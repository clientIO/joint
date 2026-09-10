import { util, g } from '@joint/core';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import { importLayout } from './import.mjs';
import { exportGraph } from './export.mjs';

import type { ExportGraphOptions } from './export.mjs';
import type { EdgeLabelsOptions, ImportLayoutOptions, PortPositionsMode, PortPositionsOptions, PortLabelPositionsOptions } from './import.mjs';
import type { ElkLayoutOptions, ElkNode } from './elkOptions.mjs';
import type { dia } from '@joint/core';
import type { ELK, ElkNode as RawElkNode } from 'elkjs';

const LAYOUT_BATCH_NAME = 'layout';

const DEFAULT_LAYOUT_OPTIONS: ElkLayoutOptions = {
    'elk.algorithm': 'layered',
    // Lay out embedded elements (containers) as part of the same pass as their
    // parent, so that edges crossing a container's boundary are routed and
    // accounted for correctly, instead of only being considered afterwards.
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    // Keep the order of ports on a node consistent with the order of their
    // `ports.items` array, instead of reordering them to reduce edge crossings.
    'elk.layered.considerModelOrder.portModelOrder': 'true',
    // JointJS positions an element by its top-left corner - match that as the point
    // `interactive` (see below) compares against an element's previous position.
    'elk.layered.interactiveReferencePoint': 'TOP_LEFT'
};

// Applied on top of `DEFAULT_LAYOUT_OPTIONS` (but under the caller's own `elkLayoutOptions`)
// when `interactive` is enabled - see its doc on `Options`.
const INTERACTIVE_LAYOUT_OPTIONS: ElkLayoutOptions = {
    // Generic hint, respected by every algorithm - see e.g. ELK Force/Stress, which use it to
    // skip generating a fresh initial layout and relax from each element's current position
    // instead. Not `'layered'`'s primary lever (below), but harmless to set alongside it.
    'elk.interactive': 'true',
    // `'layered'`'s own interactivity is per-phase - each of these reads the corresponding
    // aspect (edge direction, x/y) straight off an element's current position instead of
    // computing it from scratch, so the four are meant to be used together.
    'elk.layered.cycleBreaking.strategy': 'INTERACTIVE',
    'elk.layered.layering.strategy': 'INTERACTIVE',
    'elk.layered.crossingMinimization.strategy': 'INTERACTIVE',
    'elk.layered.nodePlacement.strategy': 'INTERACTIVE',
};

const DEFAULT_OPTIONS: Options = {
    edgeLabels: true,
    batchName: LAYOUT_BATCH_NAME,
};

let defaultElk: ELK | undefined;

/**
 * Layout configuration options.
 */
export interface Options extends
    Omit<ImportLayoutOptions, 'edgeLabels' | 'positionPorts' | 'positionPortLabels'>,
    Omit<ExportGraphOptions, 'edgeLabels' | 'positionPorts' | 'positionPortLabels'> {

    /**
     * A custom ELK instance, e.g. one configured to run inside a Web Worker.
     * The instance is not terminated by the package - call `elk.terminateWorker()`
     * yourself when it is no longer needed.
     * @defaultValue a shared, main-thread instance (`elkjs/lib/elk.bundled.js`)
     * @example
     * import ELK from 'elkjs/lib/elk-api.js';
     * const elk = new ELK({ workerUrl: new URL('elkjs/lib/elk-worker.min.js', import.meta.url).href });
     * layout(graph, { elk });
     */
    elk?: ELK;
    /**
     * ELK layout options, passed through to ELK unmodified.
     * @see https://eclipse.dev/elk/reference/options.html
     * @defaultValue `{ 'elk.algorithm': 'layered', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN' }`
     */
    elkLayoutOptions?: ElkLayoutOptions;
    /**
     * Whether to account for link labels during layout and position them
     * along the routed link afterwards.
     * @defaultValue true
     */
    edgeLabels?: boolean | EdgeLabelsOptions;
    /**
     * How freely ELK may reposition (and reorder) ports along their element,
     * instead of keeping them at the position JointJS itself already computed
     * for them - see `PortPositionsMode`. When set to anything other than
     * `'fixed'`, every port's owning group is switched to an `'absolute'`
     * position (preserving its `attrs`/`markup`/`label`) so the position ELK
     * computed for it can be applied.
     * @defaultValue 'fixed'
     */
    positionPorts?: PortPositionsMode | PortPositionsOptions;
    /**
     * Whether to let ELK reposition port labels along their port, instead of keeping
     * them at the position JointJS itself already computed for them (via the port
     * group's `label`). When enabled, every port's owning group's label is switched
     * to a `'manual'` position (preserving its `attrs`/`markup`) so the position ELK
     * computed for it can be applied.
     * @defaultValue false
     */
    positionPortLabels?: boolean | PortLabelPositionsOptions;
    /**
     * A name for the layout batch, which can be used to group multiple layout operations together.
     * @defaultValue 'layout'
     */
    batchName?: string;
    /**
     * Whether to let ELK treat elements' current positions (as already reflected on the
     * graph, e.g. from a previous `layout()` call) as a starting point, and try to change
     * the layout as little as possible from there - instead of computing a fresh layout
     * from scratch every time. Useful for laying out a graph incrementally, e.g. so that
     * adding one element and calling `layout()` again only affects that new element,
     * leaving the rest roughly where they already are.
     *
     * This approximates, rather than guarantees, the previous layout - e.g. a layer's own
     * position can still shift to fit its (possibly changed) content - so already laid out
     * elements may still move slightly. Applies `elk.interactive` plus, for the default
     * `'layered'` algorithm, its own per-phase interactive strategies; give an
     * `elkLayoutOptions` of your own to override/turn off any of them individually.
     * @defaultValue false
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-interactive.html
     */
    interactive?: boolean;
}

export interface LayoutResult {
    /** Tight bounding box of the laid out graph. */
    bbox: g.Rect;
    /** The raw ELK layout result, for anything not mapped back onto the graph (e.g. junction points). */
    elkGraph: ElkNode;
}

function getDefaultElk(): ELK {
    if (!defaultElk) {
        defaultElk = new ElkConstructor();
    }
    return defaultElk;
}

/**
 * Tight bounding box of the top-level nodes in an ELK layout result.
 */
function getBBox(elkGraph: ElkNode): g.Rect {
    const rects = (elkGraph.children || []).map((node) => new g.Rect(node.x || 0, node.y || 0, node.width || 0, node.height || 0));
    return g.Rect.fromRectUnion(...rects) || new g.Rect(0, 0, 0, 0);
}

export async function layout(graph: dia.Graph, opt?: Options): Promise<LayoutResult> {

    const options = util.defaults({}, opt || {}, DEFAULT_OPTIONS) as Options;
    const elkLayoutOptions = util.defaults(
        {},
        opt?.elkLayoutOptions || {},
        (opt?.interactive) ? INTERACTIVE_LAYOUT_OPTIONS : {},
        DEFAULT_LAYOUT_OPTIONS
    ) as ElkLayoutOptions;
    const elk = opt?.elk || getDefaultElk();
    const batchName = options.batchName || LAYOUT_BATCH_NAME;

    const { elkGraph, elementsById, linksById, portsById } = exportGraph(graph, options as ExportGraphOptions, elkLayoutOptions);

    const result = await elk.layout(elkGraph as unknown as RawElkNode) as ElkNode;

    graph.startBatch(batchName);
    importLayout(result, elementsById, linksById, portsById, options);
    graph.stopBatch(batchName);

    return {
        bbox: getBBox(result),
        elkGraph: result
    };
}

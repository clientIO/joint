import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import { util, g } from '@joint/core';

import type { dia } from '@joint/core';
import type { ELK, LayoutOptions, ElkNode as RawElkNode } from 'elkjs';
import type { ElkLayoutOptions, ElkNode } from './elkOptions.mjs';
import type { EdgeLabelsOptions, ImportLayoutOptions, PortLabelPositionsOptions, PortPositionsMode, PortPositionsOptions } from './import.mjs';
import { exportGraph, importLayout, type ExportGraphOptions } from './index.mjs';

const LAYOUT_BATCH_NAME = 'layout';

const DEFAULT_OPTIONS: Partial<ElkLayoutControllerOptions> = {
    edgeLabels: true,
    batchName: LAYOUT_BATCH_NAME,
};

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
// when `interactive` is enabled - see its doc on `ElkLayoutControllerOptions`.
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

export interface LayoutResult {
    /** Tight bounding box of the laid out graph. */
    bbox: g.Rect;
    /** The raw ELK layout result, for anything not mapped back onto the graph (e.g. junction points). */
    elkGraph: ElkNode;
}

export interface ElkLayoutControllerOptions extends
    Omit<ImportLayoutOptions, 'edgeLabels' | 'positionPorts' | 'positionPortLabels'>,
    Omit<ExportGraphOptions, 'edgeLabels' | 'positionPorts' | 'positionPortLabels'> {

    /**
     * The graph to lay out. Fixed for the controller's lifetime.
     */
    graph: dia.Graph;
    /**
     * A URL for `elkjs`'s Web Worker script, to run layout off the main thread.
     * Fixed for the controller's lifetime - the underlying ELK instance is only
     * ever created once, in the constructor.
     * @example
     * new ElkLayoutController({ graph, workerUrl: new URL('elkjs/lib/elk-worker.min.js', import.meta.url).href });
     */
    workerUrl?: string;

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

/**
 * Options that can be supplied to a single `layout()` call, supplementing (not
 * replacing) the controller's own options - see `ElkLayoutControllerOptions` -
 * for just that one run. Everything except `graph`/`workerUrl` (fixed for the
 * controller's lifetime - see their docs) can be overridden this way; `elkLayoutOptions`
 * given here is merged on top of the controller's own, rather than replacing it outright.
 */
export type ElkLayoutRunOptions = Omit<ElkLayoutControllerOptions, 'graph' | 'workerUrl'>;

export class ElkLayoutController {

    private elkInstance: ELK;
    private graph: dia.Graph;
    private options: ElkLayoutControllerOptions;

    constructor(options: ElkLayoutControllerOptions) {
        if (options.workerUrl) {
            this.elkInstance = new ElkConstructor({
                workerUrl: options.workerUrl,
                algorithms: ['layered'],
                defaultLayoutOptions: DEFAULT_LAYOUT_OPTIONS as LayoutOptions
            });
        } else {
            this.elkInstance = new ElkConstructor({
                algorithms: ['layered'],
                defaultLayoutOptions: DEFAULT_LAYOUT_OPTIONS as LayoutOptions
            });
        }

        this.graph = options.graph;

        this.options = util.defaults({}, options || {}, DEFAULT_OPTIONS) as ElkLayoutControllerOptions;
    }

    private getBBox(elkGraph: ElkNode): g.Rect {
        const rects = (elkGraph.children || []).map((node) => new g.Rect(node.x || 0, node.y || 0, node.width || 0, node.height || 0));
        return g.Rect.fromRectUnion(...rects) || new g.Rect(0, 0, 0, 0);
    }

    public async layout(options?: ElkLayoutRunOptions): Promise<LayoutResult> {
        // Options given here supplement (rather than replace) the controller's own for
        // this run only - `this.options` itself is left untouched for the next call.
        const runOptions = util.defaults({}, options || {}, this.options) as ElkLayoutRunOptions;
        const elkLayoutOptions = util.defaults(
            {},
            runOptions.elkLayoutOptions || {},
            (runOptions.interactive) ? INTERACTIVE_LAYOUT_OPTIONS : {},
            DEFAULT_LAYOUT_OPTIONS
        ) as ElkLayoutOptions;
        const elk = this.elkInstance;
        const batchName = runOptions.batchName || LAYOUT_BATCH_NAME;

        const { elkGraph, elementsById, linksById, portsById } = exportGraph(this.graph, runOptions as ExportGraphOptions, elkLayoutOptions);

        const result = await elk.layout(elkGraph as unknown as RawElkNode) as ElkNode;

        this.graph.startBatch(batchName);
        importLayout(result, elementsById, linksById, portsById, runOptions);
        this.graph.stopBatch(batchName);

        return {
            bbox: this.getBBox(result),
            elkGraph: result
        };
    }

}

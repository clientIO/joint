import { util, g } from '@joint/core';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import { importLayout } from './import.mjs';
import { exportGraph } from './export.mjs';

import type { ExportGraphOptions } from './export.mjs';
import type { ImportLayoutOptions, PortsPositionMode } from './import.mjs';
import type { ElkLayoutOptions, ElkNode } from './types/index.mjs';
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
    'elk.layered.considerModelOrder.portModelOrder': 'true'
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
     * Whether to account for link labels during layout and position them afterwards.
     * @defaultValue true
     */
    edgeLabels?: boolean;
    /**
     * How freely ELK may reposition (and reorder) ports, instead of keeping them
     * where JointJS's port groups place them - see `PortsPositionMode`.
     * @defaultValue 'fixed'
     */
    portsPosition?: PortsPositionMode;
    /**
     * Whether to let ELK reposition port labels along their port, instead of
     * keeping them where JointJS's port groups place them.
     * @defaultValue false
     */
    positionPortLabels?: boolean;
    /**
     * A name for the layout batch, which can be used to group multiple layout operations together.
     * @defaultValue 'layout'
     */
    batchName?: string;
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
        DEFAULT_LAYOUT_OPTIONS
    ) as ElkLayoutOptions;
    const elk = opt?.elk || getDefaultElk();
    const batchName = options.batchName || LAYOUT_BATCH_NAME;

    const { elkGraph, elementsById, linksById, portsById } = exportGraph(graph, options as ExportGraphOptions, elkLayoutOptions);

    const result = await elk.layout(elkGraph as unknown as RawElkNode) as ElkNode;

    // Wraps the import in a single batch, so it emits one combined change instead of
    // one per element/port/link.
    graph.startBatch(batchName);
    importLayout(result, elementsById, linksById, portsById, options);
    graph.stopBatch(batchName);

    return {
        bbox: getBBox(result),
        elkGraph: result
    };
}

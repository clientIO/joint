import { util, g } from '@joint/core';
import { importLayout } from './import.mjs';
import { layoutWithDefaultElk } from './defaultElk.mjs';
import { exportGraph } from './export.mjs';
import { abortable, throwIfAborted } from './abort.mjs';
import { ElkWorkerClient } from './workerElk.mjs';

import type { ExportGraphOptions } from './export.mjs';
import type { ImportLayoutOptions } from './import.mjs';
import type { WorkerElk } from './workerElk.mjs';
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
    'elk.layered.considerModelOrder.portModelOrder': 'true',
    // Return every edge's route points and labels graph-absolute, whichever container
    // the edge belongs to - `importLayout` applies them as they are. Overriding this
    // means handling the coordinates yourself (e.g. in `setLinkAttributes`).
    'elk.json.edgeCoords': 'ROOT'
};

/**
 * Layout configuration options.
 */
export interface LayoutOptions extends ImportLayoutOptions, ExportGraphOptions {

    /**
     * The ELK instance to lay out with - e.g. one running in a Web Worker, so the layout
     * doesn't block the page (see `createWorkerElk()`), or any `elkjs` instance of your
     * own. It is never terminated by the package.
     * @defaultValue a shared instance running on the main thread (`elkjs/lib/elk.bundled.js`,
     * loaded on the first layout that needs it)
     * @example
     * const elk = createWorkerElk(() => new Worker(new URL('@joint/layout-elk/worker', import.meta.url), { type: 'module' }));
     * layout({ graph }, { elk });
     */
    elk?: WorkerElk | ELK;
    /**
     * ELK layout options, passed through to ELK unmodified.
     * @see https://eclipse.dev/elk/reference/options.html
     * @defaultValue `{ 'elk.algorithm': 'layered', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.layered.considerModelOrder.portModelOrder': 'true', 'elk.json.edgeCoords': 'ROOT' }`
     */
    elkLayoutOptions?: ElkLayoutOptions;
    /**
     * Aborts the layout - e.g. once the graph has changed since it started, or it takes too
     * long. `layout()` then rejects with the signal's reason, and nothing is applied to the
     * graph. A layout a `createWorkerElk()` worker is busy with is stopped by terminating the
     * worker (a new one takes over the layouts still waiting). ELK on the main thread, or
     * any other `elk` instance, can't be stopped - its result is only ignored.
     * @example
     * const controller = new AbortController();
     * layout({ graph }, { signal: controller.signal });
     * graph.once('change', () => controller.abort());
     */
    signal?: AbortSignal;
}

export interface LayoutResult {
    /** Tight bounding box of the laid out graph. */
    bbox: g.Rect;
    /** The raw ELK layout result, for anything not mapped back onto the graph (e.g. junction points). */
    elkGraph: ElkNode;
}

/**
 * Tight bounding box of the top-level nodes in an ELK layout result.
 */
function getBBox(elkGraph: ElkNode): g.Rect {
    const rects = (elkGraph.children || []).map((node) => new g.Rect(node.x || 0, node.y || 0, node.width || 0, node.height || 0));
    return g.Rect.fromRectUnion(...rects) || new g.Rect(0, 0, 0, 0);
}

/**
 * What `layout()` lays out: the graph, and optionally which of its elements/links.
 */
// The elements and the links to lay out, in the order they were given.
function splitCells(graphOrCells: dia.Graph | dia.Cell[]): { elements: dia.Element[], links: dia.Link[] } {
    if (!Array.isArray(graphOrCells)) {
        return { elements: graphOrCells.getElements(), links: graphOrCells.getLinks() };
    }
    const elements: dia.Element[] = [];
    const links: dia.Link[] = [];
    graphOrCells.forEach((cell) => {
        if (cell.isElement()) {
            elements.push(cell as dia.Element);
        } else {
            links.push(cell as dia.Link);
        }
    });
    return { elements, links };
}

// Every graph the laid out cells belong to - the batch has to run on each of them, since
// it groups only the changes emitted by its own graph's cells. A cell that is in no graph
// (e.g. a container added only to shape the layout) contributes none, and emits none.
function getCellGraphs(
    elementsById: Map<string, dia.Element>,
    linksById: Map<string, dia.Link>
): dia.Graph[] {
    const graphs = new Set<dia.Graph>();
    const collect = (cell: dia.Cell) => {
        if (cell.graph) graphs.add(cell.graph);
    };
    elementsById.forEach(collect);
    linksById.forEach(collect);
    return Array.from(graphs);
}

/**
 * Lays out a whole JointJS graph, or only the given cells.
 *
 * A list of cells is laid out in the order it is given: the top-level nodes follow it, and
 * so do each container's children. An element whose parent is not listed becomes a
 * top-level node, and a link is laid out only if both of its ends are listed too. Each cell
 * should be listed only once.
 *
 * The layout is applied in a `'layout'` batch on the graph the cells belong to, so that it
 * emits one combined change rather than one per element, port and link.
 */
export async function layout(graphOrCells: dia.Graph | dia.Cell[], opt?: LayoutOptions): Promise<LayoutResult> {

    const options: LayoutOptions = opt ?? {};
    const elkLayoutOptions = util.defaults(
        {},
        opt?.elkLayoutOptions,
        DEFAULT_LAYOUT_OPTIONS
    ) as ElkLayoutOptions;
    const signal = opt?.signal;

    throwIfAborted(signal);

    const { elements, links } = splitCells(graphOrCells);

    const { elkGraph, elementsById, linksById, portsById } = exportGraph(
        elements,
        links,
        options as ExportGraphOptions,
        elkLayoutOptions
    );

    // elkjs types every `layoutOptions` as `{ [key: string]: string }`, which this package
    // narrows to its own option interfaces - and their optional properties force
    // `| undefined` into the index signature, so `ElkNode` is not assignable to elkjs's
    // own type although it is the same object at runtime. ELK's result needs no assertion
    // back: `{ [key: string]: string }` does satisfy the narrowed interfaces.
    const rawElkGraph = elkGraph as RawElkNode;
    const elk = opt?.elk;
    let layoutResult: Promise<ElkNode>;
    if (!elk) {
        layoutResult = layoutWithDefaultElk(rawElkGraph, signal);
    } else if (elk instanceof ElkWorkerClient) {
        // Stops the worker's layout when aborted, rather than only ignoring its result.
        layoutResult = elk.layout(rawElkGraph, { signal });
    } else {
        layoutResult = abortable((elk as ELK).layout(rawElkGraph), signal);
    }
    const result = await layoutResult;

    // Aborted after ELK settled, but before the result was applied.
    throwIfAborted(signal);

    // Wraps the import in a single batch, so it emits one combined change instead of
    // one per element/port/link. Closed even if a `set*Attributes` callback throws -
    // a batch left open would e.g. keep a command manager from ever closing its undo step.
    const graphs = getCellGraphs(elementsById, linksById);
    graphs.forEach((graph) => graph.startBatch(LAYOUT_BATCH_NAME));
    try {
        importLayout(result, elementsById, linksById, portsById, options);
    } finally {
        graphs.forEach((graph) => graph.stopBatch(LAYOUT_BATCH_NAME));
    }

    return {
        bbox: getBBox(result),
        elkGraph: result
    };
}

import { g } from '@joint/core';
import { importGraphLayout } from './import.mjs';
import { layoutWithDefaultElk } from './defaultElk.mjs';
import { exportGraphLayout } from './export.mjs';
import { abortable, throwIfAborted } from './abort.mjs';
import { splitCells } from './cells.mjs';
import { toNativeElkNode, getElkPadding, withDefaultElkLayoutOptions } from './elkOptions.mjs';

import type { ExportGraphLayoutOptions } from './export.mjs';
import type { ImportGraphLayoutOptions } from './import.mjs';
import type { WorkerElk } from './workerElk.mjs';
import type { ElkLayoutOptions, ElkNode } from './types/index.mjs';
import type { dia } from '@joint/core';
import type { ELK } from 'elkjs';

const LAYOUT_BATCH_NAME = 'layout';


/**
 * Layout configuration options.
 */
export interface LayoutOptions extends ImportGraphLayoutOptions, ExportGraphLayoutOptions {

    // `elkLayoutOptions` comes from `ExportGraphLayoutOptions` - it is the exported graph's root
    // options. These defaults are merged into it here:
    // `{ 'elk.algorithm': 'layered', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    //    'elk.layered.considerModelOrder.portModelOrder': 'true', 'elk.json.edgeCoords': 'ROOT' }`

    /**
     * The ELK instance to lay out with - e.g. one running in a Web Worker, so the layout
     * doesn't block the page (see `createWorkerElk()`), or any `elkjs` instance of your
     * own. It is never terminated by the package.
     * @defaultValue a shared instance running on the main thread (`elkjs/lib/elk.bundled.js`,
     * loaded on the first layout that needs it)
     * @example
     * const elk = createWorkerElk(() => new Worker(new URL('@joint/layout-elk/worker', import.meta.url), { type: 'module' }));
     * layout(graph, { elk });
     */
    elk?: WorkerElk | ELK;
    /**
     * Aborts the layout - e.g. once the graph has changed since it started, or it takes too
     * long. `layout()` then rejects with the signal's reason, and nothing is applied to the
     * graph. A layout a `createWorkerElk()` worker is busy with is stopped by terminating the
     * worker (a new one takes over the layouts still waiting). ELK on the main thread, or
     * any other `elk` instance, can't be stopped - its result is only ignored.
     * @example
     * const controller = new AbortController();
     * layout(graph, { signal: controller.signal });
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
 * Tight bounding box of an ELK layout result.
 *
 * ELK sizes the root node around everything it laid out - nodes, edge routes and edge
 * labels alike - plus the root's own padding, so the box is that size with the padding
 * taken off, the way `@joint/layout-directed-graph` and `@joint/layout-msagl` take off
 * the margins they were given.
 */
function getBBox(elkGraph: ElkNode, elkLayoutOptions: ElkLayoutOptions): g.Rect {
    // The options as they were given, not the root node's own: those have been written out
    // as the strings ELK takes, while this needs the padding itself, in either spelling.
    const { top, left, bottom, right } = getElkPadding(elkLayoutOptions);
    const width = Math.max(0, (elkGraph.width || 0) - left - right);
    const height = Math.max(0, (elkGraph.height || 0) - top - bottom);
    // Nothing was laid out - the root is its own padding, which is not a box at `left`/`top`.
    if (width === 0 && height === 0) return new g.Rect(0, 0, 0, 0);
    return new g.Rect(left, top, width, height);
}

// A `WorkerElk` takes the signal itself and terminates the worker busy with the layout.
// `instanceof` would miss any implementation that is not literally our own class - a
// caller's, or `createWorkerElk()`'s from a second copy of the package in one bundle.
// `elkjs` has no `terminate()`.
function isWorkerElk(elk: WorkerElk | ELK): elk is WorkerElk {
    return typeof (elk as WorkerElk).terminate === 'function';
}


/**
 * Lays out a whole JointJS graph, or only the given cells.
 *
 * A list of cells is laid out in the order it is given: the top-level nodes follow it, and
 * so do each container's children. An element whose parent is not listed becomes a
 * top-level node, and a link is laid out only if both of its ends are listed too. A cell
 * listed more than once is laid out once.
 *
 * The layout is applied in a `'layout'` batch on the graph the cells belong to, so that it
 * emits one combined change rather than one per element, port and link.
 */
export async function layout(graphOrCells: dia.Graph | dia.Cell[], opt?: LayoutOptions): Promise<LayoutResult> {

    const options: LayoutOptions = opt ?? {};
    const elkLayoutOptions = withDefaultElkLayoutOptions(opt?.elkLayoutOptions);
    const signal = opt?.signal;

    throwIfAborted(signal);

    const { graphs } = splitCells(graphOrCells);

    const exported = exportGraphLayout(graphOrCells, { ...options, elkLayoutOptions });
    const { elkGraph } = exported;

    // Writes every layout option out as the string ELK takes - last, so that it sees what
    // the export callbacks left behind. ELK's result needs no conversion back:
    // `{ [key: string]: string }` satisfies this package's option interfaces as it is.
    const rawElkGraph = toNativeElkNode(elkGraph);
    const elk = opt?.elk;
    let layoutResult: Promise<ElkNode>;
    if (!elk) {
        layoutResult = layoutWithDefaultElk(rawElkGraph, signal);
    } else if (isWorkerElk(elk)) {
        // Stops the worker's layout when aborted, rather than only ignoring its result.
        layoutResult = elk.layout(rawElkGraph, { signal });
    } else {
        layoutResult = abortable(elk.layout(rawElkGraph), signal);
    }
    const result = await layoutResult;

    // Aborted after ELK settled, but before the result was applied.
    throwIfAborted(signal);

    // Wraps the import in a single batch, so it emits one combined change instead of
    // one per element/port/link. Closed even if a `set*Attributes` callback throws -
    // a batch left open would e.g. keep a command manager from ever closing its undo step.
    graphs.forEach((graph) => graph.startBatch(LAYOUT_BATCH_NAME));
    try {
        importGraphLayout(result, exported.index, options);
    } finally {
        graphs.forEach((graph) => graph.stopBatch(LAYOUT_BATCH_NAME));
    }

    return {
        bbox: getBBox(result, elkLayoutOptions),
        elkGraph: result
    };
}

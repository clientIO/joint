import { util, g } from '@joint/core';
import { importLayout } from './import.mjs';
import { layoutWithDefaultElk } from './defaultElk.mjs';
import { exportGraph } from './export.mjs';
import { abortable, throwIfAborted } from './abort.mjs';

import type { ExportGraphOptions } from './export.mjs';
import type { ImportLayoutOptions } from './import.mjs';
import type { LayoutThread } from './defaultElk.mjs';

export type { LayoutThread };
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

const DEFAULT_OPTIONS: LayoutOptions = {
    batchName: LAYOUT_BATCH_NAME,
};

/**
 * Layout configuration options.
 */
export interface LayoutOptions extends ImportLayoutOptions, ExportGraphOptions {

    /**
     * A custom ELK instance, e.g. one running in a Web Worker of your own. The instance
     * is not terminated by the package - call `elk.terminateWorker()` yourself when it is
     * no longer needed.
     * @defaultValue a shared instance running in a Web Worker the package starts itself
     * (bundled as a worker file of its own by webpack 5, Vite or Parcel). Where no worker can
     * be started or loaded - no `Worker` (e.g. Node/SSR), the UMD build, a bundler that
     * doesn't emit worker files - a shared main-thread instance (`elkjs/lib/elk.bundled.js`).
     * See `thread`.
     * @example
     * import ELK from 'elkjs/lib/elk-api.js';
     * const elk = new ELK({ workerUrl: new URL('elkjs/lib/elk-worker.min.js', import.meta.url).href });
     * layout({ graph }, { elk });
     */
    elk?: ELK;
    /**
     * Where the default ELK instance runs the layout - ignored with a custom `elk`.
     * - `'auto'` - in a Web Worker where one can be used, on the main thread otherwise.
     * - `'worker'` - in a Web Worker only: where none can be used (e.g. Node/SSR, the UMD
     *   build, or a worker that fails to load), `layout()` rejects instead.
     * - `'main'` - on the main thread, without starting a worker (e.g. for tests or
     *   debugging) - it blocks the page while ELK runs.
     * @defaultValue 'auto'
     */
    thread?: LayoutThread;
    /**
     * ELK layout options, passed through to ELK unmodified.
     * @see https://eclipse.dev/elk/reference/options.html
     * @defaultValue `{ 'elk.algorithm': 'layered', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.json.edgeCoords': 'ROOT' }`
     */
    elkLayoutOptions?: ElkLayoutOptions;
    /**
     * A name for the layout batch, which can be used to group multiple layout operations together.
     * @defaultValue 'layout'
     */
    batchName?: string;
    /**
     * Aborts the layout - e.g. once the graph has changed since it started, or it takes too
     * long. `layout()` then rejects with the signal's reason, and nothing is applied to the
     * graph. A layout the default worker is busy with is stopped by terminating the worker
     * (a new one takes over the layouts still waiting). ELK on the main thread, or a custom
     * `elk` instance, can't be stopped - its result is only ignored.
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
export interface LayoutCells {
    /**
     * The graph the elements and links belong to - also where the layout's batch runs.
     * Without it, the layout is applied outside of any batch, and `elements` and `links`
     * default to none.
     */
    graph?: dia.Graph;
    /**
     * The elements to lay out, in this order - the top-level ones follow it, and so do
     * each container's own children (instead of `getEmbeddedCells()` order). An element
     * whose parent isn't listed is laid out as a top-level one. Each element must be
     * listed only once.
     * @defaultValue all of the graph's elements (none without `graph`)
     */
    elements?: dia.Element[];
    /**
     * The links to lay out, in this order - a link is laid out only if both its ends are too.
     * Each link must be listed only once.
     * @defaultValue all of the graph's links (none without `graph`)
     */
    links?: dia.Link[];
}

/**
 * Lays out a JointJS graph (or only some of its elements/links, see `LayoutCells`) with ELK.
 */
export async function layout({ graph, elements, links }: LayoutCells, opt?: LayoutOptions): Promise<LayoutResult> {

    const options = util.defaults({}, opt || {}, DEFAULT_OPTIONS) as LayoutOptions;
    const elkLayoutOptions = util.defaults(
        {},
        opt?.elkLayoutOptions || {},
        DEFAULT_LAYOUT_OPTIONS
    ) as ElkLayoutOptions;
    const batchName = options.batchName as string;
    const signal = opt?.signal;

    throwIfAborted(signal);

    const { elkGraph, elementsById, linksById, portsById } = exportGraph(
        elements ?? graph?.getElements() ?? [],
        links ?? graph?.getLinks() ?? [],
        options as ExportGraphOptions,
        elkLayoutOptions
    );

    const rawElkGraph = elkGraph as unknown as RawElkNode;
    const result = await (opt?.elk
        ? abortable(opt.elk.layout(rawElkGraph), signal)
        : layoutWithDefaultElk(rawElkGraph, signal, opt?.thread)) as ElkNode;

    // Aborted after ELK settled, but before the result was applied.
    throwIfAborted(signal);

    // Wraps the import in a single batch, so it emits one combined change instead of
    // one per element/port/link. Closed even if a `set*Attributes` callback throws -
    // a batch left open would e.g. keep a command manager from ever closing its undo step.
    graph?.startBatch(batchName);
    try {
        importLayout(result, elementsById, linksById, portsById, options);
    } finally {
        graph?.stopBatch(batchName);
    }

    return {
        bbox: getBBox(result),
        elkGraph: result
    };
}

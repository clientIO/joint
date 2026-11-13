import { loadMainThreadElk } from './mainThreadElk.mjs';
import { abortable, throwIfAborted } from './abort.mjs';
import { ELK_ALGORITHMS } from './workerElk.mjs';

import type { ELK, ElkNode } from 'elkjs';

/**
 * ELK's own message handler, which the main-thread `ELK` keeps in its fake worker - an
 * `elkjs` internal (0.12.0), not in its typings. `dispatch()` runs a command synchronously:
 * a `layout` lays `graph` out in place, and throws if ELK fails.
 *
 * `elk.layout()` reaches the same handler, but only after two `setTimeout(…, 0)` - one in
 * the fake worker, one in the promise wrapper around it - so a layout always settles after
 * the browser has painted the graph as it was before.
 */
interface ElkDispatcher {
    dispatch(event: { data: { cmd: string, id: string, [key: string]: unknown }}): void;
}

// The id of every message sent to the dispatcher directly. ELK still answers it - through
// the promise wrapper, which numbers its own messages - so a string never settles one of
// them, and the answer is ignored.
const SYNC_ID = '@joint/layout-elk:sync';

// The path from an `ELK` to its dispatcher - none of it typed by elkjs.
interface ElkInternals {
    worker?: { worker?: { dispatcher?: Partial<ElkDispatcher> }};
}

// Loaded on the first layout without an `elk` option, then shared by every later one.
let mainThreadElk: Promise<ELK> | undefined;
// `mainThreadElk` once it has loaded.
let loadedElk: ELK | undefined;
// `loadedElk`'s dispatcher, with the algorithms registered - `null` if it has none.
let syncDispatcher: ElkDispatcher | null | undefined;

/**
 * Loads the default ELK instance - once, unless it failed to load.
 */
export function getMainThreadElk(): Promise<ELK> {
    if (!mainThreadElk) {
        // The `catch` covers the constructor too, not just the import - in the UMD build
        // `ElkConstructor` is the page's `ELK` global, and is `undefined` when elkjs was
        // not loaded first.
        const pending: Promise<ELK> = loadMainThreadElk()
            .then((ElkConstructor) => {
                loadedElk = new ElkConstructor();
                return loadedElk;
            })
            .catch((error) => {
                // E.g. a chunk that failed to load - tried again on the next layout.
                if (mainThreadElk === pending) mainThreadElk = undefined;
                throw error;
            });
        mainThreadElk = pending;
    }
    return mainThreadElk;
}

/**
 * The dispatcher of the loaded default ELK instance's fake worker (`elk.worker` is elkjs'
 * promise wrapper, its `worker` the fake worker), or `null` if it has none - e.g. another
 * version of elkjs - or if the instance hasn't loaded yet.
 */
function getSyncDispatcher(): ElkDispatcher | null {
    if (!loadedElk) return null;
    if (syncDispatcher === undefined) {
        const dispatcher = (loadedElk as unknown as ElkInternals).worker?.worker?.dispatcher;
        if (typeof dispatcher?.dispatch === 'function') {
            // The algorithms the `ELK` constructor registers - but behind a `setTimeout`,
            // so a layout right after it was loaded would find none of them.
            dispatcher.dispatch({ data: { cmd: 'register', id: SYNC_ID, algorithms: ELK_ALGORITHMS }});
            syncDispatcher = dispatcher as ElkDispatcher;
        } else {
            syncDispatcher = null;
        }
    }
    return syncDispatcher;
}

function layoutWithDispatcher(dispatcher: ElkDispatcher, elkGraph: ElkNode): ElkNode {
    try {
        dispatcher.dispatch({ data: { cmd: 'layout', id: SYNC_ID, graph: elkGraph }});
    } catch (error) {
        // GWT links the error to the Java exception behind it - which `JSON.stringify()` can't
        // serialize (it links back). elkjs' own `layout()` drops it too.
        if (error && typeof error === 'object') delete (error as { '__java$exception'?: unknown })['__java$exception'];
        throw error;
    }
    return elkGraph;
}

/**
 * Lays out `elkGraph` with the default ELK instance, on the main thread.
 *
 * Once ELK is loaded, the layout runs right away rather than after ELK's own timeouts - so
 * `layout()` settles before the browser paints again.
 *
 * Aborting `signal` rejects with its reason straight away. ELK can't be stopped once it
 * started - but on the main thread, it blocks until it is done, so `signal` either keeps it
 * from starting, or comes after `layout()` has applied its result.
 */
export function layoutWithDefaultElk(elkGraph: ElkNode, signal?: AbortSignal): Promise<ElkNode> {
    const layout = getMainThreadElk().then((elk) => {
        // Aborted while ELK was loading - no need to start it.
        throwIfAborted(signal);
        const dispatcher = getSyncDispatcher();
        return dispatcher ? layoutWithDispatcher(dispatcher, elkGraph) : elk.layout(elkGraph);
    });
    return abortable(layout, signal);
}

/**
 * A function laying out an ELK graph with the default ELK instance, synchronously - in place.
 * Only called once the instance has loaded - `layoutSync()` is handed out by `loadElk()`.
 *
 * Throws if this version of elkjs can't lay out synchronously - before anything is exported,
 * so no export callback runs for a layout that can't.
 */
export function getDefaultElkSyncLayout(): (elkGraph: ElkNode) => ElkNode {
    const dispatcher = getSyncDispatcher();
    if (!dispatcher) {
        throw new Error('@joint/layout-elk: this version of elkjs can\'t lay out synchronously - use `layout()`.');
    }
    return (elkGraph) => layoutWithDispatcher(dispatcher, elkGraph);
}

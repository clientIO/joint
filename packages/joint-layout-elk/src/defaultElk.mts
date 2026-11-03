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

// An error as GWT throws it - see `flattenGwtError()`.
interface GwtError {
    cause?: unknown;
    '__java$exception'?: { cause?: { backingJsObject?: GwtError }};
}

// Loaded on the first layout without an `elk` option, then shared by every later one.
let mainThreadElk: Promise<ELK> | undefined;
// `mainThreadElk` once it has loaded - what `layoutSync()` lays out with.
let loadedElk: ELK | undefined;
// `loadedElk`'s dispatcher, with the algorithms registered - `null` if it has none.
let syncDispatcher: ElkDispatcher | null | undefined;

function getMainThreadElk(): Promise<ELK> {
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
 * The dispatcher of `elk`'s fake worker (`elk.worker` is elkjs' promise wrapper, its
 * `worker` the fake worker), or `null` if it has none - e.g. another version of elkjs.
 */
function getSyncDispatcher(elk: ELK): ElkDispatcher | null {
    if (syncDispatcher === undefined) {
        const dispatcher = (elk as unknown as ElkInternals).worker?.worker?.dispatcher;
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

// What elkjs' promise wrapper does to an error before rejecting with it: GWT keeps the Java
// exception behind it on the error - its cause, if any, is moved to `cause`.
function flattenGwtError(error: GwtError | null | undefined): void {
    if (!error || typeof error !== 'object') return;
    const javaException = error['__java$exception'];
    if (!javaException) return;
    const cause = javaException.cause?.backingJsObject;
    if (cause) {
        error.cause = cause;
        flattenGwtError(cause);
    }
    delete error['__java$exception'];
}

function layoutWithDispatcher(dispatcher: ElkDispatcher, elkGraph: ElkNode): ElkNode {
    try {
        dispatcher.dispatch({ data: { cmd: 'layout', id: SYNC_ID, graph: elkGraph }});
    } catch (error) {
        flattenGwtError(error as GwtError);
        throw error;
    }
    return elkGraph;
}

/**
 * Loads the default ELK instance, so that `layoutSync()` can lay out with it.
 */
export function loadDefaultElk(): Promise<void> {
    return getMainThreadElk().then(() => undefined);
}

/**
 * Lays out `elkGraph` with the default ELK instance, on the main thread.
 *
 * Once ELK is loaded, the layout runs right away rather than after ELK's own timeouts - so
 * `layout()` settles before the browser paints again.
 *
 * Aborting `signal` rejects with its reason straight away. ELK on the main thread can't be
 * stopped once it started - its result is only ignored.
 */
export function layoutWithDefaultElk(elkGraph: ElkNode, signal?: AbortSignal): Promise<ElkNode> {
    const layout = getMainThreadElk().then((elk) => {
        // Aborted while ELK was loading - no need to start it.
        throwIfAborted(signal);
        const dispatcher = getSyncDispatcher(elk);
        return dispatcher ? layoutWithDispatcher(dispatcher, elkGraph) : elk.layout(elkGraph);
    });
    return abortable(layout, signal);
}

/**
 * A function laying out an ELK graph with the default ELK instance, synchronously - in place.
 *
 * Throws if the instance hasn't loaded yet (see `loadDefaultElk()`) - before anything is
 * exported, so no export callback runs for a layout that can't.
 */
export function getDefaultElkSyncLayout(): (elkGraph: ElkNode) => ElkNode {
    if (!loadedElk) {
        throw new Error('@joint/layout-elk: ELK is not loaded yet - await `loadElk()` (or a `layout()`) before `layoutSync()`.');
    }
    const dispatcher = getSyncDispatcher(loadedElk);
    if (!dispatcher) {
        throw new Error('@joint/layout-elk: this version of elkjs can\'t lay out synchronously - use `layout()`.');
    }
    return (elkGraph) => layoutWithDispatcher(dispatcher, elkGraph);
}

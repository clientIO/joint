import { loadMainThreadElk } from './mainThreadElk.mjs';
import { abortable, throwIfAborted } from './abort.mjs';

import type { ELK, ElkNode } from 'elkjs';

// Loaded on the first layout without an `elk` option, then shared by every later one.
let mainThreadElk: Promise<ELK> | undefined;

function getMainThreadElk(): Promise<ELK> {
    if (!mainThreadElk) {
        // The `catch` covers the constructor too, not just the import - in the UMD build
        // `ElkConstructor` is the page's `ELK` global, and is `undefined` when elkjs was
        // not loaded first.
        const pending: Promise<ELK> = loadMainThreadElk()
            .then((ElkConstructor) => new ElkConstructor())
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
 * Lays out `elkGraph` with the default ELK instance, on the main thread.
 *
 * Aborting `signal` rejects with its reason straight away. ELK on the main thread can't be
 * stopped once it started - its result is only ignored.
 */
export function layoutWithDefaultElk(elkGraph: ElkNode, signal?: AbortSignal): Promise<ElkNode> {
    const layout = getMainThreadElk().then((elk) => {
        // Aborted while ELK was loading - no need to start it.
        throwIfAborted(signal);
        return elk.layout(elkGraph);
    });
    return abortable(layout, signal);
}

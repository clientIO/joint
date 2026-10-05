import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import ElkApi from 'elkjs/lib/elk-api.js';
import { createElkWorker } from './workerFactory.mjs';

import type { ELK, ElkNode } from 'elkjs';

// The reason a layout is retried on the main thread, rather than an error of ELK's own.
const WORKER_FAILED = Symbol('workerFailed');

// Lazily created on the first `layout()` call, then shared by every later one.
let workerElk: ELK | undefined;
let mainThreadElk: ELK | undefined;
// Rejects (with `WORKER_FAILED`) once the worker fails - `undefined` until it is started.
let workerFailure: Promise<never> | undefined;
// Set once the worker fails - every later layout then runs on the main thread straight away.
let hasWorkerFailed = false;

function getMainThreadElk(): ELK {
    if (!mainThreadElk) {
        mainThreadElk = new ElkConstructor();
    }
    return mainThreadElk;
}

function startWorker(): Worker | undefined {
    if (typeof Worker === 'undefined') return undefined;
    try {
        return createElkWorker();
    } catch {
        // E.g. a worker script the page's CSP (`worker-src`) doesn't allow.
        return undefined;
    }
}

function getWorkerElk(): ELK | undefined {
    if (workerElk || hasWorkerFailed) return workerElk;

    // No worker yet is checked for again on the next layout - nothing is started meanwhile.
    const worker = startWorker();
    if (!worker) return undefined;

    // ELK itself never listens for a worker's `error` event - a worker script that fails to
    // load (e.g. a bundler that doesn't emit worker files) would leave every layout pending.
    workerFailure = new Promise<never>((_resolve, reject) => {
        worker.addEventListener('error', (event) => {
            event.preventDefault();
            hasWorkerFailed = true;
            workerElk = undefined;
            worker.terminate();
            reject(WORKER_FAILED);
        }, { once: true });
    });
    // Nothing may be waiting on it when the worker fails.
    workerFailure.catch(() => {});

    workerElk = new ElkApi({ workerFactory: () => worker });
    return workerElk;
}

/**
 * Lays out `elkGraph` with the default ELK instance - in a Web Worker where one can be
 * started, on the main thread otherwise (e.g. no `Worker` in Node/SSR, or the UMD build).
 * A layout started while the worker fails is retried on the main thread.
 */
export async function layoutWithDefaultElk(elkGraph: ElkNode): Promise<ElkNode> {
    const elk = getWorkerElk();
    if (!elk) return getMainThreadElk().layout(elkGraph);
    try {
        // The worker gets its own (structured) clone of `elkGraph`, so a retry starts from
        // the original.
        return await Promise.race([elk.layout(elkGraph), workerFailure as Promise<never>]);
    } catch (error) {
        if (error !== WORKER_FAILED) throw error;
        return getMainThreadElk().layout(elkGraph);
    }
}

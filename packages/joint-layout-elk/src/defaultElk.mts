import { createElkWorker } from './workerFactory.mjs';
import { loadMainThreadElk } from './mainThreadElk.mjs';
import { abortable, getAbortReason, throwIfAborted } from './abort.mjs';

import type { ELK, ElkNode } from 'elkjs';

// The algorithms `elkjs/lib/elk-api.js` registers with a worker by default.
const ALGORITHMS = ['layered', 'stress', 'mrtree', 'radial', 'force', 'disco', 'sporeOverlap', 'sporeCompaction', 'rectpacking'];

// The id of the message registering `ALGORITHMS` - layouts are numbered from 1.
const REGISTER_ID = 0;

interface LayoutJob {
    id: number;
    graph: ElkNode;
    resolve: (result: ElkNode) => void;
    reject: (reason: unknown) => void;
}

// Loaded on the first layout that runs on the main thread, then shared by every later one.
let mainThreadElk: Promise<ELK> | undefined;

function getMainThreadElk(): Promise<ELK> {
    if (!mainThreadElk) {
        mainThreadElk = loadMainThreadElk().then(
            (ElkConstructor) => new ElkConstructor(),
            (error) => {
                // E.g. a chunk that failed to load - tried again on the next layout.
                mainThreadElk = undefined;
                throw error;
            }
        );
    }
    return mainThreadElk;
}

function layoutOnMainThread(graph: ElkNode, signal?: AbortSignal): Promise<ElkNode> {
    return getMainThreadElk().then((elk) => {
        // Aborted while ELK was loading - no need to start it.
        throwIfAborted(signal);
        return elk.layout(graph);
    });
}

function runOnMainThread(job: LayoutJob): void {
    layoutOnMainThread(job.graph).then(job.resolve, job.reject);
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

/**
 * Talks to ELK's own worker script (`elkjs/lib/elk-worker.min.js`, see `elk.worker.mts`)
 * in place of `elkjs/lib/elk-api.js`, which can neither cancel a layout nor settle one
 * whose worker fails or is terminated.
 *
 * The worker lays out one graph at a time, in the order they were posted - `jobs` keeps
 * that order, so its first job is the one the worker is busy with.
 */
class ElkWorkerClient {

    private worker: Worker | undefined;
    private readonly jobs = new Map<number, LayoutJob>();
    private nextId = REGISTER_ID + 1;

    /**
     * @param onFailure Called with the jobs left unsettled once the worker fails.
     */
    constructor(private readonly onFailure: (jobs: LayoutJob[]) => void) {}

    /**
     * Starts a worker, and posts it every job not settled yet (e.g. after a restart).
     * Returns `false` if no worker could be started.
     */
    start(): boolean {
        const worker = startWorker();
        if (!worker) return false;
        this.worker = worker;
        worker.addEventListener('message', (event: MessageEvent) => {
            if (worker === this.worker) this.receive(event.data);
        });
        // ELK itself never listens for a worker's `error` event - a worker script that fails
        // to load (e.g. a bundler that doesn't emit worker files) would leave every layout
        // pending.
        worker.addEventListener('error', (event) => {
            event.preventDefault();
            if (worker === this.worker) this.fail();
        });
        worker.postMessage({ id: REGISTER_ID, cmd: 'register', algorithms: ALGORITHMS });
        this.jobs.forEach((job) => this.post(job));
        return true;
    }

    layout(graph: ElkNode, signal?: AbortSignal): Promise<ElkNode> {
        return new Promise<ElkNode>((resolve, reject) => {
            if (signal?.aborted) {
                reject(getAbortReason(signal));
                return;
            }
            const onAbort = () => {
                this.cancel(job);
                reject(getAbortReason(signal as AbortSignal));
            };
            const settle = () => signal?.removeEventListener('abort', onAbort);
            const job: LayoutJob = {
                id: this.nextId++,
                graph,
                resolve: (result) => {
                    settle();
                    resolve(result);
                },
                reject: (reason) => {
                    settle();
                    reject(reason);
                }
            };
            signal?.addEventListener('abort', onAbort, { once: true });
            this.jobs.set(job.id, job);
            this.post(job);
        });
    }

    private post(job: LayoutJob): void {
        // The worker gets its own (structured) clone of `graph` - a job re-posted after a
        // restart, or retried on the main thread, starts from the original.
        this.worker?.postMessage({ id: job.id, cmd: 'layout', graph: job.graph, layoutOptions: {}, options: {}});
    }

    private receive(data: { id: number, data?: ElkNode, error?: unknown }): void {
        const job = this.jobs.get(data.id);
        if (!job) return;
        this.jobs.delete(data.id);
        if (data.error) {
            job.reject(data.error);
        } else {
            job.resolve(data.data as ElkNode);
        }
    }

    /**
     * Drops `job`. ELK can't stop a layout in progress - if the worker is busy with `job`,
     * it is terminated, and a new one takes over the jobs still waiting. A job still
     * waiting its turn is laid out regardless, its result ignored.
     */
    private cancel(job: LayoutJob): void {
        if (!this.jobs.has(job.id)) return;
        const isRunning = this.jobs.keys().next().value === job.id;
        this.jobs.delete(job.id);
        if (!isRunning) return;
        this.terminate();
        if (!this.start()) this.fail();
    }

    private fail(): void {
        this.terminate();
        const jobs = Array.from(this.jobs.values());
        this.jobs.clear();
        this.onFailure(jobs);
    }

    private terminate(): void {
        this.worker?.terminate();
        this.worker = undefined;
    }
}

let workerClient: ElkWorkerClient | undefined;
// Set once the worker fails - every later layout then runs on the main thread straight away.
let hasWorkerFailed = false;

function getWorkerClient(): ElkWorkerClient | undefined {
    if (workerClient || hasWorkerFailed) return workerClient;
    const client = new ElkWorkerClient((jobs) => {
        hasWorkerFailed = true;
        workerClient = undefined;
        // Retried on the main thread.
        jobs.forEach(runOnMainThread);
    });
    // No worker yet is checked for again on the next layout - nothing is started meanwhile.
    if (!client.start()) return undefined;
    workerClient = client;
    return client;
}

/**
 * Lays out `elkGraph` with the default ELK instance - in a Web Worker where one can be
 * started, on the main thread otherwise (e.g. no `Worker` in Node/SSR, or the UMD build).
 * A layout started while the worker fails is retried on the main thread.
 *
 * Aborting `signal` rejects with its reason straight away. A layout the worker is busy
 * with is stopped by terminating the worker - one on the main thread can't be stopped,
 * its result is only ignored.
 */
export function layoutWithDefaultElk(elkGraph: ElkNode, signal?: AbortSignal): Promise<ElkNode> {
    const client = getWorkerClient();
    if (client) return client.layout(elkGraph, signal);
    return abortable(layoutOnMainThread(elkGraph, signal), signal);
}

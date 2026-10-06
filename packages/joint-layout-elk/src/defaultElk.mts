import { createElkWorker } from './workerFactory.mjs';
import { loadMainThreadElk } from './mainThreadElk.mjs';
import { abortable, getAbortReason, throwIfAborted } from './abort.mjs';

import type { ELK, ElkNode } from 'elkjs';

/**
 * Where the default ELK instance runs a layout:
 * - `'auto'` - in a Web Worker where one can be used, on the main thread otherwise.
 * - `'worker'` - in a Web Worker only - the layout is rejected where none can be used.
 * - `'main'` - on the main thread (no worker is started).
 */
export type LayoutThread = 'auto' | 'worker' | 'main';

// The algorithms `elkjs/lib/elk-api.js` registers with a worker by default.
const ALGORITHMS = ['layered', 'stress', 'mrtree', 'radial', 'force', 'disco', 'sporeOverlap', 'sporeCompaction', 'rectpacking'];

// The id of the message registering `ALGORITHMS` - layouts are numbered from 1.
const REGISTER_ID = 0;

interface LayoutJob {
    id: number;
    graph: ElkNode;
    // Whether the job may be retried on the main thread if the worker fails to load.
    canRunOnMainThread: boolean;
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

// Why the default worker can't be used - `undefined` while it can, or where no worker is
// expected in the first place (no `Worker`, e.g. Node/SSR, or the UMD build).
let workerFailureReason: string | undefined;
let hasWarned = false;

// Running ELK on the main thread where a worker was expected is easy to miss (layouts
// still work, they only block the page) - so it is reported once.
function warnMainThreadFallback(): void {
    if (hasWarned || !workerFailureReason) return;
    hasWarned = true;
    console.warn(`@joint/layout-elk: ${workerFailureReason} - running ELK on the main thread instead. See "Web Worker" in the README of @joint/layout-elk.`);
}

function fallBackToMainThread(job: LayoutJob): void {
    warnMainThreadFallback();
    runOnMainThread(job);
}

// Rejects a layout for which `thread: 'worker'` rules out the main thread.
function createNoWorkerError(): Error {
    const reason = workerFailureReason || 'no Web Worker can be used here (e.g. Node/SSR, or the UMD build)';
    return new Error(`@joint/layout-elk: ${reason}, and \`thread: 'worker'\` rules out running ELK on the main thread.`);
}

function startWorker(): Worker | undefined {
    // E.g. Node/SSR.
    if (typeof Worker === 'undefined') return undefined;
    try {
        // `undefined` in the UMD build.
        return createElkWorker();
    } catch (error) {
        // E.g. a worker script the page's CSP (`worker-src`) doesn't allow, or no
        // `import.meta.url` to resolve it against.
        workerFailureReason = `the ELK Web Worker could not be started (${error})`;
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
    // Whether the worker has answered its first message - i.e. its script loaded and runs.
    private isLoaded = false;
    private readonly jobs = new Map<number, LayoutJob>();
    private nextId = REGISTER_ID + 1;

    /**
     * @param onFailure Called with the jobs left unsettled once the worker fails to load.
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
        this.isLoaded = false;
        worker.addEventListener('message', (event: MessageEvent) => {
            if (worker === this.worker) this.receive(event.data);
        });
        // ELK itself never listens for a worker's `error` event - a worker script that fails
        // to load (e.g. a bundler that doesn't emit worker files), or a worker that crashes
        // (e.g. out of memory), would leave every layout pending.
        worker.addEventListener('error', (event) => {
            event.preventDefault();
            if (worker !== this.worker) return;
            if (this.isLoaded) {
                this.crash(event);
            } else {
                this.fail();
            }
        });
        worker.postMessage({ id: REGISTER_ID, cmd: 'register', algorithms: ALGORITHMS });
        this.jobs.forEach((job) => this.post(job));
        return true;
    }

    layout(graph: ElkNode, signal: AbortSignal | undefined, canRunOnMainThread: boolean): Promise<ElkNode> {
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
                canRunOnMainThread,
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
        if (data.id === REGISTER_ID) {
            this.isLoaded = true;
            return;
        }
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
        if (isRunning) this.restart();
    }

    /**
     * The worker crashed (after it loaded) - most likely because of the job it was busy
     * with, which is rejected rather than retried, on the main thread least of all, where
     * the same crash would take the page down with it. A new worker takes over the jobs
     * still waiting.
     */
    private crash(event: ErrorEvent): void {
        const [running] = this.jobs.values();
        if (running) {
            this.jobs.delete(running.id);
            const details = event.message ? ` (${event.message})` : '';
            running.reject(new Error(`@joint/layout-elk: the ELK worker crashed during the layout${details}.`));
        }
        this.restart();
    }

    private restart(): void {
        this.terminate();
        if (!this.start()) this.fail();
    }

    /**
     * The worker failed to load - every job not settled yet is retried on the main thread,
     * or rejected if it can't run there (see `getWorkerClient`).
     */
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
// Set once the worker fails to load - every later layout then runs on the main thread
// straight away.
let hasWorkerFailed = false;

function getWorkerClient(): ElkWorkerClient | undefined {
    if (workerClient || hasWorkerFailed) return workerClient;
    const client = new ElkWorkerClient((jobs) => {
        hasWorkerFailed = true;
        workerClient = undefined;
        // E.g. a worker file the bundler didn't emit, or doesn't serve where it says it is.
        workerFailureReason = 'the ELK Web Worker failed to load';
        jobs.forEach((job) => {
            if (job.canRunOnMainThread) {
                fallBackToMainThread(job);
            } else {
                job.reject(createNoWorkerError());
            }
        });
    });
    // No worker yet is checked for again on the next layout - nothing is started meanwhile.
    if (!client.start()) return undefined;
    workerClient = client;
    return client;
}

/**
 * Lays out `elkGraph` with the default ELK instance - where `thread` says (see
 * `LayoutThread`). With `'auto'`, a layout started while the worker fails to load is
 * retried on the main thread - one the worker crashes during is rejected.
 *
 * Aborting `signal` rejects with its reason straight away. A layout the worker is busy
 * with is stopped by terminating the worker - one on the main thread can't be stopped,
 * its result is only ignored.
 */
export function layoutWithDefaultElk(elkGraph: ElkNode, signal?: AbortSignal, thread: LayoutThread = 'auto'): Promise<ElkNode> {
    if (thread !== 'main') {
        const client = getWorkerClient();
        if (client) return client.layout(elkGraph, signal, thread === 'auto');
        if (thread === 'worker') return Promise.reject(createNoWorkerError());
        warnMainThreadFallback();
    }
    return abortable(layoutOnMainThread(elkGraph, signal), signal);
}

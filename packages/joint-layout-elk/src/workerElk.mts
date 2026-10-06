import { getAbortReason } from './abort.mjs';

import type { ElkNode } from 'elkjs';

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

/**
 * ELK running in a Web Worker - see `createWorkerElk()`.
 */
export interface WorkerElk {
    /**
     * Lays out `graph` in the worker. Aborting `signal` rejects with its reason - if the
     * worker is busy with this layout, the worker is terminated, and a new one takes over
     * the layouts still waiting.
     */
    layout(graph: ElkNode, options?: { signal?: AbortSignal }): Promise<ElkNode>;
    /**
     * Terminates the worker - layouts not settled yet are rejected. A later layout starts
     * a new worker.
     */
    terminate(): void;
}

/**
 * Talks to ELK's own worker script (`elkjs/lib/elk-worker.min.js`) in place of
 * `elkjs/lib/elk-api.js`, which can neither cancel a layout nor settle one whose worker
 * fails or is terminated.
 *
 * The worker lays out one graph at a time, in the order they were posted - `jobs` keeps
 * that order, so its first job is the one the worker is busy with.
 */
export class ElkWorkerClient implements WorkerElk {

    private worker: Worker | undefined;
    // Whether the worker has answered its first message - i.e. its script loaded and runs.
    private isLoaded = false;
    private readonly jobs = new Map<number, LayoutJob>();
    private nextId = REGISTER_ID + 1;

    constructor(private readonly createWorker: () => Worker) {}

    layout(graph: ElkNode, { signal }: { signal?: AbortSignal } = {}): Promise<ElkNode> {
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
            this.jobs.set(job.id, job);
            if (this.worker) {
                this.post(job);
            } else {
                // Posts `job` too.
                this.start();
            }
            // `start()` may have already rejected it.
            if (this.jobs.has(job.id)) signal?.addEventListener('abort', onAbort, { once: true });
        });
    }

    terminate(): void {
        this.stopWorker();
        this.rejectAll(new Error('@joint/layout-elk: the ELK worker was terminated.'));
    }

    /**
     * Starts a worker, and posts it every job not settled yet. Rejects them all if no
     * worker could be started (e.g. a worker script the page's CSP doesn't allow).
     */
    private start(): void {
        let worker: Worker;
        try {
            worker = this.createWorker();
        } catch (error) {
            this.rejectAll(error);
            return;
        }
        this.worker = worker;
        this.isLoaded = false;
        worker.addEventListener('message', (event: MessageEvent) => {
            if (worker === this.worker) this.receive(event.data);
        });
        // ELK itself never listens for a worker's `error` event - a worker script that fails
        // to load (e.g. one the bundler didn't emit), or a worker that crashes (e.g. out of
        // memory), would leave every layout pending.
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
    }

    private post(job: LayoutJob): void {
        // The worker gets its own (structured) clone of `graph` - a job re-posted after a
        // restart starts from the original.
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
     * with, which is rejected rather than retried. A new worker takes over the jobs still
     * waiting.
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

    // With no job waiting, the next layout starts the new worker.
    private restart(): void {
        this.stopWorker();
        if (this.jobs.size > 0) this.start();
    }

    /**
     * The worker failed to load - every job not settled yet is rejected. The next layout
     * tries again with a new worker.
     */
    private fail(): void {
        this.stopWorker();
        this.rejectAll(new Error('@joint/layout-elk: the ELK worker failed to load - check that its script is served where `createWorkerElk()` starts it from.'));
    }

    private rejectAll(reason: unknown): void {
        const jobs = Array.from(this.jobs.values());
        this.jobs.clear();
        jobs.forEach((job) => job.reject(reason));
    }

    private stopWorker(): void {
        this.worker?.terminate();
        this.worker = undefined;
    }
}

/**
 * Creates an ELK instance running in a Web Worker, to pass to `layout()` as its `elk`
 * option - so a layout doesn't block the page. `createWorker` starts the worker, running
 * ELK's own worker script (`elkjs/lib/elk-worker.min.js`) - however your bundler loads a
 * worker script (see "Web Worker" in the README). It is called on the first layout, and
 * again whenever the worker is replaced (e.g. after an aborted layout).
 * @example
 * const elk = createWorkerElk(() => new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url)));
 * await layout({ graph }, { elk });
 */
export function createWorkerElk(createWorker: () => Worker): WorkerElk {
    return new ElkWorkerClient(createWorker);
}

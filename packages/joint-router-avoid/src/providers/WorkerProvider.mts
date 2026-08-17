import type { dia } from '@joint/core';
import { g } from '@joint/core';
import type { Avoid as AvoidInstance } from 'libavoid-js';
import type { Connector, Shape } from './Provider.mjs';
import { Provider, type ProviderOptions } from './Provider.mjs';
import type { WorkerRequest, WorkerResponse } from './Worker.mjs';

/** Options used to initialize a {@link WorkerProvider}. */
export interface WorkerProviderOptions extends ProviderOptions {
    /**
     * Milliseconds the Worker waits after the last received message before
     * applying the queued messages and running a single
     * `processTransaction()` call for the whole batch.
     */
    updateDebounceTime?: number;
    /** Path to the avoid WASM binary, forwarded to `AvoidLib.load()` inside the Worker. */
    libavoidFilePath?: string;
}

/**
 * A {@link Provider} that runs the avoid WASM router inside a Worker
 * thread (see `Worker.mjs`), communicating with it via `postMessage`.
 * Keeps route computation off the main thread, at the cost of the
 * messaging overhead, so it is best suited to larger graphs.
 */
export class WorkerProvider extends Provider {
    /** The underlying Worker instance running the avoid router. */
    protected worker!: Worker;
    /** Ids of the shapes currently known to the Worker's avoid router. */
    protected readonly shapeIds = new Set<dia.Cell.ID>();
    /** Ids of the connectors currently known to the Worker's avoid router. */
    protected readonly connectorIds = new Set<dia.Cell.ID>();
    /**
     * Reject callbacks of {@link sync} calls still waiting on the Worker's
     * `processed` response, so they can be settled with an error instead of
     * hanging forever if the provider is destroyed before the Worker replies.
     */
    protected readonly pendingSyncRejections = new Set<(error: Error) => void>();
    /**
     * Tail of the sync queue: resolves once every {@link sync} call
     * requested so far has settled, in order. Chaining onto this (rather
     * than posting a `sync` message immediately) ensures a new `sync()`
     * call waits for the previous one to finish before the Worker's shape
     * and connector state is reset again.
     */
    protected syncQueue: Promise<void> = Promise.resolve();
    /** Set by {@link destroy}; queued {@link sync} calls check this instead of messaging an already-terminated Worker. */
    protected destroyed = false;

    /**
     * Spawns the Worker, initializes its avoid router, and resolves once
     * the Worker reports it is ready to receive further messages.
     *
     * @param options - Configuration for the avoid router instance, forwarded to the Worker.
     */
    override async init(options: WorkerProviderOptions): Promise<void> {
        const worker = new Worker(new URL('./Worker.mjs', import.meta.url), { type: 'module' });
        this.worker = worker;

        const ready = new Promise<void>((resolve) => {
            worker.onmessage = (evt: MessageEvent<WorkerResponse>) => {
                const message = evt.data;
                switch (message.type) {
                    case 'ready': {
                        resolve();
                        break;
                    }
                    case 'connectorChanged': {
                        this.trigger(
                            'connector:changed',
                            message.connectorId,
                            message.points.map((point) => new g.Point(point))
                        );
                        break;
                    }
                    case 'processed': {
                        this.trigger('processed');
                        break;
                    }
                }
            };
        });

        this.postMessage({ type: 'init', options });

        await ready;
    }

    /**
     * Sends a request to the Worker.
     *
     * @param request - The request to send.
     */
    protected postMessage(request: WorkerRequest): void {
        this.worker.postMessage(request);
    }

    /**
     * Not supported: the avoid instance lives inside the Worker thread and
     * cannot be accessed synchronously from the main thread.
     *
     * @throws Always throws, since the `Avoid` instance is not accessible outside the Worker.
     */
    override getAvoidInstance(): AvoidInstance {
        throw new Error('WorkerProvider does not expose the Avoid instance since it runs inside a Worker thread.');
    }

    /**
     * Creates or updates the avoid shape for a JointJS element.
     *
     * @param shape - The shape to create or update.
     */
    override setShape(shape: Shape): void {
        this.shapeIds.add(shape.id);
        this.postMessage({ type: 'updateShape', shape });
    }

    /**
     * Creates or updates the avoid connector for a JointJS link.
     *
     * @param connector - The connector to create or update.
     */
    override setConnector(connector: Connector): void {
        this.connectorIds.add(connector.id);
        this.postMessage({ type: 'updateConnector', connector });
    }

    /**
     * Removes the avoid shape for a JointJS element.
     *
     * @param shapeId - Id of the shape to remove.
     */
    override deleteShape(shapeId: dia.Cell.ID): void {
        this.shapeIds.delete(shapeId);
        this.postMessage({ type: 'deleteShape', shapeId });
    }

    /**
     * Removes the avoid connector for a JointJS link.
     *
     * @param connectorId - Id of the connector to remove.
     */
    override deleteConnector(connectorId: dia.Cell.ID): void {
        this.connectorIds.delete(connectorId);
        this.postMessage({ type: 'deleteConnector', connectorId });
    }

    /**
     * Replaces the entire set of shapes and connectors known to the
     * Worker's avoid router in a single message. If a previous {@link sync}
     * call is still waiting on its own `processed` response, this call
     * queues behind it instead of messaging the Worker right away - two
     * overlapping `sync` messages could otherwise be coalesced into a
     * single batch by the Worker's debouncing (see `Worker.mts`), in which
     * case only one `processed` response would come back for both, and it
     * would be ambiguous which call's shapes/connectors actually "won".
     * The returned promise resolves once this call's own `sync` has been
     * processed, or rejects if the provider is destroyed first (see
     * {@link destroy}), whether while queued or while waiting on the Worker.
     *
     * @param shapes - The full set of shapes that should exist after the sync.
     * @param connectors - The full set of connectors that should exist after the sync.
     */
    override sync(shapes: Shape[], connectors: Connector[]): Promise<void> {
        // Wait for the previous call in the queue, regardless of whether it
        // settled successfully, so one failed/rejected sync doesn't block
        // every sync queued after it.
        const result = this.syncQueue.catch(() => {}).then(() => this.performSync(shapes, connectors));
        this.syncQueue = result.catch(() => {});
        return result;
    }

    /**
     * Does the actual work of {@link sync}: posts a `sync` message to the
     * Worker and resolves once its `processed` response comes back.
     *
     * @param shapes - The full set of shapes that should exist after the sync.
     * @param connectors - The full set of connectors that should exist after the sync.
     */
    private performSync(shapes: Shape[], connectors: Connector[]): Promise<void> {
        if (this.destroyed) {
            throw new Error('WorkerProvider was destroyed before the sync completed.');
        }

        this.shapeIds.clear();
        this.connectorIds.clear();

        shapes.forEach((shape) => this.shapeIds.add(shape.id));
        connectors.forEach((connector) => this.connectorIds.add(connector.id));

        return new Promise((resolve, reject) => {
            // Resolves on the first `processed` response after posting,
            // without correlating it to this particular `sync` request. Safe
            // only because `sync` never runs concurrently with incremental
            // updates (`RouterService` route calls require the service to be
            // stopped) and {@link sync}'s queue serializes overlapping calls.
            // If `sync` is ever allowed while update messages are in flight,
            // requests need ids echoed back in the `processed` response.
            const onProcessed = () => {
                this.off('processed', onProcessed);
                this.pendingSyncRejections.delete(reject);
                resolve();
            };
            this.on('processed', onProcessed);
            this.pendingSyncRejections.add(reject);

            this.postMessage({ type: 'sync', shapes, connectors });
        });
    }

    /**
     * Checks whether a connector with the given id currently exists.
     *
     * Note: this reflects the requests sent to the Worker, not necessarily
     * the Worker's confirmed state, since messaging is asynchronous.
     *
     * @param connectorId - Id of the connector to look up.
     * @returns `true` if the connector exists.
     */
    override hasConnector(connectorId: dia.Cell.ID): boolean {
        return this.connectorIds.has(connectorId);
    }

    /**
     * Checks whether a shape with the given id currently exists.
     *
     * Note: this reflects the requests sent to the Worker, not necessarily
     * the Worker's confirmed state, since messaging is asynchronous.
     *
     * @param shapeId - Id of the shape to look up.
     * @returns `true` if the shape exists.
     */
    override hasShape(shapeId: dia.Cell.ID): boolean {
        return this.shapeIds.has(shapeId);
    }

    /**
     * Terminates the Worker thread and releases its resources. Any
     * {@link sync} call still waiting on a `processed` response is
     * rejected instead of being left to hang forever, and any call still
     * queued behind it is rejected too, once its turn comes up, instead of
     * messaging the now-terminated Worker.
     */
    override destroy(): void {
        this.destroyed = true;

        this.pendingSyncRejections.forEach((reject) => {
            reject(new Error('WorkerProvider was destroyed before the sync completed.'));
        });
        this.pendingSyncRejections.clear();
        // Drop any `onProcessed` listeners left behind by the rejected syncs above.
        this.off('processed');

        this.worker.terminate();
    }
}

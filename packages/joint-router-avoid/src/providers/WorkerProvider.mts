import type { dia } from '@joint/core';
import { g } from '@joint/core';
import type { Avoid as AvoidInstance } from 'libavoid-js';
import type { Connector, Shape } from './Provider.mjs';
import { Provider, type ProviderOptions } from './Provider.mjs';
import type { WorkerRequest, WorkerResponse } from './Worker.mjs';

/** Options used to initialize a {@link WorkerProvider}. */
export interface WorkerProviderOptions extends ProviderOptions {
    /** Milliseconds to debounce queued messages by inside the Worker before applying them in a single batch. */
    workerUpdateDebounceTime?: number;
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
     * Worker's avoid router in a single message. The returned promise
     * resolves once the Worker reports the sync has been processed, via
     * this provider's own `processed` event.
     *
     * @param shapes - The full set of shapes that should exist after the sync.
     * @param connectors - The full set of connectors that should exist after the sync.
     */
    override sync(shapes: Shape[], connectors: Connector[]): Promise<void> {
        this.shapeIds.clear();
        this.connectorIds.clear();

        shapes.forEach((shape) => this.shapeIds.add(shape.id));
        connectors.forEach((connector) => this.connectorIds.add(connector.id));

        return new Promise((resolve) => {
            const onProcessed = () => {
                this.off('processed', onProcessed);
                resolve();
            };
            this.on('processed', onProcessed);

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

    /** Terminates the Worker thread and releases its resources. */
    override destroy(): void {
        this.worker.terminate();
    }
}

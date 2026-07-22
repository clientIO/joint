import type { dia } from '@joint/core';
import { g } from '@joint/core';
import type { Avoid as AvoidInstance } from 'libavoid-js';
import type { Connector, Shape } from './Provider.mjs';
import { Provider, type ProviderOptions } from './Provider.mjs';
import type { WorkerRequest, WorkerResponse } from './Worker.mjs';

export class WorkerProvider extends Provider {
    protected worker!: Worker;

    async init(options: ProviderOptions): Promise<void> {
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
                        this.onConnectorChanged?.(
                            message.connectorId,
                            message.points.map((point) => new g.Point(point))
                        );
                        break;
                    }
                }
            };
        });

        this.postMessage({ type: 'init', options });

        await ready;
    }

    override getAvoidInstance(): AvoidInstance {
        throw new Error('WorkerProvider does not expose the Avoid instance since it runs inside a Worker thread.');
    }

    updateShape(shape: Shape, process: boolean = true): void {
        this.postMessage({ type: 'updateShape', shape, process });
    }

    updateConnector(connector: Connector, process: boolean = true): void {
        this.postMessage({ type: 'updateConnector', connector, process });
    }

    deleteShape(shapeId: dia.Cell.ID, process: boolean = true): void {
        this.postMessage({ type: 'deleteShape', shapeId, process });
    }

    deleteConnector(connectorId: dia.Cell.ID, process: boolean = true): void {
        this.postMessage({ type: 'deleteConnector', connectorId, process });
    }

    updateGraph(shapes: Shape[], connectors: Connector[], process: boolean = true): void {
        this.postMessage({ type: 'updateGraph', shapes, connectors, process });
    }

    protected postMessage(request: WorkerRequest): void {
        this.worker.postMessage(request);
    }
}

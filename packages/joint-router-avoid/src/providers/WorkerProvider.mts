import type { dia } from '@joint/core';
import { g } from '@joint/core';
import type { Avoid as AvoidInstance } from 'libavoid-js';
import type { Connector, Shape } from './Provider.mjs';
import { Provider, type ProviderOptions } from './Provider.mjs';
import type { WorkerRequest, WorkerResponse } from './Worker.mjs';

export interface WorkerProviderOptions extends ProviderOptions {
    debounceTime?: number;
    libraryFilePath?: string;
}

export class WorkerProvider extends Provider {
    protected worker!: Worker;
    protected readonly shapeIds = new Set<dia.Cell.ID>();
    protected readonly connectorIds = new Set<dia.Cell.ID>();

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

    protected postMessage(request: WorkerRequest): void {
        this.worker.postMessage(request);
    }

    override getAvoidInstance(): AvoidInstance {
        throw new Error('WorkerProvider does not expose the Avoid instance since it runs inside a Worker thread.');
    }

    override updateShape(shape: Shape): void {
        this.shapeIds.add(shape.id);
        this.postMessage({ type: 'updateShape', shape });
    }

    override updateConnector(connector: Connector): void {
        this.connectorIds.add(connector.id);
        this.postMessage({ type: 'updateConnector', connector });
    }

    override deleteShape(shapeId: dia.Cell.ID): void {
        this.shapeIds.delete(shapeId);
        this.postMessage({ type: 'deleteShape', shapeId });
    }

    override deleteConnector(connectorId: dia.Cell.ID): void {
        this.connectorIds.delete(connectorId);
        this.postMessage({ type: 'deleteConnector', connectorId });
    }

    override updateGraph(shapes: Shape[], connectors: Connector[]): void {
        shapes.forEach((shape) => this.shapeIds.add(shape.id));
        connectors.forEach((connector) => this.connectorIds.add(connector.id));
        this.postMessage({ type: 'updateGraph', shapes, connectors });
    }

    override hasConnector(connectorId: dia.Cell.ID): boolean {
        return this.connectorIds.has(connectorId);
    }

    override hasShape(shapeId: dia.Cell.ID): boolean {
        return this.shapeIds.has(shapeId);
    }

    override destroy(): void {
        this.worker.terminate();
    }
}

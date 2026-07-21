import type { dia } from '@joint/core';
import type { Avoid } from 'libavoid-js';

export interface ProviderOptions {
    shapeBufferDistance?: number;
    idealNudgingDistance?: number;
}

export interface Pin {
    id: number;
    x: number;
    y: number;
    connectionDirection: number;
}

export interface Shape {
    id: dia.Cell.ID;
    bbox: dia.BBox;
    pins: Pin[];
}

export interface Connector {
    id: dia.Cell.ID;
    sourceId?: dia.Cell.ID;
    sourcePinId?: number;
    targetId?: dia.Cell.ID;
    targetPinId?: number;
}

export abstract class Provider {

    onConnectorChanged?: (connectorId: dia.Cell.ID, points: dia.Point[]) => void;

    abstract init(options: ProviderOptions): Promise<void>;

    abstract updateShape(shape: Shape, process?: boolean): void;

    abstract updateConnector(connector: Connector, process?: boolean): void;

    abstract deleteShape(shapeId: dia.Cell.ID, process?: boolean): void;

    abstract deleteConnector(connectorId: dia.Cell.ID, process?: boolean): void;

    abstract updateGraph(shapes: Shape[], connectors: Connector[], process?: boolean): void;

    abstract getAvoidInstance(): Avoid;
}

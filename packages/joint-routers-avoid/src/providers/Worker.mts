import type { dia } from '@joint/core';
import type { Connector, ProviderOptions, Shape } from './Provider.mjs';
import type { Avoid as AvoidInstance, Router as AvoidRouter, ConnRef, ShapeRef } from 'libavoid-js';
import { AvoidLib } from 'libavoid-js';

export interface WorkerInitRequest {
    type: 'init';
    options: ProviderOptions;
}

export interface WorkerUpdateShapeRequest {
    type: 'updateShape';
    shape: Shape;
    process: boolean;
}

export interface WorkerUpdateConnectorRequest {
    type: 'updateConnector';
    connector: Connector;
    process: boolean;
}

export interface WorkerDeleteShapeRequest {
    type: 'deleteShape';
    shapeId: dia.Cell.ID;
    process: boolean;
}

export interface WorkerDeleteConnectorRequest {
    type: 'deleteConnector';
    connectorId: dia.Cell.ID;
    process: boolean;
}

export interface WorkerUpdateGraphRequest {
    type: 'updateGraph';
    shapes: Shape[];
    connectors: Connector[];
    process: boolean;
}

export type WorkerRequest =
    | WorkerInitRequest
    | WorkerUpdateShapeRequest
    | WorkerUpdateConnectorRequest
    | WorkerDeleteShapeRequest
    | WorkerDeleteConnectorRequest
    | WorkerUpdateGraphRequest;

export interface WorkerReadyResponse {
    type: 'ready';
}

export interface WorkerConnectorChangedResponse {
    type: 'connectorChanged';
    connectorId: dia.Cell.ID;
    points: dia.Point[];
}

export type WorkerResponse = WorkerReadyResponse | WorkerConnectorChangedResponse;

let avoidInstance: AvoidInstance;
let avoidRouter: AvoidRouter;
const shapeRefs: Record<string, ShapeRef> = {};
const connectorRefs: Record<string, ConnRef> = {};
const linksByPointer: Record<number, dia.Cell.ID> = {};

function postResponse(response: WorkerResponse): void {
    postMessage(response);
}

function onAvoidConnectorChanged(connectorRefId: number): void {
    const connectorId = linksByPointer[connectorRefId];
    const connRef = connectorRefs[connectorId!];
    if (!connRef) return;

    const route = connRef.displayRoute();
    const points: dia.Point[] = [];
    for (let i = 0; i < route.size(); i++) {
        const { x, y } = route.get_ps(i);
        points.push({ x, y });
    }

    postResponse({ type: 'connectorChanged', connectorId: connectorId!, points });
}

function createAvoidRouter(Avoid: AvoidInstance, shapeBufferDistance: number, idealNudgingDistance: number): AvoidRouter {
    const router = new Avoid.Router(Avoid.OrthogonalRouting);

    // This parameter defines the spacing distance used for nudging apart
    // overlapping corners and line segments of connectors.
    router.setRoutingParameter(Avoid.idealNudgingDistance, idealNudgingDistance);

    // This parameter defines the spacing distance added to the sides of
    // each shape when determining obstacle sizes for routing.
    router.setRoutingParameter(Avoid.shapeBufferDistance, shapeBufferDistance);

    // Controls whether collinear line segments touching just at their
    // ends will be nudged apart. Not suitable for links connected to ports.
    router.setRoutingOption(Avoid.nudgeOrthogonalTouchingColinearSegments, false);

    // Controls whether the router performs a preprocessing step before
    // orthogonal nudging that generally results in better nudging quality.
    router.setRoutingOption(Avoid.performUnifyingNudgingPreprocessingStep, true);

    router.setRoutingOption(Avoid.nudgeSharedPathsWithCommonEndPoint, true);
    router.setRoutingOption(Avoid.nudgeOrthogonalSegmentsConnectedToShapes, true);

    return router;
}

function handleInit(options: ProviderOptions): void {
    avoidInstance = AvoidLib.getInstance();
    avoidRouter = createAvoidRouter(
        avoidInstance,
        options.shapeBufferDistance ?? 0,
        options.idealNudgingDistance ?? 10
    );

    postResponse({ type: 'ready' });
}

function handleUpdateShape(shape: Shape, process: boolean): void {
    const { x, y, width, height } = shape.bbox;
    const shapeRect = new avoidInstance.Rectangle(
        new avoidInstance.Point(x, y),
        new avoidInstance.Point(x + width, y + height)
    );

    const existingShapeRef = shapeRefs[shape.id];
    if (existingShapeRef) {
        // Only update the position and size of the shape.
        avoidRouter.moveShape(existingShapeRef, shapeRect);
        if (process) {
            avoidRouter.processTransaction();
        }
        return;
    }

    const shapeRef = new avoidInstance.ShapeRef(avoidRouter, shapeRect);
    shapeRefs[shape.id] = shapeRef;

    shape.pins.forEach((pin) => {
        const pinRef = new avoidInstance.ShapeConnectionPin(
            shapeRef,
            pin.id,
            pin.x,
            pin.y,
            true,
            0,
            pin.connectionDirection
        );
        pinRef.setExclusive(false);
    });

    if (process) {
        avoidRouter.processTransaction();
    }
}

function handleDeleteConnector(connectorId: dia.Cell.ID, process: boolean): void {
    const connRef = connectorRefs[connectorId];
    if (!connRef) {
        postResponse({ type: 'connectorChanged', connectorId: connectorId!, points: [] });
        return;
    };
    avoidRouter.deleteConnector(connRef);
    delete connectorRefs[connectorId];

    if (process) {
        avoidRouter.processTransaction();
    }
}

function handleUpdateConnector(connector: Connector, process: boolean): void {
    if (
        connector.sourceId === undefined || connector.sourcePinId === undefined ||
        connector.targetId === undefined || connector.targetPinId === undefined
    ) {
        handleDeleteConnector(connector.id, process);
        return;
    }

    const sourceShapeRef = shapeRefs[connector.sourceId];
    const targetShapeRef = shapeRefs[connector.targetId];

    const sourceConnEnd = new avoidInstance.ConnEnd(
        sourceShapeRef!,
        connector.sourcePinId
    );
    const targetConnEnd = new avoidInstance.ConnEnd(
        targetShapeRef!,
        connector.targetPinId
    );

    const existingConnRef = connectorRefs[connector.id];
    const connRef = existingConnRef ?? new avoidInstance.ConnRef(avoidRouter);

    connRef.setSourceEndpoint(sourceConnEnd);
    connRef.setDestEndpoint(targetConnEnd);

    if (existingConnRef) {
        // It was already created, we just updated the endpoints.
        if (process) {
            avoidRouter.processTransaction();
        }

        return;
    }

    // Note: we do not assign the connRef's `id` to the JointJS link,
    // since libavoid-js (the underlying WASM library) does not behave correctly when a connRef is
    // added-removed-added with the same `id`. Instead, we keep track
    // of the mapping using the connRef's raw pointer (`connRef.g`).
    connectorRefs[connector.id] = connRef;
    // @ts-expect-error do not defined in the type definition, but it is present in the actual object
    linksByPointer[connRef.g] = connector.id;
    connRef.setCallback(onAvoidConnectorChanged, connRef);

    if (process) {
        avoidRouter.processTransaction();
    }
}

function handleDeleteShape(shapeId: dia.Cell.ID, process: boolean): void {
    const shapeRef = shapeRefs[shapeId];
    if (!shapeRef) return;
    avoidRouter.deleteShape(shapeRef);
    delete shapeRefs[shapeId];

    if (process) {
        avoidRouter.processTransaction();
    }
}

function handleUpdateGraph(shapes: Shape[], connectors: Connector[], process: boolean): void {
    shapes.forEach((shape) => handleUpdateShape(shape, false));
    connectors.forEach((connector) => handleUpdateConnector(connector, false));

    if (process) {
        avoidRouter.processTransaction();
    }
}

onmessage = async(evt: MessageEvent<WorkerRequest>) => {
    const message = evt.data;

    switch (message.type) {
        case 'init': {
            await AvoidLib.load();
            handleInit(message.options);
            break;
        }
        case 'updateShape': {
            handleUpdateShape(message.shape, message.process);
            break;
        }
        case 'updateConnector': {
            handleUpdateConnector(message.connector, message.process);
            break;
        }
        case 'deleteShape': {
            handleDeleteShape(message.shapeId, message.process);
            break;
        }
        case 'deleteConnector': {
            handleDeleteConnector(message.connectorId, message.process);
            break;
        }
        case 'updateGraph': {
            handleUpdateGraph(message.shapes, message.connectors, message.process);
            break;
        }
    }
};

import type { dia } from '@joint/core';
import { util } from '@joint/core';
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
}

export interface WorkerUpdateConnectorRequest {
    type: 'updateConnector';
    connector: Connector;
}

export interface WorkerDeleteShapeRequest {
    type: 'deleteShape';
    shapeId: dia.Cell.ID;
}

export interface WorkerDeleteConnectorRequest {
    type: 'deleteConnector';
    connectorId: dia.Cell.ID;
}

export interface WorkerUpdateGraphRequest {
    type: 'updateGraph';
    shapes: Shape[];
    connectors: Connector[];
}

export type WorkerRequest =
    | WorkerInitRequest
    | WorkerUpdateShapeRequest
    | WorkerUpdateConnectorRequest
    | WorkerDeleteShapeRequest
    | WorkerDeleteConnectorRequest
    | WorkerUpdateGraphRequest;

// Requests other than `init` are queued and debounced so that bursts of
// messages (e.g. shape updates while dragging an element) do not each
// trigger their own `avoidRouter.processTransaction()` call.
type QueueableWorkerRequest = Exclude<WorkerRequest, WorkerInitRequest>;

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
let debounceTime: number = 100;
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
    debounceTime = options.debounceTime ?? 100;

    postResponse({ type: 'ready' });
}

function handleUpdateShape(shape: Shape): void {
    const { x, y, width, height } = shape.bbox;
    const shapeRect = new avoidInstance.Rectangle(
        new avoidInstance.Point(x, y),
        new avoidInstance.Point(x + width, y + height)
    );

    const existingShapeRef = shapeRefs[shape.id];
    if (existingShapeRef) {
        // Only update the position and size of the shape.
        avoidRouter.moveShape(existingShapeRef, shapeRect);
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
}

function handleDeleteConnector(connectorId: dia.Cell.ID): void {
    const connRef = connectorRefs[connectorId];
    if (!connRef) {
        postResponse({ type: 'connectorChanged', connectorId: connectorId!, points: [] });
        return;
    };
    avoidRouter.deleteConnector(connRef);
    delete connectorRefs[connectorId];
}

function handleUpdateConnector(connector: Connector): void {
    if (
        connector.sourceId === undefined || connector.sourcePinId === undefined ||
        connector.targetId === undefined || connector.targetPinId === undefined
    ) {
        handleDeleteConnector(connector.id);
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
}

function handleDeleteShape(shapeId: dia.Cell.ID): void {
    const shapeRef = shapeRefs[shapeId];
    if (!shapeRef) return;
    avoidRouter.deleteShape(shapeRef);
    delete shapeRefs[shapeId];
}

function handleUpdateGraph(shapes: Shape[], connectors: Connector[]): void {
    shapes.forEach((shape) => handleUpdateShape(shape));
    connectors.forEach((connector) => handleUpdateConnector(connector));
}

const messageQueue: QueueableWorkerRequest[] = [];

function handleQueuedMessage(message: QueueableWorkerRequest): void {
    switch (message.type) {
        case 'updateShape': {
            handleUpdateShape(message.shape);
            break;
        }
        case 'updateConnector': {
            handleUpdateConnector(message.connector);
            break;
        }
        case 'deleteShape': {
            handleDeleteShape(message.shapeId);
            break;
        }
        case 'deleteConnector': {
            handleDeleteConnector(message.connectorId);
            break;
        }
        case 'updateGraph': {
            handleUpdateGraph(message.shapes, message.connectors);
            break;
        }
    }
}

// Drains the queued messages, applying each of them, and runs
// `processTransaction()` at most once for the whole batch.
const flushMessageQueue = util.debounce(() => {
    const messages = messageQueue.splice(0, messageQueue.length);
    if (messages.length === 0) return;

    messages.forEach(handleQueuedMessage);

    avoidRouter.processTransaction();
}, debounceTime);

onmessage = async(evt: MessageEvent<WorkerRequest>) => {
    const message = evt.data;

    if (message.type === 'init') {
        await AvoidLib.load();
        handleInit(message.options);
        return;
    }

    if (debounceTime === 0) {
        handleQueuedMessage(message);
        avoidRouter.processTransaction();
    } else {
        messageQueue.push(message);
        flushMessageQueue();
    }
};

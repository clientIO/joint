import { util } from '@joint/core';
import { AvoidLib } from 'libavoid-js';
import type { dia } from '@joint/core';
import type { Connector, Shape } from './Provider.mjs';
import type { Avoid as AvoidInstance, Router as AvoidRouter, ConnRef, ShapeRef } from 'libavoid-js';
import type { WorkerProviderOptions } from './WorkerProvider.mjs';

/** Request sent once, right after the Worker is spawned, to load and configure the avoid router. */
export interface WorkerInitRequest {
    type: 'init';
    /** Configuration for the avoid router instance. */
    options: WorkerProviderOptions;
}

/** Request to create or update the avoid shape for a JointJS element. */
export interface WorkerUpdateShapeRequest {
    type: 'updateShape';
    /** The shape to create or update. */
    shape: Shape;
}

/** Request to create or update the avoid connector for a JointJS link. */
export interface WorkerUpdateConnectorRequest {
    type: 'updateConnector';
    /** The connector to create or update. */
    connector: Connector;
}

/** Request to remove the avoid shape for a JointJS element. */
export interface WorkerDeleteShapeRequest {
    type: 'deleteShape';
    /** Id of the shape to remove. */
    shapeId: dia.Cell.ID;
}

/** Request to remove the avoid connector for a JointJS link. */
export interface WorkerDeleteConnectorRequest {
    type: 'deleteConnector';
    /** Id of the connector to remove. */
    connectorId: dia.Cell.ID;
}

/** Request to replace the entire set of shapes and connectors known to the avoid router. */
export interface WorkerSyncRequest {
    type: 'sync';
    /** The full set of shapes that should exist after the sync. */
    shapes: Shape[];
    /** The full set of connectors that should exist after the sync. */
    connectors: Connector[];
}

/** Any request a {@link WorkerProvider} may post to this Worker. */
export type WorkerRequest =
    | WorkerInitRequest
    | WorkerUpdateShapeRequest
    | WorkerUpdateConnectorRequest
    | WorkerDeleteShapeRequest
    | WorkerDeleteConnectorRequest
    | WorkerSyncRequest;

// Requests other than `init` are queued and debounced so that bursts of
// messages (e.g. shape updates while dragging an element) do not each
// trigger their own `avoidRouter.processTransaction()` call.
/** Any {@link WorkerRequest} other than `init`, i.e. one that may be queued and debounced. */
type QueueableWorkerRequest = Exclude<WorkerRequest, WorkerInitRequest>;

/** Response posted once the Worker has finished handling an `init` request and is ready for further messages. */
export interface WorkerReadyResponse {
    type: 'ready';
}

/** Response posted whenever avoid recomputes the route of a connector. */
export interface WorkerConnectorChangedResponse {
    type: 'connectorChanged';
    /** Id of the link whose route changed. */
    connectorId: dia.Cell.ID;
    /** The new route, including the source and target points. */
    points: dia.Point[];
}

export interface WorkerProcessedResponse {
    type: 'processed';
}

/** Any response this Worker may post back to its {@link WorkerProvider}. */
export type WorkerResponse = WorkerReadyResponse | WorkerConnectorChangedResponse | WorkerProcessedResponse;
let avoidInstance: AvoidInstance;
let avoidRouter: AvoidRouter;
const shapeRefs: Record<string, ShapeRef> = {};
const connectorRefs: Record<string, ConnRef> = {};
const linksByPointer: Record<number, dia.Cell.ID> = {};

let updateDebounceTime: number = 100;
// Drains the queued messages, applying each of them, and runs
// `processTransaction()` at most once for the whole batch.
/** Applies every currently queued request, then runs a single `processTransaction()` for the whole batch. */
const flushMessageFunction = () => {
    const messages = messageQueue.splice(0, messageQueue.length);
    if (messages.length === 0) return;

    messages.forEach(handleQueuedMessage);

    avoidRouter.processTransaction();
    postResponse({ type: 'processed' });
};
/** Debounced version of {@link flushMessageFunction}, re-created by {@link handleInit} once the configured `updateDebounceTime` is known. */
let flushMessageQueue = util.debounce(flushMessageFunction, updateDebounceTime);

/**
 * Posts a response back to the {@link WorkerProvider} that owns this Worker.
 *
 * @param response - The response to send.
 */
function postResponse(response: WorkerResponse): void {
    postMessage(response);
}

/**
 * Callback registered with avoid connectors. Translates a connector's raw
 * pointer id back to its JointJS link id and posts the new route back to
 * the main thread via {@link postResponse}.
 *
 * @param connectorRefId - Raw pointer id (`connRef.g`) of the connector whose route changed.
 */
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

/**
 * Creates and configures a new avoid `Router` instance.
 *
 * @param Avoid - The `Avoid` WASM module instance.
 * @param shapeBufferDistance - Spacing distance added to the sides of each shape when determining obstacle sizes for routing.
 * @param idealNudgingDistance - Spacing distance used for nudging apart overlapping corners and line segments of connectors.
 * @returns The configured avoid router.
 */
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

/**
 * Loads the avoid WASM module and creates the router instance used for the
 * lifetime of this Worker, then posts a `ready` response.
 *
 * @param options - Configuration for the avoid router instance.
 */
async function handleInit(options: WorkerProviderOptions): Promise<void> {
    await AvoidLib.load(options.libavoidFilePath);

    avoidInstance = AvoidLib.getInstance();
    avoidRouter = createAvoidRouter(
        avoidInstance,
        options.shapeBufferDistance ?? 10,
        options.idealNudgingDistance ?? 5
    );
    updateDebounceTime = options.updateDebounceTime ?? 100;
    flushMessageQueue = util.debounce(flushMessageFunction, updateDebounceTime);

    postResponse({ type: 'ready' });
}

/**
 * Creates or updates the avoid shape for a JointJS element.
 *
 * @param shape - The shape to create or update.
 */
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

/**
 * Removes the avoid connector for a JointJS link, if it exists.
 *
 * @param connectorId - Id of the connector to remove.
 */
function handleDeleteConnector(connectorId: dia.Cell.ID): void {
    const connRef = connectorRefs[connectorId];
    if (!connRef) return;
    avoidRouter.deleteConnector(connRef);
    delete connectorRefs[connectorId];
    // @ts-expect-error do not defined in the type definition, but it is present in the actual object
    delete linksByPointer[connRef.g];

}

/**
 * Creates or updates the avoid connector for a JointJS link. If either end
 * is missing its shape/pin ids, the connector is deleted instead, since
 * avoid cannot route a connector that isn't fully connected.
 *
 * @param connector - The connector to create or update.
 */
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

/**
 * Removes the avoid shape for a JointJS element, if it exists.
 *
 * @param shapeId - Id of the shape to remove.
 */
function handleDeleteShape(shapeId: dia.Cell.ID): void {
    const shapeRef = shapeRefs[shapeId];
    if (!shapeRef) return;
    avoidRouter.deleteShape(shapeRef);
    delete shapeRefs[shapeId];
}

/**
 * Replaces the entire set of shapes and connectors known to the avoid
 * router: deletes everything currently tracked, then recreates `shapes`
 * and `connectors`.
 *
 * @param shapes - The full set of shapes that should exist after the sync.
 * @param connectors - The full set of connectors that should exist after the sync.
 */
function handleSync(shapes: Shape[], connectors: Connector[]): void {
    Object.keys(connectorRefs).forEach((connectorId) => {
        handleDeleteConnector(connectorId);
    });
    Object.keys(shapeRefs).forEach((shapeId) => {
        handleDeleteShape(shapeId);
    });

    shapes.forEach((shape) => handleUpdateShape(shape));
    connectors.forEach((connector) => handleUpdateConnector(connector));
}

const messageQueue: QueueableWorkerRequest[] = [];

/**
 * Dispatches a single queued request to its handler.
 *
 * @param message - The request to handle.
 */
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
        case 'sync': {
            handleSync(message.shapes, message.connectors);
            break;
        }
    }
}

/**
 * Entry point for every message posted to this Worker by its
 * {@link WorkerProvider}. `init` is handled immediately; every other
 * request is queued and flushed via the debounced {@link flushMessageQueue},
 * unless `debounceTime` is `0`, in which case it is applied immediately.
 *
 * @param evt - The message event carrying a {@link WorkerRequest}.
 */
onmessage = async(evt: MessageEvent<WorkerRequest>) => {
    const message = evt.data;

    if (message.type === 'init') {
        handleInit(message.options);
        return;
    }

    if (updateDebounceTime === 0) {
        handleQueuedMessage(message);
        avoidRouter.processTransaction();
        postResponse({ type: 'processed' });
    } else {
        messageQueue.push(message);
        flushMessageQueue();
    }
};

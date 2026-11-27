import { util } from '@joint/core';
import { AvoidLib } from 'libavoid-js';
import type { dia } from '@joint/core';
import type { Connector, Shape } from './Provider.mjs';
import type { Avoid as AvoidInstance, Router as AvoidRouter, ConnEndLike, ConnRef, JunctionRef, ShapeRef } from 'libavoid-js';
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
    /** `false` if avoid found no route and fell back to a straight line between the ends. */
    isValid: boolean;
}

export interface WorkerProcessedResponse {
    type: 'processed';
}

/**
 * Response posted when avoid moved a junction that is not fixed to a better position.
 *
 * @experimental Proof of concept, the API will change.
 */
export interface WorkerJunctionChangedResponse {
    type: 'junctionChanged';
    /** Id of the junction (the JointJS element). */
    junctionId: dia.Cell.ID;
    /** The new center of the junction. */
    position: dia.Point;
}

/** Response posted when the Worker fails to initialize (e.g. the avoid WASM module cannot be loaded). */
export interface WorkerErrorResponse {
    type: 'error';
    /** Description of the failure. */
    message: string;
}

/** Any response this Worker may post back to its {@link WorkerProvider}. */
export type WorkerResponse = WorkerReadyResponse | WorkerConnectorChangedResponse | WorkerProcessedResponse | WorkerJunctionChangedResponse | WorkerErrorResponse;
let avoidInstance: AvoidInstance;
let avoidRouter: AvoidRouter;
const shapeRefs: Record<string, ShapeRef> = {};
const connectorRefs: Record<string, ConnRef> = {};
/**
 * Avoid junction references, keyed by JointJS element id.
 *
 * @experimental Proof of concept, the API will change.
 */
const junctionRefs: Record<string, JunctionRef> = {};
/**
 * Ids of the shapes added since the last {@link processTransaction} call.
 * Deleting a shape in the same transaction that added it throws, and a
 * batch can do that (e.g. an element added and removed within one debounce
 * window) - see {@link handleDeleteShape}.
 */
const shapesAddedInTransaction = new Set<string>();

let updateDebounceTime: number = 100;

/** Routes every change made since the last call; see `Router.processTransaction()`. */
function processTransaction(): void {
    avoidRouter.processTransaction();
    shapesAddedInTransaction.clear();
    // A junction move takes effect at the next pass: route again until the
    // junctions settle, so every route ends at the final position.
    const movedJunctions = new Map<string, dia.Point>();
    for (let pass = 0; moveJunctionsToRecommendedPositions(movedJunctions); pass++) {
        // Out of passes: the junctions are still moving. The routes of the
        // last pass already end at the recommended positions, so the move
        // above is only reported (avoid applies it at the next transaction).
        if (pass === MAX_JUNCTION_PASSES) break;
        avoidRouter.processTransaction();
    }
    // Junctions first: a link's route (or its fallback route) is applied to
    // the junction's final position.
    movedJunctions.forEach((position, junctionId) => {
        postResponse({ type: 'junctionChanged', junctionId, position });
    });
    changedRoutes.forEach(({ points, isValid }, connectorId) => {
        postResponse({ type: 'connectorChanged', connectorId, points, isValid });
    });
    changedRoutes.clear();
}

/**
 * The most extra passes a transaction runs to let moved junctions settle.
 *
 * @experimental Proof of concept, the API will change.
 */
const MAX_JUNCTION_PASSES = 3;

/**
 * Moves every junction that is not fixed to the position avoid recommends
 * for it. The move takes effect at the next pass.
 *
 * @param movedJunctions - Collects the new position of each moved junction, keyed by its id.
 * @returns Whether any junction moved.
 * @experimental Proof of concept, the API will change.
 */
function moveJunctionsToRecommendedPositions(movedJunctions: Map<string, dia.Point>): boolean {
    let moved = false;
    Object.keys(junctionRefs).forEach((junctionId) => {
        const junctionRef = junctionRefs[junctionId]!;
        if (junctionRef.positionFixed()) return;
        const recommended = junctionRef.recommendedPosition();
        const current = junctionRef.position();
        if (recommended.x === current.x && recommended.y === current.y) return;
        avoidRouter.moveJunction(junctionRef, recommended);
        movedJunctions.set(junctionId, { x: recommended.x, y: recommended.y });
        moved = true;
    });
    return moved;
}

/**
 * Returns the avoid connector end for a connector's end: the junction, or
 * the pin of the shape.
 *
 * @param id - Id of the shape or junction.
 * @param pinId - Id of the pin on the shape; ignored for a junction.
 * @returns The avoid connector end.
 */
function getConnEnd(id: dia.Cell.ID, pinId: number): ConnEndLike {
    const junctionRef = junctionRefs[id];
    if (junctionRef) return { junction: junctionRef };
    return { shape: shapeRefs[id]!, pin: pinId };
}
/**
 * Drops every `updateConnector` request that is followed by a
 * `deleteConnector` for the same connector later in the batch. Besides
 * being dead work, applying such an update would make libavoid warn on the
 * deletion ("ConnEnd set but Router::processTransaction has not yet been
 * called") - the update sets the connector's endpoints, and the whole
 * batch shares a single `processTransaction()` call that only runs
 * afterwards. Common while dragging a link end: every pointermove queues
 * an update or delete for the same connector.
 *
 * @param messages - The batch to compact, in arrival order.
 * @returns The batch without the superseded updates.
 */
function compactMessages(messages: QueueableWorkerRequest[]): QueueableWorkerRequest[] {
    const lastDeleteIndex = new Map<dia.Cell.ID, number>();
    messages.forEach((message, index) => {
        if (message.type === 'deleteConnector') {
            lastDeleteIndex.set(message.connectorId, index);
        }
    });
    if (lastDeleteIndex.size === 0) return messages;

    return messages.filter((message, index) => {
        if (message.type !== 'updateConnector') return true;
        const deleteIndex = lastDeleteIndex.get(message.connector.id);
        return deleteIndex === undefined || index > deleteIndex;
    });
}

// Drains the queued messages, applying each of them, and runs
// `processTransaction()` at most once for the whole batch.
/** Applies every currently queued request, then runs a single `processTransaction()` for the whole batch. */
const flushMessageFunction = () => {
    const messages = messageQueue.splice(0, messageQueue.length);
    if (messages.length === 0) return;

    compactMessages(messages).forEach(handleQueuedMessage);

    processTransaction();
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
 * Callback registered with each avoid connector. Reads the connector's new
 * route and posts it back to the main thread via {@link postResponse}.
 *
 * @param connectorId - Id of the JointJS link the connector belongs to.
 * @param connRef - The avoid connector whose route changed.
 */
function onAvoidConnectorChanged(connectorId: dia.Cell.ID, connRef: ConnRef): void {
    // Posted once the pass is over (see `processTransaction()`), so a
    // connector routed again while the junctions settle is posted once.
    changedRoutes.set(connectorId, {
        points: connRef.displayRoute().map(({ x, y }) => ({ x, y })),
        isValid: connRef.hasValidRoute()
    });
}

/** The routes avoid computed during the current `processTransaction()`, keyed by link id. */
const changedRoutes = new Map<dia.Cell.ID, { points: dia.Point[], isValid: boolean }>();

/**
 * Creates and configures a new avoid `Router` instance.
 *
 * @param Avoid - The `Avoid` WASM module instance.
 * @param shapeBufferDistance - Spacing distance added to the sides of each shape when determining obstacle sizes for routing.
 * @param idealNudgingDistance - Spacing distance used for nudging apart overlapping corners and line segments of connectors.
 * @returns The configured avoid router.
 */
function createAvoidRouter(Avoid: AvoidInstance, shapeBufferDistance: number, idealNudgingDistance: number): AvoidRouter {
    const { RouterFlag, RoutingParameter, RoutingOption } = Avoid;
    const router = new Avoid.Router(RouterFlag.OrthogonalRouting);

    // This parameter defines the spacing distance used for nudging apart
    // overlapping corners and line segments of connectors.
    router.setRoutingParameter(RoutingParameter.idealNudgingDistance, idealNudgingDistance);

    // This parameter defines the spacing distance added to the sides of
    // each shape when determining obstacle sizes for routing.
    router.setRoutingParameter(RoutingParameter.shapeBufferDistance, shapeBufferDistance);

    // Controls whether collinear line segments touching just at their
    // ends will be nudged apart. Not suitable for links connected to ports.
    router.setRoutingOption(RoutingOption.nudgeOrthogonalTouchingColinearSegments, false);

    // Controls whether the router performs a preprocessing step before
    // orthogonal nudging that generally results in better nudging quality.
    router.setRoutingOption(RoutingOption.performUnifyingNudgingPreprocessingStep, true);

    router.setRoutingOption(RoutingOption.nudgeSharedPathsWithCommonEndPoint, true);
    router.setRoutingOption(RoutingOption.nudgeOrthogonalSegmentsConnectedToShapes, true);

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
    if (shape.junction) {
        handleUpdateJunction(shape);
        return;
    }
    if (junctionRefs[shape.id]) {
        // The element is no longer a junction.
        handleDeleteShape(shape.id);
    }
    const { x, y, width, height } = shape.bbox;
    const shapeRect = { x, y, width, height };

    const existingShapeRef = shapeRefs[shape.id];
    if (existingShapeRef) {
        // Only update the position and size of the shape.
        avoidRouter.moveShape(existingShapeRef, shapeRect);
        return;
    }

    const shapeRef = avoidRouter.addShape(shapeRect);
    shapeRefs[shape.id] = shapeRef;
    shapesAddedInTransaction.add(String(shape.id));

    shape.pins.forEach((pin) => {
        // `x` and `y` are proportional to the shape's size.
        const pinRef = shapeRef.addPin({
            classId: pin.id,
            x: pin.x,
            y: pin.y,
            directions: pin.connectionDirection
        });
        pinRef.setExclusive(false);
    });
}

/**
 * Creates or updates the avoid junction for a JointJS element: a point at
 * the center of the element where several connectors meet.
 *
 * @param shape - The junction to create or update (`shape.junction` is `true`).
 * @experimental Proof of concept, the API will change.
 */
function handleUpdateJunction(shape: Shape): void {
    if (shapeRefs[shape.id]) {
        // The element became a junction.
        handleDeleteShape(shape.id);
    }
    const { x, y, width, height } = shape.bbox;
    const center = { x: x + width / 2, y: y + height / 2 };
    let junctionRef = junctionRefs[shape.id];
    if (junctionRef) {
        avoidRouter.moveJunction(junctionRef, center);
    } else {
        junctionRef = avoidRouter.addJunction(center);
        junctionRefs[shape.id] = junctionRef;
        shapesAddedInTransaction.add(String(shape.id));
    }
    junctionRef.setPositionFixed(!!shape.fixed);
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

    const sourceConnEnd = getConnEnd(connector.sourceId, connector.sourcePinId);
    const targetConnEnd = getConnEnd(connector.targetId, connector.targetPinId);

    const existingConnRef = connectorRefs[connector.id];
    if (existingConnRef) {
        // It was already created, we just update the endpoints.
        existingConnRef.setSource(sourceConnEnd);
        existingConnRef.setDest(targetConnEnd);
        existingConnRef.setRoutingCheckpoints(connector.checkpoints ?? []);
        return;
    }

    // Note: we do not pass the JointJS link id to avoid as the connector's
    // `id`, since libavoid does not behave correctly when a connector is
    // added-removed-added with the same `id`. The callback closes over the
    // link id instead.
    const connRef = avoidRouter.addConnector(sourceConnEnd, targetConnEnd);
    connectorRefs[connector.id] = connRef;
    connRef.setCallback(() => onAvoidConnectorChanged(connector.id, connRef));
    if (connector.checkpoints?.length) connRef.setRoutingCheckpoints(connector.checkpoints);
}

/**
 * Removes the avoid shape for a JointJS element, if it exists.
 *
 * @param shapeId - Id of the shape to remove.
 */
function handleDeleteShape(shapeId: dia.Cell.ID): void {
    const junctionRef = junctionRefs[shapeId];
    if (junctionRef) {
        // Like a shape, a junction cannot be deleted in the transaction that added it.
        if (shapesAddedInTransaction.has(String(shapeId))) processTransaction();
        avoidRouter.deleteJunction(junctionRef);
        delete junctionRefs[shapeId];
        return;
    }
    const shapeRef = shapeRefs[shapeId];
    if (!shapeRef) return;
    if (shapesAddedInTransaction.has(String(shapeId))) {
        // libavoid cannot delete a shape in the transaction that added it,
        // so route the batch so far first. Rare: only when a shape is added
        // and removed (or replaced by a sync) within the same batch.
        processTransaction();
    }
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
    Object.keys(junctionRefs).forEach((junctionId) => {
        handleDeleteShape(junctionId);
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
        handleInit(message.options).catch((error) => {
            postResponse({
                type: 'error',
                message: error instanceof Error ? error.message : String(error)
            });
        });
        return;
    }

    if (updateDebounceTime === 0) {
        handleQueuedMessage(message);
        processTransaction();
        postResponse({ type: 'processed' });
    } else {
        messageQueue.push(message);
        flushMessageQueue();
    }
};

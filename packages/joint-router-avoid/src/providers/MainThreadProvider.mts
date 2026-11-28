import type { dia } from '@joint/core';
import { g } from '@joint/core';
import type { Connector, Shape } from './Provider.mjs';
import { Provider, type ProviderOptions } from './Provider.mjs';
import type { Avoid as AvoidInstance, Router as AvoidRouter, ConnEndLike, ConnRef, JunctionRef, ShapeRef } from 'libavoid-js';
import { AvoidLib } from 'libavoid-js';

/**
 * The most extra passes a transaction runs to let moved junctions settle.
 *
 * @experimental Proof of concept, the API will change.
 */
const MAX_JUNCTION_PASSES = 3;

/**
 * A {@link Provider} that runs the avoid WASM router directly on the main
 * thread. Simpler than {@link WorkerProvider} but blocks the UI thread
 * while routes are being computed, so it is best suited to smaller graphs.
 */
export class MainThreadProvider extends Provider {
    /** The `Avoid` WASM module instance. */
    protected avoidInstance!: AvoidInstance;
    /** The avoid router instance that owns all shapes and connectors created by this provider. */
    protected avoidRouter!: AvoidRouter;
    /** Avoid shape references, keyed by JointJS element id. */
    protected readonly shapeRefs: Record<string, ShapeRef> = {};
    /** Avoid connector references, keyed by JointJS link id. */
    protected readonly connectorRefs: Record<string, ConnRef> = {};
    /**
     * Avoid junction references, keyed by JointJS element id.
     *
     * @experimental Proof of concept, the API will change.
     */
    protected readonly junctionRefs: Record<string, JunctionRef> = {};
    /** Set by {@link destroy}; once the avoid router is freed, further changes are ignored. */
    protected destroyed = false;
    /** Whether avoid is inside `processTransaction()`, where the router must not be freed. */
    protected processing = false;
    /** Whether a listener asked for a pass while {@link processTransaction} was announcing routes. */
    protected pendingPass = false;
    /** The routes avoid computed during the current {@link processTransaction}, keyed by link id. */
    protected readonly changedRoutes = new Map<dia.Cell.ID, { points: g.Point[], isValid: boolean }>();

    /**
     * Initializes the avoid router instance on the main thread.
     *
     * @param options - Configuration for the avoid router instance.
     */
    override async init(options: ProviderOptions): Promise<void> {
        this.avoidInstance = AvoidLib.getInstance();
        this.avoidRouter = this.createAvoidRouter(
            this.avoidInstance,
            options.shapeBufferDistance ?? 10,
            options.idealNudgingDistance ?? 5
        );
    }

    /**
     * Callback registered with each avoid connector. Reads the connector's
     * new route and announces it for the JointJS link it belongs to.
     *
     * @param connectorId - Id of the JointJS link the connector belongs to.
     * @param connRef - The avoid connector whose route changed.
     */
    protected onAvoidConnectorChanged(connectorId: dia.Cell.ID, connRef: ConnRef): void {
        // Announced once the pass is over (see {@link processTransaction}),
        // so a connector routed again while the junctions settle is
        // announced once, with its final route.
        this.changedRoutes.set(connectorId, {
            points: connRef.displayRoute().map(({ x, y }) => new g.Point(x, y)),
            isValid: connRef.hasValidRoute()
        });
    }

    /**
     * Runs a routing pass over the pending avoid changes. Every processing
     * path must go through here: it announces the routes avoid computed only
     * once the WASM call has returned, so a `connector:changed` listener
     * error cannot unwind through WASM, and rethrows the first such error.
     */
    protected processTransaction(): void {
        if (this.processing) {
            // Called from a listener while the routes are announced: the
            // outer call routes again once it has announced them.
            this.pendingPass = true;
            return;
        }
        let firstError: { error: unknown } | null = null;
        // While `processing`, `destroy()` leaves freeing the router to us.
        this.processing = true;
        try {
            do {
                this.pendingPass = false;
                this.avoidRouter.processTransaction();
                const movedJunctions = new Map<string, dia.Point>();
                // A junction move takes effect at the next pass: route again until
                // the junctions settle, so every route ends at the final position.
                for (let pass = 0; this.moveJunctionsToRecommendedPositions(movedJunctions); pass++) {
                    // Out of passes: the junctions are still moving. The routes of the
                    // last pass already end at the recommended positions, so the move
                    // above is only reported (avoid applies it at the next transaction).
                    if (pass === MAX_JUNCTION_PASSES) break;
                    this.avoidRouter.processTransaction();
                }
                // The WASM call has returned, so a listener error can no longer
                // unwind through it. Announce every change, rethrow the first error.
                // Junctions first: a link's route (or its fallback route) is
                // applied to the junction's final position.
                const junctions = [...movedJunctions];
                movedJunctions.clear();
                const routes = [...this.changedRoutes];
                this.changedRoutes.clear();
                const announce = (callback: () => void) => {
                    try {
                        callback();
                    } catch (error) {
                        if (!firstError) firstError = { error };
                    }
                };
                junctions.forEach(([junctionId, position]) => {
                    announce(() => this.trigger('junction:changed', junctionId, new g.Point(position)));
                });
                routes.forEach(([connectorId, { points, isValid }]) => {
                    announce(() => this.trigger('connector:changed', connectorId, points, isValid));
                });
            } while (this.pendingPass && !this.destroyed && !firstError);
        } finally {
            this.processing = false;
            this.pendingPass = false;
        }
        if (this.destroyed) {
            // `destroy()` was called from a listener during the pass.
            this.avoidRouter.delete();
        }
        if (firstError) throw (firstError as { error: unknown }).error;
        if (this.destroyed) return;
        this.trigger('processed');
    }

    /**
     * Moves every junction that is not fixed to the position avoid
     * recommends for it. The move takes effect at the next pass.
     *
     * @param movedJunctions - Collects the new position of each moved junction, keyed by its id.
     * @returns Whether any junction moved.
     * @experimental Proof of concept, the API will change.
     */
    protected moveJunctionsToRecommendedPositions(movedJunctions: Map<string, dia.Point>): boolean {
        const { junctionRefs, avoidRouter } = this;
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
     * Returns the underlying `Avoid` WASM module instance.
     *
     * @returns The avoid instance driving this provider.
     */
    override getAvoidInstance(): AvoidInstance {
        return this.avoidInstance;
    }

    /**
     * Creates or updates the avoid shape for a JointJS element.
     *
     * @param shape - The shape to create or update.
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`. Pass `false` to batch several calls together, e.g. from {@link sync}.
     */
    override setShape(shape: Shape, process: boolean = true): void {
        if (this.destroyed) return;
        if (shape.junction) {
            this.setJunction(shape, process);
            return;
        }
        const { shapeRefs, junctionRefs, avoidRouter } = this;
        const junctionRef = junctionRefs[shape.id];
        if (junctionRef) {
            // The element is no longer a junction.
            avoidRouter.deleteJunction(junctionRef);
            delete junctionRefs[shape.id];
        }
        const { x, y, width, height } = shape.bbox;
        const shapeRect = { x, y, width, height };

        const existingShapeRef = shapeRefs[shape.id];
        if (existingShapeRef) {
            // Only update the position and size of the shape.
            avoidRouter.moveShape(existingShapeRef, shapeRect);
            if (process) {
                this.processTransaction();
            }
            return;
        }

        const shapeRef = avoidRouter.addShape(shapeRect);
        shapeRefs[shape.id] = shapeRef;

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

        if (process) {
            this.processTransaction();
        }
    }

    /**
     * Creates or updates the avoid junction for a JointJS element: a point at
     * the center of the element where several connectors meet.
     *
     * @param shape - The junction to create or update (`shape.junction` is `true`).
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`.
     * @experimental Proof of concept, the API will change.
     */
    protected setJunction(shape: Shape, process: boolean = true): void {
        const { junctionRefs, shapeRefs, avoidRouter } = this;
        const shapeRef = shapeRefs[shape.id];
        if (shapeRef) {
            // The element became a junction.
            avoidRouter.deleteShape(shapeRef);
            delete shapeRefs[shape.id];
        }
        const { x, y, width, height } = shape.bbox;
        const center = { x: x + width / 2, y: y + height / 2 };
        let junctionRef = junctionRefs[shape.id];
        if (junctionRef) {
            avoidRouter.moveJunction(junctionRef, center);
        } else {
            junctionRef = avoidRouter.addJunction(center);
            junctionRefs[shape.id] = junctionRef;
        }
        junctionRef.setPositionFixed(!!shape.fixed);
        if (process) {
            this.processTransaction();
        }
    }

    /**
     * Returns the avoid connector end for a connector's end: the junction,
     * or the pin of the shape.
     *
     * @param id - Id of the shape or junction.
     * @param pinId - Id of the pin on the shape; ignored for a junction.
     * @returns The avoid connector end.
     */
    protected getConnEnd(id: dia.Cell.ID, pinId: number): ConnEndLike {
        const junctionRef = this.junctionRefs[id];
        if (junctionRef) return { junction: junctionRef };
        return { shape: this.shapeRefs[id]!, pin: pinId };
    }

    /**
     * Creates or updates the avoid connector for a JointJS link. If either
     * end is missing its shape/pin ids, the connector is deleted instead,
     * since avoid cannot route a connector that isn't fully connected.
     *
     * @param connector - The connector to create or update.
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`. Pass `false` to batch several calls together, e.g. from {@link sync}.
     */
    override setConnector(connector: Connector, process: boolean = true): void {
        if (this.destroyed) return;
        const { connectorRefs } = this;
        if (
            connector.sourceId === undefined || connector.sourcePinId === undefined ||
            connector.targetId === undefined || connector.targetPinId === undefined
        ) {
            // Forward `process`: inside a batched sync() the deletion must not
            // process (and announce) a transaction of its own mid-batch.
            this.deleteConnector(connector.id, process);
            return;
        }

        const sourceConnEnd = this.getConnEnd(connector.sourceId, connector.sourcePinId);
        const targetConnEnd = this.getConnEnd(connector.targetId, connector.targetPinId);

        const existingConnRef = connectorRefs[connector.id];
        if (existingConnRef) {
            // It was already created, we just update the endpoints.
            existingConnRef.setSource(sourceConnEnd);
            existingConnRef.setDest(targetConnEnd);
            existingConnRef.setRoutingCheckpoints(connector.checkpoints ?? []);
            if (process) {
                this.processTransaction();
            }
            return;
        }

        // Note: we do not pass the JointJS link id to avoid as the connector's
        // `id`, since libavoid does not behave correctly when a connector is
        // added-removed-added with the same `id`. The callback closes over the
        // link id instead.
        const connRef = this.avoidRouter.addConnector(sourceConnEnd, targetConnEnd);
        connectorRefs[connector.id] = connRef;
        connRef.setCallback(() => this.onAvoidConnectorChanged(connector.id, connRef));
        if (connector.checkpoints?.length) connRef.setRoutingCheckpoints(connector.checkpoints);

        if (process) {
            this.processTransaction();
        }

        return;
    }

    /**
     * Removes the avoid shape for a JointJS element, if it exists.
     *
     * @param shapeId - Id of the shape to remove.
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`. Pass `false` to batch several calls together, e.g. from {@link sync}.
     */
    override deleteShape(shapeId: dia.Cell.ID, process: boolean = true): void {
        if (this.destroyed) return;
        const junctionRef = this.junctionRefs[shapeId];
        if (junctionRef) {
            this.avoidRouter.deleteJunction(junctionRef);
            delete this.junctionRefs[shapeId];
            if (process) {
                this.processTransaction();
            }
            return;
        }
        const shapeRef = this.shapeRefs[shapeId];
        if (!shapeRef) return;
        this.avoidRouter.deleteShape(shapeRef);
        delete this.shapeRefs[shapeId];

        if (process) {
            this.processTransaction();
        }
    }

    /**
     * Removes the avoid connector for a JointJS link, if it exists.
     *
     * @param connectorId - Id of the connector to remove.
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`. Pass `false` to batch several calls together, e.g. from {@link sync}.
     */
    override deleteConnector(connectorId: dia.Cell.ID, process: boolean = true): void {
        if (this.destroyed) return;
        const connRef = this.connectorRefs[connectorId];
        if (!connRef) return;
        this.avoidRouter.deleteConnector(connRef);
        delete this.connectorRefs[connectorId];

        if (process) {
            this.processTransaction();
        }
    }

    /**
     * Checks whether a connector with the given id currently exists.
     *
     * @param connectorId - Id of the connector to look up.
     * @returns `true` if the connector exists.
     */
    override hasConnector(connectorId: dia.Cell.ID): boolean {
        return connectorId in this.connectorRefs;
    }

    /**
     * Checks whether a shape with the given id currently exists.
     *
     * @param shapeId - Id of the shape to look up.
     * @returns `true` if the shape exists.
     */
    override hasShape(shapeId: dia.Cell.ID): boolean {
        return shapeId in this.shapeRefs || shapeId in this.junctionRefs;
    }

    /**
     * Replaces the entire set of shapes and connectors known to the avoid
     * router in a single transaction: deletes everything currently tracked,
     * recreates `shapes` and `connectors`, then processes once. The returned
     * promise resolves once the transaction has been processed, signaled by
     * this provider's own `processed` event, or rejects if the provider has
     * been destroyed.
     *
     * @param shapes - The full set of shapes that should exist after the sync.
     * @param connectors - The full set of connectors that should exist after the sync.
     */
    override async sync(shapes: Shape[], connectors: Connector[]): Promise<void> {
        if (this.destroyed) {
            throw new Error('MainThreadProvider was destroyed before the sync completed.');
        }

        Object.keys(this.connectorRefs).forEach((connectorId) => {
            this.deleteConnector(connectorId, false);
        });
        Object.keys(this.shapeRefs).forEach((shapeId) => {
            this.deleteShape(shapeId, false);
        });
        Object.keys(this.junctionRefs).forEach((junctionId) => {
            this.deleteShape(junctionId, false);
        });

        shapes.forEach((shape) => this.setShape(shape, false));
        connectors.forEach((connector) => this.setConnector(connector, false));

        this.processTransaction();
    }

    /**
     * Creates and configures a new avoid `Router` instance.
     *
     * @param Avoid - The `Avoid` WASM module instance.
     * @param shapeBufferDistance - Spacing distance added to the sides of each shape when determining obstacle sizes for routing.
     * @param idealNudgingDistance - Spacing distance used for nudging apart overlapping corners and line segments of connectors.
     * @returns The configured avoid router.
     */
    protected createAvoidRouter(Avoid: AvoidInstance, shapeBufferDistance: number, idealNudgingDistance: number): AvoidRouter {
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
     * Frees the avoid router and every shape, pin and connector added to it.
     * The WASM memory they hold is not garbage collected, so without this
     * every discarded provider would leak it. Later changes are ignored.
     */
    override destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        // Called from a callback during a pass, the router is still running
        // its transaction - {@link processTransaction} frees it afterwards.
        if (this.processing) return;
        this.avoidRouter.delete();
    }
}

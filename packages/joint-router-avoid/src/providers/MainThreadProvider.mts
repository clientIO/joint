import type { dia } from '@joint/core';
import { g } from '@joint/core';
import type { Connector, Shape } from './Provider.mjs';
import { Provider, type ProviderOptions } from './Provider.mjs';
import type { Avoid as AvoidInstance, Router as AvoidRouter, ConnRef, ShapeRef } from 'libavoid-js';
import { AvoidLib } from 'libavoid-js';

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
    /** Set by {@link destroy}; once the avoid router is freed, further changes are ignored. */
    protected destroyed = false;
    /** Whether avoid is inside `processTransaction()`, where the router must not be freed. */
    protected processing = false;

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
        const points = connRef.displayRoute().map(({ x, y }) => new g.Point(x, y));
        this.trigger('connector:changed', connectorId, points);
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
     * Runs a routing pass over the pending avoid changes and announces its
     * completion. Every processing path must go through here - `processed`
     * drives the `RouterService`'s `idle` event, and the Worker provider
     * fires it after every batch, so the incremental main-thread paths
     * (not just {@link sync}) have to fire it too for parity.
     */
    protected processTransaction(): void {
        this.processing = true;
        try {
            this.avoidRouter.processTransaction();
        } finally {
            this.processing = false;
        }
        if (this.destroyed) {
            // `destroy()` was called from a callback during the pass.
            this.avoidRouter.delete();
        }
        this.trigger('processed');
    }

    /**
     * Creates or updates the avoid shape for a JointJS element.
     *
     * @param shape - The shape to create or update.
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`. Pass `false` to batch several calls together, e.g. from {@link sync}.
     */
    override setShape(shape: Shape, process: boolean = true): void {
        if (this.destroyed) return;
        const { shapeRefs, avoidRouter } = this;
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
     * Creates or updates the avoid connector for a JointJS link. If either
     * end is missing its shape/pin ids, the connector is deleted instead,
     * since avoid cannot route a connector that isn't fully connected.
     *
     * @param connector - The connector to create or update.
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`. Pass `false` to batch several calls together, e.g. from {@link sync}.
     */
    override setConnector(connector: Connector, process: boolean = true): void {
        if (this.destroyed) return;
        const { shapeRefs, connectorRefs } = this;
        if (
            connector.sourceId === undefined || connector.sourcePinId === undefined ||
            connector.targetId === undefined || connector.targetPinId === undefined
        ) {
            // Forward `process`: inside a batched sync() the deletion must not
            // process (and announce) a transaction of its own mid-batch.
            this.deleteConnector(connector.id, process);
            return;
        }

        const sourceShapeRef = shapeRefs[connector.sourceId];
        const targetShapeRef = shapeRefs[connector.targetId];

        const sourceConnEnd = { shape: sourceShapeRef!, pin: connector.sourcePinId };
        const targetConnEnd = { shape: targetShapeRef!, pin: connector.targetPinId };

        const existingConnRef = connectorRefs[connector.id];
        if (existingConnRef) {
            // It was already created, we just update the endpoints.
            existingConnRef.setSource(sourceConnEnd);
            existingConnRef.setDest(targetConnEnd);
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
        return shapeId in this.shapeRefs;
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

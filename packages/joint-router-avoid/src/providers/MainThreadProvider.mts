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
    /** Maps an avoid connector's raw pointer (`connRef.g`) back to the JointJS link id that owns it. */
    protected readonly linksByPointer: Record<number, dia.Cell.ID> = {};
    /** Callback registered with avoid connectors, translating a raw pointer id back to a route update. */
    protected onAvoidConnectorChanged!: (connectorRefId: number) => void;

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

        this.onAvoidConnectorChanged = (connectorRefId: number) => {
            const connectorId = this.linksByPointer[connectorRefId];
            const connRef = this.connectorRefs[connectorId!];
            if (!connRef) return;

            const route = connRef.displayRoute();
            const points: g.Point[] = [];
            for (let i = 0; i < route.size(); i++) {
                const { x, y } = route.get_ps(i);
                points.push(new g.Point({ x, y }));
            }

            this.trigger('connector:changed', connectorId!, points);
        };
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
        const { shapeRefs, avoidRouter } = this;
        const { x, y, width, height } = shape.bbox;
        const shapeRect = new this.avoidInstance.Rectangle(
            new this.avoidInstance.Point(x, y),
            new this.avoidInstance.Point(x + width, y + height)
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

        const shapeRef = new this.avoidInstance.ShapeRef(avoidRouter, shapeRect);
        shapeRefs[shape.id] = shapeRef;

        shape.pins.forEach((pin) => {
            const pinRef = new this.avoidInstance.ShapeConnectionPin(
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

    /**
     * Creates or updates the avoid connector for a JointJS link. If either
     * end is missing its shape/pin ids, the connector is deleted instead,
     * since avoid cannot route a connector that isn't fully connected.
     *
     * @param connector - The connector to create or update.
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`. Pass `false` to batch several calls together, e.g. from {@link sync}.
     */
    override setConnector(connector: Connector, process: boolean = true): void {
        const { shapeRefs, connectorRefs } = this;
        if (
            connector.sourceId === undefined || connector.sourcePinId === undefined ||
            connector.targetId === undefined || connector.targetPinId === undefined
        ) {
            this.deleteConnector(connector.id);
            return;
        }

        const sourceShapeRef = shapeRefs[connector.sourceId];
        const targetShapeRef = shapeRefs[connector.targetId];

        const sourceConnEnd = new this.avoidInstance.ConnEnd(
            sourceShapeRef!,
            connector.sourcePinId
        );
        const targetConnEnd = new this.avoidInstance.ConnEnd(
            targetShapeRef!,
            connector.targetPinId
        );

        const existingConnRef = connectorRefs[connector.id];
        const connRef = existingConnRef ?? new this.avoidInstance.ConnRef(this.avoidRouter);

        connRef.setSourceEndpoint(sourceConnEnd);
        connRef.setDestEndpoint(targetConnEnd);

        if (existingConnRef) {
            // It was already created, we just updated the endpoints.
            if (process) {
                this.avoidRouter.processTransaction();
            }
            return;
        }

        // Note: we do not assign the connRef's `id` to the JointJS link,
        // since libavoid-js (the underlying WASM library) does not behave correctly when a connRef is
        // added-removed-added with the same `id`. Instead, we keep track
        // of the mapping using the connRef's raw pointer (`connRef.g`).
        connectorRefs[connector.id] = connRef;
        // @ts-expect-error not defined in the type definition, but it is present in the actual object
        this.linksByPointer[connRef.g] = connector.id;
        connRef.setCallback(this.onAvoidConnectorChanged, connRef);

        if (process) {
            this.avoidRouter.processTransaction();
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
        const shapeRef = this.shapeRefs[shapeId];
        if (!shapeRef) return;
        this.avoidRouter.deleteShape(shapeRef);
        delete this.shapeRefs[shapeId];

        if (process) {
            this.avoidRouter.processTransaction();
        }
    }

    /**
     * Removes the avoid connector for a JointJS link, if it exists.
     *
     * @param connectorId - Id of the connector to remove.
     * @param process - Whether to immediately call `avoidRouter.processTransaction()`. Pass `false` to batch several calls together, e.g. from {@link sync}.
     */
    override deleteConnector(connectorId: dia.Cell.ID, process: boolean = true): void {
        const connRef = this.connectorRefs[connectorId];
        if (!connRef) return;
        this.avoidRouter.deleteConnector(connRef);
        delete this.connectorRefs[connectorId];
        // @ts-expect-error not defined in the type definition, but it is present in the actual object
        delete this.linksByPointer[connRef.g];

        if (process) {
            this.avoidRouter.processTransaction();
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
     * this provider's own `processed` event.
     *
     * @param shapes - The full set of shapes that should exist after the sync.
     * @param connectors - The full set of connectors that should exist after the sync.
     */
    override async sync(shapes: Shape[], connectors: Connector[]): Promise<void> {
        Object.keys(this.connectorRefs).forEach((connectorId) => {
            this.deleteConnector(connectorId, false);
        });
        Object.keys(this.shapeRefs).forEach((shapeId) => {
            this.deleteShape(shapeId, false);
        });

        shapes.forEach((shape) => this.setShape(shape, false));
        connectors.forEach((connector) => this.setConnector(connector, false));

        this.avoidRouter.processTransaction();
        this.trigger('processed');
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

    /** Nothing to release: the router runs on the main thread and its resources are freed when the avoid WASM module itself is torn down. */
    override destroy(): void {}
}

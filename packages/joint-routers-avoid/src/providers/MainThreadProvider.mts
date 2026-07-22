import type { dia } from '@joint/core';
import { g } from '@joint/core';
import type { Connector, Shape } from './Provider.mjs';
import { Provider, type ProviderOptions } from './Provider.mjs';
import type { Avoid as AvoidInstance, Router as AvoidRouter, ConnRef, ShapeRef } from 'libavoid-js';
import { AvoidLib } from 'libavoid-js';

export class MainThreadProvider extends Provider {
    protected avoidInstance!: AvoidInstance;
    protected avoidRouter!: AvoidRouter;
    protected readonly shapeRefs: Record<string, ShapeRef> = {};
    protected readonly connectorRefs: Record<string, ConnRef> = {};
    protected readonly linksByPointer: Record<number, dia.Cell.ID> = {};
    protected onAvoidConnectorChanged!: (connectorRefId: number) => void;

    async init(options: ProviderOptions): Promise<void> {
        this.avoidInstance = AvoidLib.getInstance();
        this.avoidRouter = this.createAvoidRouter(
            this.avoidInstance,
            options.shapeBufferDistance ?? 0,
            options.idealNudgingDistance ?? 10
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

            if (this.onConnectorChanged) {
                this.onConnectorChanged(connectorId!, points);
            }
        };
    }

    override getAvoidInstance(): AvoidInstance {
        return this.avoidInstance;
    }

    updateShape(shape: Shape, process: boolean = true): void {
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

    updateConnector(connector: Connector, process: boolean = true) {
        const { shapeRefs, connectorRefs } = this;
        if (
            connector.sourceId === undefined || connector.sourcePinId === undefined ||
            connector.targetId === undefined || connector.targetPinId === undefined
        ) {
            this.deleteConnector(connector.id, process);
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
        // @ts-expect-error do not defined in the type definition, but it is present in the actual object
        this.linksByPointer[connRef.g] = connector.id;
        connRef.setCallback(this.onAvoidConnectorChanged, connRef);

        if (process) {
            this.avoidRouter.processTransaction();
        }

        return;
    }

    deleteShape(shapeId: dia.Cell.ID, process: boolean = true): void {
        const shapeRef = this.shapeRefs[shapeId];
        if (!shapeRef) return;
        this.avoidRouter.deleteShape(shapeRef);
        delete this.shapeRefs[shapeId];

        if (process) {
            this.avoidRouter.processTransaction();
        }
    }

    deleteConnector(connectorId: dia.Cell.ID, process: boolean = true): void {
        const connRef = this.connectorRefs[connectorId];
        if (!connRef) return;
        this.avoidRouter.deleteConnector(connRef);
        delete this.connectorRefs[connectorId];

        if (process) {
            this.avoidRouter.processTransaction();
        }
    }

    updateGraph(shapes: Shape[], connectors: Connector[], process: boolean = true): void {
        shapes.forEach((shape) => this.updateShape(shape, false));
        connectors.forEach((connector) => this.updateConnector(connector, false));

        if (process) {
            this.avoidRouter.processTransaction();
        }
    }

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
}

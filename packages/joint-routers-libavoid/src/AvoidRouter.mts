import { type dia, g, mvc, util } from '@joint/core';
import { AvoidLib, type Avoid as AvoidInstance } from 'libavoid-js';
import { type AvoidRoute, type AvoidRouterOptions } from './types.mjs';

const DEFAULT_PIN_CLASS_ID = 1;

// `libavoid-js` constructs (routers, shape/connector refs, routes, ...) are
// not exposed as named types by its own typings, only as an opaque WASM
// binding. This alias documents the intent at each use site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Unbound = any;

export class AvoidRouter {

    // One `AvoidRouter` per graph, used by the `libavoid` router function
    // to find the instance responsible for a given link.
    private static readonly registry = new WeakMap<dia.Graph, AvoidRouter>();

    static for(graph: dia.Graph): AvoidRouter | undefined {
        return AvoidRouter.registry.get(graph);
    }

    private readonly graph: dia.Graph;
    private readonly margin: number;
    private readonly portOverflow: number;
    private readonly commitTransactions: boolean;

    private avoidRouter: Unbound;
    private readonly connDirections: Record<string, Unbound>;
    private readonly shapeRefs: Record<string, Unbound> = {};
    private readonly edgeRefs: Record<string, Unbound> = {};
    private readonly pinIds: Record<string, number> = {};
    private readonly linksByPointer: Record<number, dia.Link> = {};
    private readonly routes = new Map<dia.Cell.ID, AvoidRoute>();
    private readonly onAvoidConnectorChange: (connRefPointer: number) => void;

    private nextPinId = 100000;
    private graphListener?: mvc.Listener<[]>;

    // Loads the underlying WASM module. Must resolve before
    // any `AvoidRouter` instance is created.
    static async load(wasmPath?: string): Promise<void> {
        await AvoidLib.load(wasmPath);
    }

    constructor(graph: dia.Graph, options: AvoidRouterOptions = {}) {
        const Avoid = AvoidLib.getInstance() as AvoidInstance;

        this.graph = graph;
        AvoidRouter.registry.set(graph, this);

        this.connDirections = {
            top: Avoid.ConnDirUp,
            right: Avoid.ConnDirRight,
            bottom: Avoid.ConnDirDown,
            left: Avoid.ConnDirLeft,
            all: Avoid.ConnDirAll,
        };

        this.portOverflow = options.portOverflow ?? 0;
        this.commitTransactions = options.commitTransactions ?? true;
        this.onAvoidConnectorChange = (connRefPointer) => this.routeLinkByPointer(connRefPointer);

        const {
            shapeBufferDistance = 0,
            idealNudgingDistance = 10,
        } = options;

        this.margin = shapeBufferDistance;
        this.avoidRouter = this.createAvoidRouter(Avoid, shapeBufferDistance, idealNudgingDistance);
    }

    // The margin used by the fallback router when the libavoid route is not valid.
    get fallbackMargin(): number {
        return this.margin - this.portOverflow;
    }

    // The last route computed for the given link, if any. Used by the
    // `libavoid` router function.
    getRoute(link: dia.Link): AvoidRoute | undefined {
        return this.routes.get(link.id);
    }

    private createAvoidRouter(Avoid: AvoidInstance, shapeBufferDistance: number, idealNudgingDistance: number): Unbound {
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

    private getAvoidRectFromElement(Avoid: AvoidInstance, element: dia.Element): Unbound {
        const { x, y, width, height } = element.getBBox();
        return new Avoid.Rectangle(
            new Avoid.Point(x, y),
            new Avoid.Point(x + width, y + height)
        );
    }

    private getVerticesFromAvoidRoute(route: { size(): number; get_ps(index: number): dia.Point }): dia.Point[] {
        const vertices: dia.Point[] = [];
        for (let i = 1; i < route.size() - 1; i++) {
            const { x, y } = route.get_ps(i);
            vertices.push({ x, y });
        }
        return vertices;
    }

    // Maps a JointJS port id to a libavoid pin id (a number). The pin id
    // does not need to be unique across the whole diagram, only per shape.
    private getConnectionPinId(elementId: dia.Cell.ID, portId: string): number {
        const pinKey = `${elementId}:${portId}`;
        const existingPinId = this.pinIds[pinKey];
        if (existingPinId !== undefined) return existingPinId;
        const pinId = this.nextPinId++;
        this.pinIds[pinKey] = pinId;
        return pinId;
    }

    updateShape(element: dia.Element): void {
        const Avoid = AvoidLib.getInstance() as AvoidInstance;
        const { shapeRefs, avoidRouter } = this;
        const shapeRect = this.getAvoidRectFromElement(Avoid, element);

        const existingShapeRef = shapeRefs[element.id];
        if (existingShapeRef) {
            // Only update the position and size of the shape.
            avoidRouter.moveShape(existingShapeRef, shapeRect);
            return;
        }

        const shapeRef = new Avoid.ShapeRef(avoidRouter, shapeRect);
        shapeRefs[element.id] = shapeRef;

        const centerPin = new Avoid.ShapeConnectionPin(
            shapeRef,
            DEFAULT_PIN_CLASS_ID, // one central pin for each shape
            0.5,
            0.5,
            true,
            0,
            Avoid.ConnDirAll
        );
        centerPin.setExclusive(false);

        // Add a pin for every port of the element.
        element.getPortGroupNames().forEach((groupName) => {
            const portsPositions = element.getPortsPositions(groupName);
            const { width, height } = element.size();
            const rect = new g.Rect(0, 0, width, height);
            Object.keys(portsPositions).forEach((portId) => {
                const { x, y } = portsPositions[portId]!;
                const side = rect.sideNearestToPoint({ x, y });
                const pin = new Avoid.ShapeConnectionPin(
                    shapeRef,
                    this.getConnectionPinId(element.id, portId),
                    x / width,
                    y / height,
                    true,
                    0,
                    this.connDirections[side]
                );
                pin.setExclusive(false);
            });
        });
    }

    updateConnector(link: dia.Link): Unbound {
        const Avoid = AvoidLib.getInstance() as AvoidInstance;
        const { shapeRefs, edgeRefs } = this;

        const { id: sourceId, port: sourcePortId = null } = link.source();
        const { id: targetId, port: targetPortId = null } = link.target();

        if (!sourceId || !targetId) {
            // Links without a source or target are not supported.
            this.deleteConnector(link);
            return null;
        }

        const sourceConnEnd = new Avoid.ConnEnd(
            shapeRefs[sourceId],
            sourcePortId ? this.getConnectionPinId(sourceId, sourcePortId) : DEFAULT_PIN_CLASS_ID
        );
        const targetConnEnd = new Avoid.ConnEnd(
            shapeRefs[targetId],
            targetPortId ? this.getConnectionPinId(targetId, targetPortId) : DEFAULT_PIN_CLASS_ID
        );

        const existingConnRef = edgeRefs[link.id];
        const connRef = existingConnRef ?? new Avoid.ConnRef(this.avoidRouter);

        connRef.setSourceEndpoint(sourceConnEnd);
        connRef.setDestEndpoint(targetConnEnd);

        if (existingConnRef) {
            // It was already created, we just updated the endpoints.
            return connRef;
        }

        // Note: we do not assign the connRef's `id` to the JointJS link,
        // since libavoid-js does not behave correctly when a connRef is
        // added-removed-added with the same `id`. Instead, we keep track
        // of the mapping using the connRef's raw pointer (`connRef.g`).
        edgeRefs[link.id] = connRef;
        this.linksByPointer[connRef.g] = link;
        connRef.setCallback(this.onAvoidConnectorChange, connRef);

        return connRef;
    }

    deleteConnector(link: dia.Link): void {
        const connRef = this.edgeRefs[link.id];
        if (!connRef) return;
        this.avoidRouter.deleteConnector(connRef);
        delete this.linksByPointer[connRef.g];
        delete this.edgeRefs[link.id];
        this.routes.delete(link.id);
    }

    deleteShape(element: dia.Element): void {
        const shapeRef = this.shapeRefs[element.id];
        if (!shapeRef) return;
        this.avoidRouter.deleteShape(shapeRef);
        delete this.shapeRefs[element.id];
    }

    private getLinkAnchorDelta(element: dia.Element, portId: string | null, point: g.Point): g.Point {
        let anchorPosition: g.Point;
        if (portId) {
            const port = element.getPort(portId);
            const portPosition = element.getPortsPositions(port.group as string)[portId]!;
            anchorPosition = element.position().offset(portPosition);
        } else {
            anchorPosition = element.getBBox().center();
        }
        return point.difference(anchorPosition);
    }

    // Routes a single link based on its current libavoid connector route.
    // The computed route is cached (see `getRoute`) for the `libavoid`
    // router function to pick up; this method only updates the link's
    // source/target anchors, which in turn triggers JointJS to re-invoke
    // the router.
    routeLink(link: dia.Link): void {
        const connRef = this.edgeRefs[link.id];
        if (!connRef) return;

        const route = connRef.displayRoute();
        const sourcePoint = new g.Point(route.get_ps(0));
        const targetPoint = new g.Point(route.get_ps(route.size() - 1));

        const { id: sourceId, port: sourcePortId = null } = link.source();
        const { id: targetId, port: targetPortId = null } = link.target();

        const sourceElement = link.getSourceElement();
        const targetElement = link.getTargetElement();

        if (!sourceElement || !targetElement) return;

        const sourceAnchorDelta = this.getLinkAnchorDelta(sourceElement, sourcePortId, sourcePoint);
        const targetAnchorDelta = this.getLinkAnchorDelta(targetElement, targetPortId, targetPoint);

        const valid = this.isRouteValid(route, sourceElement, targetElement, sourcePortId, targetPortId);

        this.routes.set(link.id, {
            vertices: valid ? this.getVerticesFromAvoidRoute(route) : [],
            valid,
        });

        const sourceAttrs: Unbound = {
            id: sourceId,
            port: sourcePortId || null,
            anchor: { name: 'modelCenter' },
        };
        const targetAttrs: Unbound = {
            id: targetId,
            port: targetPortId || null,
            anchor: { name: 'modelCenter' },
        };

        if (valid) {
            // Anchor exactly at the libavoid route's start/end point.
            sourceAttrs.anchor.args = { dx: sourceAnchorDelta.x, dy: sourceAnchorDelta.y };
            targetAttrs.anchor.args = { dx: targetAnchorDelta.x, dy: targetAnchorDelta.y };
        }

        link.set({ source: sourceAttrs, target: targetAttrs }, { avoidRouter: true });
    }

    private routeLinkByPointer(connRefPointer: number): void {
        const link = this.linksByPointer[connRefPointer];
        if (!link) return;
        this.routeLink(link);
    }

    // Updates every shape and connector, then routes all links.
    routeAll(): void {
        const { graph, avoidRouter } = this;
        graph.getElements().forEach((element) => this.updateShape(element));
        graph.getLinks().forEach((link) => this.updateConnector(link));
        avoidRouter.processTransaction();
    }

    // Resets a link to a straight line (e.g. it is not connected to an element).
    private resetLink(link: dia.Link): void {
        this.routes.delete(link.id);
        const newAttributes: Unbound = util.cloneDeep(link.attributes);
        newAttributes.vertices = [];
        newAttributes.router = undefined;
        delete newAttributes.source.anchor;
        delete newAttributes.target.anchor;
        link.set(newAttributes, { avoidRouter: true });
    }

    // Starts listening to graph changes and automatically updates the router.
    addGraphListeners(): void {
        this.removeGraphListeners();

        const listener = new mvc.Listener<[]>();
        listener.listenTo(this.graph, {
            remove: (cell: dia.Cell) => this.onCellRemoved(cell),
            add: (cell: dia.Cell) => this.onCellAdded(cell),
            change: (cell: dia.Cell, opt: dia.Cell.Options) => this.onCellChanged(cell, opt),
            reset: (_collection: unknown, opt: { previousModels: dia.Cell[] }) => this.onGraphReset(opt.previousModels),
        });

        this.graphListener = listener;
    }

    // Stops listening to graph changes.
    removeGraphListeners(): void {
        this.graphListener?.stopListening();
        this.graphListener = undefined;
    }

    private onCellRemoved(cell: dia.Cell): void {
        if (cell.isElement()) {
            this.deleteShape(cell);
        } else if (cell.isLink()) {
            this.deleteConnector(cell);
        }
        this.avoidRouter.processTransaction();
    }

    private onCellAdded(cell: dia.Cell): void {
        if (cell.isElement()) {
            this.updateShape(cell);
        } else if (cell.isLink()) {
            this.updateConnector(cell);
        }
        this.avoidRouter.processTransaction();
    }

    private onCellChanged(cell: dia.Cell, opt: dia.Cell.Options & { avoidRouter?: boolean }): void {
        if (opt.avoidRouter) return;

        let needsRerouting = false;

        if ('source' in cell.changed || 'target' in cell.changed) {
            if (!cell.isLink()) return;
            if (!this.updateConnector(cell)) {
                // The link is not routed with libavoid; reset it to a straight line.
                this.resetLink(cell);
            }
            needsRerouting = true;
        }

        if ('position' in cell.changed || 'size' in cell.changed) {
            if (!cell.isElement()) return;
            this.updateShape(cell);
            needsRerouting = true;
        }

        if (this.commitTransactions && needsRerouting) {
            this.avoidRouter.processTransaction();
        }
    }

    private onGraphReset(previousModels: dia.Cell[]): void {
        previousModels.forEach((cell) => {
            if (cell.isElement()) {
                this.deleteShape(cell);
            } else if (cell.isLink()) {
                this.deleteConnector(cell);
            }
        });

        this.routeAll();
    }

    // Determines whether the libavoid route should be used or whether to
    // fall back to the `rightAngle` router. Libavoid does not expose a
    // dedicated way to check this, so heuristics are used instead.
    private isRouteValid(
        route: { size(): number; get_ps(index: number): dia.Point },
        sourceElement: dia.Element,
        targetElement: dia.Element,
        sourcePortId: string | null,
        targetPortId: string | null
    ): boolean {
        const size = route.size();
        if (size > 2) {
            // A route with more than two points is considered valid.
            return true;
        }

        const sourcePs = route.get_ps(0);
        const targetPs = route.get_ps(size - 1);
        if (sourcePs.x !== targetPs.x && sourcePs.y !== targetPs.y) {
            // The route is not straight.
            return false;
        }

        const { margin } = this;

        if (sourcePortId && targetElement.getBBox().inflate(margin).containsPoint(sourcePs)) {
            // The source point is inside the target element.
            return false;
        }

        if (targetPortId && sourceElement.getBBox().inflate(margin).containsPoint(targetPs)) {
            // The target point is inside the source element.
            return false;
        }

        return true;
    }
}

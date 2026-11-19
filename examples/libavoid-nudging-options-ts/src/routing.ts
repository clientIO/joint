import { dia, g } from '@joint/core';
import { AvoidLib, type Avoid as AvoidModule } from 'libavoid-js';

// Avoid Docs
// https://www.adaptagrams.org/documentation/classAvoid_1_1Router.html

/** libavoid-js exports the module type only, so these types are read from its constructors. */
type Router = InstanceType<AvoidModule['Router']>;
type ShapeRef = InstanceType<AvoidModule['ShapeRef']>;
type ConnRef = InstanceType<AvoidModule['ConnRef']>;
type Rectangle = InstanceType<AvoidModule['Rectangle']>;

/** The three libavoid nudging options this example switches. */
export interface NudgingOptions {
    /** `nudgeOrthogonalSegmentsConnectedToShapes` */
    ends: boolean;
    /** `nudgeSharedPathsWithCommonEndPoint` */
    sharedPaths: boolean;
    /** `nudgeOrthogonalTouchingColinearSegments` */
    touchingColinear: boolean;
}

// The values `@joint/router-avoid` uses, so that only the three options differ.
const SHAPE_BUFFER_DISTANCE = 10;
const IDEAL_NUDGING_DISTANCE = 5;
/** The pin at the center of every shape, as in `@joint/router-avoid`. */
const CENTER_PIN_ID = 1;
/** A link end farther than this from the center of its port is counted as off the port. */
const OFF_PORT_TOLERANCE = 0.01;

/**
 * Routes the links of a graph with libavoid, set up the way `@joint/router-avoid`
 * sets it up, except for the three nudging options. Every element is an obstacle
 * with a pin per port; every link is a connector between two pins. The routes are
 * written to the links as `@joint/router-avoid` writes them: the route ends become
 * anchors relative to the ports, the points in between become vertices.
 */
export class NudgingRouter {
    private readonly avoid = AvoidLib.getInstance();
    private readonly graph: dia.Graph;
    private router: Router;
    private readonly shapeRefs = new Map<dia.Cell.ID, ShapeRef>();
    private connectors: Array<{ link: dia.Link, connRef: ConnRef }> = [];

    constructor(graph: dia.Graph, options: NudgingOptions) {
        this.graph = graph;
        this.createRouter(options);
    }

    /** Creates a new libavoid router with these options. Call `route()` to apply it. */
    setOptions(options: NudgingOptions): void {
        this.removeRouter();
        this.createRouter(options);
    }

    /** Moves the obstacle of an element that changed its position. Call `route()` to apply it. */
    moveElement(element: dia.Element): void {
        const shapeRef = this.shapeRefs.get(element.id);
        if (!shapeRef) return;
        const rectangle = this.createRectangle(element);
        this.router.moveShape(shapeRef, rectangle);
        this.avoid.destroy(rectangle);
    }

    /**
     * Routes the connectors and writes the routes to the links.
     * @returns The number of link ends that are not attached to the center of their port.
     */
    route(): number {
        this.router.processTransaction();
        let endsOffPort = 0;
        this.graph.startBatch('libavoid-route');
        this.connectors.forEach(({ link, connRef }) => {
            const route = connRef.displayRoute();
            const points: g.Point[] = [];
            for (let i = 0; i < route.size(); i++) {
                const { x, y } = route.get_ps(i);
                points.push(new g.Point(x, y));
            }
            const sourceOffset = portOffset(link.getSourceElement(), link.source().port, points[0]);
            const targetOffset = portOffset(link.getTargetElement(), link.target().port, points[points.length - 1]);
            if (isOffPort(sourceOffset)) endsOffPort++;
            if (isOffPort(targetOffset)) endsOffPort++;
            link.set({
                source: { ...link.source(), anchor: { name: 'modelCenter', args: { dx: sourceOffset.x, dy: sourceOffset.y }}},
                target: { ...link.target(), anchor: { name: 'modelCenter', args: { dx: targetOffset.x, dy: targetOffset.y }}},
                vertices: points.slice(1, -1).map(({ x, y }) => ({ x, y })),
            });
        });
        this.graph.stopBatch('libavoid-route');
        return endsOffPort;
    }

    private createRouter(options: NudgingOptions): void {
        const { avoid } = this;
        const router = new avoid.Router(avoid.OrthogonalRouting);
        router.setRoutingParameter(avoid.idealNudgingDistance, IDEAL_NUDGING_DISTANCE);
        router.setRoutingParameter(avoid.shapeBufferDistance, SHAPE_BUFFER_DISTANCE);
        router.setRoutingOption(avoid.performUnifyingNudgingPreprocessingStep, true);
        router.setRoutingOption(avoid.nudgeOrthogonalSegmentsConnectedToShapes, options.ends);
        router.setRoutingOption(avoid.nudgeSharedPathsWithCommonEndPoint, options.sharedPaths);
        router.setRoutingOption(avoid.nudgeOrthogonalTouchingColinearSegments, options.touchingColinear);
        this.router = router;

        const pinIds = new Map<string, number>();
        let nextPinId = CENTER_PIN_ID + 1;
        this.graph.getElements().forEach((element) => {
            const rectangle = this.createRectangle(element);
            const shapeRef = new avoid.ShapeRef(router, rectangle);
            avoid.destroy(rectangle);
            this.shapeRefs.set(element.id, shapeRef);
            this.createPin(shapeRef, CENTER_PIN_ID, 0.5, 0.5, avoid.ConnDirAll);
            const { width, height } = element.size();
            const localBBox = new g.Rect(0, 0, width, height);
            element.getPortGroupNames().forEach((group) => {
                const positions = element.getPortsPositions(group);
                Object.keys(positions).forEach((portId) => {
                    const position = positions[portId];
                    const pinId = nextPinId++;
                    pinIds.set(pinKey(element.id, portId), pinId);
                    // Proportional coordinates, guarded against zero-size elements.
                    const x = width ? position.x / width : 0;
                    const y = height ? position.y / height : 0;
                    this.createPin(shapeRef, pinId, x, y, this.getConnectionDirection(localBBox, position));
                });
            });
        });

        this.connectors = this.graph.getLinks().map((link) => {
            const source = link.source();
            const target = link.target();
            const connRef = new avoid.ConnRef(router);
            const sourceEnd = new avoid.ConnEnd(this.shapeRefs.get(source.id), pinIds.get(pinKey(source.id, source.port)));
            const targetEnd = new avoid.ConnEnd(this.shapeRefs.get(target.id), pinIds.get(pinKey(target.id, target.port)));
            connRef.setSourceEndpoint(sourceEnd);
            connRef.setDestEndpoint(targetEnd);
            avoid.destroy(sourceEnd);
            avoid.destroy(targetEnd);
            return { link, connRef };
        });
    }

    private removeRouter(): void {
        if (!this.router) return;
        // The router deletes its obstacles (with their pins) and connectors.
        this.avoid.destroy(this.router);
        this.router = null;
        this.shapeRefs.clear();
        this.connectors = [];
    }

    private createPin(shapeRef: ShapeRef, pinId: number, x: number, y: number, direction: number): void {
        const pin = new this.avoid.ShapeConnectionPin(shapeRef, pinId, x, y, true, 0, direction);
        // Several links can attach to one pin.
        pin.setExclusive(false);
    }

    private getConnectionDirection(localBBox: g.Rect, position: dia.Point): number {
        const { avoid } = this;
        switch (localBBox.sideNearestToPoint(position)) {
            case 'top': return avoid.ConnDirUp;
            case 'right': return avoid.ConnDirRight;
            case 'bottom': return avoid.ConnDirDown;
            default: return avoid.ConnDirLeft;
        }
    }

    /** libavoid copies the rectangle, so the caller destroys it once it is passed in. */
    private createRectangle(element: dia.Element): Rectangle {
        const { avoid } = this;
        const { x, y, width, height } = element.getBBox();
        const topLeft = new avoid.Point(x, y);
        const bottomRight = new avoid.Point(x + width, y + height);
        const rectangle = new avoid.Rectangle(topLeft, bottomRight);
        avoid.destroy(topLeft);
        avoid.destroy(bottomRight);
        return rectangle;
    }
}

function pinKey(elementId: dia.Cell.ID, portId: string): string {
    return `${elementId}:${portId}`;
}

/** The offset of a route end from the center of its port: a `modelCenter` anchor delta. */
function portOffset(element: dia.Element, portId: string, point: g.Point): g.Point {
    const { group } = element.getPort(portId);
    const portPosition = element.getPortsPositions(group)[portId];
    return point.difference(element.position().offset(portPosition));
}

function isOffPort({ x, y }: g.Point): boolean {
    return Math.abs(x) > OFF_PORT_TOLERANCE || Math.abs(y) > OFF_PORT_TOLERANCE;
}

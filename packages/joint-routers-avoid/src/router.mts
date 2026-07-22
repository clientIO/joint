import { type dia, g, routers } from '@joint/core';
import { RouterService } from './RouterService.mjs';

// Caches the last computed source/target anchors per link so that they can
// be reapplied when the router is invoked without a reroute (i.e. when
// `__avoidRouter/reroute` is not `true`).
const lastAnchors = new WeakMap<dia.Link, { sourceAnchor: g.Point, targetAnchor: g.Point }>();

export function avoid(_vertices: dia.Point[], _args: unknown, linkView: dia.LinkView): dia.Point[] {
    const link = linkView.model;

    const routerService = RouterService.getInstance(linkView.paper!);
    const route: dia.Point[] = routerService?.getRoute(link.id) ?? [];

    if (!route || !isRouteValid(route, linkView, routerService?.margin)) {
        return routers.rightAngle(_vertices, {
            margin: routerService?.margin,
            // @ts-expect-error not documented
            useModelMargin: true,
        }, linkView);
    }

    if (link.prop('__avoidRouter/reroute') === true) {
        const cachedAnchors = lastAnchors.get(link);
        if (cachedAnchors) {
            linkView.sourceAnchor = cachedAnchors.sourceAnchor;
            linkView.targetAnchor = cachedAnchors.targetAnchor;
        }
        return linkView.route;
    }

    const updatedRoute = getUpdatedRoute(route, linkView);

    // temporarily set the anchors to the new positions so that the link is drawn correctly
    linkView.sourceAnchor = updatedRoute.sourceAnchor;
    linkView.targetAnchor = updatedRoute.targetAnchor;

    lastAnchors.set(link, {
        sourceAnchor: updatedRoute.sourceAnchor,
        targetAnchor: updatedRoute.targetAnchor,
    });

    return updatedRoute.vertices;
}

function getUpdatedRoute(route: dia.Point[], linkView: dia.LinkView): { sourceAnchor: g.Point, targetAnchor: g.Point, vertices: dia.Point[] } {
    const link = linkView.model;

    const { port: sourcePortId = null } = link.source();
    const { port: targetPortId = null } = link.target();

    const sourceElement = link.getSourceElement() as dia.Element;
    const targetElement = link.getTargetElement() as dia.Element;

    const sourcePoint = route[0]!;
    const targetPoint = route[route.length - 1]!;
    const vertices = route.slice(1, -1);

    const sourceAnchorDelta = getLinkAnchorDelta(sourceElement, sourcePortId, sourcePoint);
    const targetAnchorDelta = getLinkAnchorDelta(targetElement, targetPortId, targetPoint);

    // temporarily set the anchors to the new positions so that the link is drawn correctly
    const sourceAnchor = linkView.sourceAnchor.clone().translate(sourceAnchorDelta);
    const targetAnchor = linkView.targetAnchor.clone().translate(targetAnchorDelta);

    return {
        sourceAnchor,
        targetAnchor,
        vertices
    };
}

function getLinkAnchorDelta(element: dia.Element, portId: string | null, point: dia.Point): dia.Point {
    let anchorPosition: dia.Point;
    if (portId) {
        const port = element.getPort(portId);
        const portPosition = element.getPortsPositions(port.group as string)[portId]!;
        anchorPosition = element.position().offset(portPosition);
    } else {
        anchorPosition = element.getBBox().center();
    }
    return new g.Point(point).difference(anchorPosition);
}

// Determines whether the avoid route should be used or whether to
// fall back to the `rightAngle` router. Avoid does not expose a
// dedicated way to check this, so heuristics are used instead.
function isRouteValid(
    route: dia.Point[],
    linkView: dia.LinkView,
    margin: number = 0
): boolean {
    const link = linkView.model;

    const { port: sourcePortId = null } = link.source();
    const { port: targetPortId = null } = link.target();

    const sourceElement = link.getSourceElement() as dia.Element;
    const targetElement = link.getTargetElement() as dia.Element;

    if (!sourceElement || !targetElement) {
        return false;
    }

    const size = route.length; // +2 for source and target points
    if (size > 2) {
        // A route with more than two points is considered valid.
        return true;
    }

    if (size < 2) {
        return false;
    }

    const sourcePoint = route[0]!;
    const targetPoint = route[route.length - 1]!;

    if (sourcePoint.x !== targetPoint.x && sourcePoint.y !== targetPoint.y) {
        // The route is not straight.
        return false;
    }

    if (sourcePortId && targetElement!.getBBox().inflate(margin).containsPoint(sourcePoint)) {
        // The source point is inside the target element.
        return false;
    }

    if (targetPortId && sourceElement!.getBBox().inflate(margin).containsPoint(targetPoint)) {
        // The target point is inside the source element.
        return false;
    }

    return true;
}

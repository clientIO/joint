import { type dia, g, routers } from '@joint/core';
import { RouterService } from './RouterService.mjs';

export function avoid(_vertices: dia.Point[], _args: unknown, linkView: dia.LinkView): dia.Point[] {
    const link = linkView.model;

    // initialize the special attribute for rerouting
    if (link.attr('__avoidRouter') === undefined) {
        link.attr('__avoidRouter', Date.now(), { avoidRouter: true });
    }

    const routerService = RouterService.getInstance(link.graph);
    const route: dia.Point[] = routerService?.getRoute(link.id) ?? [];

    const { port: sourcePortId = null } = link.source();
    const { port: targetPortId = null } = link.target();

    const sourceElement = link.getSourceElement() as dia.Element;
    const targetElement = link.getTargetElement() as dia.Element;

    if (!route || !isRouteValid(route, sourceElement, sourcePortId, targetElement, targetPortId)) {
        return routers.rightAngle(_vertices, {
            margin: routerService?.margin,
        }, linkView);
    }

    const sourcePoint = route[0]!;
    const targetPoint = route[route.length - 1]!;
    const vertices = route.slice(1, -1);

    const sourceAnchorDelta = getLinkAnchorDelta(sourceElement, sourcePortId, sourcePoint);
    const targetAnchorDelta = getLinkAnchorDelta(targetElement, targetPortId, targetPoint);

    // Anchor exactly at the avoid route's start/end point.
    const sourceAnchorDiff = { x: sourceAnchorDelta.x, y: sourceAnchorDelta.y };
    const targetAnchorDiff = { x: targetAnchorDelta.x, y: targetAnchorDelta.y };

    // temporarily set the anchors to the new positions so that the link is drawn correctly
    linkView.sourceAnchor = linkView.sourceAnchor.clone().translate(sourceAnchorDiff);
    linkView.targetAnchor = linkView.targetAnchor.clone().translate(targetAnchorDiff);

    return vertices;
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
    sourceElement: dia.Element | null,
    sourcePortId: string | null,
    targetElement: dia.Element | null,
    targetPortId: string | null
): boolean {
    const size = route.length; // +2 for source and target points
    if (size > 2) {
        // A route with more than two points is considered valid.
        return true;
    }

    const sourcePoint = route[0]!;
    const targetPoint = route[route.length - 1]!;

    if (sourcePoint.x !== targetPoint.x && sourcePoint.y !== targetPoint.y) {
        // The route is not straight.
        return false;
    }

    //const { margin } = this;

    if (sourcePortId && targetElement!.getBBox()/*.inflate(margin)*/.containsPoint(sourcePoint)) {
        // The source point is inside the target element.
        return false;
    }

    if (targetPortId && sourceElement!.getBBox()/*.inflate(margin)*/.containsPoint(targetPoint)) {
        // The target point is inside the source element.
        return false;
    }

    return true;
}

import { type dia, type g, routers } from '@joint/core';
import type { AvoidRoute, RouterService } from './RouterService.mjs';

// A router for JointJS links that follows the "custom router" contract
// documented at:
// https://docs.jointjs.com/learn/features/diagram-basics/links/#custom-router
//
// Register it under a name and reference it from a link, e.g.:
//
//   import { routers } from '@joint/core';
//   import { libavoid } from '@joint/routers-libavoid';
//
//   routers.libavoid = libavoid;
//   link.router('libavoid');
//
// or pass it directly: `link.router(libavoid)`.
//
// The actual obstacle-avoiding route is computed incrementally by an
// `AvoidRouter` instance associated with the link's graph (see `AvoidRouter`
// - it must be created and kept in sync via `addGraphListeners()`/`routeAll()`
// for this router to have anything to read). When no such instance exists
// yet for the link's graph, or the last computed route is not valid, this
// falls back to the built-in `rightAngle` router.

export function libavoid(routerService: RouterService) {
    return function(_vertices: dia.Point[], _args: unknown, linkView: dia.LinkView): dia.Point[] {
        const link = linkView.model;
        const route = routerService.getRoute(link);

        const { id: sourceId, port: sourcePortId = null } = link.source();
        const { id: targetId, port: targetPortId = null } = link.target();

        const sourceElement = link.getSourceElement() as dia.Element;
        const targetElement = link.getTargetElement() as dia.Element;

        if (!route || !isRouteValid(route, sourceElement, sourcePortId, targetElement, targetPortId)) {
            return routers.rightAngle(_vertices, { margin: 0 }, linkView);
        }

        const { sourcePoint, targetPoint, vertices } = route;

        const sourceAttrs: dia.Link.EndJSON = {
            id: sourceId,
            port: sourcePortId || undefined,
            anchor: { name: 'modelCenter' },
        };
        const targetAttrs: dia.Link.EndJSON = {
            id: targetId,
            port: targetPortId || undefined,
            anchor: { name: 'modelCenter' },
        };

        const sourceAnchorDelta = getLinkAnchorDelta(sourceElement, sourcePortId, sourcePoint);
        const targetAnchorDelta = getLinkAnchorDelta(targetElement, targetPortId, targetPoint);

        // Anchor exactly at the libavoid route's start/end point.
        sourceAttrs.anchor!.args = { dx: sourceAnchorDelta.x, dy: sourceAnchorDelta.y };
        targetAttrs.anchor!.args = { dx: targetAnchorDelta.x, dy: targetAnchorDelta.y };

        link.set({ source: sourceAttrs, target: targetAttrs }, { avoidRouter: true });

        return vertices;
    };
}

function getLinkAnchorDelta(element: dia.Element, portId: string | null, point: g.Point): g.Point {
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

// Determines whether the libavoid route should be used or whether to
// fall back to the `rightAngle` router. Libavoid does not expose a
// dedicated way to check this, so heuristics are used instead.
function isRouteValid(
    route: AvoidRoute,
    sourceElement: dia.Element | null,
    sourcePortId: string | null,
    targetElement: dia.Element | null,
    targetPortId: string | null
): boolean {
    const { sourcePoint, targetPoint, vertices } = route;

    const size = vertices.length;
    if (size > 2) {
        // A route with more than two points is considered valid.
        return true;
    }

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

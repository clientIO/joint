import type { routers, connectors as connectorTypes } from '@joint/core';
import { anchors, connectionPoints, connectors as connectorFns } from '@joint/core';

/**
 * Wraps a router so it falls back to straight-line routing when either end
 * of the link is not connected to an element.
 */
export function straightRouterUntilConnected(router: routers.Router): routers.Router {
  return (vertices, args, linkView) => {
    if (!linkView) return vertices;
    const link = linkView.model;
    if (!link.getSourceCell() || !link.getTargetCell()) {
      return vertices;
    }
    return router(vertices, args, linkView);
  };
}

/**
 * Wraps a connector so it falls back to the `straight` connector when either end
 * of the link is not connected to an element.
 */
export function straightConnectorUntilConnected(connector: connectorTypes.Connector): connectorTypes.Connector {
  return (sourcePoint, targetPoint, routePoints, args, linkView) => {
    if (!linkView || !linkView.model.getSourceCell() || !linkView.model.getTargetCell()) {
      return connectorFns.straight(sourcePoint, targetPoint, routePoints, {}, linkView);
    }
    return connector(sourcePoint, targetPoint, routePoints, args, linkView);
  };
}

/**
 * Wraps an anchor — uses `connected` when both ends are attached, `disconnected` otherwise.
 */
export function anchorWhenConnected(connected: anchors.Anchor, disconnected: anchors.Anchor): anchors.Anchor {
  return (elementView, magnet, ref, opt, endType, linkView) => {
    const link = linkView.model;
    if (!link.getSourceCell() || !link.getTargetCell()) {
      return disconnected(elementView, magnet, ref, opt, endType, linkView);
    }
    return connected(elementView, magnet, ref, opt, endType, linkView);
  };
}

/**
 * Wraps a connection point — uses `connected` when both ends are attached, `disconnected` otherwise.
 */
export function connectionPointWhenConnected(connected: connectionPoints.ConnectionPoint, disconnected: connectionPoints.ConnectionPoint): connectionPoints.ConnectionPoint {
  return (endPathSegmentLine, endView, endMagnet, opt, endType, linkView) => {
    const link = linkView.model;
    if (!link.getSourceCell() || !link.getTargetCell()) {
      return disconnected(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
    }
    return connected(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
  };
}

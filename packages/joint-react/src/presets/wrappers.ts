import type { routers, connectors as connectorTypes, anchors, connectionPoints} from '@joint/core';
import { connectors as connectorFns } from '@joint/core';

/**
 * Wraps a router so it falls back to straight-line routing when either end
 * of the link is not connected to an element.
 * @param router
 */
export function straightRouterUntilConnected(router: routers.Router): routers.Router {
  return (vertices, args, linkView) => {
    if (!linkView) return vertices;
    const link = linkView.model;
    if (!link.getSourceCell() || !link.getTargetCell()) {
      // Return a straight line between source and target positions,
      // ignoring vertices.
      return [];
    }
    return router(vertices, args, linkView);
  };
}

/**
 * Wraps a connector so it falls back to the `straight` connector when either end
 * of the link is not connected to an element.
 * @param connector
 */
export function straightConnectorUntilConnected(connector: connectorTypes.Connector): connectorTypes.Connector {
  return (sourcePoint, targetPoint, routePoints, args, linkView) => {
    if (!linkView?.model.getSourceCell() || !linkView.model.getTargetCell()) {
      return connectorFns.straight(sourcePoint, targetPoint, routePoints, {}, linkView);
    }
    return connector(sourcePoint, targetPoint, routePoints, args, linkView);
  };
}

/**
 * Wraps an anchor, uses `connected` when both ends are attached, `disconnected` otherwise.
 * @param connected
 * @param disconnected
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
 * Wraps a connection point, uses `presetAnchor` when the link end takes the paper's
 * default anchor, `customAnchor` when the end carries an anchor of its own.
 *
 * A preset whose anchor already accounts for the arrowhead (as `midSideAnchor` does)
 * pairs it with a connection point that returns the anchor untouched. An end with its
 * own `anchor` never runs that anchor, so a preset can use this to treat those ends
 * differently without the two ever both being applied.
 * @param presetAnchor - used when the end has no anchor of its own
 * @param customAnchor - used when the end declares its own anchor
 */
export function connectionPointWhenAnchorIsDefault(presetAnchor: connectionPoints.ConnectionPoint, customAnchor: connectionPoints.ConnectionPoint): connectionPoints.ConnectionPoint {
  return (endPathSegmentLine, endView, endMagnet, opt, endType, linkView) => {
    const link = linkView.model;
    const end = endType === 'source' ? link.source() : link.target();
    const connectionPoint = end?.anchor ? customAnchor : presetAnchor;
    return connectionPoint(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
  };
}

/**
 * Wraps a connection point, uses `connected` when both ends are attached, `disconnected` otherwise.
 * @param connected
 * @param disconnected
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

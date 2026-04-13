import type { routers, connectors as connectorTypes } from '@joint/core';
import { connectors as connectorFns, routers as routerFns } from '@joint/core';

/** Creates a right-angle router with `useVertices: true`. */
export function rightAngleRouter(margin = 20): routers.Router {
  return (vertices, _args, linkView) => routerFns.rightAngle(vertices, { useVertices: true, margin }, linkView);
}

/** Curve connector with outwards tangent direction. */
export const outwardsCurveConnector: connectorTypes.Connector = (sourcePoint, targetPoint, routePoints, _args, linkView) =>
  connectorFns.curve(sourcePoint, targetPoint, routePoints, {
    sourceDirection: connectorFns.curve.TangentDirections.OUTWARDS,
    targetDirection: connectorFns.curve.TangentDirections.OUTWARDS,
  }, linkView);

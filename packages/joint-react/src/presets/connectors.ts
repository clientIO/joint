import type { routers, connectors as connectorTypes } from '@joint/core';
import { connectors as connectorFns, routers as routerFns } from '@joint/core';

/** Right-angle router with `useVertices: true`. */
export const rightAngleRouter: routers.Router = (vertices, _args, linkView) =>
  routerFns.rightAngle(vertices, { useVertices: true }, linkView);

/** Curve connector with outwards tangent direction. */
export const outwardsCurveConnector: connectorTypes.Connector = (sourcePoint, targetPoint, routePoints, _args, linkView) =>
  connectorFns.curve(sourcePoint, targetPoint, routePoints, {
    sourceDirection: connectorFns.curve.TangentDirections.OUTWARDS,
    targetDirection: connectorFns.curve.TangentDirections.OUTWARDS,
  }, linkView);

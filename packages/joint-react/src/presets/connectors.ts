import type { connectors as connectorTypes } from '@joint/core';
import { connectors as connectorFns } from '@joint/core';

/**
 * Curve connector with outwards tangent direction.
 * @param sourcePoint
 * @param targetPoint
 * @param routePoints
 * @param _args
 * @param linkView
 */
export const outwardsCurveConnector: connectorTypes.Connector = (sourcePoint, targetPoint, routePoints, _args, linkView) =>
  connectorFns.curve(sourcePoint, targetPoint, routePoints, {
    sourceDirection: connectorFns.curve.TangentDirections.OUTWARDS,
    targetDirection: connectorFns.curve.TangentDirections.OUTWARDS,
  }, linkView);

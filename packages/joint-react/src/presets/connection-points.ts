import { connectionPoints, dia, g } from '@joint/core';
import { BOUNDARY_OPTIONS, EMPTY_OPTIONS, getMarkerLength, MODEL_GEOMETRY_OPTIONS } from './utils';
import { getPortOutlineWidth } from './element-geometry';

const EXTENDED_LINE_LENGTH = 1e6;

/**
 * Moves the connection point of a port back along the link by half of the
 * outline width set on the port, so the link ends at the outer edge of the outline
 * (exactly when the link meets the shape at a right angle).
 * @param point - The connection point on the port shape.
 * @param line - The end segment of the link.
 * @param outlineWidth - The outline width set on the port, `0` for none.
 * @returns The connection point, moved when the port has an outline width.
 */
function withPortOutline(point: g.Point, line: g.Line, outlineWidth: number): g.Point {
  if (outlineWidth === 0) return point;
  const distance = point.distance(line.start);
  return point.move(line.start, -Math.min(outlineWidth / 2, Math.max(distance - 1, 0)));
}

/**
 * Finds the point where the line meets the geometry of the port.
 *
 * The anchor of a port is not always inside its shape (e.g. a perpendicular
 * anchor next to a triangular port). When the line stops short of a shape
 * other than a rectangle, it is extended in its own direction, so the link
 * keeps its direction and still ends on the shape.
 * @param element - The connected element.
 * @param portId - The id of the connected port.
 * @param line - The end segment of the link, ending at the anchor.
 * @returns The intersection, or `null` when there is none.
 */
function portGeometryPoint(element: dia.Element, portId: dia.Element.PortID, line: g.Line): g.Point | null {
  const point = element.getPortGeometryIntersection(portId, line);
  if (point) return point;
  const { graph } = element;
  if (!graph || graph.getPortGeometry(element, portId).type === g.types.Rect) return null;
  return element.getPortGeometryIntersection(portId, line.clone().setLength(EXTENDED_LINE_LENGTH));
}

/**
 * Finds the point where the line meets the model geometry of the element
 * (for the root magnet) or of the port (for a port magnet). A port with an
 * `outlineWidth` moves the point to the outer edge of its outline.
 * @param line - The end segment of the link, ending at the anchor.
 * @param endView - The view of the connected cell.
 * @param endMagnet - The connected magnet.
 * @returns The connection point, or `null` when the line does not meet the geometry.
 */
function modelGeometryPoint(line: g.Line, endView: dia.CellView, endMagnet: SVGElement): g.Point | null {
  if (!(endView instanceof dia.ElementView)) return null;
  const element = endView.model;
  if (endMagnet === endView.el) return element.getGeometryIntersection(line);
  const portId = endView.findNodePortId(endMagnet);
  if (portId === null || !element.hasPort(portId)) return null;
  const point = portGeometryPoint(element, portId, line);
  return point && withPortOutline(point, line, getPortOutlineWidth(element, portId));
}

/**
 * Default connection point function for React-rendered elements.
 *
 * Uses the model geometry (see `graph.getElementGeometry()`) for:
 * - The root element (portal wrapper)
 * - Default port magnets (elements with a `port` attribute), so a link ends
 *   on the boundary of the port shape
 *
 * Falls back to `rectangle` (model geometry) when the link does not intersect it.
 * A port with an `outlineWidth` moves the point to the outer edge of its outline.
 *
 * Uses `boundary` for custom sub-elements registered via `selectorRef`.
 * @param endPathSegmentLine
 * @param endView
 * @param endMagnet
 * @param _opt
 * @param endType
 * @param linkView
 */
export const boundaryPoint: connectionPoints.ConnectionPoint = (
  endPathSegmentLine,
  endView,
  endMagnet,
  _opt,
  endType,
  linkView,
) => {
  if (endMagnet === endView.el || endMagnet.getAttribute('port')) {
    return modelGeometryPoint(endPathSegmentLine, endView, endMagnet)
      ?? connectionPoints.rectangle(endPathSegmentLine, endView, endMagnet, MODEL_GEOMETRY_OPTIONS, endType, linkView);
  }
  return connectionPoints.boundary(endPathSegmentLine, endView, endMagnet, BOUNDARY_OPTIONS, endType, linkView);
};

/**
 * Connection point for elements using `midSideAnchor`.
 * For ports: returns the anchor (already at port edge via smartAnchor).
 * For root element: returns the anchor (already on boundary via midSide).
 * For custom magnets: uses `rectangle` with model geometry.
 * @param endPathSegmentLine
 * @param endView
 * @param endMagnet
 * @param _opt
 * @param endType
 * @param linkView
 */
export const anchorPoint: connectionPoints.ConnectionPoint = (
  endPathSegmentLine,
  endView,
  endMagnet,
  _opt,
  endType,
  linkView,
) => {
  if (endMagnet === endView.el || endMagnet.getAttribute('port')) {
    return endPathSegmentLine.end.clone();
  }
  // For custom magnets, use rectangle with DOM geometry to find the point on the magnet itself.
  return connectionPoints.rectangle(endPathSegmentLine, endView, endMagnet, EMPTY_OPTIONS, endType, linkView);
};

/**
 * Wraps a connection point function and applies per-end offsets to the result.
 * @param cp
 * @param sourceOffset
 * @param targetOffset
 * @param markerSelector
 */
export function withOffsets(
  cp: connectionPoints.ConnectionPoint,
  sourceOffset: number,
  targetOffset: number,
  markerSelector = 'line',
): connectionPoints.ConnectionPoint {
  return (endPathSegmentLine, endView, endMagnet, opt, endType, linkView) => {
    const point = cp(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
    const userOffset = endType === 'source' ? sourceOffset : targetOffset;
    const markerLength = getMarkerLength(linkView, endType, markerSelector);
    const offset = userOffset + markerLength;
    if (offset === 0) return point;
    const ref = endPathSegmentLine.start;
    return point.move(ref, -offset);
  };
}

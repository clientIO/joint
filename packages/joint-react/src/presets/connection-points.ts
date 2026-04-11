import { connectionPoints } from '@joint/core';
import { BOUNDARY_OPTIONS, EMPTY_OPTIONS, getMarkerLength, MODEL_GEOMETRY_OPTIONS } from './utils';

/**
 * Default connection point function for React-rendered elements.
 *
 * Uses `rectangle` (model geometry) for:
 * - The root element (portal wrapper)
 * - Default port magnets (elements with a `port` attribute)
 *
 * Uses `boundary` for custom sub-elements registered via `selectorRef`.
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
    return connectionPoints.rectangle(endPathSegmentLine, endView, endMagnet, MODEL_GEOMETRY_OPTIONS, endType, linkView);
  }
  return connectionPoints.boundary(endPathSegmentLine, endView, endMagnet, BOUNDARY_OPTIONS, endType, linkView);
};

/**
 * Connection point for elements using `midSideAnchor`.
 * For ports: returns the anchor (already at port edge via smartAnchor).
 * For root element: returns the anchor (already on boundary via midSide).
 * For custom magnets: uses `rectangle` with model geometry.
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
 */
export function withOffsets(
  cp: connectionPoints.ConnectionPoint,
  sourceOffset: number,
  targetOffset: number,
): connectionPoints.ConnectionPoint {
  return (endPathSegmentLine, endView, endMagnet, opt, endType, linkView) => {
    const point = cp(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
    const userOffset = endType === 'source' ? sourceOffset : targetOffset;
    const markerLength = getMarkerLength(linkView, endType);
    const offset = userOffset + markerLength;
    if (offset === 0) return point;
    const ref = endPathSegmentLine.start;
    return point.move(ref, -offset);
  };
}

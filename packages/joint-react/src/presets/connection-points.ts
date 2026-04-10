import { connectionPoints } from '@joint/core';

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
  const rectangleArgs = { useModelGeometry: true } as connectionPoints.ConnectionPointArgumentsMap['rectangle'];
  if (endMagnet === endView.el || endMagnet.getAttribute('port')) {
    return connectionPoints.rectangle(endPathSegmentLine, endView, endMagnet, rectangleArgs, endType, linkView);
  }
  const boundaryArgs = {} as connectionPoints.ConnectionPointArgumentsMap['boundary'];
  return connectionPoints.boundary(endPathSegmentLine, endView, endMagnet, boundaryArgs, endType, linkView);
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
  const rectangleArgs = { useModelGeometry: true } as connectionPoints.ConnectionPointArgumentsMap['rectangle'];
  return connectionPoints.rectangle(endPathSegmentLine, endView, endMagnet, rectangleArgs, endType, linkView);
};

/**
 * Wraps a connection point function and applies per-end offsets to the result.
 */
export function withOffsets(
  cp: connectionPoints.ConnectionPoint,
  sourceOffset: number,
  targetOffset: number,
): connectionPoints.ConnectionPoint {
  if (sourceOffset === 0 && targetOffset === 0) return cp;
  return (endPathSegmentLine, endView, endMagnet, opt, endType, linkView) => {
    const point = cp(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
    const offset = endType === 'source' ? sourceOffset : targetOffset;
    if (offset === 0) return point;
    const ref = endPathSegmentLine.start;
    return point.move(ref, -offset);
  };
}

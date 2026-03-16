import { connectionPoints } from '@joint/core';

/**
 * Default connection point function for React-rendered elements.
 *
 * Uses `rectangle` (model geometry) for:
 * - The root element (portal wrapper)
 * - Default port magnets (elements with a `port` attribute)
 *
 * Uses `boundary` for custom sub-elements registered via `selectorRef`.
 * @param endPathSegmentLine - The line segment approaching the end element
 * @param endView - The view of the end element
 * @param endMagnet - The SVG element used as the connection magnet
 * @param _opt - Connection point options (unused)
 * @param endType - The type of the link end (source or target)
 * @param linkView - The view of the link being connected
 * @returns The point on the element where the link should connect.
 */
export const connectionPoint: connectionPoints.ConnectionPoint = (
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

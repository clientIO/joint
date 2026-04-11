import type { dia } from '@joint/core';
import { anchors } from '@joint/core';
import { getMarkerLength, MODEL_GEOMETRY_OPTIONS } from './utils';

/**
 * Anchor that uses `center` with model geometry for the root element and ports,
 * and plain `center` (DOM-measured) for custom magnets.
 */
export const centerAnchor: anchors.Anchor = (
  elementView, magnet, ref, _, endType, linkView
) => {
  if (magnet === elementView.el || magnet.getAttribute('port')) {
    return anchors.center(elementView, magnet, ref, MODEL_GEOMETRY_OPTIONS, endType, linkView);
  }
  return anchors.center(elementView, magnet, ref, _, endType, linkView);
};

/**
 * Anchor that uses `perpendicular` with model geometry for the root element and ports,
 * and plain `perpendicular` (DOM-measured) for custom magnets.
 */
export const perpendicularAnchor: anchors.Anchor = (
  elementView, magnet, ref, _, endType, linkView
) => {
  if (magnet === elementView.el || magnet.getAttribute('port')) {
    return anchors.perpendicular(elementView, magnet, ref, MODEL_GEOMETRY_OPTIONS, endType, linkView);
  }
  return anchors.perpendicular(elementView, magnet, ref, _, endType, linkView);
};

/** Mode for the `midSide` anchor used on root elements and custom magnets. */
export type LinkMode = 'prefer-horizontal' | 'prefer-vertical' | 'horizontal' | 'vertical' | 'auto' | 'top-bottom' | 'bottom-top' | 'left-right' | 'right-left';

/**
 * Creates an anchor function that chooses the anchor position based on the magnet type:
 * - Root element → `midSide` with model geometry and the given `mode`.
 * - Port magnet → a specific side of the port bbox, with optional padding.
 * - Other magnets → `midSide` (DOM-based)
* @param mode - The `midSide` mode. Default: `'auto'`.
 * @param sourceOffset - Padding for source end (px). Default: `0`.
 * @param targetOffset - Padding for target end (px). Default: `0`.
 */
export function midSideAnchor(mode: LinkMode = 'auto', sourceOffset = 0, targetOffset = 0): anchors.Anchor {
  return (elementView, magnet, ref, _, endType, linkView) => {
    const userOffset = endType === 'source' ? sourceOffset : targetOffset;
    const markerLength = getMarkerLength(linkView, endType);
    const padding = userOffset + markerLength;
    if (magnet === elementView.el) {
      // For the root element, use midSide with model geometry and padding
      const rootArgs = { useModelGeometry: true, rotate: true, mode, padding };
      return anchors.midSide(elementView, magnet, ref, rootArgs, endType, linkView);
    }
    const element = elementView.model as dia.Element;
    const portId = magnet.getAttribute('port');
    if (portId && element.hasPort(portId)) {
      // For ports, calculate the point based on the port bbox and element geometry
      const portBBox = element.getPortBBox(portId);
      const point = portBBox.center();
      const side = element.getBBox().sideNearestToPoint(point);
      switch (side) {
        case 'left': { point.x -= portBBox.width / 2 + padding; break; }
        case 'right': { point.x += portBBox.width / 2 + padding; break; }
        case 'top': { point.y -= portBBox.height / 2 + padding; break; }
        case 'bottom': { point.y += portBBox.height / 2 + padding; break; }
        // No default
      }
      return point;
    }
    // For other magnets, use midSide with DOM geometry
    const magnetArgs = { mode, rotate: true, padding } as anchors.MidSideAnchorArguments;
    return anchors.midSide(elementView, magnet, ref, magnetArgs, endType, linkView);
  };
}

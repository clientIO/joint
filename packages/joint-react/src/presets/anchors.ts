import type { dia } from '@joint/core';
import { anchors } from '@joint/core';

const USE_MODEL_GEOMETRY = { useModelGeometry: true } as const;

/**
 * Anchor that uses `center` with model geometry for the root element and ports,
 * and plain `center` (DOM-measured) for custom magnets.
 */
export const modelCenterAnchor: anchors.Anchor = (
  elementView, magnet, ref, _, endType, linkView
) => {
  if (magnet === elementView.el || magnet.getAttribute('port')) {
    return anchors.center(elementView, magnet, ref, USE_MODEL_GEOMETRY, endType, linkView);
  }
  return anchors.center(elementView, magnet, ref, _, endType, linkView);
};

/** Mode for the `midSide` anchor used on root elements and custom magnets. */
export type AnchorMode = 'prefer-horizontal' | 'prefer-vertical' | 'horizontal' | 'vertical' | 'auto';

/**
 * Creates an anchor function that chooses the anchor position based on the magnet type:
 * - Root element → `midSide` with model geometry and the given `mode`.
 * - Port magnet → `center` shifted to port edge + padding.
 * - Other magnets → `midSide` (DOM-based).
 * @param mode - The `midSide` mode. Default: `'auto'`.
 * @param sourceOffset - Padding for source end (px). Default: `0`.
 * @param targetOffset - Padding for target end (px). Default: `0`.
 */
export function smartAnchor(mode: AnchorMode = 'auto', sourceOffset = 0, targetOffset = 0): anchors.Anchor {
  return (elementView, magnet, ref, _, endType, linkView) => {
    const padding = endType === 'source' ? sourceOffset : targetOffset;
    if (magnet === elementView.el) {
      const rootArgs = { useModelGeometry: true, rotate: true, mode, padding };
      return anchors.midSide(elementView, magnet, ref, rootArgs, endType, linkView);
    }
    const element = elementView.model as dia.Element;
    const portId = magnet.getAttribute('port');
    if (portId && element.hasPort(portId)) {
      const point = anchors.center(elementView, magnet, ref, USE_MODEL_GEOMETRY, endType, linkView);
      const portBBox = element.getPortBBox(portId);
      const side = portBBox.sideNearestToPoint(element.getCenter());
      switch (side) {
        case 'left': { point.x += portBBox.width / 2 + padding; break; }
        case 'right': { point.x -= portBBox.width / 2 + padding; break; }
        case 'top': { point.y += portBBox.height / 2 + padding; break; }
        case 'bottom': { point.y -= portBBox.height / 2 + padding; break; }
        // No default
      }
      return point;
    }
    const magnetArgs = { mode, rotate: true, padding } as anchors.MidSideAnchorArguments;
    return anchors.midSide(elementView, magnet, ref, magnetArgs, endType, linkView);
  };
}

import type { dia } from '@joint/core';
import type { ElementPosition, ElementSize, LinkLayout } from '../types/cell-data';

/**
 * Default point used as fallback when position is not available.
 */
const DEFAULT_POINT = { x: 0, y: 0 } as const;

/** Layout fields extracted from a JointJS element for the elements container. */
export interface ElementLayoutFields {
  readonly position: ElementPosition;
  readonly size: ElementSize;
  readonly angle: number;
}

/**
 * Extracts layout fields (position, size, angle) from a JointJS element.
 * @param element - The JointJS element to extract layout from
 * @returns The layout fields or null if the element has no size
 */
export function getElementLayoutFields(element: dia.Element): ElementLayoutFields | null {
  const size = element.get('size');
  const position = element.get('position') ?? DEFAULT_POINT;
  const angle = element.get('angle') ?? 0;
  if (size === undefined) {
    return null;
  }
  return {
    position: { x: position.x ?? 0, y: position.y ?? 0 },
    size: { width: size?.width ?? 0, height: size?.height ?? 0 },
    angle,
  };
}

/**
 * Extracts the layout (source/target points and path) from a JointJS link view.
 * @param linkView - The JointJS link view to extract layout from
 * @returns The link layout with source, target coordinates and path data
 */
export function getLinkLayout(linkView: dia.LinkView): LinkLayout {
  const sourcePoint = linkView.sourcePoint ?? DEFAULT_POINT;
  const targetPoint = linkView.targetPoint ?? DEFAULT_POINT;
  const d = linkView.getSerializedConnection?.() ?? '';

  return {
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    d,
  };
}

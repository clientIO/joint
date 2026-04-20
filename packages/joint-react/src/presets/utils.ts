import type { dia } from '@joint/core';

export const MODEL_GEOMETRY_OPTIONS = {
  useModelGeometry: true,
  rotate: true
} as const;

export const EMPTY_OPTIONS = {} as const;

export const BOUNDARY_OPTIONS = {
  // use the endMagnet itself - don't search for a non-group child element
  selector: false,
} as const;

/**
 * Reads the marker length from the link's native attrs for the given end type.
 * The length is how far to push the line tip from the connection point to accommodate the marker.
 * @param linkView
 * @param endType
 * @param selector
 */
export function getMarkerLength(linkView: dia.LinkView, endType: dia.LinkEnd, selector = 'line'): number {
  const selectorAttributes = linkView.model.attributes?.attrs?.[selector];
  if (!selectorAttributes) return 0;
  const marker = endType === 'source' ? selectorAttributes.sourceMarker : selectorAttributes.targetMarker;
  return (marker as Record<string, unknown>)?.length as number ?? 0;
}

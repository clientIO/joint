import type { dia } from '@joint/core';

export const MODEL_GEOMETRY_OPTIONS = {
  useModelGeometry: true,
  rotate: true
} as const;

export const EMPTY_OPTIONS = {} as const;

export const BOUNDARY_OPTIONS = {
  // use the endMagnet itself - don't search for a non-group child element
  selector: false,
  extrapolate: true,
} as const;

/**
 * Reads the marker length from the link's native attrs for the given end type.
 * The length is how far to push the line tip from the connection point to accommodate the marker.
 */
export function getMarkerLength(linkView: dia.LinkView, endType: dia.LinkEnd): number {
  const attrs = linkView.model.attributes?.attrs;
  const line = attrs?.line;
  if (!line) return 0;
  const marker = endType === 'source' ? line.sourceMarker : line.targetMarker;
  return (marker as Record<string, unknown>)?.length as number ?? 0;
}

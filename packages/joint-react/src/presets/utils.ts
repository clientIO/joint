import type { dia } from '@joint/core';
import { namedLinkMarkers, type LinkMarkerRecord } from '../theme/named-link-markers';

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
 * Reads the marker length from the link's style for the given end type.
 * The length is how far to push the line tip from the connection point to accommodate the marker.
 * If the marker is a string name, resolves it from linkMarkerShapes.
 */
export function getMarkerLength(linkView: dia.LinkView, endType: dia.LinkEnd): number {
  const style = linkView.model.attributes?.style;
  if (!style) return 0;
  const marker = endType === 'source' ? style.sourceMarker : style.targetMarker;
  if (!marker) return 0;
  if (typeof marker === 'string') {
    const resolved = namedLinkMarkers[marker as keyof typeof namedLinkMarkers];
    return (resolved as LinkMarkerRecord | null)?.length ?? 0;
  }
  return marker.length ?? 0;
}

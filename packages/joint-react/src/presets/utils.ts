import type { dia } from '@joint/core';
import { linkMarkerShapes } from '../theme/markers';

export const USE_MODEL_GEOMETRY = { useModelGeometry: true } as const;

/**
 * Reads the marker size from the link's style for the given end type.
 * The size is how far to push the line tip from the connection point to accommodate the marker.
 * If the marker is a string name, resolves it from linkMarkerShapes.
 */
export function getMarkerSize(linkView: dia.LinkView, endType: dia.LinkEnd): number {
  const style = linkView.model.attributes?.style;
  if (!style) return 0;
  const marker = endType === 'source' ? style.sourceMarker : style.targetMarker;
  if (!marker) return 0;
  if (typeof marker === 'string') {
    const resolved = linkMarkerShapes[marker as keyof typeof linkMarkerShapes];
    return (resolved as Record<string, unknown>)?.size as number ?? 0;
  }
  return marker.size ?? 0;
}

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
 * The length is how far to push the line tip from the connection point to
 * accommodate the marker. Cached on `linkView.metrics` for the current render
 * pass — JointJS resets the metrics map on every redraw, so the cache is
 * automatically invalidated when attrs change.
 * @param linkView
 * @param endType
 * @param selector
 */
export function getMarkerLength(linkView: dia.LinkView, endType: dia.LinkEnd, selector = 'line'): number {
  const cacheKey = `--jj-$${endType}-marker-length`;
  // @ts-expect-error - `metrics` is reset by `CellView` on every update; not exposed in d.ts.
  const { metrics } = linkView;
  if (metrics && cacheKey in metrics) return metrics[cacheKey];

  const selectorAttributes = linkView.model.attributes?.attrs?.[selector];
  let length = 0;
  if (selectorAttributes) {
    const marker = endType === 'source' ? selectorAttributes.sourceMarker : selectorAttributes.targetMarker;
    length = (marker as Record<string, unknown>)?.length as number ?? 0;
  }
  if (metrics) metrics[cacheKey] = length;
  return length;
}

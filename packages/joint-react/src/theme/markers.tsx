import type { dia } from '@joint/core';
import { jsx } from '../utils/joint-jsx/jsx-to-markup';
import { isString } from '../utils/is';

/**
 * Built-in marker presets for links.
 */
export const markerPresets = {
  'none': null,
  'arrow': jsx(<path d="M 0 0 L 8 -4 V 4 z" fill="context-stroke" stroke-width="2" />),
  'arrow-open': jsx(<path d="M 10 4 L 0 0 L 10 -4" fill="none" stroke-width="2" />),
  'circle': jsx(<circle r="4" fill="context-stroke" stroke-width="2" />),
  'circle-outline': jsx(<circle r="4" fill="none" stroke-width="2" />),
  'diamond': jsx(<path d="M 0 0 L 5 -5 L 10 0 L 5 5 z" fill="context-stroke" stroke-width="2" />),
  'bar': jsx(<path d="M 0 -5 V 5" stroke-width="2" />),
  'cross': jsx(<path d="M 3 -5 L 12 5 M 3 5 L 12 -5" stroke-width="2" />),
} as const satisfies Record<string, dia.SVGMarkerJSON | null>;

export type LinkMarkerPreset = keyof typeof markerPresets;

/**
 * Resolves a marker preset name or custom marker to a MarkerJSON.
 * @param marker - Marker preset name, custom marker, or null
 * @returns The resolved marker JSON or null
 */
export type LinkMarker = LinkMarkerPreset | dia.SVGMarkerJSON | dia.MarkupJSON;

/**
 * Resolves a LinkMarker to a dia.SVGMarkerJSON or null.
 * @param marker - The LinkMarker to resolve
 * @returns The resolved dia.SVGMarkerJSON or null
 */
export function resolveMarker(
  marker: LinkMarker | undefined
): dia.SVGMarkerJSON | null {
  if (marker === undefined || marker === 'none') return null;
  if (isString(marker)) {
    const markerDefinition = markerPresets[marker as keyof typeof markerPresets];
    if (!markerDefinition) return null;
    if (Array.isArray(markerDefinition)) {
      return { markup: markerDefinition };
    }
    return markerDefinition as dia.SVGMarkerJSON;
  }
  if (Array.isArray(marker)) {
    return { markup: marker };
  }
  const markerAsRecord = marker as Record<string, unknown>;
  if (!('type' in markerAsRecord) && typeof markerAsRecord.d === 'string') {
    return { type: 'path', ...markerAsRecord } as dia.SVGMarkerJSON;
  }
  return marker as dia.SVGMarkerJSON;
}

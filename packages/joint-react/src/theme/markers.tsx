import type { dia } from '@joint/core';
import { jsx } from '../utils/joint-jsx/jsx-to-markup';
import { isString } from '../utils/is';

/**
 * Built-in marker presets for links.
 */
export const markerPresets = {
  none: null,
  arrow: {
    markup: jsx(<path d="M 0 0 L 8 -4 V 4 z" fill="context-fill" stroke-width="2" />),
  },
  'arrow-open': {
    markup: jsx(<path d="M 10 3 L 0 0 L 10 -3" fill="none" stroke-width="2" />),
  },
  circle: {
    markup: jsx(<circle r="4" fill="context-fill" stroke-width="2" />),
  },
  'circle-outline': {
    markup: jsx(<circle r="4" fill="none" stroke-width="2" />),
  },
  diamond: {
    markup: jsx(<path d="M 0 0 L 5 -5 L 10 0 L 5 5 z" fill="context-fill" stroke-width="2" />),
  },
  bar: {
    markup: jsx(<path d="M 0 -5 V 5" stroke-width="2" />),
  },
  cross: {
    markup: jsx(<path d="M 3 -5 L 12 5 M 3 5 L 12 -5" stroke-width="2" />),
  },
} as const satisfies Record<string, dia.SVGMarkerJSON | null>;

export type LinkMarkerPreset = keyof typeof markerPresets;

/**
 * Resolves a marker preset name or custom marker to a MarkerJSON.
 * @param marker - Marker preset name, custom marker, or null
 * @returns The resolved marker JSON or null
 */
export function resolveMarker(
  marker: LinkMarkerPreset | dia.SVGMarkerJSON | undefined
): dia.SVGMarkerJSON | null {
  if (marker === undefined || marker === 'none') return null;
  if (isString(marker)) {
    return markerPresets[marker as keyof typeof markerPresets] ?? null;
  }
  const markerAsRecord = marker as Record<string, unknown>;
  if (!('type' in markerAsRecord) && typeof markerAsRecord.d === 'string') {
    return { type: 'path', ...markerAsRecord } as dia.SVGMarkerJSON;
  }
  return marker;
}

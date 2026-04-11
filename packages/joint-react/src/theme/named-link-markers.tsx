import type { dia } from '@joint/core';
import { isString } from '../utils/is';
import {
  linkMarkerArrow,
  linkMarkerArrowOpen,
  linkMarkerArrowSunken,
  linkMarkerCircle,
  linkMarkerDiamond,
} from '../presets/link-markers';

/**
 * Built-in marker shapes for links.
 */
export const namedLinkMarkers = {
  'none': null,
  'arrow': linkMarkerArrow(),
  'arrow-open': linkMarkerArrowOpen(),
  'arrow-sunken': linkMarkerArrowSunken(),
  'circle': linkMarkerCircle(),
  'diamond': linkMarkerDiamond(),
} as const satisfies Record<string, dia.SVGMarkerJSON | null>;

export type LinkMarkerName = keyof typeof namedLinkMarkers;

/**
 * Resolves a marker name or custom marker to a MarkerJSON.
 * @param marker - Marker name, custom marker, or null
 * @returns The resolved marker JSON or null
 */
export type LinkMarker = LinkMarkerName | dia.SVGMarkerJSON | dia.MarkupJSON;

/**
 * Resolves a LinkMarker to a dia.SVGMarkerJSON or null.
 * @param marker - The LinkMarker to resolve
 * @returns The resolved dia.SVGMarkerJSON or null
 */
export function resolveMarker(marker: LinkMarker | undefined): dia.SVGMarkerJSON | null {
  if (marker === undefined || marker === 'none') return null;
  if (isString(marker)) {
    const markerDefinition = namedLinkMarkers[marker as keyof typeof namedLinkMarkers];
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
  return {
    stroke: 'context-stroke',
    fill: 'context-stroke',
    ...markerAsRecord,
  } as dia.SVGMarkerJSON;
}

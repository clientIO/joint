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
} as const satisfies Record<string, LinkMarkerRecord | null>;

export type LinkMarkerName = keyof typeof namedLinkMarkers;

/**
 * Resolves a marker name or custom marker to a MarkerJSON.
 * @param marker - Marker name, custom marker, or null
 * @returns The resolved marker JSON or null
 */
export type LinkMarker = LinkMarkerName | LinkMarkerRecord;

/**
 * A record representing a custom link marker, containing the SVG markup and optional length.
 */
export interface LinkMarkerRecord extends dia.SVGComplexMarkerJSON {
  length?: number;
}

/**
 * Resolves a LinkMarker to a dia.SVGComplexMarkerJSON or null.
 * @param marker - The LinkMarker to resolve
 * @returns The resolved dia.SVGComplexMarkerJSON or null
 */
export function resolveMarker(marker: LinkMarker | undefined): dia.SVGComplexMarkerJSON | null {
  if (marker === undefined || marker === 'none') return null;
  const resolvedMarker = isString(marker)
    ? namedLinkMarkers[marker as keyof typeof namedLinkMarkers]
    : marker;
  if (!resolvedMarker) return null;
  return resolvedMarker as dia.SVGComplexMarkerJSON;
}

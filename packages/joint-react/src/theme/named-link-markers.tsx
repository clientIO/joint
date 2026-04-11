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
export type LinkMarker = LinkMarkerName | dia.SVGMarkerJSON;

/**
 * Resolves a LinkMarker to a dia.SVGMarkerJSON or null.
 * @param marker - The LinkMarker to resolve
 * @returns The resolved dia.SVGMarkerJSON or null
 */
export function resolveMarker(marker: LinkMarker | undefined): dia.SVGMarkerJSON | null {
  if (marker === undefined || marker === 'none') return null;
  const resolvedMarker = isString(marker)
    ? namedLinkMarkers[marker as keyof typeof namedLinkMarkers]
    : marker;
  if (!resolvedMarker) return null;
  const { length: _length, ...nativeMarker } = resolvedMarker as Record<string, unknown>;
  return {
    stroke: 'context-stroke',
    fill: 'context-stroke',
    ...nativeMarker,
  } as dia.SVGMarkerJSON;
}

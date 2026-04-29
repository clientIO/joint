import { isString } from '../utils/is';
import {
  linkMarkerArrow,
  linkMarkerArrowOpen,
  linkMarkerArrowSunken,
  linkMarkerCircle,
  linkMarkerDiamond,
  type LinkMarkerRecord,
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
 * A named preset or a custom {@link LinkMarkerRecord}.
 */
export type LinkMarker = LinkMarkerName | LinkMarkerRecord;

/**
 * Resolves a LinkMarker to a {@link LinkMarkerRecord} or null.
 * @param marker - The LinkMarker to resolve
 * @returns The resolved marker or null
 */
export function resolveLinkMarker(marker: LinkMarker | undefined): LinkMarkerRecord | null {
  if (marker === undefined || marker === 'none') return null;
  const resolvedMarker = isString(marker)
    ? namedLinkMarkers[marker as keyof typeof namedLinkMarkers]
    : marker;
  if (!resolvedMarker) return null;
  return resolvedMarker;
}

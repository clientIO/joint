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

/**
 * The names of the built-in link markers you can pass to a {@link LinkStyle}:
 * `'arrow'`, `'arrow-open'`, `'arrow-sunken'`, `'circle'`, `'diamond'`, or
 * `'none'`.
 * @group Types
 */
export type LinkMarkerName = keyof typeof namedLinkMarkers;

/**
 * A link endpoint marker, either a built-in {@link LinkMarkerName} or a custom
 * {@link LinkMarkerRecord}.
 * @group Types
 */
export type LinkMarker = LinkMarkerName | LinkMarkerRecord;

/**
 * Normalizes a {@link LinkMarker} into a concrete {@link LinkMarkerRecord}. Looks
 * up a built-in name (`'arrow'`, `'circle'`, …) in the marker registry, passes a
 * custom record through unchanged, and returns `null` for `'none'`, `undefined`,
 * or an unknown name, meaning "draw no marker".
 * @param marker - a marker name, a custom marker record, `'none'`, or `undefined`
 * @returns The resolved marker record, or `null` when no marker should be drawn
 * @example
 * ```ts
 * import { resolveLinkMarker } from '@joint/react';
 *
 * resolveLinkMarker('arrow'); // built-in arrow record
 * resolveLinkMarker('none');  // null
 * ```
 * @group Presets
 */
export function resolveLinkMarker(marker: LinkMarker | undefined): LinkMarkerRecord | null {
  if (marker === undefined || marker === 'none') return null;
  const resolvedMarker = isString(marker)
    ? namedLinkMarkers[marker as keyof typeof namedLinkMarkers]
    : marker;
  if (!resolvedMarker) return null;
  return resolvedMarker;
}

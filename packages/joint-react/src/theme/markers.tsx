import type { dia } from '@joint/core';
import { isString } from '../utils/is';
import {
  linkMarkerArrow,
  linkMarkerArrowOpen,
  linkMarkerArrowSunken,
  linkMarkerArrowQuill,
  linkMarkerArrowDouble,
  linkMarkerCircle,
  linkMarkerDiamond,
  linkMarkerLine,
  linkMarkerCross,
  linkMarkerFork,
  linkMarkerForkClose,
  linkMarkerMany,
  linkMarkerManyOptional,
  linkMarkerOne,
  linkMarkerOneOptional,
  linkMarkerOneOrMany,
} from '../presets/link-markers';

/**
 * Built-in marker shapes for links.
 */
export const linkMarkerShapes = {
  'none': null,
  'arrow': linkMarkerArrow(),
  'arrow-outline': linkMarkerArrow({ fill: 'none' }),
  'arrow-open': linkMarkerArrowOpen(),
  'arrow-sunken': linkMarkerArrowSunken(),
  'arrow-sunken-outline': linkMarkerArrowSunken({ fill: 'none' }),
  'arrow-quill': linkMarkerArrowQuill(),
  'arrow-quill-outline': linkMarkerArrowQuill({ fill: 'none' }),
  'arrow-double': linkMarkerArrowDouble(),
  'arrow-double-outline': linkMarkerArrowDouble({ fill: 'none' }),
  'circle': linkMarkerCircle(),
  'circle-outline': linkMarkerCircle({ fill: 'none' }),
  'diamond': linkMarkerDiamond(),
  'diamond-outline': linkMarkerDiamond({ fill: 'none' }),
  'line': linkMarkerLine(),
  'cross': linkMarkerCross(),
  'fork': linkMarkerFork(),
  'fork-outline': linkMarkerFork({ fill: 'none' }),
  'fork-close': linkMarkerForkClose(),
  'fork-close-outline': linkMarkerForkClose({ fill: 'none' }),
  'many': linkMarkerMany(),
  'many-optional': linkMarkerManyOptional(),
  'one': linkMarkerOne(),
  'one-optional': linkMarkerOneOptional(),
  'one-or-many': linkMarkerOneOrMany(),
} as const satisfies Record<string, dia.SVGMarkerJSON | null>;

export type LinkMarkerName = keyof typeof linkMarkerShapes;

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
    const markerDefinition = linkMarkerShapes[marker as keyof typeof linkMarkerShapes];
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

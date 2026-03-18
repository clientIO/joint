import type { anchors, attributes, connectionPoints, dia } from '@joint/core';
import type { CellId } from '../../types/cell-id';
import type { FlatLinkEnd } from '../../types/link-types';
import type { MarkerPreset } from '../../theme/markers';
import { resolveMarker } from '../../theme/markers';
import { isString } from '../../utils/is';

export interface LinkEndAttributeOptions {
  port?: string;
  anchor?: anchors.AnchorJSON;
  connectionPoint?: connectionPoints.ConnectionPointJSON;
  magnet?: string;
}

/**
 * Converts a link end from React data format to JointJS `EndJSON` attribute.
 *
 * - `'element-1'` → `{ id: 'element-1' }`
 * - `{ x: 100, y: 200 }` → `{ x: 100, y: 200 }`
 *
 * Optionally merges `port`, `anchor`, `connectionPoint`, and `magnet`.
 * @param end - The link end value (element ID string or point object)
 * @param options - Optional endpoint detail properties to merge
 * @returns The JointJS link end attribute object
 */
export function toLinkEndAttribute(
  end: FlatLinkEnd,
  options?: LinkEndAttributeOptions
): dia.Link.EndJSON {
  const base = (isString(end) ? { id: end } : end) as dia.Link.EndJSON;
  if (!options) return base;

  const { port, anchor, connectionPoint, magnet } = options;
  if (!port && !anchor && !connectionPoint && !magnet) return base;

  const result = { ...base };
  if (port) result.port = port;
  if (anchor) result.anchor = anchor;
  if (connectionPoint) result.connectionPoint = connectionPoint;
  if (magnet) result.magnet = magnet;
  return result;
}

export interface LinkEndData {
  end: FlatLinkEnd;
  port?: string;
  anchor?: anchors.AnchorJSON;
  connectionPoint?: connectionPoints.ConnectionPointJSON;
  magnet?: string;
}

/**
 * Converts a JointJS `EndJSON` attribute back to React data format.
 *
 * - `{ id: 'element-1' }` → `end: 'element-1'`
 * - `{ x: 100, y: 200 }` → `end: { x: 100, y: 200 }`
 *
 * `port`, `anchor`, `connectionPoint`, and `magnet` are extracted as
 * separate properties.
 * @param end - The JointJS link end attribute to convert
 * @returns React-friendly link end data with optional port, anchor, connectionPoint, and magnet properties
 */
export function toLinkEndData(end: dia.Link.EndJSON): LinkEndData {
  const { port, anchor, connectionPoint, magnet } = end;

  const endData: FlatLinkEnd =
    'x' in end && 'y' in end ? { x: end.x!, y: end.y! } : (end.id as CellId);

  const result: LinkEndData = { end: endData };
  if (port !== undefined) result.port = port;
  if (anchor) result.anchor = anchor;
  if (connectionPoint) result.connectionPoint = connectionPoint;
  if (magnet) result.magnet = magnet;
  return result;
}

/**
 * Copies the optional endpoint detail properties (port, anchor, connectionPoint,
 * magnet) from a {@link LinkEndData} into a flat data record.
 * @param linkData - The flat data record to write properties into
 * @param endData - The link end data containing optional properties
 * @param keys - Mapping of property names to their flat data keys
 * @param keys.port - Key for the port property
 * @param keys.anchor - Key for the anchor property
 * @param keys.connectionPoint - Key for the connectionPoint property
 * @param keys.magnet - Key for the magnet property
 */
export function assignEndDataProperties(
  linkData: Record<string, unknown>,
  endData: LinkEndData,
  keys: { port: string; anchor: string; connectionPoint: string; magnet: string }
): void {
  if (endData.port) linkData[keys.port] = endData.port;
  if (endData.anchor) linkData[keys.anchor] = endData.anchor;
  if (endData.connectionPoint) linkData[keys.connectionPoint] = endData.connectionPoint;
  if (endData.magnet) linkData[keys.magnet] = endData.magnet;
}

const SOURCE_KEYS = {
  port: 'sourcePort',
  anchor: 'sourceAnchor',
  connectionPoint: 'sourceConnectionPoint',
  magnet: 'sourceMagnet',
} as const;
const TARGET_KEYS = {
  port: 'targetPort',
  anchor: 'targetAnchor',
  connectionPoint: 'targetConnectionPoint',
  magnet: 'targetMagnet',
} as const;

export { SOURCE_KEYS, TARGET_KEYS };

interface LinkPresentationOptions {
  color?: string;
  strokeWidth?: number | string;
  sourceMarker: MarkerPreset | dia.SVGMarkerJSON;
  targetMarker: MarkerPreset | dia.SVGMarkerJSON;
  className: string;
  strokeDashArray: string;
  lineCap: string;
  lineJoin: string;
  wrapperBuffer: number;
  wrapperColor: string;
  wrapperClassName: string;
}

/**
 * Builds the full `attrs` object for a link cell, containing
 * `line` and `wrapper` selectors.
 *
 * Resolves marker presets, dash patterns, and class names into
 * flat SVG attribute objects for the line, and computes wrapper
 * hit-area attributes.
 *
 * `color` and `strokeWidth` are applied via inline `style` (not SVG attributes) so that:
 * 1. CSS variables like `var(--color-pink-200)` work (`var()` is invalid in SVG attributes)
 * 2. Inline style has highest specificity — overrides theme.css rules
 * When not set, theme.css CSS variables control the stroke.
 * @param options - Theme-driven styling options for line and wrapper
 * @returns Record with `line` and `wrapper` attribute objects
 */
export function buildLinkPresentationAttributes(
  options: LinkPresentationOptions
): Record<string, attributes.SVGAttributes> {
  const {
    color,
    strokeWidth,
    sourceMarker,
    targetMarker,
    className,
    strokeDashArray,
    lineCap,
    lineJoin,
    wrapperBuffer,
    wrapperColor,
    wrapperClassName,
  } = options;

  // Build inline style for color and strokeWidth when explicitly set.
  // When not set, omit — CSS variables from theme.css handle defaults.
  const style: Record<string, unknown> = {};
  if (color !== undefined) style.stroke = color;
  if (strokeWidth !== undefined) style['stroke-width'] = strokeWidth;

  const lineAttributes: attributes.SVGAttributes = {
    ...(Object.keys(style).length > 0 ? { style } : {}),
  };

  if (sourceMarker !== 'none') {
    lineAttributes.sourceMarker = resolveMarker(sourceMarker);
  }

  // Explicitly set to null to override the standard.Link default arrowhead
  lineAttributes.targetMarker = targetMarker === 'none' ? null : resolveMarker(targetMarker);

  if (className) {
    lineAttributes.class = className;
  }
  if (strokeDashArray) {
    lineAttributes.strokeDasharray = strokeDashArray;
  }

  const strokeAttributes: attributes.SVGAttributes = {};
  if (lineCap) strokeAttributes.strokeLinecap = lineCap;
  if (lineJoin) strokeAttributes.strokeLinejoin = lineJoin;

  // Wrapper strokeWidth: when strokeWidth is a number, add wrapperBuffer.
  // When it's a string (CSS variable) or undefined, use wrapperBuffer alone.
  const wrapperStrokeWidth = typeof strokeWidth === 'number'
    ? wrapperBuffer + strokeWidth
    : wrapperBuffer;

  return {
    line: {
      connection: true,
      ...lineAttributes,
      ...strokeAttributes,
    },
    wrapper: {
      connection: true,
      strokeWidth: wrapperStrokeWidth,
      stroke: wrapperColor,
      ...(wrapperClassName ? { class: wrapperClassName } : {}),
      ...strokeAttributes,
    },
  };
}

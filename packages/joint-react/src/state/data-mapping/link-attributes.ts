import type { anchors, attributes, connectionPoints, dia } from '@joint/core';
import type { CellId } from '../../types/cell-id';
import type { FlatLinkData, FlatLinkEnd, FlatLinkPresentationData } from '../../types/data-types';
import type { Nullable } from '../../types';
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
  options?: LinkEndAttributeOptions,
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

  const endData: FlatLinkEnd = 'x' in end && 'y' in end
    ? { x: end.x!, y: end.y! }
    : end.id as CellId;

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
  keys: { port: string; anchor: string; connectionPoint: string; magnet: string },
): void {
  if (endData.port) linkData[keys.port] = endData.port;
  if (endData.anchor) linkData[keys.anchor] = endData.anchor;
  if (endData.connectionPoint) linkData[keys.connectionPoint] = endData.connectionPoint;
  if (endData.magnet) linkData[keys.magnet] = endData.magnet;
}

const SOURCE_KEYS = { port: 'sourcePort', anchor: 'sourceAnchor', connectionPoint: 'sourceConnectionPoint', magnet: 'sourceMagnet' } as const;
const TARGET_KEYS = { port: 'targetPort', anchor: 'targetAnchor', connectionPoint: 'targetConnectionPoint', magnet: 'targetMagnet' } as const;

export { SOURCE_KEYS, TARGET_KEYS };

/**
 * Builds the full `attrs` object for a link cell, containing
 * `line` and `wrapper` selectors.
 *
 * Resolves marker names, dash patterns, and class names into
 * flat SVG attribute objects for the line, and computes wrapper
 * hit-area attributes.
 *
 * `color` and `width` are set via inline `style` so they win over CSS theme
 * rules. Empty strings are no-ops, letting CSS variables from theme.css take over.
 * @param options - Theme-driven styling options for line and wrapper
 * @returns Record with `line` and `wrapper` attribute objects
 */
export function buildLinkPresentationAttributes(
  options: Required<FlatLinkPresentationData>
): Record<string, Nullable<attributes.SVGAttributes>> {
  const { color, width, sourceMarker, targetMarker, className, dasharray, linecap, linejoin, wrapperWidth, wrapperColor, wrapperClassName } = options;

  // Use inline `style` so that explicit values win over CSS theme rules
  // (inline style > CSS specificity). Empty strings are no-ops on the DOM,
  // letting CSS variables from theme.css handle defaults.
  const lineStyle: Record<string, unknown> = {
    stroke: color,
    strokeWidth: width,
    strokeDasharray: dasharray,
    strokeLinecap: linecap,
    strokeLinejoin: linejoin,
  };

  const lineAttributes: Nullable<attributes.SVGAttributes> = {
    style: lineStyle,
  };

  if (sourceMarker !== 'none') {
    lineAttributes.sourceMarker = resolveMarker(sourceMarker);
  }

  // Explicitly set to null to override the standard.Link default arrowhead
  lineAttributes.targetMarker =
    targetMarker === 'none' ? null : resolveMarker(targetMarker);

  lineAttributes.class = `jr-link-line ${className}`.trim();

  return {
    line: {
      connection: true,
      ...lineAttributes,
    },
    wrapper: {
      connection: true,
      style: {
        strokeWidth: wrapperWidth,
        stroke: wrapperColor,
        // Note: `linecap` and `linejoin` are shared between the line and wrapper.
        strokeLinecap: linecap,
        strokeLinejoin: linejoin
      },
      class: `jr-link-wrapper ${wrapperClassName}`.trim(),
    },
  };
}

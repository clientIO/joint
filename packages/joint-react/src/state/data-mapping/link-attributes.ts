import type { anchors, attributes, connectionPoints, dia } from '@joint/core';
import type { GraphLinkEnd } from '../../types/link-types';
import type { MarkerPreset } from '../../theme/markers';
import { resolveMarker } from '../../theme/markers';

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
 * @param end
 * @param options
 */
export function toLinkEndAttribute(
  end: GraphLinkEnd,
  options?: LinkEndAttributeOptions,
): dia.Link.EndJSON {
  const base = (typeof end === 'string' ? { id: end } : end) as dia.Link.EndJSON;
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
  end: GraphLinkEnd;
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
 * @param end
 * @returns React-friendly link end data with optional port, anchor, connectionPoint, and magnet properties
 */
export function toLinkEndData(end: dia.Link.EndJSON): LinkEndData {
  const { port, anchor, connectionPoint, magnet } = end;

  const endData: GraphLinkEnd = 'x' in end && 'y' in end
    ? { x: end.x!, y: end.y! }
    : end.id!;

  const result: LinkEndData = { end: endData };
  if (port !== undefined) result.port = port;
  if (anchor) result.anchor = anchor;
  if (connectionPoint) result.connectionPoint = connectionPoint;
  if (magnet) result.magnet = magnet;
  return result;
}

interface LinkPresentationOptions {
  color: string;
  width: number;
  sourceMarker: MarkerPreset | dia.SVGMarkerJSON;
  targetMarker: MarkerPreset | dia.SVGMarkerJSON;
  className: string;
  pattern: string;
  lineCap: string;
  lineJoin: string;
  wrapperBuffer: number;
  wrapperColor: string;
}

/**
 * Builds the full `attrs` object for a link cell, containing
 * `line` and `wrapper` selectors.
 *
 * Resolves marker presets, dash patterns, and class names into
 * flat SVG attribute objects for the line, and computes wrapper
 * hit-area attributes.
 * @param options - Theme-driven styling options for line and wrapper
 * @returns Record with `line` and `wrapper` attribute objects
 */
export function buildLinkPresentationAttributes(
  options: LinkPresentationOptions
): Record<string, attributes.SVGAttributes> {
  const { color, width, sourceMarker, targetMarker, className, pattern, lineCap, lineJoin, wrapperBuffer, wrapperColor } = options;

  // Build line attributes
  const lineAttributes: attributes.SVGAttributes = {
    stroke: color,
    strokeWidth: width,
  };

  if (sourceMarker !== 'none') {
    lineAttributes.sourceMarker = resolveMarker(sourceMarker);
  }

  // Explicitly set to null to override the standard.Link default arrowhead
  lineAttributes.targetMarker =
    targetMarker === 'none' ? null : resolveMarker(targetMarker);

  if (className) {
    lineAttributes.class = className;
  }
  if (pattern) {
    lineAttributes.strokeDasharray = pattern;
  }

  const strokeAttributes: attributes.SVGAttributes = {};
  if (lineCap) strokeAttributes.strokeLinecap = lineCap;
  if (lineJoin) strokeAttributes.strokeLinejoin = lineJoin;

  return {
    line: {
      connection: true,
      ...lineAttributes,
      ...strokeAttributes,
    },
    wrapper: {
      connection: true,
      strokeWidth: wrapperBuffer + width,
      stroke: wrapperColor,
      ...strokeAttributes,
    },
  };
}

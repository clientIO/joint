import type { attributes, dia } from '@joint/core';
import type { MarkerPreset } from '../../theme/markers';
import { resolveMarker } from '../../theme/markers';

/**
 * Normalizes a link end (source or target) to the JointJS EndJSON format.
 *
 * Accepts either a cell ID string or an existing EndJSON object.
 * @param id - A cell ID or an EndJSON object
 * @returns The normalized EndJSON object
 */
export function normalizeLinkEnd(id: dia.Cell.ID | dia.Link.EndJSON): dia.Link.EndJSON {
  if (typeof id === 'object') {
    return id;
  }
  return { id };
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
  if (lineCap) {
    lineAttributes.strokeLinecap = lineCap;
  }
  if (lineJoin) {
    lineAttributes.strokeLinejoin = lineJoin;
  }

  return {
    line: {
      connection: true,
      ...lineAttributes,
    },
    wrapper: {
      connection: true,
      strokeWidth: wrapperBuffer + width,
      stroke: wrapperColor,
    },
  };
}

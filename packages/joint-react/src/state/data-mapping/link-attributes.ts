import type { attributes, dia } from '@joint/core';
import type { MarkerPreset } from '../../theme/markers';
import type { LinkTheme } from '../../theme/link-theme';
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

interface LineAttributeOptions {
  color: string;
  width: number;
  sourceMarker: MarkerPreset | dia.SVGMarkerJSON;
  targetMarker: MarkerPreset | dia.SVGMarkerJSON;
  className: string;
  pattern: string;
}

/**
 * Builds SVG attributes for the link line element.
 *
 * Resolves marker presets, dash patterns, and class names into
 * flat SVG attribute objects.
 * @param options - Theme-driven line styling options
 * @returns SVG attributes for the line selector
 */
export function buildLinePresentationAttributes(options: LineAttributeOptions): attributes.SVGAttributes {
  const { color, width, sourceMarker, targetMarker, className, pattern } = options;

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

  return lineAttributes;
}

/**
 * Builds the full `attrs` object for a link cell, containing
 * `line` and `wrapper` selectors.
 * @param lineAttributes - Resolved SVG attributes from `buildLinePresentationAttributes`
 * @param width - Stroke width, used to compute the wrapper hit area
 * @param theme - The link theme providing the wrapper buffer size
 * @returns Record with `line` and `wrapper` attribute objects
 */
export function buildLinkPresentationAttributes(
  lineAttributes: attributes.SVGAttributes,
  width: number,
  theme: Pick<LinkTheme, 'wrapperBuffer'>,
): Record<string, attributes.SVGAttributes> {
  return {
    line: {
      connection: true,
      ...lineAttributes,
    },
    wrapper: {
      connection: true,
      strokeWidth: theme.wrapperBuffer + width,
    },
  };
}

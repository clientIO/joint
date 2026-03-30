import type { attributes } from '@joint/core';
import type { LinkStyle } from '../../types/data-types';
import type { Nullable } from '../../types';
import { resolveMarker } from '../../theme/markers';

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
 * @param styleProperties - Theme-driven styling options for line and wrapper
 * @param defaultStyle
 * @returns Record with `line` and `wrapper` attribute objects
 */
export function buildLinkPresentationAttributes(
  styleProperties: LinkStyle,
  defaultStyle: Required<LinkStyle>
): Record<string, Nullable<attributes.SVGAttributes>> {
  const {
    color = defaultStyle.color,
    width = defaultStyle.width,
    sourceMarker = defaultStyle.sourceMarker,
    targetMarker = defaultStyle.targetMarker,
    className = defaultStyle.className,
    dasharray = defaultStyle.dasharray,
    linecap = defaultStyle.linecap,
    linejoin = defaultStyle.linejoin,
    wrapperWidth = defaultStyle.wrapperWidth,
    wrapperColor = defaultStyle.wrapperColor,
    wrapperClassName = defaultStyle.wrapperClassName,
  } = styleProperties;

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
  lineAttributes.targetMarker = targetMarker === 'none' ? null : resolveMarker(targetMarker);

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
        strokeLinejoin: linejoin,
      },
      class: `jr-link-wrapper ${wrapperClassName}`.trim(),
    },
  };
}

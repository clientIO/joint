import type { attributes } from '@joint/core';
import type { LinkStyle } from '../types/data-types';
import type { Nullable } from '../types';
import { resolveMarker } from '../theme/named-link-markers';
import { defaultLinkStyle } from '../theme/link-theme';

/**
 * Converts a `LinkStyle` into JointJS SVG `attrs` for `line` and `wrapper` selectors.
 *
 * Resolves marker names, dash patterns, and class names into flat SVG attribute objects.
 * Empty strings are no-ops, letting CSS variables from `theme.css` take over.
 *
 * @example
 * ```ts
 * import { linkStyle } from '@joint/react/presets';
 *
 * const attrs = linkStyle({ color: '#333', width: 2, targetMarker: 'arrow' });
 * ```
 */
export function linkStyle(style: LinkStyle = {}): Record<string, Nullable<attributes.SVGAttributes>> {
  const {
    color = defaultLinkStyle.color,
    width = defaultLinkStyle.width,
    sourceMarker = defaultLinkStyle.sourceMarker,
    targetMarker = defaultLinkStyle.targetMarker,
    className = defaultLinkStyle.className,
    dasharray = defaultLinkStyle.dasharray,
    linecap = defaultLinkStyle.linecap,
    linejoin = defaultLinkStyle.linejoin,
    wrapperWidth = defaultLinkStyle.wrapperWidth,
    wrapperColor = defaultLinkStyle.wrapperColor,
    wrapperClassName = defaultLinkStyle.wrapperClassName,
  } = style;

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
        strokeLinecap: linecap,
        strokeLinejoin: linejoin,
      },
      class: `jr-link-wrapper ${wrapperClassName}`.trim(),
    },
  };
}

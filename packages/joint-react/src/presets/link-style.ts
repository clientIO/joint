import type { attributes } from '@joint/core';
import type { LinkStyle } from '../types/data-types';
import type { Nullable } from '../types';
import { resolveMarker } from '../theme/named-link-markers';

const defaultLinkStyle: Readonly<Required<LinkStyle>> = {
  color: '',
  width: '',
  sourceMarker: 'none',
  targetMarker: 'none',
  wrapperWidth: 10,
  wrapperColor: 'transparent',
  wrapperClassName: '',
  className: '',
  dasharray: '',
  linecap: '',
  linejoin: '',
};

/**
 * Builds the `line` selector attrs from a LinkStyle.
 * Handles stroke, markers, dash patterns, and CSS class.
 */
export function linkStyleLine(style: LinkStyle = {}): Nullable<attributes.SVGAttributes> {
  const {
    color = defaultLinkStyle.color,
    width = defaultLinkStyle.width,
    sourceMarker = defaultLinkStyle.sourceMarker,
    targetMarker = defaultLinkStyle.targetMarker,
    className = defaultLinkStyle.className,
    dasharray = defaultLinkStyle.dasharray,
    linecap = defaultLinkStyle.linecap,
    linejoin = defaultLinkStyle.linejoin,
  } = style;

  const lineAttributes: Nullable<attributes.SVGAttributes> = {
    connection: true,
    style: {
      stroke: color,
      strokeWidth: width,
      strokeDasharray: dasharray,
      strokeLinecap: linecap,
      strokeLinejoin: linejoin,
    },
  };

  if (sourceMarker !== 'none') {
    lineAttributes.sourceMarker = resolveMarker(sourceMarker);
  }

  lineAttributes.targetMarker = targetMarker === 'none' ? null : resolveMarker(targetMarker);
  lineAttributes.class = `jr-link-line ${className}`.trim();

  return lineAttributes;
}

/**
 * Builds the `wrapper` selector attrs from a LinkStyle.
 * Handles hit-area stroke, width, and CSS class.
 */
export function linkStyleWrapper(style: LinkStyle = {}): Nullable<attributes.SVGAttributes> {
  const {
    linecap = defaultLinkStyle.linecap,
    linejoin = defaultLinkStyle.linejoin,
    wrapperWidth = defaultLinkStyle.wrapperWidth,
    wrapperColor = defaultLinkStyle.wrapperColor,
    wrapperClassName = defaultLinkStyle.wrapperClassName,
  } = style;

  return {
    connection: true,
    style: {
      strokeWidth: wrapperWidth,
      stroke: wrapperColor,
      strokeLinecap: linecap,
      strokeLinejoin: linejoin,
    },
    class: `jr-link-wrapper ${wrapperClassName}`.trim(),
  };
}

/**
 * Converts a `LinkStyle` into JointJS SVG `attrs` for `line` and `wrapper` selectors.
 *
 * @example
 * ```ts
 * const attrs = linkStyle({ color: '#333', width: 2, targetMarker: 'arrow' });
 * ```
 */
export function linkStyle(style: LinkStyle = {}): Record<string, Nullable<attributes.SVGAttributes>> {
  return {
    line: linkStyleLine(style),
    wrapper: linkStyleWrapper(style),
  };
}

import type { attributes } from '@joint/core';
import type { Nullable, LiteralUnion } from '../types';
import { resolveLinkMarker, type LinkMarker } from '../theme/named-link-markers';

/**
 * Visual styling for a link, the visible line plus its invisible pointer
 * hit-area wrapper. Hand it to {@link linkStyle} (or a link record's `style`
 * field); empty-string values fall back to the CSS variables in `theme.css`.
 * @group Types
 */
export interface LinkStyle {
  /** Stroke color of the visible line. Any CSS color, including CSS variables. Empty inherits the theme default. @default '' */
  color?: string;
  /** Stroke width of the visible line, a number (px) or CSS length string. Empty inherits the theme default. @default '' */
  width?: number | string;
  /** Marker at the source end: a {@link LinkMarkerName}, a {@link LinkMarkerRecord}, or `'none'` for no marker. @default 'none' */
  sourceMarker?: LinkMarker;
  /** Marker at the target end: a {@link LinkMarkerName}, a {@link LinkMarkerRecord}, or `'none'` for no marker. @default 'none' */
  targetMarker?: LinkMarker;
  /** Extra CSS class added to the visible line. @default '' */
  className?: string;
  /** Dash pattern in SVG `stroke-dasharray` syntax, e.g. `'5,5'` for a dashed line. @default '' */
  dasharray?: string;
  /** Stroke line cap of the line ends. @default '' */
  linecap?: LiteralUnion<'butt' | 'round' | 'square'>;
  /** Stroke line join at the line's corners. @default '' */
  linejoin?: LiteralUnion<'miter' | 'round' | 'bevel'>;
  /** Stroke width, in px, of the transparent wrapper that widens the pointer hit area. @default 10 */
  wrapperWidth?: number;
  /** Stroke color of the wrapper. Usually transparent, set it to make the hit area visible while debugging. @default 'transparent' */
  wrapperColor?: string;
  /** Extra CSS class added to the wrapper. @default '' */
  wrapperClassName?: string;
}

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
 * Builds the SVG `attrs` for a link's visible `line` from a {@link LinkStyle}:
 * stroke color and width, source/target markers, dash pattern, and the line's
 * CSS class. This is the `line` half of {@link linkStyle}; reach for it when you
 * style the line and wrapper selectors separately.
 * @param style - link style to convert to SVG attributes
 * @returns SVG attributes for the `line` selector
 * @example
 * ```ts
 * import { LinkModel, linkStyleLine, linkStyleWrapper } from '@joint/react';
 *
 * const style = { color: '#333', width: 2 };
 * const link = new LinkModel({
 *   source: { id: 'a' }, target: { id: 'b' },
 *   attrs: { line: linkStyleLine(style), wrapper: linkStyleWrapper(style) },
 * });
 * ```
 * @group Presets
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
    lineAttributes.sourceMarker = {
      // if color is set, apply it to marker stroke and fill
      attrs: {
        stroke: color || 'var(--jj-link-color)',
        fill: color || 'var(--jj-link-color)',
      },
      ...resolveLinkMarker(sourceMarker)
    };
  }

  if (targetMarker !== 'none') {
    lineAttributes.targetMarker = {
      // if color is set, apply it to marker stroke and fill
      attrs: {
        stroke: color || 'var(--jj-link-color)',
        fill: color || 'var(--jj-link-color)',
      },
      ...resolveLinkMarker(targetMarker)
    };
  }

  lineAttributes.class = `jj-link-line ${className}`.trim();

  return lineAttributes;
}

/**
 * Builds the SVG `attrs` for a link's `wrapper`, the wide invisible path around
 * the visible line that catches pointer events, from a {@link LinkStyle}. This is
 * the `wrapper` half of {@link linkStyle}; reach for it when you style the line
 * and wrapper selectors separately.
 * @param style - link style to convert to SVG attributes
 * @returns SVG attributes for the `wrapper` selector
 * @example
 * ```ts
 * import { LinkModel, linkStyleLine, linkStyleWrapper } from '@joint/react';
 *
 * const style = { color: '#333', width: 2 };
 * const link = new LinkModel({
 *   source: { id: 'a' }, target: { id: 'b' },
 *   attrs: { line: linkStyleLine(style), wrapper: linkStyleWrapper(style) },
 * });
 * ```
 * @group Presets
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
    class: `jj-link-wrapper ${wrapperClassName}`.trim(),
  };
}

/**
 * Converts a {@link LinkStyle} into the JointJS SVG `attrs` object a link needs,
 * keyed by the `line` and `wrapper` selectors. Use it to set a link's `attrs`
 * directly, or rely on the `style` shorthand handled by {@link linkAttributes}.
 * @param style - link style to convert to SVG attributes
 * @returns An `attrs` object with `line` and `wrapper` entries
 * @example
 * ```ts
 * import { LinkModel, linkStyle } from '@joint/react';
 *
 * const link = new LinkModel({
 *   source: { id: 'a' },
 *   target: { id: 'b' },
 *   attrs: linkStyle({ color: '#333', width: 2, targetMarker: 'arrow' }),
 * });
 * ```
 * @group Presets
 */
export function linkStyle(style: LinkStyle = {}): Record<string, Nullable<attributes.SVGAttributes>> {
  return {
    line: linkStyleLine(style),
    wrapper: linkStyleWrapper(style),
  };
}

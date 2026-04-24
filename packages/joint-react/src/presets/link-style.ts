import type { attributes } from '@joint/core';
import type { Nullable, LiteralUnion } from '../types';
import { resolveLinkMarker, type LinkMarker } from '../theme/named-link-markers';

/**
 * Visual/presentation attributes for a link line and its wrapper.
 * All properties are optional — empty strings let CSS variables from `theme.css` take over.
 * @group Graph
 */
export interface LinkStyle {
  /** Stroke color of the link line. Accepts any CSS color value including CSS variables. @default '' */
  color?: string;
  /** Stroke width of the link line. Accepts a number (px) or CSS value string. @default '' */
  width?: number | string;
  /** Source marker name or custom marker definition. Use `'none'` for no marker. @default 'none' */
  sourceMarker?: LinkMarker;
  /** Target marker name or custom marker definition. Use `'none'` for no marker. @default 'none' */
  targetMarker?: LinkMarker;
  /** CSS class name to apply to the link line. @default '' */
  className?: string;
  /** Stroke dash pattern (SVG `stroke-dasharray` syntax, e.g. `'5,5'`). @default '' */
  dasharray?: string;
  /** Stroke line cap for the link line. @default '' */
  linecap?: LiteralUnion<'butt' | 'round' | 'square'>;
  /** Stroke line join for the link line. @default '' */
  linejoin?: LiteralUnion<'miter' | 'round' | 'bevel'>;
  /** Stroke width of the link wrapper (hit area) in pixels. @default 10 */
  wrapperWidth?: number;
  /** Stroke color of the link wrapper (outline). @default 'transparent' */
  wrapperColor?: string;
  /** CSS class name to apply to the link wrapper (outline). @default '' */
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
 * Builds the `line` selector attrs from a LinkStyle.
 * Handles stroke, markers, dash patterns, and CSS class.
 * @param style
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
 * Builds the `wrapper` selector attrs from a LinkStyle.
 * Handles hit-area stroke, width, and CSS class.
 * @param style
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
 * Converts a `LinkStyle` into JointJS SVG `attrs` for `line` and `wrapper` selectors.
 * @param style
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

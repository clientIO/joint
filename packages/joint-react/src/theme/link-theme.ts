import type { LinkStyle } from '../types/data-types';

export type RequiredLinkStyle = Required<LinkStyle>;

/**
 * Internal fallback values for link line properties not set by data or defaults.
 * `color` and `width` default to `''`. Empty strings are no-ops on the DOM
 * inline style, letting CSS variables from theme.css take over.
 */
export const defaultLinkStyle: Readonly<RequiredLinkStyle> = {
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

/** A presentation key on Link, mapped to SVG attrs by buildLinkPresentationAttributes. */
export type LinkPresentationKey = keyof LinkStyle;

/**
 * Internal fallback values for label properties not set by labelStyle or individual labels.
 */
export const defaultLabelStyle = {
  color: '' as string,
  fontSize: '' as number | string,
  fontFamily: '' as string,
  backgroundColor: '' as string,
  backgroundOutline: '' as string,
  backgroundOutlineWidth: '' as number | string,
  backgroundBorderRadius: 4,
  backgroundPadding: { x: 4, y: 2 } as { readonly x: number; readonly y: number },
  position: 0.5,
  className: '',
  backgroundClassName: '',
} as const;

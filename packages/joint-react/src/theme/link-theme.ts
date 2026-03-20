import type { LinkMarkerName } from './markers';

/**
 * Internal fallback values for link line properties not set by data or defaults.
 * `color` and `width` default to `''`. Empty strings are no-ops on the DOM
 * inline style, letting CSS variables from theme.css take over.
 */
export const defaultLinkStyle = {
  color: '' as string,
  width: '' as number | string,
  sourceMarker: 'none' as LinkMarkerName,
  targetMarker: 'none' as LinkMarkerName,
  wrapperWidth: 10,
  wrapperColor: 'transparent',
  wrapperClassName: '',
  className: '',
  pattern: '',
  lineCap: '' as '' | 'butt' | 'round' | 'square',
  lineJoin: '' as '' | 'miter' | 'round' | 'bevel',
} as const;

/**
 * Internal fallback values for label properties not set by labelStyle or individual labels.
 */
export const defaultLabelStyle = {
  color: '' as string,
  fontSize: '' as number | string,
  fontFamily: '' as string,
  backgroundColor: '' as string,
  backgroundStroke: '' as string,
  backgroundStrokeWidth: '' as number | string,
  backgroundBorderRadius: 4,
  backgroundPadding: { x: 4, y: 2 } as { readonly x: number; readonly y: number },
  position: 0.5,
  className: '',
  backgroundClassName: '',
} as const;

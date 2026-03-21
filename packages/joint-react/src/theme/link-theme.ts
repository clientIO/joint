import type { LinkMarkerName } from './markers';

/**
 * Internal fallback values for link line properties not set by data or defaults.
 * `color` and `width` default to `''`. Empty strings are no-ops on the DOM
 * inline style, letting CSS variables from theme.css take over.
 */
export const defaultLinkStyle = {
  color: '' as string, // Accepts any CSS color (e.g., "#333", "var(--my-color)")
  width: '' as number | string, // Accepts px number or CSS value (e.g., "var(--my-width)")
  sourceMarker: 'none' as LinkMarkerName, // Marker name, definition, or JSX
  targetMarker: 'none' as LinkMarkerName, // Marker name, definition, or JSX
  wrapperWidth: 10, // Hit-area stroke width in px
  wrapperColor: 'transparent', // Hit-area stroke color
  wrapperClassName: '', // CSS class applied to the link wrapper
  className: '', // CSS class applied to the link line
  dasharray: '', // Accepts SVG stroke-dasharray (e.g., "5,5")
  linecap: '' as '' | 'butt' | 'round' | 'square', // Accepts SVG stroke-linecap
  linejoin: '' as '' | 'miter' | 'round' | 'bevel', // Accepts SVG stroke-linejoin
} as const;

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

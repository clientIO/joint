import type { MarkerPreset } from './markers';

// Re-export markers for backward compatibility (public API)
export { defaultMarkers, resolveMarker, type MarkerPreset } from './markers';

/**
 * Default link theme with structural (non-color) properties.
 * Color/width defaults are handled by CSS variables in theme.css.
 */
export const defaultLinkTheme = {
  sourceMarker: 'none' as MarkerPreset,
  targetMarker: 'none' as MarkerPreset,
  wrapperBuffer: 8,
  wrapperColor: 'transparent',
  wrapperClassName: '',
  className: '',
  strokeDashArray: '',
  lineCap: '' as '' | 'butt' | 'round' | 'square',
  lineJoin: '' as '' | 'miter' | 'round' | 'bevel',
  labelBackgroundBorderRadius: 4,
  labelBackgroundPadding: { x: 4, y: 2 } as { readonly x: number; readonly y: number },
  labelPosition: 0.5,
} as const;

export type LinkTheme = typeof defaultLinkTheme;

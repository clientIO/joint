import type { LinkMarkerPreset } from './markers';

// Re-export markers for backward compatibility (public API)
export { markerPresets as defaultMarkers, resolveMarker, type LinkMarkerPreset as MarkerPreset } from './markers';

/**
 * Default link theme with all properties filled.
 * No fallbacks needed in the default link mapper.
 *
 */
export const defaultLinkTheme = {
  color: '#333333',
  width: 2,
  sourceMarker: 'none' as LinkMarkerPreset,
  targetMarker: 'none' as LinkMarkerPreset,
  wrapperBuffer: 8,
  wrapperColor: 'transparent',
  wrapperClassName: '',
  className: '',
  pattern: '',
  lineCap: '' as '' | 'butt' | 'round' | 'square',
  lineJoin: '' as '' | 'miter' | 'round' | 'bevel',
  labelColor: '#333333',
  labelFontSize: 12,
  labelFontFamily: 'sans-serif',
  labelBackgroundColor: 'var(--jj-color-bg)',
  labelBackgroundStroke: '#333333',
  labelBackgroundStrokeWidth: 1,
  labelBackgroundBorderRadius: 4,
  labelBackgroundPadding: { x: 4, y: 2 } as { readonly x: number; readonly y: number },
  labelPosition: 0.5,
} as const;

export type LinkTheme = typeof defaultLinkTheme;

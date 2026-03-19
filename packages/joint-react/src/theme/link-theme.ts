import type { LinkMarkerPreset } from './markers';

/**
 * Internal fallback values for link line properties not set by data or defaults.
 */
export const defaultLinkStyle = {
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
} as const;

/**
 * Internal fallback values for label properties not set by labelStyle or individual labels.
 */
export const defaultLabelStyle = {
  color: '#333333',
  fontSize: 12,
  fontFamily: 'sans-serif',
  backgroundColor: '#ffffff',
  backgroundStroke: '#333333',
  backgroundStrokeWidth: 1,
  backgroundBorderRadius: 4,
  backgroundPadding: { x: 4, y: 2 } as { readonly x: number; readonly y: number },
  position: 0.5,
} as const;

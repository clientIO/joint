import type { LinkMarkerPreset } from './markers';

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
  labelBackgroundColor: '#ffffff',
  labelBackgroundStroke: '#333333',
  labelBackgroundStrokeWidth: 1,
  labelBackgroundBorderRadius: 4,
  labelBackgroundPadding: { x: 4, y: 2 } as { readonly x: number; readonly y: number },
  labelPosition: 0.5,
} as const;

/**
 * Widened type for link theme overrides.
 * Matches the shape of `defaultLinkTheme` but with non-literal types
 * so that users can pass arbitrary values (e.g. any color string).
 */
export interface LinkTheme {
  readonly color: string;
  readonly width: number;
  readonly sourceMarker: LinkMarkerPreset;
  readonly targetMarker: LinkMarkerPreset;
  readonly wrapperBuffer: number;
  readonly wrapperColor: string;
  readonly wrapperClassName: string;
  readonly className: string;
  readonly pattern: string;
  readonly lineCap: '' | 'butt' | 'round' | 'square';
  readonly lineJoin: '' | 'miter' | 'round' | 'bevel';
  readonly labelColor: string;
  readonly labelFontSize: number;
  readonly labelFontFamily: string;
  readonly labelBackgroundColor: string;
  readonly labelBackgroundStroke: string;
  readonly labelBackgroundStrokeWidth: number;
  readonly labelBackgroundBorderRadius: number;
  readonly labelBackgroundPadding: { readonly x: number; readonly y: number };
  readonly labelPosition: number;
}

import type { MarkerPreset } from './markers';

// Re-export markers for backward compatibility (public API)
export { defaultMarkers, resolveMarker, type MarkerPreset } from './markers';

/**
 * Default link theme with all properties filled.
 * No fallbacks needed in createDefaultLinkMapper.
 */
export const defaultLinkTheme = {
    color: '#333333',
    width: 2,
    sourceMarker: 'none' as MarkerPreset,
    targetMarker: 'none' as MarkerPreset,
    wrapperBuffer: 8,
    wrapperColor: 'transparent',
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

export type LinkTheme = typeof defaultLinkTheme;

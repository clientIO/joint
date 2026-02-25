import type { MarkerPreset } from './markers';

// Re-export markers for backward compatibility (public API)
export { defaultMarkers, resolveMarker, type MarkerPreset } from './markers';

/**
 * Default link theme with all properties filled.
 * No fallbacks needed in createDefaultLinkMapper.
 */
export const DEFAULT_LINK_THEME = {
    color: '#333333',
    width: 2,
    sourceMarker: 'none' as MarkerPreset,
    targetMarker: 'none' as MarkerPreset,
    wrapperBuffer: 8,
    className: '',
    pattern: '',
} as const;

export type LinkTheme = typeof DEFAULT_LINK_THEME;

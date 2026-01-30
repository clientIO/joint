import { util, type dia } from '@joint/core';

/**
 * Built-in marker presets for links.
 */
export const defaultMarkers = {
    none: null,
    arrow: {
        markup: util.svg`<path d="M 0 0 L 8 -4 V 4 z" fill="context-fill" stroke-width="2" />`,
    },
    'arrow-open': {
        markup: util.svg`<path d="M 10 3 L 0 0 L 10 -3" fill="none" stroke-width="2" />`,
    },
    circle: {
        markup: util.svg`<circle r="4" fill="context-fill" stroke-width="2" />`,
    },
    'circle-outline': {
        markup: util.svg`<circle r="4" fill="none" stroke-width="2" />`,
    },
    diamond: {
        markup: util.svg`<path d="M 0 0 L 5 -5 L 10 0 L 5 5 z" fill="context-fill" stroke-width="2" />`,
    },
    bar: {
        markup: util.svg`<path d="M 0 -5 V 5" stroke-width="2" />`,
    },
    cross: {
        markup: util.svg`<path d="M 3 -5 L 12 5 M 3 5 L 12 -5" stroke-width="2" />`,
    },
} as const satisfies Record<string, dia.SVGMarkerJSON | null>;

export type MarkerPreset = keyof typeof defaultMarkers;

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
} as const;

export type LinkTheme = typeof DEFAULT_LINK_THEME;

/**
 * Resolves a marker preset name or custom marker to a MarkerJSON.
 * @param marker - Marker preset name, custom marker, or null
 * @returns The resolved marker JSON or null
 */
export function resolveMarker(
    marker: MarkerPreset | dia.SVGMarkerJSON | null | undefined
): dia.SVGMarkerJSON | null {
    if (marker === null || marker === undefined || marker === 'none') return null;
    if (typeof marker === 'string') {
        return defaultMarkers[marker as keyof typeof defaultMarkers] ?? null;
    }
    return marker;
}

import { useMemo, useCallback } from 'react';
import { defaultMapDataToLinkAttributes } from '../state/data-mapping/link-mapper';
import { defaultLinkTheme, type LinkTheme } from '../theme/link-theme';
import type { GraphMappings } from '../state/data-mapping';
import type { FlatLinkData } from '../types/link-types';
import type { LinkToGraphOptions } from '../state/data-mapping/link-mapper';

/**
 * Returns a memoized `mapDataToLinkAttributes` function that uses
 * the default link mapper with a merged theme.
 * @param theme - Partial theme overrides; omitted properties use `defaultLinkTheme`.
 * @returns An object with `mapDataToLinkAttributes`, ready to spread into `GraphProvider` props.
 * @example
 * ```tsx
 * const { mapDataToLinkAttributes } = useThemeLinkMapper({
 *   color: '#0066cc',
 *   width: 3,
 *   targetMarker: 'arrow',
 * });
 *
 * <GraphProvider mapDataToLinkAttributes={mapDataToLinkAttributes} ... />
 * ```
 */
export function useThemeLinkMapper(
    theme?: Partial<LinkTheme>
): Pick<GraphMappings, 'mapDataToLinkAttributes'> {

    const mergedTheme = useMemo(
        () => (theme ? { ...defaultLinkTheme, ...theme } : defaultLinkTheme),
        // Serialize to stabilize across re-renders with inline objects.
        // Safe: LinkTheme is a flat object with primitives + one shallow { x, y }.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(theme)]
    );

    const mapDataToLinkAttributes = useCallback(
        (options: LinkToGraphOptions<FlatLinkData>) => {
            return defaultMapDataToLinkAttributes({
                id: options.id,
                data: options.data,
                theme: mergedTheme,
            });
        },
        [mergedTheme]
    );

    return useMemo(
        () => ({ mapDataToLinkAttributes }),
        [mapDataToLinkAttributes]
    );
}

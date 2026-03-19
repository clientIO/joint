import { useMemo, useCallback } from 'react';
import { defaultMapDataToElementAttributes } from '../state/data-mapping/element-mapper';
import { defaultElementTheme, type ElementTheme } from '../theme/element-theme';
import type { GraphMappings } from '../state/data-mapping';
import type { FlatElementData } from '../types/element-types';
import type { ElementToGraphOptions } from '../state/data-mapping/element-mapper';

/**
 * Returns a memoized `mapDataToElementAttributes` function that uses
 * the default element mapper with a merged theme.
 * @param theme - Partial theme overrides; omitted properties use `defaultElementTheme`.
 * @returns An object with `mapDataToElementAttributes`, ready to spread into `GraphProvider` props.
 * @example
 * ```tsx
 * const { mapDataToElementAttributes } = useThemeElementMapper({
 *   portColor: '#0066cc',
 *   portWidth: 12,
 *   portHeight: 12,
 * });
 *
 * <GraphProvider mapDataToElementAttributes={mapDataToElementAttributes} ... />
 * ```
 */
export function useThemeElementMapper(
    theme?: Partial<ElementTheme>
): Pick<GraphMappings, 'mapDataToElementAttributes'> {

    const mergedTheme = useMemo(
        () => (theme ? { ...defaultElementTheme, ...theme } : defaultElementTheme),
        // Serialize to stabilize across re-renders with inline objects.
        // Safe: ElementTheme is a flat object with only primitives.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(theme)]
    );

    const mapDataToElementAttributes = useCallback(
        (options: ElementToGraphOptions<FlatElementData>) => {
            return defaultMapDataToElementAttributes({
                id: options.id,
                data: options.data,
                theme: mergedTheme,
            });
        },
        [mergedTheme]
    );

    return useMemo(
        () => ({ mapDataToElementAttributes }),
        [mapDataToElementAttributes]
    );
}

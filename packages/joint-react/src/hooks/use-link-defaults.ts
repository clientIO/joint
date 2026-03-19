import { type DependencyList, useMemo, useCallback, useRef } from 'react';
import { defaultMapDataToLinkAttributes } from '../state/data-mapping/link-mapper';
import type { GraphMappings } from '../state/data-mapping';
import type { FlatLinkData } from '../types/link-types';
import type { LinkToGraphOptions } from '../state/data-mapping/link-mapper';

/**
 * Returns a memoized `mapDataToLinkAttributes` function that applies
 * defaults to link data before mapping to JointJS attributes.
 *
 * Accepts either a static defaults object or a callback that returns
 * per-link defaults based on the link data.
 * Label styling defaults are specified via `labelStyle` on the data;
 * line styling properties (`color`, `width`, etc.) are set directly.
 * @param defaults - Static defaults or a callback `(data) => defaults`.
 * @param deps - Optional dependency list. When provided, the mapper is recreated
 *   when any dependency changes (like `useEffect` deps). For the callback form
 *   this is the primary way to trigger re-processing of existing links.
 *   For the static form, value changes are detected automatically via serialization.
 * @returns An object with `mapDataToLinkAttributes`, ready to spread into `GraphProvider` props.
 * @example
 * ```tsx
 * // Static defaults
 * const { mapDataToLinkAttributes } = useLinkDefaults({
 *   color: '#0066cc',
 *   width: 3,
 *   targetMarker: 'arrow',
 *   labelStyle: { color: '#fff', fontSize: 11 },
 * });
 *
 * // Per-type defaults with deps
 * const { mapDataToLinkAttributes } = useLinkDefaults((data) => ({
 *   color,
 *   width: data.priority === 'high' ? 4 : 2,
 * }), [color]);
 * ```
 */
export function useLinkDefaults<T extends FlatLinkData = FlatLinkData>(
    defaults?: Partial<FlatLinkData> | ((data: T) => Partial<FlatLinkData>),
    deps?: DependencyList,
): Pick<GraphMappings<unknown, T>, 'mapDataToLinkAttributes'> {

    // Keep latest defaults in a ref so the callback form always reads
    // the current value without recreating the mapper.
    const defaultsRef = useRef(defaults);
    defaultsRef.current = defaults;

    // Determines when the mapper reference changes (triggers GraphProvider re-sync):
    // - With deps: changes when deps change
    // - Static without deps: changes when serialized value changes
    // - Callback without deps: stable (never changes, ref provides latest)
    const isCallback = typeof defaults === 'function';
    const autoKey = isCallback ? 'fn' : JSON.stringify(defaults);
    const serialized = useMemo(
        () => (deps ? JSON.stringify(deps) : autoKey),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        deps ?? [autoKey]
    );

    const mapDataToLinkAttributes = useCallback(
        (options: LinkToGraphOptions<T>) => {
            const { current } = defaultsRef;
            const resolved = typeof current === 'function'
                ? current(options.data)
                : current;

            if (!resolved) {
                return defaultMapDataToLinkAttributes({
                    id: options.id,
                    data: options.data,
                });
            }

            const mergedData = { ...resolved, ...options.data } as T;
            return defaultMapDataToLinkAttributes({
                id: options.id,
                data: mergedData,
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [serialized]
    );

    return useMemo(
        () => ({ mapDataToLinkAttributes }),
        [mapDataToLinkAttributes]
    );
}

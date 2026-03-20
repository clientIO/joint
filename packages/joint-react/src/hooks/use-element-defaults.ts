import { type DependencyList, useMemo, useCallback, useRef } from 'react';
import { flatMapDataToElementAttributes } from '../state/data-mapping/element-mapper';
import type { GraphMappings } from '../state/data-mapping';
import type { FlatElementData } from '../types/element-types';
import type { ToElementAttributesOptions } from '../state/data-mapping/element-mapper';

/**
 * Returns a memoized `mapDataToElementAttributes` function that applies
 * defaults to element data before mapping to JointJS attributes.
 *
 * Accepts either a static defaults object or a callback that returns
 * per-element defaults based on the element data (e.g. by type).
 * Port styling defaults are specified via `portDefaults` on the data;
 * all other keys are merged under the element data.
 * @param defaults - Static defaults or a callback `(data) => defaults`.
 * @param deps - Optional dependency list. When provided, the mapper is recreated
 *   when any dependency changes (like `useEffect` deps). For the callback form
 *   this is the primary way to trigger re-processing of existing elements.
 *   For the static form, value changes are detected automatically via serialization.
 * @returns An object with `mapDataToElementAttributes`, ready to spread into `GraphProvider` props.
 * @example
 * ```tsx
 * // Static defaults
 * const { mapDataToElementAttributes } = useElementDefaults({
 *   portDefaults: { color: '#0066cc', width: 12 },
 * });
 *
 * // Per-type defaults with ports and deps
 * const { mapDataToElementAttributes } = useElementDefaults((data) => ({
 *   portDefaults: { color },
 *   ports: data.type === 'process'
 *     ? { in: { cx: 0, cy: 'calc(0.5*h)' }, out: { cx: 'calc(w)', cy: 'calc(0.5*h)' } }
 *     : { out: { cx: 'calc(w)', cy: 'calc(0.5*h)' } },
 * }), [color]);
 * ```
 */
export function useElementDefaults<T extends FlatElementData = FlatElementData>(
    defaults?: Partial<FlatElementData> | ((data: T) => Partial<FlatElementData>),
    deps?: DependencyList,
): Pick<GraphMappings<T>, 'mapDataToElementAttributes'> {

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

    const mapDataToElementAttributes = useCallback(
        (options: ToElementAttributesOptions<T>) => {
            const { current } = defaultsRef;
            const resolved = typeof current === 'function'
                ? current(options.data)
                : current;

            if (!resolved) {
                return flatMapDataToElementAttributes({
                    id: options.id,
                    data: options.data,
                });
            }

            const mergedData = { ...resolved, ...options.data } as T;
            const result = flatMapDataToElementAttributes({
                id: options.id,
                data: mergedData,
            });

            // Strip default-provided keys from cell.data so they don't
            // pollute React state on round-trip (e.g. after element move).
            if (result.data) {
                const cellData = result.data as Record<string, unknown>;
                const userData = options.data as Record<string, unknown>;
                for (const key of Object.keys(resolved)) {
                    if (!(key in userData)) {
                        delete cellData[key];
                    }
                }
            }
            return result;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [serialized]
    );

    return useMemo(
        () => ({ mapDataToElementAttributes }),
        [mapDataToElementAttributes]
    );
}

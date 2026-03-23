import { type DependencyList, useMemo, useCallback, useRef } from 'react';
import { type dia } from '@joint/core';
import { flatLinkDataToAttributes, flatAttributesToLinkData } from '../state/data-mapping/link-mapper';
import type { GraphMappings, CellAttributes } from '../state/data-mapping';
import type { FlatLinkData } from '../types/data-types';
import type { ToLinkAttributesOptions, ToLinkDataOptions } from '../state/data-mapping/link-mapper';
import type { CellId } from '../types/cell-id';

/**
 * Returns memoized `mapDataToLinkAttributes` and `mapLinkAttributesToData`
 * functions with support for defaults, post-processing hooks, and key filtering.
 *
 * @param options - Configuration object.
 * @param options.defaults - Static defaults or a callback `(data, id) => defaults`.
 *   Merged as `{ ...resolvedDefaults, ...data }` before flat mapping.
 *   Keys added by defaults are auto-stripped from `result.data`.
 * @param options.mapAttributes - Post-process: modify attributes after flat mapping (forward only).
 *   Receives attributes, original data, and graph.
 * @param options.mapData - Post-process: modify data after flat reverse mapping (reverse only).
 *   Receives data, original attributes, and graph.
 * @param options.pick - Whitelist of keys to keep in reverse-mapped data.
 * @param deps - Optional dependency list. When provided, the mappers are recreated
 *   when any dependency changes (like `useEffect` deps).
 * @returns An object with `mapDataToLinkAttributes` and `mapLinkAttributesToData`,
 *   ready to spread into `GraphProvider` props.
 * @example
 * ```tsx
 * const { mapDataToLinkAttributes, mapLinkAttributesToData } = useFlatLinkData<MyLinkData>({
 *   defaults: { targetMarker: 'arrow', color: '#333' },
 *   pick: ['label'],
 * }, []);
 * ```
 */
export function useFlatLinkData<T extends FlatLinkData = FlatLinkData>(
    options: {
        defaults?: Partial<FlatLinkData> | ((data: T, id: CellId) => Partial<FlatLinkData>);
        mapAttributes?: (options: { attributes: CellAttributes; data: T; graph: dia.Graph }) => CellAttributes;
        mapData?: (options: { data: T; attributes: dia.Link.Attributes; graph: dia.Graph }) => T;
        pick?: (keyof T)[];
    } = {},
    deps?: DependencyList,
): Pick<GraphMappings<unknown, T>, 'mapDataToLinkAttributes' | 'mapLinkAttributesToData'> {

    const { defaults, mapAttributes, mapData, pick } = options;

    // Keep latest values in refs so the callback form always reads
    // the current value without recreating the mapper.
    const defaultsRef = useRef(defaults);
    defaultsRef.current = defaults;

    const mapAttributesRef = useRef(mapAttributes);
    mapAttributesRef.current = mapAttributes;

    const mapDataRef = useRef(mapData);
    mapDataRef.current = mapData;

    const pickRef = useRef(pick);
    pickRef.current = pick;

    // Determines when the mapper reference changes (triggers GraphProvider re-sync):
    // - With deps: changes when deps change
    // - Static without deps: changes when serialized value changes
    // - Callback without deps: stable (never changes, ref provides latest)
    const isCallback = typeof defaults === 'function';
    const autoKey = isCallback ? 'fn' : JSON.stringify(options);
    const serialized = useMemo(
        () => (deps ? JSON.stringify(deps) : autoKey),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        deps ?? [autoKey]
    );

    const mapDataToLinkAttributes = useCallback(
        (mapOptions: ToLinkAttributesOptions<T>) => {
            const { current } = defaultsRef;
            const resolved = typeof current === 'function'
                ? current(mapOptions.data, mapOptions.id)
                : current;

            let result: CellAttributes;
            if (!resolved) {
                result = flatLinkDataToAttributes(mapOptions.data);
            } else {
                const mergedData = { ...resolved, ...mapOptions.data } as T;
                result = flatLinkDataToAttributes(mergedData);

                // Strip default-provided keys from cell.data so they don't
                // pollute React state on round-trip (e.g. after link reconnect).
                if (result.data) {
                    const cellData = result.data as Record<string, unknown>;
                    const userData = mapOptions.data as Record<string, unknown>;
                    for (const key of Object.keys(resolved)) {
                        if (!(key in userData)) {
                            delete cellData[key];
                        }
                    }
                }
            }

            // Post-process with mapAttributes if provided
            const mapAttrFn = mapAttributesRef.current;
            if (mapAttrFn) {
                result = mapAttrFn({
                    attributes: result,
                    data: mapOptions.data,
                    graph: mapOptions.graph,
                });
            }

            return result;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [serialized]
    );

    const mapLinkAttributesToData = useCallback(
        (mapOptions: ToLinkDataOptions<T>) => {
            let data = flatAttributesToLinkData(mapOptions.attributes) as T;

            // Post-process with mapData if provided
            const mapDataFn = mapDataRef.current;
            if (mapDataFn) {
                data = mapDataFn({
                    data,
                    attributes: mapOptions.attributes,
                    graph: mapOptions.graph,
                });
            }

            const keys = pickRef.current;
            if (keys) {
                const picked = {} as Record<string, unknown>;
                const src = data as Record<string, unknown>;
                for (const key of keys) {
                    if ((key as string) in src) {
                        picked[key as string] = src[key as string];
                    }
                }
                data = picked as T;
            }
            return data;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [serialized]
    );

    return useMemo(
        () => ({ mapDataToLinkAttributes, mapLinkAttributesToData }),
        [mapDataToLinkAttributes, mapLinkAttributesToData]
    );
}

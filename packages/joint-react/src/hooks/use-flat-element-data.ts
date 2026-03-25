import { type DependencyList, useMemo, useCallback, useRef } from 'react';
import { type dia } from '@joint/core';
import { flatElementDataToAttributes, flatAttributesToElementData } from '../state/data-mapping/element-mapper';
import type { GraphMappings, CellAttributes } from '../state/data-mapping';
import type { FlatElementData } from '../types/data-types';
import type { ToElementAttributesOptions, ToElementDataOptions } from '../state/data-mapping/element-mapper';
import type { CellId } from '../types/cell-id';

/**
 * Returns memoized `mapDataToElementAttributes` and `mapElementAttributesToData`
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
 *   Properties that can change via JointJS interactions (resize, drag) must be
 *   included in `pick` to survive round-trip.
 * @param deps - Optional dependency list. When provided, the mappers are recreated
 *   when any dependency changes (like `useEffect` deps).
 * @returns An object with `mapDataToElementAttributes` and `mapElementAttributesToData`,
 *   ready to spread into `GraphProvider` props.
 * @example
 * ```tsx
 * const { mapDataToElementAttributes, mapElementAttributesToData } = useFlatElementData<MyData>({
 *   defaults: { width: 100, height: 100, color: 'blue' },
 *   pick: ['label', 'type'],
 * }, []);
 * ```
 */
export function useFlatElementData<T extends FlatElementData = FlatElementData>(
    options: {
        defaults?: Partial<FlatElementData> | ((data: T, id: CellId) => Partial<FlatElementData>);
        mapAttributes?: (options: { attributes: CellAttributes; data: T; graph: dia.Graph }) => CellAttributes;
        mapData?: (options: { data: T; attributes: dia.Element.Attributes; graph: dia.Graph }) => T;
        pick?: (keyof T)[];
    } = {},
    deps?: DependencyList,
): Pick<GraphMappings<T>, 'mapDataToElementAttributes' | 'mapElementAttributesToData'> {

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

    const mapDataToElementAttributes = useCallback(
        (mapOptions: ToElementAttributesOptions<T>) => {
            const { current } = defaultsRef;
            const resolved = typeof current === 'function'
                ? current(mapOptions.data, mapOptions.id)
                : current;

            let result: CellAttributes;
            if (!resolved) {
                result = flatElementDataToAttributes(mapOptions.data);
            } else {
                const mergedData = { ...resolved, ...mapOptions.data } as T;
                result = flatElementDataToAttributes(mergedData);

                // Strip default-provided keys from cell.data so they don't
                // pollute React state on round-trip (e.g. after element move).
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

    const mapElementAttributesToData = useCallback(
        (mapOptions: ToElementDataOptions<T>) => {
            let data = flatAttributesToElementData(mapOptions.attributes) as T;

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
        () => ({ mapDataToElementAttributes, mapElementAttributesToData }),
        [mapDataToElementAttributes, mapElementAttributesToData]
    );
}

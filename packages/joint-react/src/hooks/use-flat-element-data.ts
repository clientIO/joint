import { type DependencyList, useMemo } from 'react';
import { type dia } from '@joint/core';
import {
  flatElementDataToAttributes,
  flatAttributesToElementData,
} from '../state/data-mapping/element-mapper';
import type { GraphMappings, CellAttributes } from '../state/data-mapping';
import type { CellData, FlatElementData } from '../types/data-types';
import type {
  ToElementAttributesOptions,
  ToElementDataOptions,
} from '../state/data-mapping/element-mapper';
import type { CellId } from '../types/cell-id';

interface Options<Data extends object = CellData> {
  readonly defaults?:
    | Partial<FlatElementData<Data>>
    | ((data: FlatElementData<Data>, id: CellId) => Partial<FlatElementData<Data>>);
  readonly mapAttributes?: (options: {
    readonly attributes: CellAttributes;
    readonly data: FlatElementData<Data>;
    readonly graph: dia.Graph;
  }) => CellAttributes;
  readonly mapData?: (options: {
    readonly data: FlatElementData<Data>;
    readonly attributes: dia.Element.Attributes;
    readonly graph: dia.Graph;
  }) => FlatElementData<Data>;
  readonly pick?: Array<keyof Data>;
}

/**
 * Returns memoized `mapDataToElementAttributes` and `mapElementAttributesToData`
 * functions with support for defaults, post-processing hooks, and key filtering.
 *
 * Uses a single `useMemo` with an explicit `deps` array to control when mappers
 * are recreated. No refs, no JSON.stringify — standard React memoization.
 *
 * @param options - Configuration object.
 * @param deps - Dependency list controlling when mappers are recreated.
 *   Defaults to `[]` (stable forever). Provide reactive values that the
 *   mappers close over (like `useEffect` / `useMemo` deps).
 * @returns An object with `mapDataToElementAttributes` and `mapElementAttributesToData`,
 *   ready to spread into `GraphProvider` props.
 * @example
 * ```tsx
 * // Static defaults — stable forever
 * const mappers = useFlatElementData({ defaults: { width: 100, height: 100 } });
 *
 * // Dynamic defaults — recreated when `color` changes
 * const mappers = useFlatElementData({ defaults: { color } }, [color]);
 * ```
 */
export function useFlatElementData<Data extends object = CellData>(
  options: Options<Data> = {},
  deps: DependencyList = [],
): Pick<
  GraphMappings<FlatElementData<Data>>,
  'mapDataToElementAttributes' | 'mapElementAttributesToData'
> {
  return useMemo(() => {
    const { defaults, mapAttributes, mapData, pick } = options;

    const mapDataToElementAttributes = (
      mapOptions: ToElementAttributesOptions<FlatElementData<Data>>,
    ): CellAttributes => {
      const resolved =
        typeof defaults === 'function' ? defaults(mapOptions.data, mapOptions.id) : defaults;

      let result: CellAttributes;
      if (resolved) {
        const mergedData = { ...resolved, ...mapOptions.data };
        result = flatElementDataToAttributes(mergedData);

        // Strip default-provided keys from cell.data so they don't
        // pollute React state on round-trip (e.g. after element move).
        if (result.data) {
          const cellData = result.data;
          const userData = mapOptions.data;
          for (const key of Object.keys(resolved)) {
            if (!(key in userData)) {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete cellData[key];
            }
          }
        }
      } else {
        result = flatElementDataToAttributes(mapOptions.data);
      }

      if (mapAttributes) {
        result = mapAttributes({
          attributes: result,
          data: mapOptions.data,
          graph: mapOptions.graph,
        });
      }

      return result;
    };

    const mapElementAttributesToData = (
      mapOptions: ToElementDataOptions<FlatElementData<Data>>,
    ): Partial<FlatElementData<Data>> => {
      let data = flatAttributesToElementData<Data>(mapOptions.attributes);

      if (mapData) {
        data = mapData({
          data,
          attributes: mapOptions.attributes,
          graph: mapOptions.graph,
        });
      }

      if (!pick) {
        return data;
      }

      const picked: Record<string, unknown> = {};
      for (const key of pick) {
        if (key in data) {
          picked[String(key)] = data[String(key)];
        }
      }
      return picked;
    };

    return { mapDataToElementAttributes, mapElementAttributesToData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

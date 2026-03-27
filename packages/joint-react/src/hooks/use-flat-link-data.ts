import { type DependencyList, useMemo } from 'react';
import { type dia } from '@joint/core';
import {
  flatLinkDataToAttributes,
  flatAttributesToLinkData,
} from '../state/data-mapping/link-mapper';
import type { GraphMappings, CellAttributes } from '../state/data-mapping';
import type { FlatLinkData } from '../types/data-types';
import type { CellData } from '../types/cell-data';
import type { ToLinkAttributesOptions, ToLinkDataOptions } from '../state/data-mapping/link-mapper';
import type { CellId } from '../types/cell-id';

interface Options<Data extends object = CellData> {
  readonly defaults?:
    | Partial<FlatLinkData<Data>>
    | ((data: FlatLinkData<Data>, id: CellId) => Partial<FlatLinkData<Data>>);
  readonly mapAttributes?: (options: {
    readonly attributes: CellAttributes;
    readonly data: FlatLinkData<Data>;
    readonly graph: dia.Graph;
  }) => CellAttributes;
  readonly mapData?: (options: {
    readonly data: FlatLinkData<Data>;
    readonly attributes: dia.Link.Attributes;
    readonly graph: dia.Graph;
  }) => FlatLinkData<Data>;
  readonly pick?: Array<keyof FlatLinkData<Data>>;
}

/**
 * Returns memoized `mapDataToLinkAttributes` and `mapLinkAttributesToData`
 * functions with support for defaults, post-processing hooks, and key filtering.
 *
 * Uses a single `useMemo` with an explicit `deps` array to control when mappers
 * are recreated. No refs, no JSON.stringify — standard React memoization.
 *
 * @param options - Configuration object.
 * @param deps - Dependency list controlling when mappers are recreated.
 *   Defaults to `[]` (stable forever). Provide reactive values that the
 *   mappers close over (like `useEffect` / `useMemo` deps).
 * @returns An object with `mapDataToLinkAttributes` and `mapLinkAttributesToData`,
 *   ready to spread into `GraphProvider` props.
 * @example
 * ```tsx
 * // Static defaults — stable forever
 * const mappers = useFlatLinkData({ defaults: { targetMarker: 'arrow', color: '#333' } });
 *
 * // Dynamic defaults — recreated when `color` changes
 * const mappers = useFlatLinkData({ defaults: { color } }, [color]);
 * ```
 */
export function useFlatLinkData<Data extends object = CellData>(
  options: Options<Data> = {},
  deps: DependencyList = []
): Pick<
  GraphMappings<CellData, FlatLinkData<Data>>,
  'mapDataToLinkAttributes' | 'mapLinkAttributesToData'
> {
  return useMemo(() => {
    const { defaults, mapAttributes, mapData, pick } = options;

    const mapDataToLinkAttributes = (
      mapOptions: ToLinkAttributesOptions<FlatLinkData<Data>>
    ): CellAttributes => {
      const resolved =
        typeof defaults === 'function' ? defaults(mapOptions.data, mapOptions.id) : defaults;

      let result: CellAttributes;
      if (resolved) {
        const mergedData = { ...resolved, ...mapOptions.data };
        result = flatLinkDataToAttributes(mergedData);

        // Strip default-provided keys from cell.data so they don't
        // pollute React state on round-trip (e.g. after link reconnect).
        if (result.data) {
          const cellData = result.data;
          const userData = mapOptions.data;
          for (const key of Object.keys(resolved)) {
            if (!(key in userData)) {
              Reflect.deleteProperty(cellData, key);
            }
          }
        }
      } else {
        result = flatLinkDataToAttributes(mapOptions.data);
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

    const mapLinkAttributesToData = (
      mapOptions: ToLinkDataOptions<FlatLinkData<Data>>
    ): Partial<FlatLinkData<Data>> => {
      let data = flatAttributesToLinkData<Data>(mapOptions.attributes);

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

    return { mapDataToLinkAttributes, mapLinkAttributesToData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

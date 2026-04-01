import { type DependencyList, useMemo } from 'react';
import { buildAttributesFromLink } from '../state/data-mapping/link-mapper';
import type { CellAttributes, MapLinkToAttributes } from '../state/data-mapping';
import type { LinkRecord } from '../types/data-types';
import type { CellId } from '../types/cell-id';

export function useLinkDefaults<Data extends object = Record<string, unknown>>(
  defaults:
    | Partial<LinkRecord<Data>>
    | ((options: { link: LinkRecord<Data>; id?: CellId }) => Partial<LinkRecord<Data>>),
  deps: DependencyList = []
) {
  return useMemo(
    (): {
      mapLinkToAttributes: MapLinkToAttributes<Data>;
    } => {
      return {
        mapLinkToAttributes: (mapOptions) => {
          const resolved = typeof defaults === 'function' ? defaults(mapOptions) : defaults;

          let result: CellAttributes;
          if (resolved) {
            const mergedData = { ...resolved, ...mapOptions.link } as LinkRecord<Data>;
            result = buildAttributesFromLink(mergedData);
            result.id = mapOptions.id;

            // Strip default-provided keys from cell.data so they don't
            // pollute React state on round-trip (e.g. after link reconnect).
            if (result.data) {
              const cellData = result.data;
              const userData = mapOptions.link;
              for (const key of Object.keys(resolved)) {
                if (!(key in userData)) {
                  Reflect.deleteProperty(cellData, key);
                }
              }
            }
          } else {
            result = buildAttributesFromLink(mapOptions.link);
            result.id = mapOptions.id;
          }

          return result;
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
}

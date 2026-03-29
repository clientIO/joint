import { type DependencyList, useMemo } from 'react';
import { linkToAttributes } from '../state/data-mapping/link-mapper';
import type { CellAttributes, MapLinkToAttributes } from '../state/data-mapping';
import type { AnyLinkRecord } from '../types/data-types';
import type { CellId } from '../types/cell-id';

export function useLinkDefaults<Data extends object = Record<string, unknown>>(
  defaults:
    | Partial<AnyLinkRecord<Data>>
    | ((options: { link: AnyLinkRecord<Data>; id?: CellId }) => Partial<AnyLinkRecord<Data>>),
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
            const mergedData = { ...resolved, ...mapOptions.link } as AnyLinkRecord<Data>;
            result = linkToAttributes({ link: mergedData, id: mapOptions.id });

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
            result = linkToAttributes({ link: mapOptions.link, id: mapOptions.id });
          }

          return result;
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
}

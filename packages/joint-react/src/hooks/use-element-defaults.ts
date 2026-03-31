import { type DependencyList, useMemo } from 'react';
import { elementToAttributes } from '../state/data-mapping/element-mapper';
import type { CellAttributes, MapElementToAttributes } from '../state/data-mapping';
import type { ElementRecord } from '../types/data-types';
import type { CellId } from '../types/cell-id';


export function useElementDefaults<Data extends object = Record<string, unknown>>(
  defaults:
    | Partial<ElementRecord<Data>>
    | ((options: { data: ElementRecord<Data>; id?: CellId }) => Partial<ElementRecord<Data>>),
  deps: DependencyList = []
) {
  return useMemo((): { mapElementToAttributes: MapElementToAttributes<Data> } => {
    return {
      mapElementToAttributes: (mapOptions) => {
        {
          const resolved =
            typeof defaults === 'function'
              ? defaults({
                  // @todo  - this should be `element` not `data`
                  data: mapOptions.element,
                  id: mapOptions.id,
                })
              : defaults;

          let result: CellAttributes;
          if (resolved) {
            const element = { ...resolved, ...mapOptions.element } as ElementRecord<Data>;
            result = elementToAttributes(element);
            result.id = mapOptions.id;

            // Strip default-provided keys from cell.data so they don't
            // pollute React state on round-trip (e.g. after element move).
            if (result.data) {
              const cellData = result.data;
              const userData = mapOptions.element;
              for (const key of Object.keys(resolved)) {
                if (!(key in userData)) {
                  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                  delete cellData[key];
                }
              }
            }
          } else {
            result = elementToAttributes(mapOptions);
          }

          return result;
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

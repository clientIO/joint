import { type DependencyList, useMemo } from 'react';
import { elementToAttributes } from '../state/data-mapping/element-mapper';
import type { CellAttributes, MapElementToAttributes } from '../state/data-mapping';
import type { Element } from '../types/data-types';
import type { CellId } from '../types/cell-id';

export function useElementDefaults<Data extends object | undefined = undefined>(
  defaults:
    | Partial<Element<Data>>
    | ((options: { data: Element<Data>; id?: CellId }) => Partial<Element<Data>>),
  deps: DependencyList = []
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `any` lets GraphProvider infer ElementData from `elements` prop without requiring an explicit type parameter on the hook.
  return useMemo((): { mapElementToAttributes: MapElementToAttributes<any> } => {
    return {
      mapElementToAttributes: (mapOptions) => {
        {
          const resolved =
            typeof defaults === 'function'
              ? defaults({
                  data: mapOptions.element,
                  id: mapOptions.id,
                })
              : defaults;

          let result: CellAttributes;
          if (resolved) {
            const element = { ...resolved, ...mapOptions.element } as Element<Data>;
            result = elementToAttributes({ id: mapOptions.id, element });

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

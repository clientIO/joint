import { type DependencyList, useMemo } from 'react';
import { buildAttributesFromElement } from '../state/data-mapping/element-mapper';
import type { MapElementToAttributes } from '../state/data-mapping';
import type { ElementRecord } from '../types/data-types';
import type { CellId } from '../types/cell-id';

export function useElementDefaults<Data extends object = Record<string, unknown>>(
  defaults:
    | Partial<ElementRecord<Data>>
    | ((options: { element: ElementRecord<Data>; id?: CellId }) => Partial<ElementRecord<Data>>),
  deps: DependencyList = []
) {
  return useMemo((): { mapElementToAttributes: MapElementToAttributes<Data> } => {
    return {
      mapElementToAttributes: (mapOptions) => {
        const resolvedDefaults =
          typeof defaults === 'function'
            ? defaults(mapOptions)
            : defaults;

        const merged = resolvedDefaults
          ? { ...resolvedDefaults, ...mapOptions.element } as ElementRecord<Data>
          : mapOptions.element;

        const attributes = buildAttributesFromElement(merged);
        attributes.id = mapOptions.id;

        // Track which keys came from defaults so the reverse mapper can omit them.
        if (resolvedDefaults) {
          attributes.metadata = { ...attributes.metadata, omit: Object.keys(resolvedDefaults) };
        }

        return attributes;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

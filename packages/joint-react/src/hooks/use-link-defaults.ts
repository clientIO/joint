import { type DependencyList, useMemo } from 'react';
import { buildAttributesFromLink } from '../state/data-mapping/link-mapper';
import type { MapLinkToAttributes } from '../state/data-mapping';
import type { LinkRecord } from '../types/data-types';
import type { CellId } from '../types/cell-id';

export function useLinkDefaults<Data extends object = Record<string, unknown>>(
  defaults:
    | Partial<LinkRecord<Data>>
    | ((options: { link: LinkRecord<Data>; id?: CellId }) => Partial<LinkRecord<Data>>),
  deps: DependencyList = []
) {
  return useMemo((): { mapLinkToAttributes: MapLinkToAttributes<Data> } => {
    return {
      mapLinkToAttributes: (mapOptions) => {
        const resolvedDefaults =
          typeof defaults === 'function'
            ? defaults(mapOptions)
            : defaults;

        const merged = resolvedDefaults
          ? { ...resolvedDefaults, ...mapOptions.link } as LinkRecord<Data>
          : mapOptions.link;

        const attributes = buildAttributesFromLink(merged);
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

import { useGraphStore } from './use-graph-store';
import { util } from '@joint/core';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { GraphLink, GraphLinkBase, GraphLinks } from '../types/link-types';

function defaultSelector<Link extends GraphLinkBase = GraphLink>(items: GraphLinks<Link>): Link[] {
  return items.map((item) => item) as Link[];
}
/**
 * A hook to access the graph store's links.
 *
 * This hook returns the selected links from the graph store. It accepts:
 *  - a selector function, which extracts the desired portion from the links map.
 *    (By default, it returns all links.)
 *  - an optional `isEqual` function, used to compare previous and new values to prevent unnecessary re-renders.
 *
 * How it works:
 * 1. The hook subscribes to the links of the graph store.
 * 2. It retrieves the links and then applies the selector.
 * 3. The `isEqual` comparator (defaulting to a deep comparison) checks if the selected value has really changed.
 *
 * @example
 * // Using without a selector (returns all links):
 * const links = useLinks();
 *
 * @example
 * // Using with a selector (extract part of the links data):
 * const linkIds = useLinks((links) => links.map(link => link.id));
 *
 * @example
 * // Using with a custom isEqual function:
 * const filteredLinks = useLinks(
 *   (links) => links,
 *   (prev, next) => prev.length === next.length
 * );
 *
 * @param {Function} selector The selector function to pick links. @default defaultLinksSelector
 * @param {Function=} isEqual The function to compare equality. @default util.isEqual
 * @returns {T} The selected links.
 */

export function useLinks<Link extends GraphLinkBase = GraphLink, SelectorReturnType = Link[]>(
  selector: (
    items: GraphLinks<Link>
  ) => SelectorReturnType = defaultSelector as () => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = util.isEqual
): SelectorReturnType {
  const { subscribe, getLinks } = useGraphStore();
  const typedGetLinks = getLinks as unknown as () => GraphLinks<Link>;
  const elements = useSyncExternalStoreWithSelector(
    subscribe,
    typedGetLinks,
    typedGetLinks,
    selector,
    isEqual
  );
  return elements;
}

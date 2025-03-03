import { useGraphStore } from './use-graph-store';
import { util } from '@joint/core';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { GraphLinks } from '../data/graph-links';

/**
 * A hook to access the graph store's links. This hook takes a selector function
 * as an argument. The selector is called with the store links.
 *
 * This hook takes an optional equality comparison function as the second parameter
 * that allows you to customize the way the selected links are compared to determine
 * whether the component needs to be re-rendered.
 *
 * @param {Function} selector The selector function to select links. @default defaultLinksSelector
 * @param {Function=} isEqual The function that will be used to determine equality. @default util.isEqual
 * @group Hooks
 *
 * @example
 *
 * import React from 'react'
 * import { useLinks } from './use-links'
 *
 * export const LinksComponent = () => {
 *   const links = useLinks(state => state.links)
 *   return <div>{links.length}</div>
 * }
 */
export function useLinks<Link = GraphLinks, ReturnedLinks = Link>(
  selector: (items: GraphLinks) => ReturnedLinks = (items) => items as unknown as ReturnedLinks,
  isEqual: (a: ReturnedLinks, b: ReturnedLinks) => boolean = util.isEqual
): ReturnedLinks {
  const { subscribe, getLinks } = useGraphStore();
  const elements = useSyncExternalStoreWithSelector(
    subscribe,
    getLinks,
    getLinks,
    selector,
    isEqual
  );
  return elements;
}

import { useGraphStore } from './use-graph-store'
import type { dia } from '@joint/core'
import type { BaseLink } from '../types/cell.types'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector'
import { defaultLinksSelector } from '../utils/cell/to-react-cell'
import { shallow } from '../utils/shallow'

/**
 * A hook to access the graph store's links. This hook takes a selector function
 * as an argument. The selector is called with the store links.
 *
 * This hook takes an optional equality comparison function as the second parameter
 * that allows you to customize the way the selected links are compared to determine
 * whether the component needs to be re-rendered.
 *
 * @param {Function} selector The selector function to select links.
 * @param {Function=} isEqual The function that will be used to determine equality.
 *
 * @returns {any} The selected links.
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
export function useLinks<T = BaseLink, R = T[]>(
  selector: (items: dia.Link[]) => R = defaultLinksSelector,
  isEqual: (a: R, b: R) => boolean = shallow
): R {
  const graphStore = useGraphStore()
  const elements = useSyncExternalStoreWithSelector(
    graphStore.subscribeToLinks,
    graphStore.getLinksSnapshot,
    graphStore.getLinksSnapshot,
    selector,
    isEqual
  )
  return elements
}

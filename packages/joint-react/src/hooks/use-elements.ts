import { useGraphStore } from './use-graph-store'
import { util, type dia } from '@joint/core'
import type { BaseElement } from '../types/cell.types'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector'
import { defaultElementsSelector } from '../utils/cell/to-react-cell'

/**
 * A hook to access the graph store's elements. This hook takes a selector function
 * as an argument. The selector is called with the store elements.
 *
 * This hook takes an optional equality comparison function as the second parameter
 * that allows you to customize the way the selected elements are compared to determine
 * whether the component needs to be re-rendered.
 *
 * @param {Function} selector The selector function to select elements. @default defaultElementsSelector
 * @param {Function=} isEqual The function that will be used to determine equality. @default util.isEqual
 *
 * @returns {any} The selected elements.
 *
 * @example
 *
 * import React from 'react'
 * import { useElements } from './use-elements'
 *
 * export const ElementsComponent = () => {
 *   const elements = useElements(state => state.elements)
 *   return <div>{elements.length}</div>
 * }
 */
export function useElements<T = BaseElement, R = T[]>(
  selector: (items: dia.Element[]) => R = defaultElementsSelector,
  isEqual: (a: R, b: R) => boolean = util.isEqual
): R {
  const { subscribeToElements, graph } = useGraphStore()
  const elements = useSyncExternalStoreWithSelector(
    subscribeToElements,
    () => graph.getElements(),
    () => graph.getElements(),
    selector,
    isEqual
  )
  return elements
}

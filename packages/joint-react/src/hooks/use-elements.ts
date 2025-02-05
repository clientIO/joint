import { useGraphStore } from './use-graph-store'
import type { dia } from '@joint/core'
import type { BaseElement } from '../types/cell.types'
import { useMemo, useSyncExternalStore } from 'react'
import { defaultElementSelector } from '../utils/cell/to-react-cell'

/**
 * Custom hook to manage the state of graph cells with optional item selector.
 * @param selector A function to select the properties of the cells.  @default BaseCell
 * @returns A tuple containing the cells in JSON format and a setter function for updating the cells.
 */
export function useElements<T = BaseElement>(
  selector: (item: dia.Cell) => T = defaultElementSelector
): T[] {
  const graphStore = useGraphStore()

  const elements = useSyncExternalStore(
    graphStore.subscribeToElements,
    graphStore.getElementsSnapshot,
    graphStore.getElementsSnapshot
  )

  return useMemo(() => elements.map((element) => selector(element)), [elements, selector])
}

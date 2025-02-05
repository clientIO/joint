import { useGraphStore } from './use-graph-store'
import type { dia } from '@joint/core'
import type { BaseCell, RequiredCell } from '../types/cell.types'
import { useMemo, useSyncExternalStore } from 'react'
import { defaultCellSelector } from '../utils/cell/to-react-cell'

/**
 * Custom hook to manage the state of graph cells with optional item selector.
 * @param selector A function to select the properties of the cells.  @default BaseCell
 * @returns A tuple containing the cells in JSON format and a setter function for updating the cells.
 */
export function useGraphCells<T extends RequiredCell = BaseCell>(
  selector: (item: dia.Cell) => T = defaultCellSelector
): T[] {
  const graphStore = useGraphStore()

  const cells = useSyncExternalStore(
    graphStore.subscribe,
    graphStore.getSnapshot,
    graphStore.getServerSnapshot
  )

  return useMemo(() => cells.map((cell) => selector(cell)), [cells, selector])
}

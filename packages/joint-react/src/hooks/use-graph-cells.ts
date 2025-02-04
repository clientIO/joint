import { useEffect, useState } from 'react'
import { useGraph } from './use-graph'
import type { dia } from '@joint/core'
import { listenToCellChange } from '../utils/cell/listen-to-cell-change'
import { toBaseCells } from '../utils/cell/to-react-cell'
import { BaseCell, RequiredCell } from '../types/cell.types'

/**
 * Custom hook to manage the state of graph cells.
 * @returns A tuple containing the cells in JSON format and a setter function for updating the cells.
 */
export function useGraphCells<T extends RequiredCell = BaseCell>(
  selector?: (item: dia.Cell) => T
): [T[]] {
  const graph = useGraph()

  const [cells, setCells] = useState(() => toBaseCells(graph.getCells(), selector))

  useEffect(() => {
    // There is a question if we want to make updates with graph.getCells()
    // or with the cell parameter and maybe with some event info - removed, change, add.
    const handleCellsChange = () => {
      setCells(toBaseCells(graph.getCells(), selector))
    }
    return listenToCellChange(graph, handleCellsChange)
  }, [graph])

  const cells1 = graph.getCells()
  const cells2 = graph.getCells()
  console.log('Is same reference', cells1 === cells2)
  return cells
}

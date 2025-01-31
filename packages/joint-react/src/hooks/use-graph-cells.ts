import type { Dispatch } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useGraph } from './use-graph'
import type { dia } from '@joint/core'
import { updateGraph } from '../utils/update-graph'
import { listenToCellChange } from '../utils/cell/listen-to-cell-change'
import { getCells } from '../utils/cell/get-cell'

/**
 * Custom hook to manage the state of graph cells.
 * @returns A tuple containing the cells in JSON format and a setter function for updating the cells.
 */
export function useGraphCells<
  K extends dia.Cell.Selectors = dia.Cell.Selectors,
  T extends dia.Cell.GenericAttributes<K> = dia.Cell.GenericAttributes<K>,
>(): [dia.Cell.JSON<K, T>[], Dispatch<React.SetStateAction<dia.Cell.JSON<K, T>[]>>] {
  const graph = useGraph()
  const [cells, setCells] = useState<dia.Cell.JSON<K, T>[]>(() => getCells(graph))

  useEffect(() => {
    const handleCellsChange = () => {
      setCells(getCells(graph))
    }
    return listenToCellChange(graph, handleCellsChange)
  }, [graph])

  return [
    cells,
    useCallback(
      (update: React.SetStateAction<dia.Cell.JSON<K, T>[]>) => {
        // This handles React dispatch way.
        // Example: setCells((previousCells) => previousCells.filter((cell) => cell.id !== '1'))
        if (typeof update === 'function') {
          setCells((previousCells) => {
            const newCells = update(previousCells)
            updateGraph(graph, newCells)
            return newCells
          })
          return
        }
        // This handles React set way.
        // Example: setCells([])
        updateGraph(graph, update)
      },
      [graph]
    ),
  ]
}

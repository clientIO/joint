import { useCallback } from 'react'
import { useGraphStore } from './use-graph-store'
import type { dia } from '@joint/core'
import { updateGraph } from '../utils/update-graph'

export type Item = dia.Cell | dia.Cell.JSON
export type CellsSetter = (oldCells: Array<dia.Cell>) => Array<Item>

export function useSetCells() {
  const { graph } = useGraphStore()
  return useCallback(
    (update: CellsSetter | Item[]) => {
      if (typeof update === 'function') {
        const oldCells = graph.getCells()
        const newCells = update(oldCells)
        updateGraph(graph, newCells)
        return
      }
      updateGraph(graph, update)
    },
    [graph]
  )
}

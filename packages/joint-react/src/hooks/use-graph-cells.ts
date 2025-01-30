import { useEffect, useState } from 'react'
import { useGraph } from './use-graph'
import type { dia } from '@joint/core'

function getCells<
  K extends dia.Cell.Selectors = dia.Cell.Selectors,
  T extends dia.Cell.GenericAttributes<K> = dia.Cell.GenericAttributes<K>,
>(graph: dia.Graph): dia.Cell.JSON<K, T>[] {
  return graph.getCells().map((cell) => cell.toJSON()) as dia.Cell.JSON<K, T>[]
}

export function useGraphCells<
  K extends dia.Cell.Selectors = dia.Cell.Selectors,
  T extends dia.Cell.GenericAttributes<K> = dia.Cell.GenericAttributes<K>,
>(): dia.Cell.JSON<K, T>[] {
  const graph = useGraph()
  const [cells, setCells] = useState<dia.Cell.JSON<K, T>[]>(() => getCells(graph))

  useEffect(() => {
    const handleCellsChange = () => {
      setCells(getCells(graph))
    }
    graph.on('all', handleCellsChange)
    return () => {
      graph.off('all')
    }
  }, [graph])

  return cells
}

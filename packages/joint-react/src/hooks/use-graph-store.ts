import { dia } from '@joint/core'
import { useEffect, useId, useRef, useState } from 'react'
import { ChangeEvent, listenToCellChange } from '../utils/cell/listen-to-cell-change'

interface Options {
  readonly graph?: dia.Graph
  readonly cellNamespace?: unknown
  readonly cellModel?: typeof dia.Cell
}

type GraphId = string
const CELLS = new Map<GraphId, dia.Cell[]>()
const EMPTY_ARRAY: dia.Cell[] = []

export interface GraphStore {
  readonly graph: dia.Graph
  readonly subscribe: (onStoreChange: () => void) => () => void
  readonly getSnapshot: () => dia.Cell[]
  readonly getServerSnapshot: () => dia.Cell[]
}

export function useGraphStore(options: Options): GraphStore {
  const { cellNamespace, cellModel } = options
  // this should be called just once

  const graphId: GraphId = useId()
  const [graph] = useState(() => {
    const newGraph = options.graph ?? new dia.Graph({}, { cellNamespace, cellModel })
    return newGraph
  })

  useEffect(() => {
    const handleCellsChange = (cell: dia.Cell, eventType: ChangeEvent) => {
      // update cells
      const cells = CELLS.get(graphId) ?? EMPTY_ARRAY
      switch (eventType) {
        case 'add':
          CELLS.set(graphId, [...cells, cell])
          break
        case 'remove':
          CELLS.set(
            graphId,
            cells.filter((c) => c !== cell)
          )
          break
        case 'change':
          CELLS.set(
            graphId,
            cells.map((c) => (c.id === cell.id ? cell : c))
          )
          break
      }
      // notify subscribers
      subscribers.current.forEach((subscriber) => {
        subscriber()
      })
    }
    return listenToCellChange(graph, handleCellsChange)
  }, [graph])

  const subscribers = useRef(new Set<() => void>())

  return {
    graph,
    subscribe: (onStoreChange: () => void) => {
      subscribers.current.add(onStoreChange)
      return () => {
        subscribers.current.delete(onStoreChange)
      }
    },
    getSnapshot: () => {
      return CELLS.get(graphId) ?? EMPTY_ARRAY
    },
    getServerSnapshot: () => {
      return graph.getCells()
    },
  }
}

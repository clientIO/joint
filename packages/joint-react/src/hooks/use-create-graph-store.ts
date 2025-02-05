/* eslint-disable sonarjs/redundant-type-aliases */
import { dia } from '@joint/core'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from '../utils/cell/listen-to-cell-change'
import { listenToCellChange } from '../utils/cell/listen-to-cell-change'

type GraphId = string
interface Options {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: dia.Graph
  /**
   * Namespace for cell models.
   * @default shapes
   * @see https://docs.jointjs.com/api/shapes
   */
  readonly cellNamespace?: unknown
  /**
   * Custom cell model to use.
   * @see https://docs.jointjs.com/api/dia/Cell
   */
  readonly cellModel?: typeof dia.Cell
  /**
   * Initial cells to be added to graph
   */
  readonly cells?: Array<dia.Cell | dia.Cell.JSON>
}

// Cached cells
const CELLS = new Map<GraphId, dia.Cell[]>()
const EMPTY_ARRAY: dia.Cell[] = []

export interface GraphStore {
  /**
   * The JointJS graph instance.
   */
  readonly graph: dia.Graph
  /**
   * Subscribes to the store changes.
   */
  readonly subscribe: (onStoreChange: () => void) => () => void
  /**
   * Get memoized / cached snapshot of the graph cells.
   */
  readonly getSnapshot: () => dia.Cell[]
  /**
   * Get the server snapshot of the graph cells.
   */
  readonly getServerSnapshot: () => dia.Cell[]
}

/**
 * Store for listen to cell changes and updates on the graph elements (nodes) and links (edges).
 * It use `useSyncExternalStore` to avoid memory leaks and cells (state) duplicates.
 */
export function useCreateGraphStore(options: Options): GraphStore {
  const { cellNamespace, cells, cellModel } = options

  // Generate a unique ID for the graph, use react `useId` hook
  const graphId: GraphId = useId()
  // Store subscribers
  const subscribers = useRef(new Set<() => void>())

  // initialize graph instance and save it in the store
  const [graph] = useState(() => {
    const newGraph = options.graph ?? new dia.Graph({}, { cellNamespace, cellModel })
    newGraph.id = graphId
    if (cells !== undefined) {
      graph.resetCells(cells)
    }
    CELLS.set(graphId, newGraph.getCells())
    return newGraph
  })

  const handleCellsChange = useCallback(
    (cell: dia.Cell, eventType: ChangeEvent) => {
      // update cells
      const oldCells = CELLS.get(graphId) ?? EMPTY_ARRAY
      switch (eventType) {
        case 'add': {
          CELLS.set(graphId, [...oldCells, cell])
          break
        }
        case 'remove': {
          CELLS.set(
            graphId,
            oldCells.filter((c) => c !== cell)
          )
          break
        }
        case 'change': {
          CELLS.set(
            graphId,
            oldCells.map((c) => (c.id === cell.id ? cell : c))
          )
          break
        }
      }
      // notify subscribers
      for (const subscriber of subscribers.current) {
        subscriber()
      }
    },
    [graphId]
  )

  // On-load effect
  useEffect(() => {
    const unsubscribe = listenToCellChange(graph, handleCellsChange)
    return () => {
      unsubscribe()
      CELLS.delete(graphId)
    }
  }, [graph, graphId, handleCellsChange])

  return useMemo(
    () => ({
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
        // This should be called just once.
        return graph.getCells()
      },
    }),
    [graph, graphId]
  )
}

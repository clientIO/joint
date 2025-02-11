/* eslint-disable camelcase */
/* eslint-disable sonarjs/redundant-type-aliases */
import { dia } from '@joint/core'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { listenToCellChange } from '../utils/cell/listen-to-cell-change'
import { unstable_batchedUpdates } from 'react-dom'
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
   * Initial elements to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly defaultElements?: Array<dia.Element>

  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly defaultLinks?: Array<dia.Link>
}

export interface GraphStore {
  /**
   * The JointJS graph instance.
   */
  readonly graph: dia.Graph
  /**
   * Subscribes to the store changes.
   */
  readonly subscribeToElements: (onStoreChange: () => void) => () => void
  readonly subscribeToLinks: (onStoreChange: () => void) => () => void
}

/**
 * Store for listen to cell changes and updates on the graph elements (nodes) and links (edges).
 * It use `useSyncExternalStore` to avoid memory leaks and cells (state) duplicates.
 */
export function useCreateGraphStore(options: Options): GraphStore {
  const { cellNamespace, defaultElements, defaultLinks, cellModel } = options

  // Generate a unique ID for the graph, use react `useId` hook
  const graphId: GraphId = useId()
  // Store subscribers
  const elementSubscribers = useRef(new Set<() => void>())
  const linkSubscribers = useRef(new Set<() => void>())

  // initialize graph instance and save it in the store
  const [graph] = useState(() => {
    const newGraph = options.graph ?? new dia.Graph({}, { cellNamespace, cellModel })
    newGraph.id = graphId
    if (defaultElements !== undefined) {
      newGraph.addCells(defaultElements)
    }
    if (defaultLinks !== undefined) {
      newGraph.addCells(defaultLinks)
    }

    return newGraph
  })

  const isScheduled = useRef(false)

  const notifySubscribers = useCallback((subscribers: Set<() => void>) => {
    if (!isScheduled.current) {
      isScheduled.current = true
      requestAnimationFrame(() => {
        unstable_batchedUpdates(() => {
          for (const subscriber of subscribers) {
            subscriber()
          }
        })
        isScheduled.current = false
      })
    }
  }, [])

  const handleCellsChange = useCallback(
    (cell: dia.Cell) => {
      if (cell.isElement()) {
        return notifySubscribers(elementSubscribers.current)
      }
      if (cell.isLink()) {
        return notifySubscribers(linkSubscribers.current)
      }
    },
    [notifySubscribers]
  )

  // On-load effect
  useEffect(() => {
    const unsubscribe = listenToCellChange(graph, handleCellsChange)
    return () => {
      unsubscribe()
    }
  }, [graph, graphId, handleCellsChange])

  return useMemo(
    () => ({
      graph,
      subscribeToElements: (onStoreChange: () => void) => {
        elementSubscribers.current.add(onStoreChange)
        return () => {
          elementSubscribers.current.delete(onStoreChange)
        }
      },
      subscribeToLinks: (onStoreChange: () => void) => {
        linkSubscribers.current.add(onStoreChange)
        return () => {
          linkSubscribers.current.delete(onStoreChange)
        }
      },
    }),
    [graph]
  )
}

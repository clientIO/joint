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
const ELEMENTS = new Map<GraphId, dia.Element[]>()
const LINKS = new Map<GraphId, dia.Link[]>()

const EMPTY_ELEMENTS: dia.Element[] = []
const EMPTY_LINKS: dia.Link[] = []

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
  /**
   * Get memoized / cached snapshot of the graph cells.
   */
  readonly getElementsSnapshot: () => dia.Element[]
  readonly getLinksSnapshot: () => dia.Link[]
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
  const elementSubscribers = useRef(new Set<() => void>())
  const linkSubscribers = useRef(new Set<() => void>())

  // initialize graph instance and save it in the store
  const [graph] = useState(() => {
    const newGraph = options.graph ?? new dia.Graph({}, { cellNamespace, cellModel })
    newGraph.id = graphId
    if (cells !== undefined) {
      graph.resetCells(cells)
    }
    ELEMENTS.set(graphId, newGraph.getElements())
    LINKS.set(graphId, newGraph.getLinks())
    return newGraph
  })

  const handleCellsChange = useCallback(
    (cell: dia.Cell, eventType: ChangeEvent) => {
      // update cells
      if (cell.isElement()) {
        const previousElements = ELEMENTS.get(graphId) ?? []
        switch (eventType) {
          case 'add': {
            ELEMENTS.set(graphId, [...previousElements, cell])
            break
          }
          case 'remove': {
            ELEMENTS.set(
              graphId,
              previousElements.filter((element) => element.id !== cell.id)
            )
            break
          }
          case 'change': {
            // we need to create new reference for the cell.
            const newCell = new dia.Element({ ...cell, ...cell.attributes })
            ELEMENTS.set(
              graphId,
              previousElements.map((element) => (element.id === cell.id ? newCell : element))
            )
            break
          }
        }

        // notify subscribers
        for (const subscriber of elementSubscribers.current) {
          subscriber()
        }
        return
      }

      if (cell.isLink()) {
        const previousLinks = LINKS.get(graphId) ?? []
        switch (eventType) {
          case 'add': {
            LINKS.set(graphId, [...previousLinks, cell])
            break
          }
          case 'remove': {
            LINKS.set(
              graphId,
              previousLinks.filter((link) => link.id !== cell.id)
            )
            break
          }
          case 'change': {
            // we need to create new reference for the cell.
            const newCell = new dia.Link({ ...cell, ...cell.attributes })
            LINKS.set(
              graphId,
              previousLinks.map((link) => (link.id === cell.id ? newCell : link))
            )
            break
          }
        }

        // notify subscribers
        for (const subscriber of linkSubscribers.current) {
          subscriber()
        }
      }
    },
    [graphId]
  )

  // On-load effect
  useEffect(() => {
    const unsubscribe = listenToCellChange(graph, handleCellsChange)
    return () => {
      unsubscribe()
      ELEMENTS.delete(graphId)
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
      getElementsSnapshot: () => {
        return ELEMENTS.get(graphId) ?? EMPTY_ELEMENTS
      },

      getLinksSnapshot: () => {
        return LINKS.get(graphId) ?? EMPTY_LINKS
      },
    }),
    [graph, graphId]
  )
}

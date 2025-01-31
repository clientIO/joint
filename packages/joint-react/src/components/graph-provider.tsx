import { useEffect, useState } from 'react'
import { isDiaCellsJSON, type Cell } from '../types/cell.types'
import { GraphContext } from '../context/graph-context'
import { dia, shapes } from '@joint/core'
import { updateGraph } from '../utils/update-graph'

export interface GraphProps<T extends dia.Cell.ID> {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: dia.Graph
  /**
   * Children to render.
   */
  readonly children: React.ReactNode
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
   * Cells to render - elements (nodes) or links (edges).
   * @see https://docs.jointjs.com/api/dia/Cell
   */
  readonly cells?: Array<Cell<T>>
  /**
   * Callback to handle cells change.
   * This handle events directly from the graph instance.
   * This event is not triggered when cells are changed via React state.
   */
  readonly onCellsChange?: (cells: Array<Cell<T>>) => void
}

/**
 * GraphProvider component creates a graph instance and provides it to its children via context.
 * It also handles updates to the graph when cells change via React state or JointJS events.
 */
export function GraphProvider<T extends dia.Cell.ID>(props: GraphProps<T>) {
  const { children, cellNamespace = shapes, cellModel, cells, onCellsChange } = props
  const [graphValue] = useState(() => {
    const graph = props.graph ?? new dia.Graph({}, { cellNamespace, cellModel })
    if (cells?.length && isDiaCellsJSON(cells)) {
      graph.addCells(cells)
    }
    return graph
  })

  // Update the graph when cells change via react state.
  useEffect(() => {
    if (cells?.length && isDiaCellsJSON(cells)) {
      updateGraph(graphValue, cells)
    } else {
      graphValue.clear()
    }

    if (!onCellsChange) {
      return
    }
    /**
     * Events handled by jointjs should be debounced to avoid performance issues.
     * TODO: We should talk about it, maybe use some trotting instead of debouncing.
     */
    const handleCellsChange = () => {
      onCellsChange(graphValue.getCells().map((cell) => cell.toJSON() as Cell<T>))
    }

    graphValue.on('all', handleCellsChange)
    return () => {
      graphValue.off('all')
    }
  }, [cells, graphValue, onCellsChange])

  // Handle cells change events via graph jointjs events.
  // useEffect(() => {

  // }, [eventDebounceMs, graphValue, onCellsChange])

  return <GraphContext.Provider value={graphValue}>{children}</GraphContext.Provider>
}

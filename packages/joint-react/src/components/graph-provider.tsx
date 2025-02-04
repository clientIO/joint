import { useId, useMemo, useState } from 'react'
import { GraphContext } from '../context/graph-context'
import { dia, shapes } from '@joint/core'

export interface GraphProps {
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
   * Callback to handle cells change.
   * This handle events directly from the graph instance.
   * This event is not triggered when cells are changed via React state.
   */
  readonly onCellsChange?: (cells: Array<dia.Cell>) => void
}

/**
 * GraphProvider component creates a graph instance and provides it to its children via context.
 * It also handles updates to the graph when cells change via React state or JointJS events.
 */
export function GraphProvider(props: GraphProps) {
  const { children, cellNamespace = shapes, cellModel, onCellsChange } = props

  const [graphValue] = useState(() => {
    const graph = props.graph ?? new dia.Graph({}, { cellNamespace, cellModel })
    return graph
  })

  return <GraphContext.Provider value={graphValue}>{children}</GraphContext.Provider>
}

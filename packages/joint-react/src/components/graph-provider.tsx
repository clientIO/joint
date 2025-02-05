import { GraphContext } from '../context/graph-context'
import type { dia } from '@joint/core'
import { useCreateGraphStore } from '../hooks/use-create-graph-store'

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
   * Initial cells to be added to graph
   */
  readonly cells?: Array<dia.Cell | dia.Cell.JSON>
}

/**
 * GraphProvider component creates a graph instance and provides it to its children via context.
 * It also handles updates to the graph when cells change via React state or JointJS events.
 */
export function GraphProvider(props: GraphProps) {
  const { children, ...rest } = props
  const graphStore = useCreateGraphStore(rest)

  return <GraphContext.Provider value={graphStore}>{children}</GraphContext.Provider>
}

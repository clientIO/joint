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
   * It's loaded just once, so it cannot be used as React state.
   * @default shapes
   * @see https://docs.jointjs.com/api/shapes
   */
  readonly cellNamespace?: unknown
  /**
   * Custom cell model to use.
   * It's loaded just once, so it cannot be used as React state.
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

/**
 * GraphProvider component creates a graph instance and provides it to its children via context.
 * It also handles updates to the graph when cells change via React state or JointJS events.
 */
export function GraphProvider(props: GraphProps) {
  const { children, ...rest } = props
  const graphStore = useCreateGraphStore(rest)

  return <GraphContext.Provider value={graphStore}>{children}</GraphContext.Provider>
}

import { GraphStoreContext } from '../context/graph-store-context';
import { type dia } from '@joint/core';
import { useCreateGraphStore } from '../hooks/use-create-graph-store';
import type { BaseElement, BaseLink } from '../types/cell.types';

export interface GraphProps {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: dia.Graph;
  /**
   * Children to render.
   */
  readonly children?: React.ReactNode;
  /**
   * Namespace for cell models.
   * It's loaded just once, so it cannot be used as React state.
   * @default shapes + ReactElement
   * @see https://docs.jointjs.com/api/shapes
   */
  readonly cellNamespace?: unknown;
  /**
   * Custom cell model to use.
   * It's loaded just once, so it cannot be used as React state.
   * @see https://docs.jointjs.com/api/dia/Cell
   */
  readonly cellModel?: typeof dia.Cell;
  /**
   * Initial elements to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly defaultElements?: (dia.Element | BaseElement)[];

  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly defaultLinks?: (dia.Link | BaseLink)[];
}

/**
 * GraphProvider component creates a graph instance and provides it to its children via context.
 * It also handles updates to the graph when cells change via React state or JointJS events.
 * For using many hooks provided by this library, you need to wrap your app with this provider.
 *
 * @example
 * Using provider:
 * ```tsx
 * import { GraphProvider } from '@joint/react'
 *
 * function App() {
 *  return (
 *   <GraphProvider>
 *    <MyApp />
 *  </GraphProvider>
 * )
 * ```
 * @example
 * Using provider with default elements and links:
 * ```tsx
 * import { GraphProvider } from '@joint/react'
 *
 * function App() {
 *  return (
 *   <GraphProvider defaultElements={[]} defaultLinks={[]}>
 *    <MyApp />
 *  </GraphProvider>
 * )
 * ```
 *
 * @group Components
 */
export function GraphProvider(props: GraphProps) {
  const { children, ...rest } = props;
  const graphStore = useCreateGraphStore(rest);

  return <GraphStoreContext.Provider value={graphStore}>{children}</GraphStoreContext.Provider>;
}

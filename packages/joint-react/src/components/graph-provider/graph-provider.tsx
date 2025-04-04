import type { dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import { GraphStoreContext, type StoreContext } from '../../context/graph-store-context';
import type { GraphElementBase } from '../../types/element-types';
import { useEffect, useMemo, useState } from 'react';
import { createStore, type Store } from '../../data/create-store';

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
  readonly defaultElements?: Array<dia.Element | GraphElementBase>;
  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly defaultLinks?: Array<dia.Link | GraphLink>;

  /**
   * Store is build around graph, it handles react updates and states, it can be created separately and passed to the provider via `createStore` function.
   * @see `createStore`
   */
  readonly store?: Store;
}

/**
 *
 * GraphProvider component creates a graph instance and provide `dia.graph` to it's children.
 * It relies on @see useCreateGraphStore hook to create the graph instance.
 *
 * Without this provider, the library will not work.
 * @param props - {GraphProvider} props
 * @returns GraphProvider component
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
 * @group Components
 */
export function GraphProvider(props: GraphProps) {
  const { children, store, ...rest } = props;
  const [isLoaded, setIsLoaded] = useState(false);
  const [graphStore] = useState(() => {
    if (store) {
      return store;
    }
    return createStore({ ...rest, onLoad: setIsLoaded });
  });

  // Initialize and cleanup
  useEffect(() => {
    graphStore.forceUpdate();
    return () => {
      graphStore.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const graphContext = useMemo(
    (): StoreContext => ({
      ...graphStore,
      isLoaded,
    }),
    [graphStore, isLoaded]
  );

  return <GraphStoreContext.Provider value={graphContext}>{children}</GraphStoreContext.Provider>;
}

import type { dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import {
  GraphAreElementsMeasuredContext,
  GraphStoreContext,
} from '../../context/graph-store-context';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { createStore, type Store } from '../../data/create-store';
import { useElements } from '../../hooks/use-elements';
import { useGraph } from '../../hooks';
import { setLinks } from '../../utils/cell/set-cells';
import type { GraphElement } from '../../types/element-types';

interface GraphProviderHandlerProps {
  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly initialLinks?: Array<dia.Link | GraphLink>;
}

/**
 * GraphProviderHandler component is used to handle the graph instance and provide it to the children.
 * It also handles the default elements and links.
 * @param props - {GraphProviderHandler} props
 * @param props.children - Children to render.
 * @param props.initialLinks - Initial links to be added to graph
 * @returns GraphProviderHandler component
 * @private
 */
function GraphProviderHandler({
  children,
  initialLinks,
}: PropsWithChildren<GraphProviderHandlerProps>) {
  const areElementsMeasured = useElements((items) => {
    let areMeasured = true;
    for (const [, { width = 0, height = 0 }] of items) {
      if (width <= 1 || height <= 1) {
        areMeasured = false;
        break;
      }
    }
    return areMeasured;
  });
  const graph = useGraph();
  useEffect(() => {
    if (areElementsMeasured) {
      setLinks({ graph, initialLinks });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areElementsMeasured, graph]);

  return (
    <GraphAreElementsMeasuredContext.Provider value={areElementsMeasured}>
      {children}
    </GraphAreElementsMeasuredContext.Provider>
  );
}

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
   * When added new shape, it will not remove existing ones, it will just add new ones.
   * So `{ ...shapes, ReactElement }` elements are still available.
   * @default  `{ ...shapes, ReactElement }`
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
  readonly initialElements?: Array<dia.Element | GraphElement>;
  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly initialLinks?: Array<dia.Link | GraphLink>;

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
 *   <GraphProvider initialElements={[]} initialLinks={[]}>
 *    <MyApp />
 *  </GraphProvider>
 * )
 * ```
 * @group Components
 */
export function GraphProvider(props: GraphProps) {
  const { children, initialLinks, store, ...rest } = props;

  /**
   * Graph store instance.
   * @returns - The graph store instance.
   */

  const [graphStore, setGraphStore] = useState<null | Store>(null);

  useEffect(() => {
    const newStore = store ?? createStore({ ...rest });
    // We must use state initialization for the store, because it can be used in the same component.
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setGraphStore(newStore);
    return () => {
      if (newStore) {
        newStore.destroy();
      }
    };
    // On load initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (graphStore === null) {
    return null;
  }

  return (
    <GraphStoreContext.Provider value={graphStore}>
      <GraphProviderHandler initialLinks={initialLinks}>{children}</GraphProviderHandler>
    </GraphStoreContext.Provider>
  );
}

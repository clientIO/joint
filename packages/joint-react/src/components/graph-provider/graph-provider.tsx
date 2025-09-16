import type { dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import {
  GraphAreElementsMeasuredContext,
  GraphStoreContext,
} from '../../context/graph-store-context';
import { useLayoutEffect, type Dispatch, type PropsWithChildren, type SetStateAction } from 'react';
import { createStore, type Store } from '../../data/create-store';
import { useElements } from '../../hooks/use-elements';
import { useGraph } from '../../hooks';
import { setElements, setLinks } from '../../utils/cell/cell-utilities';
import type { GraphElement } from '../../types/element-types';
import { CONTROLLED_MODE_BATCH_NAME } from '../../utils/graph/update-graph';
import { useImperativeApi } from '../../hooks/use-imperative-api';

interface GraphProviderHandlerProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Element extends dia.Element | GraphElement = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link extends dia.Link | GraphLink = any,
> {
  /**
   * Elements (nodes) to be added to graph.
   * When `onElementsChange`, it enabled controlled mode.
   * If there is no `onElementsChange` provided, it will be used just on onload (initial)
   */
  readonly initialElements?: Element[];

  /**
   * Links (edges) to be added to graph.
   * When `onLinksChange`, it enabled controlled mode.
   * If there is no `onLinksChange` provided, it will be used just on onload (initial)
   */
  readonly initialLinks?: Link[];

  /**
   * Callback triggered when elements (nodes) change.
   * Providing this prop enables controlled mode for elements.
   * If specified, this function will override the default behavior, allowing you to manage all element changes manually instead of relying on `graph.change`.
   */
  readonly onElementsChange?: Dispatch<SetStateAction<Element[]>>;

  /**
   * Callback triggered when links (edges) change.
   * Providing this prop enables controlled mode for links.
   * If specified, this function will override the default behavior, allowing you to manage all link changes manually instead of relying on `graph.change`.
   */
  readonly onLinksChange?: Dispatch<SetStateAction<Link[]>>;
}

/**
 * GraphProviderHandler component is used to handle the graph instance and provide it to the children.
 * It also handles the default elements and links.
 * @returns GraphProviderHandler component
 * @param props - {GraphProviderHandler} props
 * @private
 */
export function GraphProviderHandler(props: PropsWithChildren<GraphProviderHandlerProps>) {
  const { initialElements, initialLinks, onElementsChange, onLinksChange, children } = props;
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

  const areElementsInControlledMode = !!onElementsChange;
  const areLinksInControlledMode = !!onLinksChange;
  const isControlledMode = areElementsInControlledMode || areLinksInControlledMode;
  // Controlled mode for elements
  useLayoutEffect(() => {
    if (!areElementsMeasured) return;
    if (!graph) return;
    if (!isControlledMode) return;

    graph.startBatch(CONTROLLED_MODE_BATCH_NAME);
    if (areElementsInControlledMode) {
      setElements({ graph, elements: initialElements });
    }
    if (areLinksInControlledMode) {
      setLinks({ graph, links: initialLinks });
    }
    graph.stopBatch(CONTROLLED_MODE_BATCH_NAME);
  }, [
    areElementsInControlledMode,
    areElementsMeasured,
    areLinksInControlledMode,
    graph,
    initialElements,
    initialLinks,
    isControlledMode,
  ]);

  useLayoutEffect(() => {
    // with this all links are connected only when react elements are measured
    // It fixes issue with a flickering of un-measured react elements.
    if (isControlledMode) return;
    if (!areElementsMeasured) return;
    setLinks({ graph, links: initialLinks });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areElementsMeasured, isControlledMode]);

  return (
    <GraphAreElementsMeasuredContext.Provider value={areElementsMeasured}>
      {children}
    </GraphAreElementsMeasuredContext.Provider>
  );
}

export interface GraphProps<
  Graph extends dia.Graph = dia.Graph,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Element extends dia.Element | GraphElement = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link extends dia.Link | GraphLink = any,
> extends GraphProviderHandlerProps<Element, Link> {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: Graph;
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
export function GraphProvider<
  Element extends dia.Element | GraphElement,
  Link extends dia.Link | GraphLink,
>(props: Readonly<GraphProps<dia.Graph, Element, Link>>) {
  const { children, store, ...rest } = props;
  /**
   * Graph store instance.
   * @returns - The graph store instance.
   */

  const { isReady, ref } = useImperativeApi(
    {
      onLoad() {
        const newStore = store ?? createStore({ ...rest });
        // We must use state initialization for the store, because it can be used in the same component.

        return {
          cleanup() {
            if (newStore) {
              newStore.destroy(!!rest.graph || !!store?.graph);
            }
          },
          instance: newStore,
        };
      },
    },
    []
  );

  if (!isReady) {
    return null;
  }

  return (
    <GraphStoreContext.Provider value={ref.current}>
      <GraphProviderHandler {...props}>{children}</GraphProviderHandler>
    </GraphStoreContext.Provider>
  );
}

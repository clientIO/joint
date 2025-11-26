import type { dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';
import { createStore, type GraphStore } from '../../data/create-graph-store';
import { useElements } from '../../hooks/use-elements';
import { useGraphStore } from '../../hooks';
import type { GraphElement } from '../../types/element-types';
import { CONTROLLED_MODE_BATCH_NAME } from '../../utils/graph/update-graph';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphAreElementsMeasuredContext, GraphStoreContext } from '../../context';

interface GraphProviderBaseProps<
  Element extends dia.Element | GraphElement,
  Link extends dia.Link | GraphLink,
> {
  /**
   * Elements (nodes) to be added to graph.
   * When `onElementsChange`, it enabled controlled mode.
   * If there is no `onElementsChange` provided, it will be used just on onload (initial)
   */
  readonly elements?: Element[];

  /**
   * Links (edges) to be added to graph.
   * When `onLinksChange`, it enabled controlled mode.
   * If there is no `onLinksChange` provided, it will be used just on onload (initial)
   */
  readonly links?: Link[];

  /**
   * Callback triggered when eleme§nts (nodes) change.
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
 * Internal handler coordinating initial population and controlled-mode mirroring
 * for elements and links. Also delays link creation until elements are measured
 * in uncontrolled mode to avoid flicker.
 * @param props - The properties for the GraphProviderHandler, including elements, links, and callbacks.
 * @returns A context provider for the measured state of elements.
 * @private
 */
export function GraphProviderHandler<
  Element extends dia.Element | GraphElement = dia.Element,
  Link extends dia.Link | GraphLink = dia.Link,
>(props: PropsWithChildren<GraphProviderBaseProps<Element, Link>>) {
  const { elements, links, onElementsChange, onLinksChange, children } = props;
  const alreadyMeasured = useRef(false);
  const areElementsMeasured = useElements((items) => {
    if (alreadyMeasured.current) return true;
    let areMeasured = true;
    for (const { width = 0, height = 0 } of items) {
      if (width <= 1 || height <= 1) {
        areMeasured = false;
        break;
      }
    }
    alreadyMeasured.current = areMeasured;
    return areMeasured;
  });

  const { graph, setElements, setLinks } = useGraphStore();

  const areElementsInControlledMode = !!onElementsChange;
  const areLinksInControlledMode = !!onLinksChange;
  // Controlled mode for elements
  useLayoutEffect(() => {
    if (!areElementsMeasured) return;
    if (!graph) return;
    if (!areElementsInControlledMode) return;

    graph.startBatch(CONTROLLED_MODE_BATCH_NAME);
    if (areElementsInControlledMode && elements !== undefined) {
      setElements(elements as GraphElement[]);
    }
    graph.stopBatch(CONTROLLED_MODE_BATCH_NAME);
  }, [areElementsInControlledMode, areElementsMeasured, elements, graph, setElements]);

  // Controlled mode for links
  useLayoutEffect(() => {
    if (!areElementsMeasured) return;
    if (!graph) return;
    if (!areLinksInControlledMode) return;

    graph.startBatch(CONTROLLED_MODE_BATCH_NAME);
    if (areLinksInControlledMode && links !== undefined) {
      setLinks(links as GraphLink[]);
    }
    graph.stopBatch(CONTROLLED_MODE_BATCH_NAME);
  }, [areElementsMeasured, areLinksInControlledMode, graph, links, setLinks]);

  return (
    <GraphAreElementsMeasuredContext.Provider value={areElementsMeasured}>
      {children}
    </GraphAreElementsMeasuredContext.Provider>
  );
}

export interface GraphProps<
  Graph extends dia.Graph = dia.Graph,
  Element extends dia.Element | GraphElement = GraphElement,
  Link extends dia.Link | GraphLink = GraphLink,
> extends GraphProviderBaseProps<Element, Link> {
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
  readonly store?: GraphStore<Graph>;
}

/**
 * Graph component creates a graph instance and provides `dia.graph` to its children.
 * This component is essential for the library to function correctly. It manages the graph instance and supports controlled and uncontrolled modes for elements and links.
 * @param props - The properties for the Graph component.
 * @param forwardedRef - A reference to the GraphStore instance.
 * @returns The Graph component.
 * @example
 * Using the Graph component:
 * ```tsx
 * import { Graph } from '@joint/react';
 * function App() {
 *   return (
 *     <Graph>
 *       <MyApp />
 *     </Graph>
 *   );
 * }
 * ```
 * @example
 * Using the Graph component with default elements and links:
 * ```tsx
 * import { Graph } from '@joint/react';
 * function App() {
 *   return (
 *     <Graph elements={[]} links={[]}>
 *       <MyApp />
 *     </Graph>
 *   );
 * }
 * ```
 */
function GraphBase<Element extends dia.Element | GraphElement, Link extends dia.Link | GraphLink>(
  props: Readonly<GraphProps<dia.Graph, Element, Link>>,
  forwardedRef: React.Ref<GraphStore>
) {
  const { children, store, ...rest } = props;
  /**
   * Graph store instance.
   * @returns - The graph store instance.
   */

  const { isReady, ref } = useImperativeApi<GraphStore>(
    {
      forwardedRef,
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

/**
 * GraphProviderHandler component is used to handle the graph instance and provide it to the children.
 * It also handles the default elements and links.
 * @returns GraphProviderHandler component
 * @param props - {GraphProviderHandler} props
 * @private
 */
export const GraphProvider = forwardRef(GraphBase) as <
  Element extends dia.Element | GraphElement,
  Link extends dia.Link | GraphLink,
>(
  props: Readonly<GraphProps<dia.Graph, Element, Link>> & {
    ref?: React.Ref<GraphStore>;
  }
) => ReturnType<typeof GraphBase>;

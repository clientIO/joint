import type { dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import {
  forwardRef,
  useRef,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';
import { useElements } from '../../hooks/use-elements';
import type { GraphElement } from '../../types/element-types';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphAreElementsMeasuredContext, GraphStoreContext } from '../../context';
import { GraphStore, type ExternalGraphStore } from '../../store';
import { useStateToExternalStore } from '../../hooks/use-state-to-external-store';
import typedMemo from '../../utils/typed-react';

interface GraphProviderProps<
  Element extends dia.Element | GraphElement,
  Link extends dia.Link | GraphLink,
> {
  /**
   * Elements (nodes) to be added to graph.
   * When `onElementsChange` is provided, it enables controlled mode.
   * If there is no `onElementsChange` provided, it will be used just on onload (initial).
   */
  readonly elements?: Element[];

  /**
   * Links (edges) to be added to graph.
   * When `onLinksChange` is provided, it enables controlled mode.
   * If there is no `onLinksChange` provided, it will be used just on onload (initial).
   */
  readonly links?: Link[];

  /**
   * Callback triggered when elements (nodes) change.
   * Providing this prop enables controlled mode for elements.
   * If specified, this function will override the default behavior,
   * allowing you to manage all element changes manually instead of relying on `graph.change`.
   */
  readonly onElementsChange?: Dispatch<SetStateAction<Element[]>>;

  /**
   * Callback triggered when links (edges) change.
   * Providing this prop enables controlled mode for links.
   * If specified, this function will override the default behavior,
   * allowing you to manage all link changes manually instead of relying on `graph.change`.
   */
  readonly onLinksChange?: Dispatch<SetStateAction<Link[]>>;
}

export function GraphProviderHandlerBase<
  Element extends dia.Element | GraphElement = dia.Element,
  Link extends dia.Link | GraphLink = dia.Link,
>(props: PropsWithChildren<GraphProviderProps<Element, Link>>) {
  const { children } = props;

  const alreadyMeasured = useRef(false);

  // We still compute "areElementsMeasured" for the context,
  // but we don't block syncing on it anymore.
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

  return (
    <GraphAreElementsMeasuredContext.Provider value={areElementsMeasured}>
      {children}
    </GraphAreElementsMeasuredContext.Provider>
  );
}

const GraphProviderHandler = typedMemo(GraphProviderHandlerBase);

export interface GraphProps<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> extends GraphProviderProps<Element, Link> {
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
   * Store is built around graph, it handles React updates and state.
   * It can be created separately and passed to the provider via `store`.
   */
  readonly store?: GraphStore<Graph, Element, Link>;

  /**
   * Optional external state (Redux / Zustand / etc.) controlling elements + links.
   * When provided, GraphStore will treat this as the source of truth for those fields.
   */
  readonly externalStore?: ExternalGraphStore<Element, Link>;
}

/**
 * Graph component creates a graph instance and provides `dia.Graph` to its children.
 * It manages the graph instance and supports:
 * - uncontrolled mode (no onElementsChange/onLinksChange/externalStore)
 * - React-controlled mode (onElementsChange/onLinksChange)
 * - external-store-controlled mode (externalStore).
 */
function GraphBase<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
>(
  props: Readonly<GraphProps<Graph, Element, Link>>,
  forwardedRef: React.Ref<GraphStore<Graph, Element, Link>>
) {
  const {
    children,
    store,
    onElementsChange,
    onLinksChange,
    elements,
    links,
    externalStore,
    ...rest
  } = props;
  const isReactControlled = !!onElementsChange || !!onLinksChange;
  const hasExternalState = !!externalStore;
  const isControlled = isReactControlled || hasExternalState;

  const externalStoreLike = useStateToExternalStore({
    elements,
    links,
    onElementsChange,
    onLinksChange,
  });

  const { isReady, ref } = useImperativeApi<GraphStore<Graph, Element, Link>>(
    {
      forwardedRef,
      onLoad() {
        const graphStore =
          store ?? new GraphStore({ ...rest, elements, links, externalState: externalStoreLike });

        return {
          cleanup() {
            if (graphStore) {
              // If graph or store.graph was provided externally, we don't clear it.
              graphStore.destroy(!!rest.graph || !!store?.graph);
            }
          },
          instance: graphStore,
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
      <GraphProviderHandler<Element, Link>>{children}</GraphProviderHandler>
    </GraphStoreContext.Provider>
  );
}

/**
 * GraphProvider is the main exported component.
 * Examples:
 *
 * Uncontrolled:
 * ```tsx
 * <GraphProvider elements={initialElements} links={initialLinks}>
 *   <App />
 * </GraphProvider>
 * ```
 *
 * React controlled:
 * ```tsx
 * const [elements, setElements] = useState<GraphElement[]>([]);
 * const [links, setLinks] = useState<GraphLink[]>([]);
 *
 * <GraphProvider
 *   elements={elements}
 *   links={links}
 *   onElementsChange={setElements}
 *   onLinksChange={setLinks}
 * >
 *   <App />
 * </GraphProvider>
 * ```
 *
 * External store:
 * ```tsx
 * <GraphProvider externalStore={graphExternalState}>
 *   <App />
 * </GraphProvider>
 * ```
 */
export const GraphProvider = forwardRef(GraphBase) as <
  Element extends GraphElement,
  Link extends GraphLink,
>(
  props: Readonly<GraphProps<dia.Graph, Element, Link>> & {
    ref?: React.Ref<GraphStore<dia.Graph, Element, Link>>;
  }
) => ReturnType<typeof GraphBase>;

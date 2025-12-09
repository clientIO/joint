import type { dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import { forwardRef, type Dispatch, type SetStateAction } from 'react';
import type { GraphElement } from '../../types/element-types';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphStoreContext } from '../../context';
import { GraphStore, type ExternalGraphStore } from '../../store';
import { useStateToExternalStore } from '../../hooks/use-state-to-external-store';

/**
 * Props for GraphProvider component.
 * Supports three modes: uncontrolled, React-controlled, and external-store-controlled.
 */
interface GraphProviderProps {
  /**
   * Elements (nodes) to be added to the graph.
   *
   * **Controlled mode:** When `onElementsChange` is provided, this prop controls the elements.
   * All changes must go through React state updates.
   *
   * **Uncontrolled mode:** If `onElementsChange` is not provided, this is only used for initial elements.
   * The graph manages its own state internally.
   */
  readonly elements?: GraphElement[];

  /**
   * Links (edges) to be added to the graph.
   *
   * **Controlled mode:** When `onLinksChange` is provided, this prop controls the links.
   * All changes must go through React state updates.
   *
   * **Uncontrolled mode:** If `onLinksChange` is not provided, this is only used for initial links.
   * The graph manages its own state internally.
   */
  readonly links?: GraphLink[];

  /**
   * Callback triggered when elements (nodes) change in the graph.
   *
   * **Enables React-controlled mode for elements.**
   * When provided, all element changes (from user interactions or programmatic updates)
   * will trigger this callback, allowing you to manage element state in React.
   *
   * This gives you full control over element state and enables features like:
   * - Undo/redo functionality
   * - State persistence
   * - Integration with other React state management
   */
  readonly onElementsChange?: Dispatch<SetStateAction<GraphElement[]>>;

  /**
   * Callback triggered when links (edges) change in the graph.
   *
   * **Enables React-controlled mode for links.**
   * When provided, all link changes (from user interactions or programmatic updates)
   * will trigger this callback, allowing you to manage link state in React.
   *
   * This gives you full control over link state and enables features like:
   * - Undo/redo functionality
   * - State persistence
   * - Integration with other React state management
   */
  readonly onLinksChange?: Dispatch<SetStateAction<GraphLink[]>>;
}

/**
 * Props for the GraphProvider component.
 * Extends GraphProviderProps with additional configuration options.
 */
export interface GraphProps extends GraphProviderProps {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   *
   * Useful when you need to:
   * - Share a graph instance across multiple providers
   * - Integrate with existing JointJS code
   * - Control graph initialization manually
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: dia.Graph;
  /**
   * React children to render inside the GraphProvider.
   * Typically includes Paper components and other graph-related components.
   */
  readonly children?: React.ReactNode;
  /**
   * Namespace for cell models. Defines which cell types are available in the graph.
   *
   * **Important:** This is loaded just once during initialization, so it cannot be used as React state.
   *
   * When provided, it will be merged with the default namespace (`{ ...shapes, ReactElement }`).
   * Existing shapes are not removed, only new ones are added.
   * @default `{ ...shapes, ReactElement }`
   * @see https://docs.jointjs.com/api/shapes
   */
  readonly cellNamespace?: unknown;
  /**
   * Custom cell model to use as the base class for all cells in the graph.
   *
   * **Important:** This is loaded just once during initialization, so it cannot be used as React state.
   * @see https://docs.jointjs.com/api/dia/Cell
   */
  readonly cellModel?: typeof dia.Cell;

  /**
   * Pre-created GraphStore instance to use.
   *
   * The store handles React updates and state synchronization.
   * If not provided, a new store will be created automatically.
   *
   * Useful for:
   * - Sharing a store across multiple providers
   * - Advanced use cases requiring manual store management
   */
  readonly store?: GraphStore;

  /**
   * External state store (Redux, Zustand, etc.) controlling elements and links.
   *
   * **Enables external-store-controlled mode.**
   * When provided, GraphStore will treat this as the source of truth for elements and links.
   * This takes precedence over React-controlled mode (onElementsChange/onLinksChange).
   *
   * The external store must implement the ExternalStoreLike interface, which is compatible
   * with most state management libraries.
   */
  readonly externalStore?: ExternalGraphStore;
}

/**
 * GraphBase component that handles uncontrolled mode.
 * Used when no external store or React state setters are provided.
 * The graph manages its own state internally.
 */
const GraphBase = forwardRef<GraphStore, GraphProps>(function GraphBase(props, forwardedRef) {
  const { children, store, elements, links, ...rest } = props;

  const { isReady, ref } = useImperativeApi<GraphStore>(
    {
      forwardedRef,
      onLoad() {
        const graphStore =
          store ??
          new GraphStore({
            ...rest,
            initialElements: elements,
            initialLinks: links,
          });

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

  return <GraphStoreContext.Provider value={ref.current}>{children}</GraphStoreContext.Provider>;
});

/**
 * GraphBaseWithSetters component that handles React-controlled mode.
 * Used when onElementsChange and/or onLinksChange props are provided.
 * All graph changes are synchronized with React state.
 */
const GraphBaseWithSetters = forwardRef<GraphStore, GraphProps>(
  function GraphBaseWithSetters(props, forwardedRef) {
    const { children, store, onElementsChange, onLinksChange, elements, links, ...rest } = props;

    const externalStoreLike = useStateToExternalStore({
      elements,
      links,
      onElementsChange,
      onLinksChange,
    });

    const { isReady, ref } = useImperativeApi<GraphStore>(
      {
        forwardedRef,
        onLoad() {
          const graphStore =
            store ??
            new GraphStore({
              ...rest,
              initialElements: elements,
              initialLinks: links,
              externalStore: externalStoreLike,
            });

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

    return <GraphStoreContext.Provider value={ref.current}>{children}</GraphStoreContext.Provider>;
  }
);

/**
 * GraphBaseRouter component that routes to the appropriate implementation based on props.
 *
 * Supports three modes:
 * 1. **Uncontrolled mode:** No external store or setters - graph manages its own state
 * 2. **React-controlled mode:** onElementsChange/onLinksChange provided - React state controls the graph
 * 3. **External-store-controlled mode:** externalStore provided - external state management controls the graph
 *
 * The router automatically selects the correct implementation based on which props are provided.
 * External store takes precedence over React-controlled mode.
 * @param props - The props for the GraphProvider component
 * @param forwardedRef - The forwarded ref for GraphStore instance
 * @returns The appropriate GraphBase component or null if not ready
 */
const GraphBaseRouter = forwardRef<GraphStore, GraphProps>(
  function GraphBaseRouter(props, forwardedRef) {
    const { externalStore, onElementsChange, onLinksChange } = props;

    // externalStore takes precedence over React-controlled mode
    if (externalStore) {
      return <GraphBase {...props} ref={forwardedRef} />;
    }

    // React-controlled mode (with setters)
    if (onElementsChange || onLinksChange) {
      return <GraphBaseWithSetters {...props} ref={forwardedRef} />;
    }

    // Uncontrolled mode
    return <GraphBase {...props} ref={forwardedRef} />;
  }
);

/**
 * GraphProvider is the main component that provides graph context to its children.
 *
 * It creates and manages a GraphStore instance, which handles:
 * - Graph state management
 * - Bidirectional synchronization between React state and JointJS graph
 * - Multiple paper view coordination
 * - Element size observation
 *
 * **Three modes of operation:**
 *
 * 1. **Uncontrolled mode** (default):
 * ```tsx
 * <GraphProvider elements={initialElements} links={initialLinks}>
 *   <Paper />
 * </GraphProvider>
 * ```
 *
 * 2. **React-controlled mode:**
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
 *   <Paper />
 * </GraphProvider>
 * ```
 *
 * 3. **External-store-controlled mode:**
 * ```tsx
 * const store = createExternalStore(); // Redux, Zustand, etc.
 *
 * <GraphProvider externalStore={store}>
 *   <Paper />
 * </GraphProvider>
 * ```
 * @see GraphProps for all available props
 */
export const GraphProvider = GraphBaseRouter;

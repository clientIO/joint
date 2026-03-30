import type { dia } from '@joint/core';
import type { CellId } from '../../types/cell-id';
import React, { useLayoutEffect, type Dispatch, type SetStateAction } from 'react';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphStoreContext } from '../../context';
import { GraphStore } from '../../store';
import type { GraphMappings } from '../../state/data-mapping';
import type { IncrementalContainerChanges } from '../../store/graph-view';
import type { ElementRecord, LinkRecord } from '../../types/data-types';

/**
 * Props for the GraphProvider component.
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 */
export interface GraphProviderProps<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> extends GraphMappings<ElementData, LinkData> {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: dia.Graph;
  /**
   * React children to render inside the GraphProvider.
   */
  readonly children?: React.ReactNode;
  /**
   * Namespace for cell models.
   * @default `{ ...shapes, PortalElement, PortalLink }`
   */
  readonly cellNamespace?: unknown;
  /**
   * Custom cell model to use as the base class for all cells in the graph.
   */
  readonly cellModel?: typeof dia.Cell;

  /**
   * Pre-created GraphStore instance to use.
   */
  readonly store?: GraphStore<ElementData, LinkData>;

  /**
   * When enabled, graph state updates are deferred during JointJS batch operations
   * (e.g. drag) and flushed once the batch completes. Disabled by default — each
   * graph change triggers an immediate state update.
   * @default false
   */
  readonly enableBatchUpdates?: boolean;

  /**
   * Elements (nodes) to be added to the graph as a Record keyed by cell ID.
   *
   * **Controlled mode:** When `onElementsChange` or `onIncrementalChange` is provided, this prop controls the elements.
   *
   * **Uncontrolled mode:** If neither is provided, this is only used for initial elements.
   */
  readonly elements?: Record<CellId, ElementRecord<ElementData>>;

  /**
   * Links (edges) to be added to the graph as a Record keyed by cell ID.
   *
   * **Controlled mode:** When `onLinksChange` or `onIncrementalChange` is provided, this prop controls the links.
   *
   * **Uncontrolled mode:** If neither is provided, this is only used for initial links.
   */
  readonly links?: Record<CellId, LinkRecord<LinkData>>;

  /**
   * Callback triggered when elements (nodes) change in the graph.
   * Enables React-controlled mode for elements.
   */
  readonly onElementsChange?: Dispatch<SetStateAction<Record<CellId, ElementRecord<ElementData>>>>;

  /**
   * Callback triggered when links (edges) change in the graph.
   * Enables React-controlled mode for links.
   */
  readonly onLinksChange?: Dispatch<SetStateAction<Record<CellId, LinkRecord<LinkData>>>>;

  /**
   * Callback triggered with granular incremental change information when graph state changes.
   * Enables incremental-controlled mode. Can be used with external stores (Redux, Zustand, etc.).
   */
  readonly onIncrementalChange?: (
    changes: IncrementalContainerChanges<ElementData, LinkData>
  ) => void;
}

function GraphBase<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(props: GraphProviderProps<ElementData, LinkData> & { ref?: React.Ref<dia.Graph | null> }) {
  const {
    children,
    store,
    elements,
    links,
    onElementsChange,
    onLinksChange,
    onIncrementalChange,
    ref: forwardedRef,
    ...rest
  } = props;

  const isControlledMode =
    Boolean(onIncrementalChange) || Boolean(onElementsChange) || Boolean(onLinksChange);

  const { isReady, ref } = useImperativeApi<GraphStore<ElementData, LinkData>, dia.Graph>(
    {
      instanceSelector: (instance) => instance.graph,
      forwardedRef,
      onLoad() {
        const graphStore =
          store ??
          new GraphStore<ElementData, LinkData>({
            ...rest,
            initialElements: elements,
            initialLinks: links,
            onIncrementalChange,
            onElementsChange,
            onLinksChange,
          });

        return {
          cleanup() {
            if (store) {
              return;
            }
            graphStore.destroy(!!rest.graph);
          },
          instance: graphStore,
        };
      },
    },
    []
  );

  const {
    mapElementToAttributes,
    mapLinkToAttributes,
    mapAttributesToElement,
    mapAttributesToLink,
  } = rest;

  useLayoutEffect(() => {
    if (!isReady || !ref.current) return;
    ref.current.graphView.updateMappers({
      mapElementToAttributes,
      mapLinkToAttributes,
      mapAttributesToElement,
      mapAttributesToLink,
    });
  }, [
    mapElementToAttributes,
    mapLinkToAttributes,
    mapAttributesToElement,
    mapAttributesToLink,
    isReady,
    ref,
  ]);

  useLayoutEffect(() => {
    if (!isControlledMode || !isReady || !ref.current) return;
    ref.current.graphView.updateGraph({
      elements: elements ?? {},
      links: links ?? {},
      flag: 'updateFromReact',
    });
  }, [elements, links, isControlledMode, isReady, ref]);

  if (!isReady) {
    return null;
  }

  return <GraphStoreContext.Provider value={ref.current}>{children}</GraphStoreContext.Provider>;
}

/**
 * GraphProvider is the main component that provides graph context to its children.
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
 * const [elements, setElements] = useState({});
 * const [links, setLinks] = useState({});
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
 * 3. **Incremental-controlled mode:**
 * ```tsx
 * <GraphProvider onIncrementalChange={(changes) => dispatch(changes)}>
 *   <Paper />
 * </GraphProvider>
 * ```
 * @see GraphProviderProps for all available props
 */
export const GraphProvider = GraphBase as <
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(
  props: GraphProviderProps<ElementData, LinkData> & {
    ref?: React.Ref<dia.Graph | null>;
  }
) => ReturnType<typeof GraphBase>;

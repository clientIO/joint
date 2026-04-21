import type { dia } from '@joint/core';
import type { CellId } from '../../types/cell-id';
import React, { useLayoutEffect, type Dispatch, type SetStateAction } from 'react';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphStoreContext } from '../../context';
import { GraphStore, type GraphStoreOptions } from '../../store';
import type { IncrementalContainerChanges } from '../../store/graph-view';
import type { ElementRecord, LinkRecord } from '../../types/data-types';

type ElementsRecord<ElementData extends object> = Record<CellId, ElementRecord<ElementData>>;
type LinksRecord<LinkData extends object> = Record<CellId, LinkRecord<LinkData>>;

/**
 * Props common to every GraphProvider mode.
 * @template ElementData - User data attached to each element.
 * @template LinkData - User data attached to each link.
 */
interface GraphProviderBaseProps<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  /**
   * Pre-existing JointJS graph instance to use. If omitted, GraphProvider
   * creates a fresh `new dia.Graph(...)`.
   * @see https://docs.jointjs.com/api/dia/Graph
   */
  readonly graph?: dia.Graph;
  /** React children rendered inside the provider — typically a `<Paper />`. */
  readonly children?: React.ReactNode;
  /**
   * Cell namespace passed through to `new dia.Graph`. Defaults to JointJS
   * built-in shapes plus the `@joint/react` ElementModel and LinkModel.
   */
  readonly cellNamespace?: unknown;
  /** Custom cell model used as the base class for all cells in the graph. */
  readonly cellModel?: typeof dia.Cell;
  /** Pre-built `GraphStore` instance. When provided, GraphProvider does not own its lifecycle. */
  readonly store?: GraphStore<ElementData, LinkData>;
  /**
   * Defer state updates during JointJS batch operations (e.g. drag) and flush
   * them after `batch:stop`. Off by default — every change triggers an
   * immediate React update.
   * @default false
   */
  readonly enableBatchUpdates?: boolean;
  /**
   * Notification fired with granular `added` / `changed` / `removed` sets
   * after each commit. Independent of controlled/uncontrolled mode — fires
   * in either. Wire up to external stores (Redux, Zustand, etc.).
   */
  readonly onIncrementalChange?: (
    changes: IncrementalContainerChanges<ElementData, LinkData>
  ) => void;
}

/**
 * Elements-stream props. Either `elements` (controlled) or `initialElements`
 * (uncontrolled) — the discriminated union forbids passing both.
 */
type GraphProviderElementsProps<ElementData extends object> =
  | {
      /**
       * Controlled elements record keyed by cell ID. Pair with `onElementsChange`
       * to write changes back to React state.
       */
      readonly elements: ElementsRecord<ElementData>;
      readonly initialElements?: never;
      /**
       * Fires whenever elements change. In controlled mode (when `elements` is
       * provided), consumers MUST update their state from this callback for the
       * graph to reflect new data.
       */
      readonly onElementsChange?: Dispatch<SetStateAction<ElementsRecord<ElementData>>>;
    }
  | {
      readonly elements?: never;
      /**
       * Uncontrolled initial elements record. Used only on mount; subsequent
       * changes from React are ignored. JointJS drives the graph from here.
       */
      readonly initialElements?: ElementsRecord<ElementData>;
      /**
       * Fires whenever elements change. In uncontrolled mode this is a
       * notification only — React state is NOT pushed back to the graph.
       */
      readonly onElementsChange?: (elements: ElementsRecord<ElementData>) => void;
    };

/**
 * Links-stream props. Either `links` (controlled) or `initialLinks`
 * (uncontrolled) — the discriminated union forbids passing both.
 */
type GraphProviderLinksProps<LinkData extends object> =
  | {
      /**
       * Controlled links record keyed by cell ID. Pair with `onLinksChange`
       * to write changes back to React state.
       */
      readonly links: LinksRecord<LinkData>;
      readonly initialLinks?: never;
      /** Fires whenever links change. In controlled mode, consumers MUST update state. */
      readonly onLinksChange?: Dispatch<SetStateAction<LinksRecord<LinkData>>>;
    }
  | {
      readonly links?: never;
      /** Uncontrolled initial links record. Used only on mount. */
      readonly initialLinks?: LinksRecord<LinkData>;
      /** Notification-only callback — React state is NOT pushed back to the graph. */
      readonly onLinksChange?: (links: LinksRecord<LinkData>) => void;
    };

/**
 * Props for `GraphProvider`. Elements and links are independent streams —
 * any combination of controlled/uncontrolled is valid.
 *
 * **Modes (per stream):**
 * - **Uncontrolled:** Pass `initialElements` / `initialLinks`. JointJS owns the graph.
 *   `onElementsChange` / `onLinksChange` may still be passed as notifications.
 * - **Controlled:** Pass `elements` / `links` and `onElementsChange` / `onLinksChange`.
 *   React owns the data; the graph is kept in sync from React state.
 *
 * Mixed (e.g. controlled elements + uncontrolled links) is fully supported.
 * @template ElementData - User data attached to each element record.
 * @template LinkData - User data attached to each link record.
 */
export type GraphProviderProps<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> = GraphProviderBaseProps<ElementData, LinkData> &
  GraphProviderElementsProps<ElementData> &
  GraphProviderLinksProps<LinkData>;

/**
 * Internal generic base component for GraphProvider.
 * @param props - GraphProvider props including optional forwarded ref.
 * @returns The rendered graph context provider or null while loading.
 */
function GraphBase<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(props: GraphProviderProps<ElementData, LinkData> & { ref?: React.Ref<dia.Graph | null> }) {
  const {
    children,
    store,
    onIncrementalChange,
    onElementsChange,
    onLinksChange,
    ref: forwardedRef,
    ...rest
  } = props as GraphProviderBaseProps<ElementData, LinkData> & {
    elements?: ElementsRecord<ElementData>;
    initialElements?: ElementsRecord<ElementData>;
    links?: LinksRecord<LinkData>;
    initialLinks?: LinksRecord<LinkData>;
    onElementsChange?: GraphStoreOptions<ElementData, LinkData>['onElementsChange'];
    onLinksChange?: GraphStoreOptions<ElementData, LinkData>['onLinksChange'];
    ref?: React.Ref<dia.Graph | null>;
  };

  const { elements, links, initialElements, initialLinks } = rest;
  const isElementsControlled = elements !== undefined;
  const isLinksControlled = links !== undefined;

  const { isReady, ref } = useImperativeApi<GraphStore<ElementData, LinkData>, dia.Graph>(
    {
      instanceSelector: (instance) => instance.graph,
      forwardedRef,
      onLoad() {
        const graphStore =
          store ??
          new GraphStore<ElementData, LinkData>({
            graph: rest.graph,
            cellNamespace: rest.cellNamespace,
            cellModel: rest.cellModel,
            initialElements: isElementsControlled ? elements : initialElements,
            initialLinks: isLinksControlled ? links : initialLinks,
            onIncrementalChange,
            onElementsChange: onElementsChange as GraphStoreOptions<
              ElementData,
              LinkData
            >['onElementsChange'],
            onLinksChange: onLinksChange as GraphStoreOptions<
              ElementData,
              LinkData
            >['onLinksChange'],
          });

        return {
          cleanup() {
            if (store) return;
            graphStore.destroy(!!rest.graph);
          },
          instance: graphStore,
        };
      },
    },
    []
  );

  useLayoutEffect(() => {
    if (!isElementsControlled || !isReady || !ref.current) return;
    ref.current.graphView.updateGraph({
      elements: elements ?? {},
      flag: 'updateFromReact',
    });
  }, [elements, isElementsControlled, isReady, ref]);

  useLayoutEffect(() => {
    if (!isLinksControlled || !isReady || !ref.current) return;
    ref.current.graphView.updateGraph({
      links: links ?? {},
      flag: 'updateFromReact',
    });
  }, [links, isLinksControlled, isReady, ref]);

  if (!isReady) {
    return null;
  }

  return <GraphStoreContext.Provider value={ref.current}>{children}</GraphStoreContext.Provider>;
}

/**
 * GraphProvider is the main component that provides graph context to its children.
 *
 * **Modes of operation (per stream — elements and links are independent):**
 *
 * 1. **Uncontrolled mode** (default): JointJS owns the graph after mount.
 * ```tsx
 * <GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
 *   <Paper />
 * </GraphProvider>
 * ```
 *
 * 2. **React-controlled mode:** React owns the data and pushes updates to the graph.
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
 * 3. **Mixed mode:** controlled elements + uncontrolled links (or vice versa).
 * ```tsx
 * <GraphProvider
 *   elements={elements}
 *   onElementsChange={setElements}
 *   initialLinks={initialLinks}
 * >
 *   <Paper />
 * </GraphProvider>
 * ```
 *
 * 4. **Incremental-controlled mode:**
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

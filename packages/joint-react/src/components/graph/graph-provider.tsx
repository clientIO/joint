import type { dia } from '@joint/core';
import React, { useLayoutEffect } from 'react';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphStoreContext } from '../../context';
import { GraphStore } from '../../store';
import type { AutoSizeOrigin } from '../../store/graph-store';
import type { OnIncrementalCellsChange } from '../../store/graph-projection';
import type { ElementJSONInit, LinkJSONInit, CellInput } from '../../types/cell.types';

/** Cells array accepted by GraphProvider. */
type ProviderCells<Element extends ElementJSONInit, Link extends LinkJSONInit> = ReadonlyArray<
  Element | Link
>;

/**
 * Props common to every `GraphProvider` mode.
 * @template ElementData - User data attached to each element record.
 * @template LinkData - User data attached to each link record.
 */
export interface GraphProviderProps<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
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
  /**
   * Reference point that stays fixed when an auto-sized element's measured
   * size changes (via `useMeasureElement`). Mirrors CSS `transform-origin` semantics.
   * - `'top-left'` (default): element grows right/down.
   * - `'center'`: element grows symmetrically — its geometric center stays put.
   *
   * Only affects measurement-driven writes. Manual `cell.resize()`, interactive
   * resize tools, and direct `cell.set('size', ...)` calls are unaffected.
   * @default 'top-left'
   */
  readonly autoSizeOrigin?: AutoSizeOrigin;
  /** Pre-built `GraphStore` instance. When provided, GraphProvider does not own its lifecycle. */
  readonly store?: GraphStore<Element, Link>;

  /**
   * Initial cells for uncontrolled mode. Ignored if `cells` is provided. Should not
   */
  readonly initialCells?: ReadonlyArray<CellInput<Element, Link>>;
  readonly cells?: ProviderCells<Element, Link>;
  /** Notification-only callback — React state is NOT pushed back into the graph. */
  readonly onCellsChange?: (newCells: ProviderCells<Element, Link>) => void;
  /**
   * Notification fired with granular `added` / `changed` / `removed` sets
   * after each commit. Independent of controlled/uncontrolled mode.
   */
  readonly onIncrementalCellsChange?: OnIncrementalCellsChange<Element, Link>;
}

/**
 * Provider props normalised to the unparameterised base shape.
 *
 * Internally GraphProvider stores the `GraphStore` with default generics
 * (`ElementAttributes` / `LinkAttributes`). Each `useGraphStore<E, L>()` call
 * re-binds the generics on read — the runtime instance is the same.
 */
type GraphProviderBaseInternalProps = GraphProviderProps<ElementJSONInit, LinkJSONInit> & {
  ref?: React.Ref<dia.Graph | null>;
};

/**
 * Internal base component for GraphProvider.
 *
 * Operates exclusively on the base record shape so the runtime instance can
 * flow into the unparameterised `GraphStoreContext` without a variance cast.
 * The exported `GraphProvider` re-types this base to the caller's `<Element,
 * Link>` parameters.
 * @param props - GraphProvider props including optional forwarded ref.
 * @returns The rendered graph context provider or null while loading.
 */
function GraphBase(props: GraphProviderBaseInternalProps) {
  const {
    children,
    store,
    onIncrementalCellsChange,
    onCellsChange,
    ref: forwardedRef,
    graph,
    cellNamespace,
    cellModel,
    autoSizeOrigin,
    initialCells,
    cells,
  } = props;

  const isControlled = !!cells;

  const { isReady, ref } = useImperativeApi<GraphStore<ElementJSONInit, LinkJSONInit>, dia.Graph>(
    {
      instanceSelector: (instance) => instance.graph,
      forwardedRef,
      onLoad() {
        const graphStore =
          store ??
          new GraphStore<ElementJSONInit, LinkJSONInit>({
            graph,
            cellNamespace,
            cellModel,
            initialCells: cells ?? initialCells ?? [],
            autoSizeOrigin,
          });
        return {
          cleanup() {
            if (store) return;
            graphStore.destroy(!!graph);
          },
          instance: graphStore,
        };
      },
    },
    []
  );

  useLayoutEffect(() => {
    if (!isReady) return;
    ref.current.setOnIncrementalCellsChange((changeSet) => {
      onIncrementalCellsChange?.(changeSet);
      if (onCellsChange) {
        onCellsChange([...ref.current.graphProjection.cells.getAll()]);
        return;
      }
      if (isControlled) {
        ref.current.applyControlled(cells);
      }
    });
    if (isControlled) {
      ref.current.applyControlled(cells ?? []);
    }
  }, [isReady, onIncrementalCellsChange, onCellsChange, ref, isControlled, cells]);

  if (!isReady) {
    return null;
  }

  return <GraphStoreContext.Provider value={ref.current}>{children}</GraphStoreContext.Provider>;
}

/**
 * GraphProvider supplies graph context to its children.
 *
 * **Modes of operation:**
 *
 * 1. **Uncontrolled** (JointJS owns the graph after mount):
 * ```tsx
 * <GraphProvider initialCells={[...]}>
 *   <Paper />
 * </GraphProvider>
 * ```
 *
 * 2. **Controlled** (React owns the cells array):
 * ```tsx
 * const [cells, setCells] = useState<readonly CellRecord[]>([...]);
 * <GraphProvider cells={cells} onCellsChange={setCells}>
 *   <Paper />
 * </GraphProvider>
 * ```
 *
 * 3. **Incremental-notification** (external store, Redux/Zustand):
 * ```tsx
 * <GraphProvider onIncrementalCellsChange={(c) => dispatch(c)}>
 *   <Paper />
 * </GraphProvider>
 * ```
 * @see GraphProviderProps for all available props
 */
export const GraphProvider = GraphBase as <
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(
  props: GraphProviderProps<Element, Link> & {
    ref?: React.Ref<dia.Graph | null>;
  }
) => ReturnType<typeof GraphBase>;

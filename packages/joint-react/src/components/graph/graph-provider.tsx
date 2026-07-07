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
 * Props for {@link GraphProvider} — pick the graph source (existing
 * instance, initial cells, or a controlled cells array) and subscribe to changes.
 * @template Element - Shape of the element cells stored in the graph.
 * @template Link - Shape of the link cells stored in the graph.
 * @expand
 * @group Types
 */
export interface GraphProviderProps<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  /**
   * Pre-existing JointJS graph instance to use. If omitted, GraphProvider
   * creates a fresh `new dia.Graph(...)`.
   * @see [`dia.Graph`](https://docs.jointjs.com/api/dia/Graph)
   */
  readonly graph?: dia.Graph;
  /** React children rendered inside the provider, typically a `<Paper />`. */
  readonly children?: React.ReactNode;
  /**
   * Cell namespace passed to `new dia.Graph`. Your entries are merged on top of
   * the built-ins, so JointJS shapes and the `@joint/react` {@link ElementModel}
   * / {@link LinkModel} stay available even when you register custom shapes.
   * @default JointJS `shapes` plus the `@joint/react` cell models
   */
  readonly cellNamespace?: unknown;
  /**
   * Base model class used for every cell the graph constructs from JSON. Maps to
   * the (deprecated) `cellModel` option of `dia.Graph`; prefer `cellNamespace`,
   * which registers shapes by `type` and supports per-type model classes.
   * @see [`dia.Graph`](https://docs.jointjs.com/api/dia/Graph)
   */
  readonly cellModel?: typeof dia.Cell;
  /**
   * Reference point that stays fixed when an auto-sized element's measured
   * size changes (via {@link useMeasureElement}). Mirrors CSS `transform-origin` semantics.
   * - `'top-left'` (default): element grows right/down.
   * - `'center'`: element grows symmetrically, its geometric center stays put.
   *
   * Only affects measurement-driven writes. Manual `cell.resize()`, interactive
   * resize tools, and direct `cell.set('size', ...)` calls are unaffected.
   * @default 'top-left'
   */
  readonly autoSizeOrigin?: AutoSizeOrigin;
  /**
   * Pre-built `GraphStore` instance. When provided, GraphProvider does not own its lifecycle.
   * @hidden
   */
  readonly store?: GraphStore<Element, Link>;

  /**
   * Cells used to seed the graph once, at mount, for uncontrolled mode. Later
   * changes to this array are not applied. Ignored when `cells` is provided.
   * @see {@link CellInput}
   */
  readonly initialCells?: ReadonlyArray<CellInput<Element, Link>>;
  /**
   * Controlled cells array. Whenever this array changes, the graph is re-synced
   * to match it (and `initialCells` is ignored); passing the same reference on a
   * re-render does not re-sync. Pair it with `onCellsChange` to mirror user edits
   * back into your own state.
   */
  readonly cells?: ProviderCells<Element, Link>;
  /**
   * Fires after each graph change with the full, updated cells array. Use it to
   * keep external React state in sync with the graph; it is notification only
   * and does not itself write anything back into the graph.
   */
  readonly onCellsChange?: (newCells: ProviderCells<Element, Link>) => void;
  /**
   * Fires after each commit with the granular `added` / `changed` / `removed`
   * delta, so you can apply just the change to an external store (Redux, Zustand,
   * etc.). Works in both controlled and uncontrolled mode.
   * @see {@link IncrementalCellsChange}
   */
  readonly onIncrementalCellsChange?: OnIncrementalCellsChange<Element, Link>;
}

/**
 * Provider props normalised to the unparameterised base shape.
 *
 * Internally GraphProvider stores the `GraphStore` with default generics
 * (`ElementAttributes` / `LinkAttributes`). Each `useGraphStore<E, L>()` call
 * re-binds the generics on read, the runtime instance is the same.
 */
type GraphProviderBaseInternalProps = GraphProviderProps<ElementJSONInit, LinkJSONInit>;

/**
 * Internal base component for GraphProvider.
 *
 * Operates exclusively on the base record shape so the runtime instance can
 * flow into the unparameterised `GraphStoreContext` without a variance cast.
 * The exported {@link GraphProvider} re-types this base to the caller's `<Element,
 * Link>` parameters.
 * @param props - GraphProvider props.
 * @returns The rendered graph context provider or null while loading.
 */
function GraphBase(props: Readonly<GraphProviderBaseInternalProps>): React.ReactNode {
  const {
    children,
    store,
    onIncrementalCellsChange,
    onCellsChange,
    graph,
    cellNamespace,
    cellModel,
    autoSizeOrigin,
    initialCells,
    cells,
  } = props;

  const isControlled = !!cells;

  const { isReady, ref } = useImperativeApi<GraphStore<ElementJSONInit, LinkJSONInit>>(
    {
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
 * Creates (or adopts) a JointJS graph and shares it with every `<Paper>` and
 * graph hook rendered inside it. Mount it near the root of your diagram: hooks
 * like {@link useGraph}, {@link useCells}, and {@link useCell} read the graph
 * from its context and throw when used outside a provider.
 *
 * It works in three modes, depending on which props you pass: pass
 * `initialCells` to let JointJS own the graph after mount (uncontrolled), pass
 * `cells` + `onCellsChange` to drive the graph from React state (controlled), or
 * pass `onIncrementalCellsChange` to forward deltas to an external store.
 * @example Uncontrolled — seed once, JointJS owns the graph
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 *
 * // `renderElement` receives the element's `data` slice only — not its
 * // geometry. Read position/size with the context hooks (e.g. useCell) when
 * // you need them.
 * <GraphProvider
 *   initialCells={[{ id: '1', type: 'element', position: { x: 20, y: 20 }, size: { width: 80, height: 40 }, data: { label: 'A' } }]}
 * >
 *   <Paper renderElement={(data) => <rect width={80} height={40} rx={4} fill="#4763ff" />} />
 * </GraphProvider>
 * ```
 * @example Controlled — React state owns the cells
 * ```tsx
 * import { useState } from 'react';
 * import { GraphProvider, Paper, type CellRecord } from '@joint/react';
 *
 * const [cells, setCells] = useState<readonly CellRecord[]>([]);
 * <GraphProvider cells={cells} onCellsChange={setCells}>
 *   <Paper />
 * </GraphProvider>
 * ```
 * @example Incremental — forward deltas to an external store
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 *
 * <GraphProvider
 *   onIncrementalCellsChange={(delta) => {
 *     // forward the { added, changed, removed } delta to your external store
 *     store.apply(delta);
 *   }}
 * >
 *   <Paper />
 * </GraphProvider>
 * ```
 * @see {@link GraphProviderProps} for the full list of props.
 * @group Components
 */
export const GraphProvider = GraphBase as <
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(
  props: GraphProviderProps<Element, Link>
) => ReturnType<typeof GraphBase>;

import type { dia } from '@joint/core';
import React, { memo, useLayoutEffect, useRef } from 'react';
import { useLatestRef } from '../../hooks/use-latest-ref';
import { simpleScheduler } from '../../utils/scheduler';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphStoreContext } from '../../context';
import { GraphStore } from '../../store';
import type { AutoSizeOrigin } from '../../store/graph-store';
import type { OnIncrementalCellsChange } from '../../store/graph-projection';
import type { ElementJSONInit, LinkJSONInit, CellInput } from '../../types/cell.types';
import type { LayerRecord } from '../../types/layer.types';

/** Cells array accepted by GraphProvider. */
type ProviderCells<Element extends ElementJSONInit, Link extends LinkJSONInit> = ReadonlyArray<
  Element | Link
>;

/**
 * Props for {@link GraphProvider} — pick the graph source (existing
 * instance, initial cells, or a controlled cells array) and subscribe to changes.
 * @template Element - Shape of the element cells stored in the graph.
 * @template Link - Shape of the link cells stored in the graph.
 * @template LayerId - Union of the layer ids the diagram uses. Include the
 *   default `'cells'` layer: it always exists and `onLayersChange` reports it.
 * @expand
 * @group Types
 */
export interface GraphProviderProps<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
  LayerId extends string = string,
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

  /**
   * Layers to declare once, at mount, in paint order (index 0 is painted at the
   * bottom). Cells join a layer through their `layer` field. The default
   * `cells` layer always exists: omit it and it sits at the bottom, name it to
   * position it. Later changes to this array are not applied; use `layers`
   * for that, or `setLayers` / `setLayer` from {@link useGraph}.
   *
   * A cell must name a layer that exists — declared here, in `layers`, or
   * added through the graph — or joint-core throws when the cell is synced.
   * The membership field is always `layer`; a custom `config.layerAttribute`
   * is not supported by the React records.
   * @see {@link LayerRecord}
   */
  readonly initialLayers?: ReadonlyArray<LayerRecord<LayerId>>;
  /**
   * Controlled layers array, in paint order. Whenever this array changes the
   * graph's layers are reconciled to match it — added, reordered, updated, and
   * removed once empty; a layer that still holds cells is kept and a dev warning
   * names them. A new array with the same content is diffed and leaves the graph
   * untouched; passing the same reference does not re-run the diff. Pair it
   * with `onLayersChange`.
   */
  readonly layers?: ReadonlyArray<LayerRecord<LayerId>>;
  /**
   * Fires after any layer change with the full, ordered layers array —
   * including the default `cells` layer. Notification only; it writes nothing
   * back into the graph.
   */
  readonly onLayersChange?: (layers: ReadonlyArray<LayerRecord<LayerId>>) => void;
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
    initialLayers,
    layers,
    onLayersChange,
  } = props;

  const isControlled = !!cells;
  const hasControlledLayers = !!layers;
  const onLayersChangeRef = useLatestRef(onLayersChange);
  const layersRef = useLatestRef(layers);
  // Set for the duration of a React-origin layers apply so the subscription
  // below can tell an echo from a graph-origin change.
  const isApplyingLayersRef = useRef(false);
  const lastAppliedCellsRef = useRef<typeof cells>(undefined);
  // Layers are re-reconciled only when their reference changes, so a drag frame
  // in controlled mode does zero layer work. Cleared on a graph-origin change so
  // a parent that ignores it still gets its array re-applied on the next commit.
  const lastAppliedLayersRef = useRef<typeof layers>(undefined);

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
            initialLayers: layers ?? initialLayers,
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
    const { setOnIncrementalCellsChange, applyControlled, graphProjection } = ref.current;
    /** The controlled layers, or `undefined` when the same reference was already applied. */
    const layersToApply = () =>
      hasControlledLayers && layers !== lastAppliedLayersRef.current ? layers : undefined;
    setOnIncrementalCellsChange((changeSet) => {
      onIncrementalCellsChange?.(changeSet);
      if (onCellsChange) {
        onCellsChange(graphProjection.cells.getSnapshot());
        return;
      }
      if (isControlled) {
        applyControlled(cells, undefined, layersToApply());
      }
    });
    // Controlled layers ride along with controlled cells in ONE commit: joint-core
    // throws on a cell naming a layer that does not exist yet, and refuses to
    // remove a layer until its cells are gone — so the two cannot be applied by
    // separate effects. When the cells reference is unchanged nothing can have
    // left a layer, so a layers-only change skips the O(n) cells diff.
    if (isControlled) {
      const nextLayers = layersToApply();
      isApplyingLayersRef.current = true;
      if (cells === lastAppliedCellsRef.current) {
        if (nextLayers) ref.current.applyLayers(nextLayers);
      } else {
        applyControlled(cells ?? [], undefined, nextLayers);
      }
      isApplyingLayersRef.current = false;
      lastAppliedCellsRef.current = cells;
      lastAppliedLayersRef.current = layers;
    }
  }, [
    isReady,
    onIncrementalCellsChange,
    onCellsChange,
    ref,
    isControlled,
    hasControlledLayers,
    cells,
    layers,
  ]);

  // With uncontrolled cells nothing else applies controlled layers, so do it here.
  useLayoutEffect(() => {
    if (!isReady || isControlled || !hasControlledLayers) return;
    isApplyingLayersRef.current = true;
    ref.current.applyLayers(layers);
    isApplyingLayersRef.current = false;
    lastAppliedLayersRef.current = layers;
  }, [isReady, ref, isControlled, hasControlledLayers, layers]);

  // Subscribe once; the handler and the controlled array are read through refs
  // so an inline `onLayersChange` never re-subscribes.
  useLayoutEffect(() => {
    if (!isReady) return;
    const { applyLayers, graphProjection } = ref.current;
    // One closure for the life of the subscription: `simpleScheduler` dedupes
    // by identity, so a burst of graph-origin events reverts once, not per event.
    const revert = () => {
      const controlledLayers = layersRef.current;
      if (!controlledLayers) return;
      // A React-origin apply like the effects': its store re-read is an echo.
      isApplyingLayersRef.current = true;
      applyLayers(controlledLayers);
      isApplyingLayersRef.current = false;
    };
    return graphProjection.layers.subscribe(() => {
      // A React-origin apply re-reads the store synchronously; that is the
      // parent's own array coming back, not a change to report or revert.
      if (isApplyingLayersRef.current) return;
      // A graph-origin change: whatever the parent decides, its array must be
      // reconciled again on the next commit even if the reference is unchanged.
      lastAppliedLayersRef.current = undefined;
      const handler = onLayersChangeRef.current;
      if (handler) {
        handler(graphProjection.layers.getSnapshot());
        return;
      }
      // Controlled without a change handler: the parent's array is the truth,
      // so an imperative change is reverted — same contract as `cells`. Deferred
      // so the revert does not re-enter the notification loop that is running.
      simpleScheduler(revert);
    });
  }, [isReady, ref, layersRef, onLayersChangeRef]);

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
 * @example Layers — declare paint order once, or control it from state
 * ```tsx
 * import { useState } from 'react';
 * import { GraphProvider, Paper, type LayerRecord } from '@joint/react';
 *
 * type LayerId = 'background' | 'cells' | 'notes';
 * const [layers, setLayers] = useState<ReadonlyArray<LayerRecord<LayerId>>>([
 *   { id: 'background' },
 *   { id: 'cells' },
 *   { id: 'notes', visible: false },
 * ]);
 * // Cells join a layer through their `layer` field: { id: 'n1', type: 'element', layer: 'notes' }
 * <GraphProvider layers={layers} onLayersChange={setLayers} initialCells={cells}>
 *   <Paper />
 * </GraphProvider>
 * ```
 * @see {@link GraphProviderProps} for the full list of props.
 * @group Components
 */
export const GraphProvider = memo(GraphBase) as <
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
  LayerId extends string = string,
>(
  props: GraphProviderProps<Element, Link, LayerId>
) => ReturnType<typeof GraphBase>;

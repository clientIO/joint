import { useCallback, useMemo } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import {
  useSetCell,
  useSetCellData,
  useRemoveCell,
  useRemoveCells,
  useResetCells,
  useUpdateCells,
  type SetCell,
  type SetCellData,
} from './use-cell-setters';
import type { ArrayUpdate } from '../store/state-container';
import type {
  ElementJSONInit,
  LinkJSONInit,
  CellInput,
  CellRef,
} from '../types/cell.types';

/**
 * The shape of the graph's JSON export, as produced by `graph.toJSON()`.
 */
export type GraphJSON = dia.Graph.JSON;

/** Drops an untyped (`unknown`) `data` side so it doesn't collapse a union. */
type TypedData<Data> = unknown extends Data ? never : Data;

/**
 * `data` type for the handle's `setCellData`, derived from `useGraph`'s
 * `Element` / `Link` generics by reusing each record's `['data']`:
 * - both sides untyped → open `Record<string, unknown>` (keeps the no-generic
 *   `useGraph()` spreadable)
 * - one side typed → that side's data
 * - both sides typed → their union (narrow inside the updater)
 *
 * A cell id is opaque at the type level, so this cannot narrow element-vs-link
 * per call — it exposes the data shapes `useGraph` was told about.
 */
type HandleCellData<Element extends ElementJSONInit, Link extends LinkJSONInit> = [
  TypedData<Element['data']> | TypedData<Link['data']>,
] extends [never]
  ? Record<string, unknown>
  : TypedData<Element['data']> | TypedData<Link['data']>;

/**
 * Public imperative API returned by {@link useGraph}.
 *
 * Setters mirror JointJS `syncCells` / `removeCells` / `resetCells` semantics and
 * preserve reference identity where possible — every write wraps a graph batch
 * with the internal `isUpdateFromReact` flag so React-driven changes do not
 * echo back into the subscription pipeline.
 * @template Element - element record shape (e.g. `ElementRecord<MyData>` for
 *                    write input, `Computed<ElementRecord<MyData>>` for reads)
 * @template Link - link record shape (e.g. `LinkRecord<MyData>` /
 *                  `Computed<LinkRecord<MyData>>`)
 */
export interface GraphHandle<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  /** The JointJS graph instance. */
  readonly graph: dia.Graph;
  /**
   * Add or update a cell. Two forms:
   * - `setCell(record)` — `record.id` names the target. Existing cell:
   *   attributes merge over it. Missing cell: the cell is added.
   * - `setCell(id, (prev) => next)` — updater form. The updater is invoked
   *   once with the real previous record. A nullish `id`, or an `id` with no
   *   matching cell, warns in dev and no-ops (use the direct form to add).
   */
  readonly setCell: SetCell<Element, Link>;
  /**
   * Set a single cell's `data` field. Two forms, both keyed by cell id:
   * - `setCellData(id, data)` — replaces the cell's `data` with `data`.
   * - `setCellData(id, (prev) => next)` — updater form; `prev` is the current
   *   `data`, the return value replaces it (merge inside the updater for a
   *   partial update). A nullish `id`, or an `id` with no matching cell, warns
   *   in dev and no-ops.
   *
   * The `data` type is derived from the `useGraph<Element, Link>` generics (see
   * {@link HandleCellData}): typed records flow through, otherwise it falls back
   * to `Record<string, unknown>`. A cell id can't be narrowed to element-vs-link
   * at the type level, so when both are typed the updater sees their union —
   * narrow inside it. For a single fixed `data` shape, use the standalone
   * `useSetCellData<MyData>()` hook.
   */
  readonly setCellData: SetCellData<HandleCellData<Element, Link>>;
  /**
   * Remove a cell by id or dia.Cell reference. A nullish reference warns in dev
   * and no-ops; a reference that resolves to no cell is a silent no-op.
   */
  readonly removeCell: (cellRef?: CellRef | null) => void;
  /**
   * Remove multiple cells by id or dia.Cell reference. A nullish array warns in
   * dev and no-ops; references that resolve to no cell are silently skipped.
   */
  readonly removeCells: (cellRefs?: readonly CellRef[] | null) => void;
  /** Atomically replace the cell set. Accepts dia.Cell instances alongside records. */
  readonly resetCells: (input: ArrayUpdate<Element | Link, CellInput<Element, Link>>) => void;
  /** Apply an updater to the current cells array. Updater may return dia.Cell instances. */
  readonly updateCells: (
    updater: (previous: ReadonlyArray<Element | Link>) => ReadonlyArray<CellInput<Element, Link>>
  ) => void;
  /**
   * Predicate / type guard: true when the input resolves to an element cell.
   * Delegates to `GraphStore.isElement` — consults the graph's type registry
   * so any `dia.Element` subclass (including custom shapes) is recognised,
   * not just our default `ElementModel`.
   */
  readonly isElement: (input: Element | Link) => input is Element;
  /**
   * Predicate / type guard: true when the input resolves to a link cell.
   * Delegates to `GraphStore.isLink` — consults the graph's type registry so
   * any `dia.Link` subclass (including custom shapes) is recognised, not just
   * our default `LinkModel`.
   */
  readonly isLink: (input: Element | Link) => input is Link;
  /**
   * Serialize the graph to a plain JSON object.
   *
   * By default the output is **minimal**: attributes that match each cell's
   * `defaults` are dropped and empty `{}` placeholders are pruned everywhere
   * except inside `attrs` at the third nesting level (e.g.
   * `attrs.text.textWrap: {}` is a meaningful reset marker in JointJS shapes
   * and must survive). Pass `{ includeDefaults: true }` to keep every
   * attribute on every cell — no pruning is applied in that mode.
   */
  readonly exportToJSON: (options?: ExportToJSONOptions) => GraphJSON;
  /**
   * Replace the graph contents from a previously exported JSON object
   * (e.g. produced by {@link exportToJSON}). Triggers JointJS's `reset`
   * event so all React subscriptions resync automatically.
   */
  readonly importFromJSON: (json: GraphJSON) => void;
}

/** Options accepted by {@link GraphHandle.exportToJSON}. */
export interface ExportToJSONOptions {
  /**
   * When `true`, every attribute is preserved (defaults included) and no
   * empty-attribute pruning is applied. Defaults to `false` — minimal output:
   * defaults stripped, empties pruned (except `attrs.*.*`).
   */
  readonly includeDefaults?: boolean;
}

/**
 * Hook exposing the graph instance and the full unified cell-mutation API.
 *
 * All setters run through the internal `isUpdateFromReact` flag so listeners
 * do not echo React-driven changes back through the subscription pipeline.
 * `isElement` / `isLink` delegate to the `GraphStore` methods, which consult
 * the graph's type registry so custom cell types narrow correctly.
 * @template Element - element record shape (use `ElementRecord<MyData>` for input,
 *                    `Computed<ElementRecord<MyData>>` for read shapes)
 * @template Link - link record shape (use `LinkRecord<MyData>` /
 *                  `Computed<LinkRecord<MyData>>`)
 * @returns the imperative API described by {@link GraphHandle}
 */
export function useGraph<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(): GraphHandle<Element, Link> {
  const store = useGraphStore<Element, Link>();
  const { graph } = store;

  const setCell = useSetCell<Element, Link>();
  const setCellData = useSetCellData<HandleCellData<Element, Link>>();
  const removeCell = useRemoveCell();
  const removeCells = useRemoveCells();
  const resetCells = useResetCells<Element, Link>();
  const updateCells = useUpdateCells<Element, Link>();

  const exportToJSON = useCallback<GraphHandle<Element, Link>['exportToJSON']>(
    (options) => {
      if (options?.includeDefaults) {
        // Raw graph state — defaults kept, no pruning.
        // `cell.toJSON()` with no opts still strips `attrs` defaults
        // (built-in fallback `differentiateKeys = ['attrs']`), so we pass
        // `ignoreDefaults: false` explicitly to keep them.
        return graph.toJSON({ cellAttributes: { ignoreDefaults: false } });
      }
      return graph.toJSON({
        cellAttributes: {
          ignoreDefaults: true,
          // Drop every empty `{}` EXCEPT inside `attrs` at depth 3
          // (e.g. `attrs.text.textWrap: {}` is a meaningful reset marker).
          ignoreEmptyAttributes: (_key, path) => !(path[0] === 'attrs' && path.length === 3),
        },
      });
    },
    [graph]
  );

  const importFromJSON = useCallback<GraphHandle<Element, Link>['importFromJSON']>(
    (json) => {
      graph.fromJSON(json);
    },
    [graph]
  );

  return useMemo(
    () => ({
      graph,
      setCell,
      setCellData,
      removeCell,
      removeCells,
      resetCells,
      updateCells,
      isElement: store.isElement,
      isLink: store.isLink,
      exportToJSON,
      importFromJSON,
    }),
    [
      graph,
      store,
      setCell,
      setCellData,
      removeCell,
      removeCells,
      resetCells,
      updateCells,
      exportToJSON,
      importFromJSON,
    ]
  );
}

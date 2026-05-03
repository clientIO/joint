import { useCallback, useMemo } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import {
  useSetCell,
  useRemoveCell,
  useRemoveCells,
  useResetCells,
  useUpdateCells,
  type SetCell,
} from './use-cell-setters';
import type {
  ElementJSONInit,
  LinkJSONInit,
  CellId,
  CellUnion,
} from '../types/cell.types';

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
export interface UseGraphResult<
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
   *   once with the real previous record. Throws when no cell with `id`
   *   exists (use the direct form to add).
   */
  readonly setCell: SetCell<Element, Link>;
  /** Remove a cell by id. No-op when the id is missing. */
  readonly removeCell: (id: CellId) => void;
  /** Remove multiple cells by id. Missing ids are silently skipped. */
  readonly removeCells: (ids: readonly CellId[]) => void;
  /** Atomically replace the cell set. */
  readonly resetCells: (
    input:
      | ReadonlyArray<CellUnion<Element, Link>>
      | ((
          previous: ReadonlyArray<CellUnion<Element, Link>>
        ) => ReadonlyArray<CellUnion<Element, Link>>)
  ) => void;
  /** Apply an updater to the current cells array. */
  readonly updateCells: (
    updater: (
      previous: ReadonlyArray<CellUnion<Element, Link>>
    ) => ReadonlyArray<CellUnion<Element, Link>>
  ) => void;
  /**
   * Predicate / type guard: true when the input resolves to an element cell.
   * Delegates to `GraphStore.isElement` — consults the graph's type registry
   * so any `dia.Element` subclass (including custom shapes) is recognised,
   * not just our default `ElementModel`.
   */
  readonly isElement: (input: CellUnion<Element, Link>) => input is Element;
  /**
   * Predicate / type guard: true when the input resolves to a link cell.
   * Delegates to `GraphStore.isLink` — consults the graph's type registry so
   * any `dia.Link` subclass (including custom shapes) is recognised, not just
   * our default `LinkModel`.
   */
  readonly isLink: (input: CellUnion<Element, Link>) => input is Link;
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
  readonly exportToJSON: (options?: ExportToJSONOptions) => ReturnType<dia.Graph['toJSON']>;
  /**
   * Replace the graph contents from a previously exported JSON object
   * (e.g. produced by {@link exportToJSON}). Triggers JointJS's `reset`
   * event so all React subscriptions resync automatically.
   */
  readonly importFromJSON: (json: Parameters<dia.Graph['fromJSON']>[0]) => void;
}

/** Options accepted by {@link UseGraphResult.exportToJSON}. */
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
 * @returns the imperative API described by {@link UseGraphResult}
 */
export function useGraph<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(): UseGraphResult<Element, Link> {
  const store = useGraphStore<Element, Link>();
  const { graph } = store;

  const setCell = useSetCell<Element, Link>();
  const removeCell = useRemoveCell();
  const removeCells = useRemoveCells();
  const resetCells = useResetCells<Element, Link>();
  const updateCells = useUpdateCells<Element, Link>();

  const exportToJSON = useCallback<UseGraphResult<Element, Link>['exportToJSON']>(
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

  const importFromJSON = useCallback<UseGraphResult<Element, Link>['importFromJSON']>(
    (json) => {
      graph.fromJSON(json);
    },
    [graph]
  );

  return useMemo(
    () => ({
      graph,
      setCell,
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
      removeCell,
      removeCells,
      resetCells,
      updateCells,
      exportToJSON,
      importFromJSON,
    ]
  );
}

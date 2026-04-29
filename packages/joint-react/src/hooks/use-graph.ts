import { useMemo } from 'react';
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
  DiaElementAttributes,
  DiaLinkAttributes,
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
  Element extends DiaElementAttributes = DiaElementAttributes,
  Link extends DiaLinkAttributes = DiaLinkAttributes,
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
  Element extends DiaElementAttributes = DiaElementAttributes,
  Link extends DiaLinkAttributes = DiaLinkAttributes,
>(): UseGraphResult<Element, Link> {
  const store = useGraphStore<Element, Link>();
  const { graph } = store;

  const setCell = useSetCell<Element, Link>();
  const removeCell = useRemoveCell();
  const removeCells = useRemoveCells();
  const resetCells = useResetCells<Element, Link>();
  const updateCells = useUpdateCells<Element, Link>();

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
    }),
    [graph, store, setCell, removeCell, removeCells, resetCells, updateCells]
  );
}

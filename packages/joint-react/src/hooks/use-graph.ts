import { useMemo } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import {
  useAddCell,
  useAddCells,
  useSetCell,
  useRemoveCell,
  useRemoveCells,
  useResetCells,
  useUpdateCells,
} from './use-cell-setters';
import type { CellId, CellRecord, Cells } from '../types/cell.types';

/**
 * Public imperative API returned by {@link useGraph}.
 *
 * Setters mirror JointJS `syncCells` / `addCells` / `removeCells` semantics and
 * preserve reference identity where possible — every write wraps a graph batch
 * with the internal `isUpdateFromReact` flag so React-driven changes do not
 * echo back into the subscription pipeline.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 */
export interface UseGraphResult<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  /** The JointJS graph instance. */
  readonly graph: dia.Graph;
  /** Add one cell. Throws if a cell with the same id already exists. */
  readonly addCell: (cell: CellRecord<ElementData, LinkData>) => void;
  /** Add many cells atomically. Throws on any id collision before writing anything. */
  readonly addCells: (cells: Cells<ElementData, LinkData>) => void;
  /**
   * Update an existing cell. Takes either a full `CellRecord` (id via
   * `cell.id`) or an updater `(prev: CellRecord) => CellRecord` that must
   * return a record whose `id` matches the target. Merges over existing
   * attributes. Throws if the id does not resolve to a cell.
   */
  readonly setCell: (
    input:
      | CellRecord<ElementData, LinkData>
      | ((
          previous: CellRecord<ElementData, LinkData>
        ) => CellRecord<ElementData, LinkData>)
  ) => void;
  /** Remove a cell by id. No-op when the id is missing. */
  readonly removeCell: (id: CellId) => void;
  /** Remove multiple cells by id. Missing ids are silently skipped. */
  readonly removeCells: (ids: readonly CellId[]) => void;
  /** Atomically replace the cell set. */
  readonly resetCells: (
    input:
      | Cells<ElementData, LinkData>
      | ((previous: Cells<ElementData, LinkData>) => Cells<ElementData, LinkData>)
  ) => void;
  /** Apply an updater to the current cells array. */
  readonly updateCells: (
    updater: (previous: Cells<ElementData, LinkData>) => Cells<ElementData, LinkData>
  ) => void;
  /**
   * Predicate / type guard: true when the input resolves to an element cell.
   * Delegates to `GraphStore.isElement` — consults the graph's type registry
   * so any `dia.Element` subclass (including custom shapes) is recognised,
   * not just our default `ElementModel`.
   */
  readonly isElement: (input: CellRecord<ElementData, LinkData>) => boolean;
  /**
   * Predicate / type guard: true when the input resolves to a link cell.
   * Delegates to `GraphStore.isLink` — consults the graph's type registry so
   * any `dia.Link` subclass (including custom shapes) is recognised, not just
   * our default `LinkModel`.
   */
  readonly isLink: (input: CellRecord<ElementData, LinkData>) => boolean;
}

/**
 * Hook exposing the graph instance and the full unified cell-mutation API.
 *
 * All setters run through the internal `isUpdateFromReact` flag so listeners
 * do not echo React-driven changes back through the subscription pipeline.
 * `isElement` / `isLink` delegate to the `GraphStore` methods, which consult
 * the graph's type registry so custom cell types narrow correctly.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @returns the imperative API described by {@link UseGraphResult}
 */
export function useGraph<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(): UseGraphResult<ElementData, LinkData> {
  const store = useGraphStore<ElementData, LinkData>();
  const { graph } = store;

  const addCell = useAddCell<ElementData, LinkData>();
  const addCells = useAddCells<ElementData, LinkData>();
  const setCell = useSetCell<ElementData, LinkData>();
  const removeCell = useRemoveCell();
  const removeCells = useRemoveCells();
  const resetCells = useResetCells<ElementData, LinkData>();
  const updateCells = useUpdateCells<ElementData, LinkData>();

  return useMemo(
    () => ({
      graph,
      addCell,
      addCells,
      setCell,
      removeCell,
      removeCells,
      resetCells,
      updateCells,
      isElement: store.isElement,
      isLink: store.isLink,
    }),
    [graph, store, addCell, addCells, setCell, removeCell, removeCells, resetCells, updateCells]
  );
}

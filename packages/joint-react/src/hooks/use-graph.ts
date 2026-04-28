import { useMemo } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import {
  useSetCell,
  useRemoveCell,
  useRemoveCells,
  useResetCells,
  useUpdateCells,
} from './use-cell-setters';
import type { ElementAttributes, LinkAttributes, CellId } from '../types/cell.types';

/**
 * Union of the records this `useGraph` instance accepts as cell input —
 * either a typed `Element` or `Link` record. To support custom cell types,
 * extend the union at the call site (e.g. `useGraph<MyElement | MyCustom, MyLink>`).
 * @template Element - element record shape
 * @template Link - link record shape
 */
export type GraphCellInput<
  Element extends ElementAttributes = ElementAttributes,
  Link extends LinkAttributes = LinkAttributes,
> = Element | Link;

/**
 * Public imperative API returned by {@link useGraph}.
 *
 * Setters mirror JointJS `syncCells` / `removeCells` / `resetCells` semantics and
 * preserve reference identity where possible — every write wraps a graph batch
 * with the internal `isUpdateFromReact` flag so React-driven changes do not
 * echo back into the subscription pipeline.
 * @template Element - element record shape (e.g. `ElementRecord<MyData>` for
 *                    write input, `ResolvedElementRecord<MyData>` for reads)
 * @template Link - link record shape (e.g. `LinkRecord<MyData>` /
 *                  `ResolvedLinkRecord<MyData>`)
 */
export interface UseGraphResult<
  Element extends ElementAttributes = ElementAttributes,
  Link extends LinkAttributes = LinkAttributes,
> {
  /** The JointJS graph instance. */
  readonly graph: dia.Graph;
  /**
   * Add or update a cell. Takes either a full cell record (id via
   * `cell.id`) or an updater `(prev) => next` that must return a record
   * whose `id` matches the target. If a cell with the given `id` exists,
   * attributes merge over it; otherwise the cell is added.
   * Throws when the input has no `id`.
   */
  readonly setCell: (
    input:
      | GraphCellInput<Element, Link>
      | ((previous: GraphCellInput<Element, Link>) => GraphCellInput<Element, Link>)
  ) => void;
  /** Remove a cell by id. No-op when the id is missing. */
  readonly removeCell: (id: CellId) => void;
  /** Remove multiple cells by id. Missing ids are silently skipped. */
  readonly removeCells: (ids: readonly CellId[]) => void;
  /** Atomically replace the cell set. */
  readonly resetCells: (
    input:
      | ReadonlyArray<GraphCellInput<Element, Link>>
      | ((
          previous: ReadonlyArray<GraphCellInput<Element, Link>>
        ) => ReadonlyArray<GraphCellInput<Element, Link>>)
  ) => void;
  /** Apply an updater to the current cells array. */
  readonly updateCells: (
    updater: (
      previous: ReadonlyArray<GraphCellInput<Element, Link>>
    ) => ReadonlyArray<GraphCellInput<Element, Link>>
  ) => void;
  /**
   * Predicate / type guard: true when the input resolves to an element cell.
   * Delegates to `GraphStore.isElement` — consults the graph's type registry
   * so any `dia.Element` subclass (including custom shapes) is recognised,
   * not just our default `ElementModel`.
   */
  readonly isElement: (input: GraphCellInput<Element, Link>) => boolean;
  /**
   * Predicate / type guard: true when the input resolves to a link cell.
   * Delegates to `GraphStore.isLink` — consults the graph's type registry so
   * any `dia.Link` subclass (including custom shapes) is recognised, not just
   * our default `LinkModel`.
   */
  readonly isLink: (input: GraphCellInput<Element, Link>) => boolean;
}

/**
 * Hook exposing the graph instance and the full unified cell-mutation API.
 *
 * All setters run through the internal `isUpdateFromReact` flag so listeners
 * do not echo React-driven changes back through the subscription pipeline.
 * `isElement` / `isLink` delegate to the `GraphStore` methods, which consult
 * the graph's type registry so custom cell types narrow correctly.
 * @template Element - element record shape (use `ElementRecord<MyData>` for input,
 *                    `ResolvedElementRecord<MyData>` for read shapes)
 * @template Link - link record shape (use `LinkRecord<MyData>` /
 *                  `ResolvedLinkRecord<MyData>`)
 * @returns the imperative API described by {@link UseGraphResult}
 */
export function useGraph<
  Element extends ElementAttributes = ElementAttributes,
  Link extends LinkAttributes = LinkAttributes,
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

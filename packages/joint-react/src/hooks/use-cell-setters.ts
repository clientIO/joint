import { useCallback } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import { mapCellToAttributes } from '../state/data-mapping';
import type {
  ElementJSONInit,
  LinkJSONInit,
  CellId,
} from '../types/cell.types';
/**
 * Updater function form for {@link SetCell}. Receives the current cell record
 * (read from the cells container) and returns the next record. Invoked
 * exactly once with the real previous value.
 * @template Element - element record shape
 * @template Link - link record shape
 */
export type SetCellUpdater<
  Element extends ElementJSONInit,
  Link extends LinkJSONInit,
> = (previous: Element | Link) => Element | Link;

/**
 * Function returned by {@link useSetCell}. Two forms:
 * - `setCell(record)` — direct form. `record.id` names the target. Cell
 *   exists: attributes merge over it. Cell missing: cell is added.
 * - `setCell(id, updater)` — updater form. Throws when no cell with `id`
 *   exists. The updater is called once with the real previous record.
 * @template Element - element record shape
 * @template Link - link record shape
 */
export interface SetCell<
  Element extends ElementJSONInit,
  Link extends LinkJSONInit,
> {
  (record: Element | Link): void;
  (id: CellId, updater: SetCellUpdater<Element, Link>): void;
}

/**
 * Returns a function that adds-or-updates a cell. See {@link SetCell} for
 * the supported call forms.
 * @template Element - element record shape
 * @template Link - link record shape
 * @returns memoized setCell setter
 */
export function useSetCell<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(): SetCell<Element, Link> {
  const store = useGraphStore<Element, Link>();
  const { graph } = store;
  const setCell = useCallback(
    (
      argument1: Element | Link | CellId,
      argument2?: SetCellUpdater<Element, Link>
    ) => {
      const next = resolveSetCellInput(argument1, argument2, store);
      if (next.id === undefined) {
        throw new Error('setCell: input record must have an `id` to identify the target cell');
      }
      const previous = store.graphView.cells.get(next.id);
      const diaCell = graph.getCell(next.id);
      if (!previous || !diaCell) {
        graph.addCell(mapCellToAttributes(next, graph));
        return;
      }
      const merged = {
        ...previous,
        ...next,
        id: previous.id,
        type: previous.type,
      };
      const attributes = mapCellToAttributes(merged, graph);
      diaCell.set(attributes);
    },
    [graph, store]
  );
  return setCell as SetCell<Element, Link>;
}

/**
 * Resolves a `setCell` invocation to a concrete cell record.
 *
 * - Two-arg form `setCell(id, updater)`: looks up the previous cell by id
 *   and invokes the updater once with the real previous record. Throws when
 *   no cell with the given id exists — updater form implies the cell exists.
 * - One-arg form `setCell(record)`: returns the record as-is. The caller
 *   decides add vs update by checking the cells container.
 * @template Element - element record shape
 * @template Link - link record shape
 * @param argument1 - cell record (direct form) or cell id (updater form)
 * @param argument2 - updater function (updater form only)
 * @param store - graph store used to read the previous record for the updater form
 * @returns resolved cell record
 */
function resolveSetCellInput<Element extends ElementJSONInit, Link extends LinkJSONInit>(
  argument1: Element | Link | CellId,
  argument2: SetCellUpdater<Element, Link> | undefined,
  store: ReturnType<typeof useGraphStore<Element, Link>>
): Element | Link {
  if (argument2 === undefined) return argument1 as Element | Link;
  const id = argument1 as CellId;
  const previous = store.graphView.cells.get(id);
  if (!previous) {
    throw new Error(
      `setCell: cannot update — no cell with id "${String(id)}" exists. ` +
        'Use the direct form `setCell({ id, type, ... })` to add a new cell.'
    );
  }
  return argument2(previous);
}

/**
 * Returns a function that removes one cell by id.
 * No-op if the id does not exist.
 * @returns memoized removeCell setter
 */
export function useRemoveCell() {
  const store = useGraphStore();
  const { graph } = store;
  return useCallback(
    (id: CellId) => {
      const diaCell = graph.getCell(id);
      if (!diaCell) return;
      graph.removeCells([diaCell]);
    },
    [graph]
  );
}

/**
 * Returns a function that removes multiple cells by id.
 * Ignores missing ids.
 * @returns memoized removeCells setter
 */
export function useRemoveCells() {
  const store = useGraphStore();
  const { graph } = store;
  return useCallback(
    (ids: readonly CellId[]) => {
      const toRemove: dia.Cell[] = [];
      for (const id of ids) {
        const cell = graph.getCell(id);
        if (cell) toRemove.push(cell);
      }
      if (toRemove.length === 0) return;
      graph.removeCells(toRemove);
    },
    [graph]
  );
}

/**
 * Returns a function that atomically replaces all cells.
 * Accepts either a new array or an updater receiving the current snapshot.
 * Maps the next cells through `mapCellToAttributes` and calls
 * `graph.resetCells` directly — equivalent to JointJS' bulk-reset semantics.
 * @template Element - element record shape
 * @template Link - link record shape
 * @returns memoized resetCells setter
 */
export function useResetCells<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>() {
  const store = useGraphStore<Element, Link>();
  const { graph } = store;
  return useCallback(
    (
      input:
        | ReadonlyArray<Element | Link>
        | ((
            previous: ReadonlyArray<Element | Link>
          ) => ReadonlyArray<Element | Link>)
    ) => {
      const current = store.graphView.cells.getAll();
      const next = typeof input === 'function' ? input(current) : input;
      const mapped: dia.Cell.JSONInit[] = next.map((cell) => mapCellToAttributes(cell, graph));
      graph.resetCells(mapped);
    },
    [graph, store]
  );
}

/**
 * Returns a function that applies an updater to the current cells array.
 * Shorthand for `resetCells(prev => updater(prev))` — removals happen via `filter`.
 * @template Element - element record shape
 * @template Link - link record shape
 * @returns memoized updateCells setter
 */
export function useUpdateCells<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>() {
  const store = useGraphStore<Element, Link>();
  return useCallback(
    (
      updater: (
        previous: ReadonlyArray<Element | Link>
      ) => ReadonlyArray<Element | Link>
    ) => {
      const current = store.graphView.cells.getAll();
      store.applyControlled(updater(current));
    },
    [store]
  );
}

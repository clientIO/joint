import { useCallback } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import { mapCellToAttributes } from '../state/data-mapping';
import type { ElementAttributes, LinkAttributes, CellId } from '../types/cell.types';

// Why no `{ isUpdateFromReact: true }` flag on these imperative setters:
// the flag is used only by the controlled-mode `graphView.updateGraph` path
// to break the `parent state ↔ graph` echo loop. Per-cell setters must NOT
// suppress the listener — otherwise their mutations never reach the cells
// container, and every hook that reads via `useCells` / `useCell`
// returns stale data. A controlled
// `<input value={useCells(id).data.label}>` wired to `setCell` would reset
// every keystroke (the bug this note guards).

/** Cell record union accepted by setters. */
type SettableCell<Element extends ElementAttributes, Link extends LinkAttributes> = Element | Link;

/** Read-only cell array used by reset/update setters. */
type SettableCells<Element extends ElementAttributes, Link extends LinkAttributes> = ReadonlyArray<
  SettableCell<Element, Link>
>;

/**
 * Returns a function that adds-or-updates a cell.
 *
 * Accepts either:
 * - a full cell record — `cell.id` names the target. If a cell with that id
 *   exists, attributes are merged over it; otherwise the cell is added.
 * - an updater `(prev) => next` — implies the cell exists.
 *   The updater receives the current record (read from the cells container)
 *   and must return a record whose `id` matches the target.
 *
 * Throws when the input has no `id`.
 * @template Element - element record shape
 * @template Link - link record shape
 * @returns memoized setCell setter
 */
export function useSetCell<
  Element extends ElementAttributes = ElementAttributes,
  Link extends LinkAttributes = LinkAttributes,
>() {
  const store = useGraphStore<Element, Link>();
  const { graph } = store;
  return useCallback(
    (
      input:
        | SettableCell<Element, Link>
        | ((previous: SettableCell<Element, Link>) => SettableCell<Element, Link>)
    ) => {
      const next = resolveSetCellInput(input, store);
      if (next.id === undefined) {
        throw new Error('setCell: input record must have an `id` to identify the target cell');
      }
      const previous = store.graphView.cells.get(next.id);
      const diaCell = graph.getCell(next.id);
      // Add path: no existing cell — map the input directly and add it.
      if (!previous || !diaCell) {
        graph.addCell(mapCellToAttributes(next, graph));
        return;
      }
      // Update path: merge over the existing record, preserving id/type.
      const merged = {
        ...previous,
        ...next,
        id: previous.id,
        type: previous.type,
      } as SettableCell<Element, Link>;
      const attributes = mapCellToAttributes(merged, graph);
      diaCell.set(attributes as dia.Cell.Attributes);
    },
    [graph, store]
  );
}

/**
 * Resolves a `setCell` input to a concrete cell record.
 *
 * Function form: runs the updater with the current record read from the cells
 * container. Throws if the updater is called for an id that doesn't resolve
 * — we can't call the updater without a prev, and an updater form implies
 * "update this existing cell".
 *
 * Direct form: returns the record as-is. For the direct form we don't need
 * prev — `setCell` will look it up and error if missing.
 *
 * The slightly-awkward "updater must know the id" constraint falls out of
 * `setCell` being stateless and not tied to `CellIdContext`: we can't resolve
 * an id out of thin air, so the updater must return a cell whose `id`
 * identifies the target. We call the updater once with `previous` read by
 * the caller (below), so its return `id` must equal `previous.id`.
 * @template Element - element record shape
 * @template Link - link record shape
 * @param input - direct cell record or `(prev) => next` updater
 * @param store - graph store used to read `prev` for the updater form
 * @returns resolved cell record
 */
function resolveSetCellInput<Element extends ElementAttributes, Link extends LinkAttributes>(
  input:
    | SettableCell<Element, Link>
    | ((previous: SettableCell<Element, Link>) => SettableCell<Element, Link>),
  store: ReturnType<typeof useGraphStore<Element, Link>>
): SettableCell<Element, Link> {
  if (typeof input !== 'function') return input;
  // Updater form: we need `previous` to call it. Without an explicit id the
  // only way to discover the target is to require that the updater's
  // returned record identifies itself — so we first call with an empty-id
  // placeholder, look up the real previous by the returned id, then invoke
  // the updater again with the actual previous.
  const placeholder = { id: '', type: '' } as unknown as SettableCell<Element, Link>;
  const firstPass = input(placeholder);
  if (firstPass.id === undefined) return firstPass;
  const previous = store.graphView.cells.get(firstPass.id);
  if (!previous) return firstPass;
  return input(previous);
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
  Element extends ElementAttributes = ElementAttributes,
  Link extends LinkAttributes = LinkAttributes,
>() {
  const store = useGraphStore<Element, Link>();
  const { graph } = store;
  return useCallback(
    (
      input:
        | SettableCells<Element, Link>
        | ((previous: SettableCells<Element, Link>) => SettableCells<Element, Link>)
    ) => {
      const current = store.graphView.cells.getAll() as SettableCells<Element, Link>;
      const next = typeof input === 'function' ? input(current) : input;
      const mapped: dia.Cell.JSON[] = next.map((cell) => mapCellToAttributes(cell, graph));
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
  Element extends ElementAttributes = ElementAttributes,
  Link extends LinkAttributes = LinkAttributes,
>() {
  const store = useGraphStore<Element, Link>();
  return useCallback(
    (updater: (previous: SettableCells<Element, Link>) => SettableCells<Element, Link>) => {
      const current = store.graphView.cells.getAll() as SettableCells<Element, Link>;
      store.applyControlled(updater(current));
    },
    [store]
  );
}

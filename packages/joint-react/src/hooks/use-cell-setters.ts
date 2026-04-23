import { useCallback } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import { mapCellToAttributes } from '../state/data-mapping';
import type { CellId, CellRecord, Cells } from '../types/cell.types';

// Why no `{ isUpdateFromReact: true }` flag on these imperative setters:
// the flag is used only by the controlled-mode `graphView.updateGraph` path
// to break the `parent state ↔ graph` echo loop. Per-cell setters must NOT
// suppress the listener — otherwise their mutations never reach the cells
// container, and every hook that reads via `useCells` / `useCell` /
// `useElement` / `useLink` returns stale data. A controlled
// `<input value={useCells(id).data.label}>` wired to `setCell` would reset
// every keystroke (the bug this note guards).

/**
 * Returns a function that adds one cell to the graph.
 * Throws if the id already exists.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @returns memoized addCell setter
 */
export function useAddCell<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>() {
  const store = useGraphStore<ElementData, LinkData>();
  const { graph } = store;
  return useCallback(
    (cell: CellRecord<ElementData, LinkData>) => {
      if (graph.getCell(cell.id)) {
        throw new Error(`addCell: a cell with id "${String(cell.id)}" already exists`);
      }
      graph.addCell(mapCellToAttributes(cell, graph));
    },
    [graph]
  );
}

/**
 * Returns a function that adds many cells atomically.
 * Throws if any id already exists (pre-flight check, no partial write).
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @returns memoized addCells setter
 */
export function useAddCells<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>() {
  const store = useGraphStore<ElementData, LinkData>();
  const { graph } = store;
  return useCallback(
    (cells: Cells<ElementData, LinkData>) => {
      for (const cell of cells) {
        if (graph.getCell(cell.id)) {
          throw new Error(`addCells: a cell with id "${String(cell.id)}" already exists`);
        }
      }
      graph.startBatch('react.addCells');
      try {
        for (const cell of cells) {
          graph.addCell(mapCellToAttributes(cell, graph));
        }
      } finally {
        graph.stopBatch('react.addCells');
      }
    },
    [graph]
  );
}

/**
 * Returns a function that updates an existing cell.
 *
 * Accepts either:
 * - a full `CellRecord` — `cell.id` names the target and merges over the
 *   existing attributes; OR
 * - an updater `(prev: CellRecord) => CellRecord` — receives the current
 *   record (read from the cells container) and must return a record whose
 *   `id` matches. The returned record replaces-via-merge.
 *
 * Throws when the id does not resolve to an existing cell.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @returns memoized setCell setter
 */
export function useSetCell<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>() {
  const store = useGraphStore<ElementData, LinkData>();
  const { graph } = store;
  return useCallback(
    (
      input:
        | CellRecord<ElementData, LinkData>
        | ((
            previous: CellRecord<ElementData, LinkData>
          ) => CellRecord<ElementData, LinkData>)
    ) => {
      const next = resolveSetCellInput(input, store);
      const previous = store.graphView.cells.get(next.id);
      if (!previous) {
        throw new Error(`setCell: no cell with id "${String(next.id)}"`);
      }
      const merged = {
        ...previous,
        ...next,
        id: previous.id,
        type: previous.type,
      } as CellRecord<ElementData, LinkData>;
      const attributes = mapCellToAttributes(merged, graph);
      const diaCell = graph.getCell(next.id);
      if (!diaCell) {
        graph.addCell(attributes);
        return;
      }
      diaCell.set(attributes as dia.Cell.Attributes);
    },
    [graph, store]
  );
}

/**
 * Resolves a `setCell` input to a concrete `CellRecord`.
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
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @param input - direct CellRecord or `(prev) => CellRecord` updater
 * @param store - graph store used to read `prev` for the updater form
 * @returns resolved CellRecord
 */
function resolveSetCellInput<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(
  input:
    | CellRecord<ElementData, LinkData>
    | ((
        previous: CellRecord<ElementData, LinkData>
      ) => CellRecord<ElementData, LinkData>),
  store: ReturnType<typeof useGraphStore<ElementData, LinkData>>
): CellRecord<ElementData, LinkData> {
  if (typeof input !== 'function') return input;
  // Updater form: we need `previous` to call it. Without an explicit id the
  // only way to discover the target is to require that the updater's
  // returned record identifies itself — so we first call with an empty-id
  // placeholder, look up the real previous by the returned id, then invoke
  // the updater again with the actual previous.
  const placeholder = { id: '', type: '' } as unknown as CellRecord<ElementData, LinkData>;
  const firstPass = input(placeholder);
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
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @returns memoized resetCells setter
 */
export function useResetCells<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>() {
  const store = useGraphStore<ElementData, LinkData>();
  return useCallback(
    (
      input:
        | Cells<ElementData, LinkData>
        | ((previous: Cells<ElementData, LinkData>) => Cells<ElementData, LinkData>)
    ) => {
      const current = store.graphView.cells.getAll() as Cells<ElementData, LinkData>;
      const next = typeof input === 'function' ? input(current) : input;
      store.applyControlled(next);
    },
    [store]
  );
}

/**
 * Returns a function that applies an updater to the current cells array.
 * Shorthand for `resetCells(prev => updater(prev))` — removals happen via `filter`.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @returns memoized updateCells setter
 */
export function useUpdateCells<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>() {
  const store = useGraphStore<ElementData, LinkData>();
  return useCallback(
    (updater: (previous: Cells<ElementData, LinkData>) => Cells<ElementData, LinkData>) => {
      const current = store.graphView.cells.getAll() as Cells<ElementData, LinkData>;
      store.applyControlled(updater(current));
    },
    [store]
  );
}

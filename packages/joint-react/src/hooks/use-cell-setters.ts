import { useCallback } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import { mapCellToAttributes } from '../state/data-mapping';
import type {
  ElementJSONInit,
  LinkJSONInit,
  CellId,
  CellInput,
  CellRef,
} from '../types/cell.types';
import { type ArrayUpdate } from '../store/state-container';
import { cellInputToRecord, cellInputToModel } from '../utils/normalize-cell-input';

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
 * Function exposed by `GraphHandle.setCell`. Three forms:
 * - `setCell(record)` — direct form. `record.id` names the target. Cell
 *   exists: attributes merge over it. Cell missing: cell is added.
 * - `setCell(diaCell)` — dia.Cell form. The cell is converted to a record
 *   and handled like the direct form.
 * - `setCell(id, updater)` — updater form. Throws when no cell with `id`
 *   exists. The updater is called once with the real previous record.
 * @template Element - element record shape
 * @template Link - link record shape
 */
export interface SetCell<
  Element extends ElementJSONInit,
  Link extends LinkJSONInit,
> {
  (record: CellInput<Element, Link>): void;
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
      argument1: CellInput<Element, Link> | CellId,
      argument2?: SetCellUpdater<Element, Link>
    ) => {
      const next = resolveSetCellInput(argument1, argument2, store);
      if (next.id === undefined) {
        throw new Error('setCell: input record must have an `id` to identify the target cell');
      }
      const previous = store.graphProjection.cells.get(next.id);
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
  argument1: CellInput<Element, Link> | CellId,
  argument2: SetCellUpdater<Element, Link> | undefined,
  store: ReturnType<typeof useGraphStore<Element, Link>>
): Element | Link {
  if (argument2 === undefined) return cellInputToRecord<Element, Link>(argument1 as CellInput<Element, Link>);
  const id = argument1 as CellId;
  const previous = store.graphProjection.cells.get(id);
  if (!previous) {
    throw new Error(
      `setCell: cannot update — no cell with id "${String(id)}" exists. ` +
        'Use the direct form `setCell({ id, type, ... })` to add a new cell.'
    );
  }
  return argument2(previous);
}

/**
 * Updater form for {@link SetCellData}. Receives the cell's current `data` and
 * returns the next `data`. The return value replaces `data` wholesale — perform
 * a partial update by merging inside the updater
 * (`(prev) => ({ ...prev, ...patch })`).
 * @template Data - cell data shape
 */
export type SetCellDataUpdater<Data> = (previousData: Data) => Data;

/**
 * Function exposed by `GraphHandle.setCellData` and returned by
 * {@link useSetCellData}. Two forms, both keyed by cell id:
 * - `setCellData(id, data)` — replaces the cell's `data` with `data`.
 * - `setCellData(id, (prev) => next)` — updater form; `prev` is the current
 *   `data`, the return value replaces it.
 *
 * Both forms throw when no cell with `id` exists — updating data implies the
 * cell is already on the graph (use `setCell` to add a new one). The updater
 * overload is listed first so a function argument matches it; any non-function
 * argument falls through to the direct form.
 * @template Data - cell data shape (defaults to an open `Record<string, unknown>`)
 */
export interface SetCellData<Data = Record<string, unknown>> {
  (id: CellId, updater: SetCellDataUpdater<Data>): void;
  (id: CellId, data: Data): void;
}

/**
 * Returns a function that sets a single cell's `data` field. See
 * {@link SetCellData} for the supported call forms. Throws when the target cell
 * does not exist.
 *
 * Writes `data` directly on the `dia.Cell`, so JointJS fires `change:data` and
 * every React subscription resyncs — no full-record merge is involved.
 * @template Data - cell data shape (defaults to an open `Record<string, unknown>`)
 * @returns memoized setCellData setter
 */
export function useSetCellData<Data = Record<string, unknown>>(): SetCellData<Data> {
  const store = useGraphStore();
  const { graph } = store;
  return useCallback<SetCellData<Data>>(
    (id: CellId, dataOrUpdater: unknown) => {
      const previous = store.graphProjection.cells.get(id);
      const diaCell = graph.getCell(id);
      if (!previous || !diaCell) {
        throw new Error(
          `setCellData: cannot update — no cell with id "${String(id)}" exists. ` +
            'Add the cell first with the direct form `setCell({ id, type, ... })`.'
        );
      }
      const nextData =
        typeof dataOrUpdater === 'function' ? dataOrUpdater(previous.data) : dataOrUpdater;
      diaCell.set('data', nextData);
    },
    [graph, store]
  );
}

/**
 * Returns a function that removes one cell by id or dia.Cell reference.
 * No-op if the cell does not exist.
 * @returns memoized removeCell setter
 */
export function useRemoveCell() {
  const store = useGraphStore();
  const { graph } = store;
  return useCallback(
    (cellRef: CellRef) => {
      const diaCell = graph.getCell(cellRef);
      if (!diaCell) return;
      graph.removeCells([diaCell]);
    },
    [graph]
  );
}

/**
 * Returns a function that removes multiple cells by id or dia.Cell reference.
 * Ignores missing ids.
 * @returns memoized removeCells setter
 */
export function useRemoveCells() {
  const store = useGraphStore();
  const { graph } = store;
  return useCallback(
    (cellRefs: readonly CellRef[]) => {
      const toRemove: dia.Cell[] = [];
      for (const cellRef of cellRefs) {
        const cell = graph.getCell(cellRef);
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
 * Both records and dia.Cell instances are accepted — dia.Cell instances
 * are normalized to records before mapping.
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
    (input: ArrayUpdate<Element | Link, CellInput<Element, Link>>) => {
      const current = store.graphProjection.cells.getAll();
      const next = typeof input === 'function' ? input(current) : input;
      const models = next.map((cell) => cellInputToModel<Element, Link>(cell, graph));
      graph.resetCells(models);
    },
    [graph, store]
  );
}

/**
 * Returns a function that applies an updater to the current cells array.
 * Shorthand for `resetCells(prev => updater(prev))` — removals happen via `filter`.
 * The updater may return dia.Cell instances alongside records; they are
 * normalized before applying.
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
      ) => ReadonlyArray<CellInput<Element, Link>>
    ) => {
      const current = store.graphProjection.cells.getAll();
      const next = updater(current);
      const cellRecords = next.map((cell) => cellInputToRecord<Element, Link>(cell));
      store.applyControlled(cellRecords);
    },
    [store]
  );
}

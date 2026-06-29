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
import { warnMissingSetterCell } from '../utils/dev-warnings';

/** True for `null` / `undefined` cell ids passed to a setter. */
function isMissingId(id: CellId | null | undefined): id is null | undefined {
  return id === undefined || id === null;
}

/**
 * Merges `next` over an existing cell record and writes the result onto the
 * `dia.Cell`, preserving the original `id` and `type`.
 * @template Element - element record shape
 * @template Link - link record shape
 * @param diaCell - the live cell to write to
 * @param previous - the current record read from the store
 * @param next - the incoming partial/whole record
 * @param graph - graph used to map the merged record to cell attributes
 */
function writeMergedCell<Element extends ElementJSONInit, Link extends LinkJSONInit>(
  diaCell: dia.Cell,
  previous: Element | Link,
  next: Element | Link,
  graph: dia.Graph
): void {
  const merged = {
    ...previous,
    ...next,
    id: previous.id,
    type: previous.type,
  };
  diaCell.set(mapCellToAttributes(merged, graph));
}

/**
 * Updater function form for {@link SetCell}. Receives the current cell record
 * (read from the cells container) and returns the next record. Invoked
 * exactly once with the real previous value.
 * @template Element - element record shape
 * @template Link - link record shape
 * @group Types
 */
type SetCellUpdater<Element extends ElementJSONInit, Link extends LinkJSONInit> = (
  previous: Element | Link
) => Element | Link;

/**
 * Function exposed by {@link GraphApi}.setCell. Three forms:
 * - `setCell(record)`, direct form. `record.id` names the target. Cell
 *   exists: attributes merge over it. Cell missing: cell is added.
 * - `setCell(diaCell)`, dia.Cell form. The cell is converted to a record
 *   and handled like the direct form.
 * - `setCell(id, updater)`, updater form. The updater is called once with the
 *   real previous record. A nullish `id`, or an `id` with no matching cell,
 *   warns in dev and no-ops, pass the direct form to add a new cell.
 * @template Element - element record shape
 * @template Link - link record shape
 * @group Types
 */
export interface SetCell<Element extends ElementJSONInit, Link extends LinkJSONInit> {
  (record: CellInput<Element, Link>): void;
  (id: CellId | null | undefined, updater: SetCellUpdater<Element, Link>): void;
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
      argument1: CellInput<Element, Link> | CellId | null | undefined,
      argument2?: SetCellUpdater<Element, Link>
    ) => {
      // Updater form: the target must already exist so the updater receives a
      // real previous record. A nullish id or a missing cell warns and no-ops.
      if (typeof argument2 === 'function') {
        const id = argument1 as CellId | null | undefined;
        const previous = isMissingId(id) ? undefined : store.graphProjection.cells.get(id);
        const diaCell = isMissingId(id) ? undefined : graph.getCell(id);
        if (!previous || !diaCell) {
          warnMissingSetterCell('setCell', id);
          return;
        }
        writeMergedCell(diaCell, previous, argument2(previous), graph);
        return;
      }

      // Direct form: a record names its own target. A missing cell is added;
      // an existing cell is merged. A record without an id cannot be placed.
      const next = cellInputToRecord<Element, Link>(argument1 as CellInput<Element, Link>);
      if (isMissingId(next.id)) {
        warnMissingSetterCell('setCell', next.id);
        return;
      }
      const previous = store.graphProjection.cells.get(next.id);
      const diaCell = graph.getCell(next.id);
      if (!previous || !diaCell) {
        graph.addCell(mapCellToAttributes(next, graph));
        return;
      }
      writeMergedCell(diaCell, previous, next, graph);
    },
    [graph, store]
  );
  return setCell as SetCell<Element, Link>;
}

/**
 * Updater form for `SetCellData`. Receives the cell's current `data` and
 * returns the next `data`. The return value replaces `data` wholesale, perform
 * a partial update by merging inside the updater
 * (`(prev) => ({ ...prev, ...patch })`).
 * @template Data - cell data shape
 * @group Types
 */
type SetCellDataUpdater<Data> = (previousData: Data) => Data;

/**
 * Function exposed by {@link GraphApi}.setCellData and returned by
 * {@link useSetCellData}. Two forms, both keyed by cell id:
 * - `setCellData(id, data)`, replaces the cell's `data` with `data`.
 * - `setCellData(id, (prev) => next)`, updater form; `prev` is the current
 *   `data`, the return value replaces it.
 *
 * A nullish `id`, or an `id` with no matching cell, warns in dev and no-ops.
 * updating data implies the cell is already on the graph (use `setCell` to add
 * a new one). The updater overload is listed first so a function argument
 * matches it; any non-function argument falls through to the direct form.
 * @template Data - cell data shape (defaults to an open `Record<string, unknown>`)
 * @group Types
 */
export interface SetCellData<Data = Record<string, unknown>> {
  (id: CellId | null | undefined, updater: SetCellDataUpdater<Data>): void;
  (id: CellId | null | undefined, data: Data): void;
}

/**
 * Returns a function that sets a single cell's `data` field. Two forms:
 * `setCellData(id, data)` replaces wholesale; `setCellData(id, (prev) => next)`
 * uses an updater. A nullish `id`, or an `id` with no matching cell, warns
 * in dev and no-ops.
 *
 * Writes `data` directly on the `dia.Cell`, so JointJS fires `change:data` and
 * every React subscription resyncs, no full-record merge is involved.
 * @template Data - cell data shape (defaults to an open `Record<string, unknown>`)
 * @returns memoized setCellData setter
 * @group Hooks
 */
export function useSetCellData<Data = Record<string, unknown>>(): SetCellData<Data> {
  const store = useGraphStore();
  const { graph } = store;
  return useCallback<SetCellData<Data>>(
    (id?: CellId | null, dataOrUpdater?: unknown) => {
      if (isMissingId(id) || dataOrUpdater === undefined) {
        warnMissingSetterCell('setCellData', id);
        return;
      }
      const previous = store.graphProjection.cells.get(id);
      const diaCell = graph.getCell(id);
      if (!previous || !diaCell) {
        warnMissingSetterCell('setCellData', id);
        return;
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
 * A nullish reference warns in dev and no-ops; a reference that resolves to no
 * cell is a silent no-op (removal is idempotent, the cell is already gone).
 * @returns memoized removeCell setter
 */
export function useRemoveCell() {
  const store = useGraphStore();
  const { graph } = store;
  return useCallback(
    (cellRef?: CellRef | null) => {
      if (cellRef === undefined || cellRef === null) {
        warnMissingSetterCell('removeCell', cellRef);
        return;
      }
      const diaCell = graph.getCell(cellRef);
      if (!diaCell) return;
      graph.removeCells([diaCell]);
    },
    [graph]
  );
}

/**
 * Returns a function that removes multiple cells by id or dia.Cell reference.
 * A nullish array warns in dev and no-ops; references that resolve to no cell
 * are silently skipped.
 * @returns memoized removeCells setter
 */
export function useRemoveCells() {
  const store = useGraphStore();
  const { graph } = store;
  return useCallback(
    (cellRefs?: readonly CellRef[] | null) => {
      if (cellRefs === undefined || cellRefs === null) {
        warnMissingSetterCell('removeCells', cellRefs);
        return;
      }
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
 * Both records and dia.Cell instances are accepted, dia.Cell instances
 * are normalized to records before mapping.
 * Maps the next cells through `mapCellToAttributes` and calls
 * `graph.resetCells` directly, equivalent to JointJS' bulk-reset semantics.
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
 * Shorthand for `resetCells(prev => updater(prev))`, removals happen via `filter`.
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
      updater: (previous: ReadonlyArray<Element | Link>) => ReadonlyArray<CellInput<Element, Link>>
    ) => {
      const current = store.graphProjection.cells.getAll();
      const next = updater(current);
      const cellRecords = next.map((cell) => cellInputToRecord<Element, Link>(cell));
      store.applyControlled(cellRecords);
    },
    [store]
  );
}

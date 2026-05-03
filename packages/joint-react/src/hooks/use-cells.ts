import { useCallback, useMemo, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { useGraphStore } from './use-graph-store';
import type { CellId, CellRecord, Computed } from '../types/cell.types';
import type { ReadonlyContainer } from '../store/state-container';

/**
 * Internal upper bound for any cell record this hook accepts as a constraint.
 * Equivalent to `CellRecord<unknown, unknown, string, string>` — the loose
 * variant where `type` is any string.
 */
type AnyCellRecord = CellRecord<unknown, unknown, string, string>;

/** Union of all possible `useCells` return shapes (depends on argument form). */
type UseCellsResult<Cell extends AnyCellRecord, Selected> =
  | readonly Cell[]
  | Cell
  | undefined
  | Selected;

/**
 * Shallow-compare two readonly arrays by length and element identity (`===`).
 * Used to keep the `useCells(ids)` array reference stable when no underlying
 * cell reference changed.
 * @param a - first array
 * @param b - second array
 * @returns true when both arrays have the same length and the same element refs
 */
function areArraysShallowEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (const [index, value] of a.entries()) {
    if (value !== b[index]) return false;
  }
  return true;
}

/**
 * Equality function on raw `unknown` values. Used internally so we don't have
 * to weave generic types through helper closures (the runtime check is the
 * same regardless of the static type).
 */
type UnknownEqual = (a: unknown, b: unknown) => boolean;

/**
 * Wraps a user-provided isEqual that operates on a typed value so it can be
 * stored as an `UnknownEqual`. Module-scoped so the closure does not nest
 * inside `useCells`.
 * @param userIsEqual - user equality on a typed value
 * @returns equality on raw `unknown` values
 */
function wrapUserIsEqual<T>(userIsEqual: (a: T, b: T) => boolean): UnknownEqual {
  return (a, b) => userIsEqual(a as T, b as T);
}

/**
 * Shallow array equality on raw values. Module-scoped so it stays
 * referentially stable across renders and avoids deep nesting inside
 * `useCells`.
 * @param a - previous result (expected to be a readonly array)
 * @param b - next result (expected to be a readonly array)
 * @returns true when both arrays match by length and element identity
 */
function arrayResultEqual(a: unknown, b: unknown): boolean {
  return areArraysShallowEqual(a as readonly unknown[], b as readonly unknown[]);
}

/**
 * Shallow equality with an array-aware fallthrough: when both inputs are
 * arrays, compare them shallowly by length and element identity; otherwise
 * fall back to `Object.is`. Lets selectors that return arrays
 * (e.g. `cells.map(c => c.id)`) keep a stable reference across renders when
 * no element changed.
 * @param a - previous result
 * @param b - next result
 * @returns true when both inputs are equal under shallow array or `Object.is`
 */
function arrayAwareEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return areArraysShallowEqual(a, b);
  }
  return Object.is(a, b);
}

/**
 * Picks the cells named by `subscribedIds` out of the container in order.
 * Missing ids are skipped. Module-scoped so the closure does not nest inside
 * `useCells.select`.
 * @param container - container to read from
 * @param subscribedIds - cell ids to pick
 * @returns array of resolved cells in id order (missing ids omitted)
 */
function pickCells<Cell extends AnyCellRecord>(
  container: ReadonlyContainer<Cell>,
  subscribedIds: readonly CellId[]
): readonly Cell[] {
  const picked: Cell[] = [];
  for (const id of subscribedIds) {
    const cell = container.get(id);
    if (cell !== undefined) picked.push(cell);
  }
  return picked;
}

/**
 * Builds the next selector result for `useCells`. Module-scoped so the
 * closure does not nest deeply inside `useCells.select`.
 * @param container - container to read from
 * @param targetId - single cell id when the (id) form is in use
 * @param subscribedIds - id list when the (ids) form is in use
 * @param arraySelector - selector for array forms (optional)
 * @param cellSelector - selector for the single-id form (optional)
 * @returns selected value or raw cell / cells
 */
function computeNext<Cell extends AnyCellRecord, Selected>(
  container: ReadonlyContainer<Cell>,
  targetId: CellId | undefined,
  subscribedIds: readonly CellId[] | undefined,
  arraySelector: ((cells: readonly Cell[]) => Selected) | undefined,
  cellSelector: ((cell: Cell | undefined) => Selected) | undefined
): UseCellsResult<Cell, Selected> {
  if (targetId !== undefined) {
    const cell = container.get(targetId);
    return cellSelector ? cellSelector(cell) : cell;
  }
  const source: readonly Cell[] =
    subscribedIds && subscribedIds.length > 0
      ? pickCells(container, subscribedIds)
      : container.getAll();
  return arraySelector ? arraySelector(source) : source;
}

/** Normalised arguments after dispatching by the runtime call shape. */
interface ParsedUseCellsArgs<Cell extends AnyCellRecord, Selected> {
  readonly targetId: CellId | undefined;
  readonly ids: readonly CellId[] | undefined;
  readonly arraySelector: ((cells: readonly Cell[]) => Selected) | undefined;
  readonly cellSelector: ((cell: Cell | undefined) => Selected) | undefined;
  readonly userIsEqual: ((a: Selected, b: Selected) => boolean) | undefined;
}

/**
 * Classifies the runtime arguments of `useCells` into a normalised shape so
 * the hook body can stay flat and cheap to read.
 * @param argument1 - first positional arg (id, ids, or selector)
 * @param argument2 - second positional arg (selector or isEqual depending on form)
 * @param argument3 - third positional arg (isEqual when the form admits it)
 * @returns the normalised input
 */
function parseUseCellsArgs<Cell extends AnyCellRecord, Selected>(
  argument1?: CellId | readonly CellId[] | ((cells: readonly Cell[]) => Selected),
  argument2?:
    | ((cells: readonly Cell[]) => Selected)
    | ((cell: Cell | undefined) => Selected)
    | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): ParsedUseCellsArgs<Cell, Selected> {
  const isIdsArray = Array.isArray(argument1);
  const isSelectorFirst = typeof argument1 === 'function';
  const isSingleId = !isIdsArray && !isSelectorFirst && argument1 !== undefined;
  const targetId: CellId | undefined = isSingleId ? (argument1 as CellId) : undefined;
  const ids: readonly CellId[] | undefined = isIdsArray
    ? (argument1 as readonly CellId[])
    : undefined;

  if (isSelectorFirst) {
    return {
      targetId,
      ids,
      arraySelector: argument1 as (cells: readonly Cell[]) => Selected,
      cellSelector: undefined,
      userIsEqual:
        typeof argument2 === 'function'
          ? (argument2 as (a: Selected, b: Selected) => boolean)
          : undefined,
    };
  }
  if (isIdsArray) {
    return {
      targetId,
      ids,
      arraySelector:
        typeof argument2 === 'function'
          ? (argument2 as (cells: readonly Cell[]) => Selected)
          : undefined,
      cellSelector: undefined,
      userIsEqual: typeof argument3 === 'function' ? argument3 : undefined,
    };
  }
  if (isSingleId && typeof argument2 === 'function') {
    return {
      targetId,
      ids,
      arraySelector: undefined,
      cellSelector: argument2 as (cell: Cell | undefined) => Selected,
      userIsEqual: typeof argument3 === 'function' ? argument3 : undefined,
    };
  }
  return {
    targetId,
    ids,
    arraySelector: undefined,
    cellSelector: undefined,
    userIsEqual: undefined,
  };
}

/**
 * Subscribe to the full cells array.
 *
 * Returned array reference is stable across data-only mutations (the internal
 * container mutates items in-place). Size changes produce a new snapshot token.
 * @template Cell - resolved cell record shape (defaults to Computed<CellRecord>)
 * @returns readonly resolved cells array
 */
export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>>(): readonly Cell[];
/**
 * Subscribe to a single cell by id.
 * @template Cell - resolved cell record shape (defaults to Computed<CellRecord>)
 * @param id - cell id to track
 * @returns current resolved cell, or undefined when missing
 */
export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>>(
  id: CellId
): Cell | undefined;
/**
 * Subscribe to a single cell by id and derive a value from it. Subscribes
 * only to that id so unrelated mutations don't trigger re-renders.
 * @template Cell - resolved cell record shape (defaults to Computed<CellRecord>)
 * @template Selected - selector return type (defaults to `Cell | undefined`)
 * @param id - cell id to track
 * @param selector - derive a value from the cell (or `undefined` when missing)
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useCells<Cell extends AnyCellRecord = Computed, Selected = Cell | undefined>(
  id: CellId,
  selector: (cell: Cell | undefined) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe to a specific set of cells by id. Subscribes only to those ids
 * (not the full container) so unrelated mutations don't trigger re-renders.
 * Returns the picked cells in the order they appear in `ids`; missing ids
 * are skipped. The array reference is stable when no picked cell changed.
 *
 * Cannot be unified with the `(id)` overload because the argument shape
 * (`CellId` vs `readonly CellId[]`) drives the return shape (single record
 * vs array of records).
 * @template Cell - resolved cell record shape (defaults to Computed<CellRecord>)
 * @param ids - cell ids to track
 * @returns array of resolved cells (only those that exist; missing ids are skipped)
 */
export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  ids: readonly CellId[]
): readonly Cell[];
/**
 * Subscribe to a specific set of cells by id and derive a value from them.
 * Subscribes only to those ids; the selector receives the picked cells array.
 * @template Cell - resolved cell record shape (defaults to Computed<CellRecord>)
 * @template Selected - selector return type (defaults to `readonly Cell[]`)
 * @param ids - cell ids to track
 * @param selector - derive a value from the picked resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useCells<Cell extends AnyCellRecord = Computed, Selected = readonly Cell[]>(
  ids: readonly CellId[],
  selector: (cells: readonly Cell[]) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe via a selector. Runs on every commit; return equal values to skip re-render.
 * @template Cell - resolved cell record shape (defaults to Computed<CellRecord>)
 * @template Selected - selector return type (defaults to `readonly Cell[]`)
 * @param selector - derive a value from the resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useCells<Cell extends AnyCellRecord = Computed, Selected = readonly Cell[]>(
  selector: (cells: readonly Cell[]) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
export function useCells<Cell extends AnyCellRecord = Computed, Selected = readonly Cell[]>(
  argument1?: CellId | readonly CellId[] | ((cells: readonly Cell[]) => Selected),
  argument2?:
    | ((cells: readonly Cell[]) => Selected)
    | ((cell: Cell | undefined) => Selected)
    | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): UseCellsResult<Cell, Selected> {
  const store = useGraphStore();
  // The runtime container holds resolved cell records; `Cell extends
  // Computed<CellRecord>` is structurally compatible. Bridge the typed
  // store value to the caller's `Cell` view with a single cast.
  const container = store.graphView.cells as ReadonlyContainer<Cell>;

  const { targetId, ids, arraySelector, cellSelector, userIsEqual } = parseUseCellsArgs<
    Cell,
    Selected
  >(argument1, argument2, argument3);
  const hasSelector = arraySelector !== undefined || cellSelector !== undefined;

  const arraySelectorRef = useRef(arraySelector);
  arraySelectorRef.current = arraySelector;
  const cellSelectorRef = useRef(cellSelector);
  cellSelectorRef.current = cellSelector;

  /** Local alias for the hook's return shape so the cache type stays readable. */
  type Result = UseCellsResult<Cell, Selected>;
  const cachedRef = useRef<{ hasValue: boolean; value: Result }>({
    hasValue: false,
    value: undefined,
  });

  // Stable key for the ids array so subscribe/select callbacks update only
  // when the actual id set changes — not on every render with a new array
  // reference (common when caller inlines the array literal).
  const idsKey = useMemo(() => (ids ? ids.join('|') : ''), [ids]);
  const idsRef = useRef<readonly CellId[] | undefined>(ids);
  idsRef.current = ids;

  const subscribe = useCallback(
    (listener: () => void) => {
      if (targetId !== undefined) return container.subscribe(targetId, listener);
      const subscribedIds = idsRef.current;
      if (subscribedIds && subscribedIds.length > 0) {
        const unsubscribers = subscribedIds.map((id) => container.subscribe(id, listener));
        return () => {
          for (const unsubscribe of unsubscribers) unsubscribe();
        };
      }
      return container.subscribeToAll(listener);
    },
    // idsKey stands in for the ids array reference so we resubscribe only on
    // an actual id change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, targetId, idsKey]
  );

  const getSnapshot = useCallback(() => {
    if (targetId !== undefined && !cellSelectorRef.current) {
      return container.get(targetId);
    }
    return container.getVersion();
  }, [container, targetId]);

  // For ids-only (no selector), default to shallow array equality so the
  // returned array reference stays stable when no picked cell changed. When
  // a selector is provided, fall back to an array-aware equality so selectors
  // that return arrays (e.g. `cells.map(c => c.id)`) also stay reference-
  // stable when their elements didn't change.
  const isEqual = useMemo<UnknownEqual>(() => {
    if (userIsEqual) return wrapUserIsEqual(userIsEqual);
    if (ids && !hasSelector) return arrayResultEqual;
    if (hasSelector) return arrayAwareEqual;
    return Object.is;
  }, [userIsEqual, ids, hasSelector]);

  const select = useCallback(
    (): Result => {
      const next = computeNext<Cell, Selected>(
        container,
        targetId,
        idsRef.current,
        arraySelectorRef.current,
        cellSelectorRef.current
      );
      if (cachedRef.current.hasValue && isEqual(cachedRef.current.value, next)) {
        return cachedRef.current.value;
      }
      cachedRef.current = { hasValue: true, value: next };
      return next;
    },
    // idsKey stands in for the ids array reference; selectors are read via
    // refs so `select` stays stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, targetId, idsKey, isEqual]
  );

  return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, select, isEqual);
}

import { useCallback, useMemo, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { type mvc, type dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import type { AnyCellRecord, CellId, CellRecord, Computed } from '../types/cell.types';
import type { ReadonlyContainer } from '../store/state-container';
import { areArraysShallowEqual, arrayAwareEqual } from '../utils/selector-utils';
import { isCollection } from '../utils/is';
import { subscribeToCollection } from '../utils/collection-subscription';
import { parseUseCellsArgs } from './use-cells.utils';

// ── Types ───────────────────────────────────────────────────────────────────

/** Union of all possible `useCells` return shapes (depends on argument form). */
type UseCellsResult<Cell extends AnyCellRecord, Selected> =
  | readonly Cell[]
  | Cell
  | undefined
  | Selected;

/** Equality function on raw `unknown` values. */
type UnknownEqual = (a: unknown, b: unknown) => boolean;

// ── Module-scoped helpers ───────────────────────────────────────────────────

/**
 * Picks cells named by `subscribedIds` from the container in order.
 * Missing ids are skipped.
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
    subscribedIds === undefined
      ? container.getAll()
      : pickCells(container, subscribedIds);
  return arraySelector ? arraySelector(source) : source;
}

// ── Overloads ───────────────────────────────────────────────────────────────

/**
 * Subscribe to a collection's cells. Tracks collection membership
 * (`add`/`remove`/`reset`) and reads cell records from the GraphProvider's
 * container. Collection cells not present in the graph are skipped.
 * @template Cell - resolved cell record shape (defaults to Computed<CellRecord>)
 * @param collection - JointJS collection whose member IDs drive the subscription
 * @returns readonly resolved cells array filtered by collection membership
 */
export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  collection: mvc.Collection<dia.Cell>
): readonly Cell[];
/**
 * Subscribe to a collection's cells with a selector.
 * @template Cell - resolved cell record shape (defaults to Computed<CellRecord>)
 * @template Selected - selector return type
 * @param collection - JointJS collection whose member IDs drive the subscription
 * @param selector - derive a value from the picked resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>, Selected = readonly Cell[]>(
  collection: mvc.Collection<dia.Cell>,
  selector: (cells: readonly Cell[]) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
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
export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>, Selected = Cell | undefined>(
  id: CellId,
  selector: (cell: Cell | undefined) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe to a specific set of cells by id. Subscribes only to those ids
 * (not the full container) so unrelated mutations don't trigger re-renders.
 * Returns the picked cells in the order they appear in `ids`; missing ids
 * are skipped. The array reference is stable when no picked cell changed.
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
export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>, Selected = readonly Cell[]>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
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
export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>, Selected = readonly Cell[]>(
  selector: (cells: readonly Cell[]) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;

// ── Implementation ──────────────────────────────────────────────────────────

export function useCells<Cell extends AnyCellRecord = Computed<CellRecord>, Selected = readonly Cell[]>(
  argument1?:
    | CellId
    | readonly CellId[]
    | ((cells: readonly Cell[]) => Selected)
    | mvc.Collection<dia.Cell>,
  argument2?:
    | ((cells: readonly Cell[]) => Selected)
    | ((cell: Cell | undefined) => Selected)
    | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): UseCellsResult<Cell, Selected> {
  const store = useGraphStore();
  const container = store.graphProjection.cells as ReadonlyContainer<Cell>;

  const collectionArgument = isCollection(argument1) ? argument1 : undefined;

  const { targetId, ids, isCollectionForm, arraySelector, cellSelector, userIsEqual } =
    parseUseCellsArgs<Cell, Selected>(argument1, argument2, argument3);
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

  const idsKey = useMemo(() => (ids ? ids.join('|') : ''), [ids]);
  const idsRef = useRef<readonly CellId[] | undefined>(ids);
  idsRef.current = ids;

  // ── Collection refs (no-op when not in collection form) ──

  const collectionIdsRef = useRef<readonly CellId[]>([]);
  const collectionVersionRef = useRef(0);

  const previousCollectionRef = useRef(collectionArgument);
  if (previousCollectionRef.current !== collectionArgument) {
    previousCollectionRef.current = collectionArgument;
    collectionIdsRef.current = collectionArgument
      ? collectionArgument.models.map((m) => m.id as CellId)
      : [];
    collectionVersionRef.current++;
  }

  // ── Subscribe ──

  const subscribe = useCallback(
    (listener: () => void) => {
      if (collectionArgument) {
        return subscribeToCollection(
          collectionArgument,
          container,
          listener,
          collectionIdsRef,
          collectionVersionRef
        );
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, collectionArgument, targetId, idsKey]
  );

  // ── Snapshot ──

  const getSnapshot = useCallback(() => {
    if (targetId !== undefined && !cellSelectorRef.current) {
      return container.get(targetId);
    }
    if (collectionArgument) return collectionVersionRef.current;
    return container.getVersion();
  }, [container, collectionArgument, targetId]);

  // ── Equality ──

  const isEqual = useMemo<UnknownEqual>(() => {
    if (userIsEqual) return userIsEqual as unknown as UnknownEqual;
    if ((ids || isCollectionForm) && !hasSelector) {
      return (a, b) => areArraysShallowEqual(a as readonly unknown[], b as readonly unknown[]);
    }
    if (hasSelector) return arrayAwareEqual;
    return Object.is;
  }, [userIsEqual, ids, isCollectionForm, hasSelector]);

  // ── Selector ──

  const select = useCallback(
    (): Result => {
      const subscribedIds = collectionArgument ? collectionIdsRef.current : idsRef.current;
      const next = computeNext<Cell, Selected>(
        container,
        targetId,
        subscribedIds,
        arraySelectorRef.current,
        cellSelectorRef.current
      );
      if (cachedRef.current.hasValue && isEqual(cachedRef.current.value, next)) {
        return cachedRef.current.value;
      }
      cachedRef.current = { hasValue: true, value: next };
      return next;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, collectionArgument, targetId, idsKey, isEqual]
  );

  return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, select, isEqual);
}

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
import { warnUnstableSelector } from '../utils/dev-warnings';
import { toCellRecord } from '../state/data-mapping/cell-record-merge';

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Union of all possible `useCells` return shapes (depends on argument form).
 *  `Cell` here is the already-resolved (Computed) record the helpers work with.
 */
type CellsResult<Cell extends AnyCellRecord, Selected> =
  | readonly Cell[]
  | Cell
  | undefined
  | Selected;

/** Equality function on raw `unknown` values. */
type UnknownEqual = (a: unknown, b: unknown) => boolean;

// ── Module-scoped helpers ───────────────────────────────────────────────────

/**
 * Resolves a single cell record for the collection form. Tries the graph
 * container first; falls back to the collection itself for cells that exist
 * outside the graph (e.g. `ui.Clipboard` clones). Fallback records are cached
 * by `dia.Cell` identity so repeat renders share the same reference and the
 * outer shallow-equality short-circuit can fire.
 */
function resolveCell<Cell extends AnyCellRecord>(
  id: CellId,
  container: ReadonlyContainer<Cell>,
  collection: mvc.Collection<dia.Cell> | undefined,
  fallbackCache: WeakMap<dia.Cell, AnyCellRecord> | undefined
): Cell | undefined {
  const fromContainer = container.get(id);
  if (fromContainer !== undefined) return fromContainer;
  if (!collection || !fallbackCache) return undefined;
  const rawCell = collection.get(id);
  if (!rawCell) return undefined;
  const cached = fallbackCache.get(rawCell);
  if (cached !== undefined) return cached as Cell;
  const record = toCellRecord(rawCell) as Cell;
  fallbackCache.set(rawCell, record);
  return record;
}

/**
 * Picks cells named by `subscribedIds` in order. Missing ids (not in the
 * graph container and not in the optional fallback `collection`) are skipped.
 */
function pickCells<Cell extends AnyCellRecord>(
  container: ReadonlyContainer<Cell>,
  subscribedIds: readonly CellId[],
  collection: mvc.Collection<dia.Cell> | undefined,
  fallbackCache: WeakMap<dia.Cell, AnyCellRecord> | undefined
): readonly Cell[] {
  const picked: Cell[] = [];
  for (const id of subscribedIds) {
    const cell = resolveCell(id, container, collection, fallbackCache);
    if (cell !== undefined) picked.push(cell);
  }
  return picked;
}

/**
 * Builds the next selector result for {@link useCells}. Module-scoped so the
 * closure does not nest deeply inside {@link useCells}.select.
 */
function computeNext<Cell extends AnyCellRecord, Selected>(
  container: ReadonlyContainer<Cell>,
  targetId: CellId | undefined,
  subscribedIds: readonly CellId[] | undefined,
  collection: mvc.Collection<dia.Cell> | undefined,
  fallbackCache: WeakMap<dia.Cell, AnyCellRecord> | undefined,
  arraySelector: ((cells: readonly Cell[]) => Selected) | undefined,
  cellSelector: ((cell: Cell | undefined) => Selected) | undefined
): CellsResult<Cell, Selected> {
  // Single-cell-with-selector form: a nullish id resolves to no cell, so the
  // selector runs against `undefined` instead of falling through to all cells.
  if (cellSelector) {
    const cell =
      targetId === undefined
        ? undefined
        : resolveCell(targetId, container, collection, fallbackCache);
    return cellSelector(cell);
  }
  if (targetId !== undefined) {
    return resolveCell(targetId, container, collection, fallbackCache);
  }
  const source: readonly Cell[] =
    subscribedIds === undefined
      ? container.getSnapshot()
      : pickCells(container, subscribedIds, collection, fallbackCache);
  return arraySelector ? arraySelector(source) : source;
}

// ── Overloads ───────────────────────────────────────────────────────────────

/**
 * Subscribe to a collection's cells. Tracks collection membership
 * (`add`/`remove`/`reset`) and reads cell records from the GraphProvider's
 * container. Cells not in the graph (e.g. `ui.Clipboard` clones) fall back to
 * the collection's own `dia.Cell` instances, converted to records on demand.
 * @title Subscribe to a collection
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @param collection - JointJS collection whose member IDs drive the subscription
 * @returns readonly resolved cells array filtered by collection membership
 * @group Hooks
 */
export function useCells<Cell extends AnyCellRecord = CellRecord>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  collection: mvc.Collection<dia.Cell>
): ReadonlyArray<Computed<Cell>>;
/**
 * Subscribe to a collection's cells with a selector.
 * @title Select from a collection
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type
 * @param collection - JointJS collection whose member IDs drive the subscription
 * @param selector - derive a value from the picked resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 */
export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = ReadonlyArray<Computed<Cell>>,
>(
  collection: mvc.Collection<dia.Cell>,
  selector: (cells: ReadonlyArray<Computed<Cell>>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe to the full cells array.
 *
 * Returned array reference is stable across data-only mutations (the internal
 * container mutates items in-place). Size changes produce a new snapshot token.
 * @title Subscribe to all cells
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @returns readonly resolved cells array
 * @example
 * ```tsx
 * import { useCells } from '@joint/react';
 *
 * function CellCount() {
 *   const cells = useCells();
 *   return <span>{cells.length} cells</span>;
 * }
 * ```
 */
export function useCells<Cell extends AnyCellRecord = CellRecord>(): ReadonlyArray<Computed<Cell>>;
/**
 * Subscribe to a single cell by id.
 * @title Subscribe to a cell by id
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @param id - cell id to track
 * @returns current resolved cell, or undefined when missing
 */
export function useCells<Cell extends AnyCellRecord = CellRecord>(
  id: CellId
): Computed<Cell> | undefined;
/**
 * Subscribe to a single cell by id and derive a value from it. Subscribes
 * only to that id so unrelated mutations don't trigger re-renders. A nullish
 * `id` resolves to no cell, so the selector runs against `undefined`, handy
 * for optional selection state (`useCells(selectedId, ...)`) with no `?? ''`.
 * @title Select from a cell by id
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type (defaults to `Cell | undefined`)
 * @param id - cell id to track (nullish → selector receives `undefined`)
 * @param selector - derive a value from the cell (or `undefined` when missing)
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 */
export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = Computed<Cell> | undefined,
>(
  id: CellId | null | undefined,
  selector: (cell: Computed<Cell> | undefined) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe to a specific set of cells by id. Subscribes only to those ids
 * (not the full container) so unrelated mutations don't trigger re-renders.
 * Returns the picked cells in the order they appear in `ids`; missing ids
 * are skipped. The array reference is stable when no picked cell changed.
 * @title Subscribe to specific cells
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @param ids - cell ids to track
 * @returns array of resolved cells (only those that exist; missing ids are skipped)
 */
export function useCells<Cell extends AnyCellRecord = CellRecord>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  ids: readonly CellId[]
): ReadonlyArray<Computed<Cell>>;
/**
 * Subscribe to a specific set of cells by id and derive a value from them.
 * Subscribes only to those ids; the selector receives the picked cells array.
 * @title Select from specific cells
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type (defaults to `readonly Cell[]`)
 * @param ids - cell ids to track
 * @param selector - derive a value from the picked resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 */
export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = ReadonlyArray<Computed<Cell>>,
>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  ids: readonly CellId[],
  selector: (cells: ReadonlyArray<Computed<Cell>>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe via a selector. Runs on every commit; return equal values to skip re-render.
 * @title Subscribe via a selector
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type (defaults to `readonly Cell[]`)
 * @param selector - derive a value from the resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 * @example
 * ```tsx
 * import { useCells } from '@joint/react';
 *
 * function ElementCount() {
 *   // Counts cells whose type is the default 'element' and re-renders only when
 *   // that count changes; shape-typed elements (e.g. 'standard.Rectangle') are
 *   // not included.
 *   const count = useCells((cells) => cells.filter((cell) => cell.type === 'element').length);
 *   return <span>{count} elements</span>;
 * }
 * ```
 */
export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = ReadonlyArray<Computed<Cell>>,
>(
  selector: (cells: ReadonlyArray<Computed<Cell>>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;

// ── Implementation ──────────────────────────────────────────────────────────

export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = ReadonlyArray<Computed<Cell>>,
>(
  argument1?:
    | CellId
    | null
    | readonly CellId[]
    | ((cells: ReadonlyArray<Computed<Cell>>) => Selected)
    | mvc.Collection<dia.Cell>,
  argument2?:
    | ((cells: ReadonlyArray<Computed<Cell>>) => Selected)
    | ((cell: Computed<Cell> | undefined) => Selected)
    | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): CellsResult<Computed<Cell>, Selected> {
  const store = useGraphStore();
  // The store holds resolved (Computed) records; the public `Cell` generic is the
  // input record shape, so internally we work in `Computed<Cell>`.
  const container = store.graphProjection.cells as ReadonlyContainer<Computed<Cell>>;

  const collectionArgument = isCollection(argument1) ? argument1 : undefined;

  const { targetId, ids, arraySelector, cellSelector, isEqual } = parseUseCellsArgs<
    Computed<Cell>,
    Selected
  >(
    argument1,
    argument2,
    argument3
  );
  const hasSelector = arraySelector !== undefined || cellSelector !== undefined;

  const arraySelectorRef = useRef(arraySelector);
  arraySelectorRef.current = arraySelector;
  const cellSelectorRef = useRef(cellSelector);
  cellSelectorRef.current = cellSelector;

  /** Local alias for the hook's return shape so the cache type stays readable. */
  type Result = CellsResult<Computed<Cell>, Selected>;
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
  const fallbackCacheRef = useRef<WeakMap<dia.Cell, AnyCellRecord>>(new WeakMap());

  // Use `null` sentinel so the init-block runs on first render too, picking up
  // any models that already exist in the collection at subscribe time.
  const previousCollectionRef = useRef<mvc.Collection<dia.Cell> | undefined | null>(null);
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
      if (targetId !== undefined) return container.subscribeById(targetId, listener);
      const subscribedIds = idsRef.current;
      if (subscribedIds && subscribedIds.length > 0) {
        const unsubscribers = subscribedIds.map((id) => container.subscribeById(id, listener));
        return () => {
          for (const unsubscribe of unsubscribers) unsubscribe();
        };
      }
      return container.subscribe(listener);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, collectionArgument, targetId, idsKey]
  );

  // ── Snapshot ──

  const getSnapshot = useCallback(() => {
    // Per-id token for ANY single-cell form (with or without a selector): the
    // token is the cell record itself, so the store only re-reads when THIS cell
    // changes, never on unrelated commits. Immutable records keep the reference
    // stable between changes, so useSyncExternalStore stays consistent.
    if (targetId !== undefined) return container.get(targetId);
    if (collectionArgument) return collectionVersionRef.current;
    // All-cells / ids / selector-only forms: the immutable snapshot reference
    // changes on every commit and doubles as the change token.
    return container.getSnapshot();
  }, [container, collectionArgument, targetId]);

  // ── Equality ──

  const isEqualCallback = useMemo<UnknownEqual>(() => {
    if (isEqual) return isEqual as unknown as UnknownEqual;
    if (targetId === undefined && !hasSelector) {
      return (a, b) => areArraysShallowEqual(a as readonly unknown[], b as readonly unknown[]);
    }
    if (hasSelector) return arrayAwareEqual;
    return Object.is;
  }, [isEqual, targetId, hasSelector]);

  // ── Selector ──

  const select = useCallback(
    (): Result => {
      const subscribedIds = collectionArgument ? collectionIdsRef.current : idsRef.current;
      const next = computeNext<Computed<Cell>, Selected>(
        container,
        targetId,
        subscribedIds,
        collectionArgument,
        fallbackCacheRef.current,
        arraySelectorRef.current,
        cellSelectorRef.current
      );
      // Reuse the cached value when equal so the returned reference stays stable
      // across commits that didn't affect this subscription.
      if (cachedRef.current.hasValue && isEqualCallback(cachedRef.current.value, next)) {
        return cachedRef.current.value;
      }
      if (hasSelector && cachedRef.current.hasValue) {
        warnUnstableSelector('useCells', cachedRef.current.value, next, !!isEqual);
      }
      // No defensive copy for the all-cells form: the container's snapshot is
      // already immutable and yields a fresh reference on every commit, so it is
      // safe to return as-is.
      cachedRef.current = { hasValue: true, value: next };
      return next;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, collectionArgument, targetId, idsKey, isEqualCallback]
  );

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    select,
    isEqualCallback
  );
}

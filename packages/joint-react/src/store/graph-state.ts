import { mvc, type dia } from '@joint/core';
import type { AnyCellRecord, CellId, CellRecord, Computed } from '../types/cell.types';
import type { GraphStore } from './graph-store';
import type { ReadonlyContainer } from './state-container';
import { toCellRecord } from '../state/data-mapping/cell-record-merge';
import { isCollection } from '../utils/is';
import { warnGraphStateReadOutsideSelector, warnUnstableSelector } from '../utils/dev-warnings';
import { arrayAwareEqual } from '../selectors/selector-utils';

/**
 * The state of a graph, as a selector of {@link useGraphState} sees it. Read
 * it inside the selector only: the hook subscribes to exactly what the
 * selector read, so a selector that reads one cell is not run when another
 * cell changes, and one that reads `sizingVersion` is not run on a drag.
 * @template Cell - Input cell record shape (defaults to CellRecord); reads resolve to its Computed form.
 * @internal
 */
export interface GraphState<Cell extends AnyCellRecord = CellRecord> {
  /** All cells. A new array on every graph change, so a selector reading it runs on each of them. */
  readonly cells: ReadonlyArray<Computed<Cell>>;
  /**
   * One cell by id, or `undefined` when the graph does not hold it.
   * @param id - The id of the cell to read.
   */
  readonly getCell: (id: CellId) => Computed<Cell> | undefined;
  /**
   * The cells with the given ids, or the cells of a JointJS collection, in
   * that order. Cells the graph does not hold are skipped, except the members
   * of a collection, which are read from the collection itself.
   * @param target - Cell ids, or a `mvc.Collection` of cells.
   */
  readonly getCells: (
    target: readonly CellId[] | mvc.Collection<dia.Cell>
  ) => ReadonlyArray<Computed<Cell>>;
  /**
   * `0` while the element sizes are not known, otherwise a number that changes
   * each time they settle. See {@link createMeasurement}.
   */
  readonly sizingVersion: number;
}

/**
 * Derives a value from the {@link GraphState}.
 * @internal
 */
export type GraphStateSelector<Cell extends AnyCellRecord, Selected> = (
  state: GraphState<Cell>
) => Selected;

/**
 * Equality test that tells whether a newly selected value is a change.
 * @group Types
 */
export type SelectedEqual<Selected> = (a: Selected, b: Selected) => boolean;

const ALL_CELLS = Symbol('cells');
const SIZING_VERSION = Symbol('sizingVersion');
/** Membership and order of a collection; `sort` reorders without adding or removing. */
const COLLECTION_EVENTS = 'update reset sort';

/** A part of the graph state a selector can read: all cells, the sizing version, a collection or one cell. */
type Source = typeof ALL_CELLS | typeof SIZING_VERSION | mvc.Collection<dia.Cell> | CellId;

/** The parts of a {@link GraphStore} the reader reads, whatever its cell shapes are. */
interface GraphStateStore {
  readonly graphProjection: { readonly cells: ReadonlyContainer<AnyCellRecord> };
  readonly measurement: Pick<GraphStore['measurement'], 'getSizingVersion' | 'subscribe'>;
}

interface Subscription {
  readonly listener: () => void;
  readonly unsubscribers: Map<Source, () => void>;
}

const collectionIds = new WeakMap<mvc.Collection<dia.Cell>, readonly CellId[]>();
const detachedRecords = new WeakMap<dia.Cell, AnyCellRecord>();

/**
 * The ids of a collection's cells, the same array for as long as the
 * membership and order are. O(members) per call, nothing allocated while unchanged.
 * @param collection - The collection to read.
 */
function getCollectionIds(collection: mvc.Collection<dia.Cell>): readonly CellId[] {
  const { models } = collection;
  const known = collectionIds.get(collection);
  if (known?.length === models.length) {
    let isSame = true;
    for (const [index, model] of models.entries()) {
      if (model.id !== known[index]) {
        isSame = false;
        break;
      }
    }
    if (isSame) return known;
  }
  const ids = models.map((model) => model.id);
  collectionIds.set(collection, ids);
  return ids;
}

/**
 * The record of a collection member the graph does not hold (a `ui.Clipboard`
 * clone, for example), one per cell so repeated reads share a reference.
 * @param collection - The collection the cell is a member of.
 * @param id - The id of the cell.
 */
function getDetachedRecord(
  collection: mvc.Collection<dia.Cell>,
  id: CellId
): AnyCellRecord | undefined {
  const cell = collection.get(id);
  if (!cell) return undefined;
  let record = detachedRecords.get(cell);
  if (!record) {
    record = toCellRecord(cell);
    detachedRecords.set(cell, record);
  }
  return record;
}

/**
 * Reads a selected value from a graph store and keeps track of what the
 * selector read, so that it is run again, and its subscriber notified, only
 * when one of those parts changes. One reader serves one hook instance.
 *
 * The staleness test compares what the selector saw with the store itself, not
 * with what the subscription delivered, so a change that lands between a
 * render and its subscription is not missed.
 * @param store - The graph store to read.
 * @param hookName - The hook the application called, named in dev warnings.
 * @returns `read`, `sync` and `subscribe`, all identity-stable.
 * @internal
 */
export function createGraphStateReader<Cell extends AnyCellRecord, Selected>(
  store: GraphStateStore,
  hookName = 'useGraphState'
) {
  // The store holds resolved (Computed) records of the application's own cell
  // shape; the `Cell` generic is how the caller declares that shape.
  const cells = store.graphProjection.cells as ReadonlyContainer<Computed<Cell>>;
  const { measurement } = store;
  // What the last selector run read, with the value it saw.
  const seen = new Map<Source, unknown>();
  let subscription: Subscription | undefined;
  // The selector `seen` belongs to. Unset from the start of a run until it
  // returns, so a selector that throws leaves nothing to trust.
  let lastSelector: GraphStateSelector<Cell, Selected> | undefined;
  let selected: { readonly value: Selected } | undefined;
  // True only while a selector runs: the state is not to be read at any other time.
  let isSelecting = false;
  // True while the subscription listens to exactly what `seen` holds. Then a
  // change cannot go unreported, and `isDirty` says whether one was: a read
  // needs no scan of `seen`. Without it, k changed cells out of N watched ones
  // cost k scans of N per commit.
  let isListeningToSeen = false;
  let isDirty = false;

  const current = (source: Source): unknown => {
    if (source === ALL_CELLS) return cells.getSnapshot();
    if (source === SIZING_VERSION) return measurement.getSizingVersion();
    if (typeof source === 'object') return getCollectionIds(source);
    return cells.get(source);
  };

  const subscribeTo = (source: Source, notify: () => void): (() => void) => {
    // Compares its own source only: once a selector run has seen the new
    // values, the rest of the notifications of the same commit find no change.
    const listener = () => {
      if (!Object.is(current(source), seen.get(source))) isDirty = true;
      notify();
    };
    if (source === ALL_CELLS) return cells.subscribe(listener);
    if (source === SIZING_VERSION) return measurement.subscribe(listener);
    if (typeof source === 'object') {
      const controller = new mvc.Listener();
      controller.listenTo(source, COLLECTION_EVENTS, listener);
      return () => controller.stopListening();
    }
    return cells.subscribeById(source, listener);
  };

  const hasChanged = (): boolean => {
    if (isListeningToSeen && !isDirty) return false;
    for (const [source, value] of seen) {
      if (!Object.is(current(source), value)) return true;
    }
    isDirty = false;
    return false;
  };

  /** Makes the subscription listen to what the last run read, and to nothing else. */
  const syncSubscription = ({ listener, unsubscribers }: Subscription): void => {
    for (const [source, unsubscribe] of unsubscribers) {
      if (seen.has(source)) continue;
      unsubscribe();
      unsubscribers.delete(source);
    }
    for (const source of seen.keys()) {
      if (unsubscribers.has(source)) continue;
      unsubscribers.set(source, subscribeTo(source, listener));
      // It may have changed between being read and being listened to.
      isDirty = true;
    }
    isListeningToSeen = true;
  };

  /** Records what a selector read. Outside of a selector run nothing would follow it. */
  const see = (source: Source, value: unknown): void => {
    if (isSelecting) seen.set(source, value);
    else warnGraphStateReadOutsideSelector();
  };

  const getCell = (id: CellId): Computed<Cell> | undefined => {
    const cell = cells.get(id);
    see(id, cell);
    return cell;
  };

  const state: GraphState<Cell> = {
    get cells() {
      const snapshot = cells.getSnapshot();
      see(ALL_CELLS, snapshot);
      return snapshot;
    },
    get sizingVersion() {
      const sizingVersion = measurement.getSizingVersion();
      see(SIZING_VERSION, sizingVersion);
      return sizingVersion;
    },
    getCell,
    getCells(target) {
      let collection: mvc.Collection<dia.Cell> | undefined;
      let ids: readonly CellId[];
      if (isCollection(target)) {
        collection = target;
        ids = getCollectionIds(target);
        see(target, ids);
      } else {
        ids = target;
      }
      const picked: Array<Computed<Cell>> = [];
      for (const id of ids) {
        // A detached record is of the application's cell shape too, like the
        // records of the container above.
        const cell =
          getCell(id) ??
          (collection && (getDetachedRecord(collection, id) as Computed<Cell> | undefined));
        if (cell !== undefined) picked.push(cell);
      }
      return picked;
    },
  };

  const read = (
    selector: GraphStateSelector<Cell, Selected>,
    isEqual: SelectedEqual<Selected> = arrayAwareEqual
  ): Selected => {
    if (selected && selector === lastSelector && !hasChanged()) return selected.value;
    lastSelector = undefined;
    isListeningToSeen = false;
    seen.clear();
    // Stays set if the selector throws: a read outside of a selector then goes
    // unreported until the next run, which is all that is lost.
    isSelecting = true;
    const next = selector(state);
    isSelecting = false;
    lastSelector = selector;
    isDirty = false;
    if (selected) {
      if (isEqual(selected.value, next)) return selected.value;
      warnUnstableSelector(hookName, selected.value, next, isEqual !== arrayAwareEqual);
    }
    selected = { value: next };
    return next;
  };

  return {
    /**
     * The value `selector` selects. The selector runs when it is a new function
     * or when something its last run read has changed; otherwise, and whenever
     * the new value is equal to the last one, the last value is returned as is.
     *
     * Safe to call while rendering: it leaves the subscription alone, so a
     * render React throws away cannot move it. See {@link sync}.
     * @param selector - derives the value from the graph state
     * @param isEqual - tells whether a newly selected value is a change
     * @returns the selected value, reference-stable while it is equal
     */
    read,
    /**
     * Reads like {@link read}, then makes the subscription listen to what that
     * run read. Call it with the selector that is in effect, outside of render:
     * once it has committed, or when a notification arrives.
     * @param selector - derives the value from the graph state
     * @param isEqual - tells whether a newly selected value is a change
     * @returns the selected value, reference-stable while it is equal
     */
    sync(
      selector: GraphStateSelector<Cell, Selected>,
      isEqual?: SelectedEqual<Selected>
    ): Selected {
      const value = read(selector, isEqual);
      if (subscription && lastSelector && !isListeningToSeen) syncSubscription(subscription);
      return value;
    },
    /**
     * Calls `listener` when something the selector read may have changed. The
     * listener is expected to read again with the selector in effect; the
     * subscription then moves to whatever that run read.
     * @param listener - called on a change, synchronously with the store
     * @returns the unsubscribe function
     */
    subscribe(listener: () => void): () => void {
      const own: Subscription = {
        listener: () => {
          listener();
          // The listener has read with the selector in effect: follow it. Not
          // after unsubscribing, which the listener itself may have done.
          if (subscription === own && lastSelector && !isListeningToSeen) syncSubscription(own);
        },
        unsubscribers: new Map(),
      };
      subscription = own;
      syncSubscription(own);
      return () => {
        for (const unsubscribe of own.unsubscribers.values()) unsubscribe();
        own.unsubscribers.clear();
        if (subscription !== own) return;
        subscription = undefined;
        isListeningToSeen = false;
      };
    },
  };
}

/** Reader returned by {@link createGraphStateReader}. */
export type GraphStateReader<Cell extends AnyCellRecord, Selected> = ReturnType<
  typeof createGraphStateReader<Cell, Selected>
>;

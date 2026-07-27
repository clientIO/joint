/* eslint-disable unicorn/prefer-spread */
import { simpleScheduler } from '../utils/scheduler';
import { isStrictEqual } from '../utils/selector-utils';
import type { CellId, AnyCellRecord } from '../types/cell.types';

/**
 * Update payload for array-shaped state, replace or transform-from-previous.
 * `Input` defaults to `T` (same type for read and write). Override it to
 * widen the write side, e.g. `ArrayUpdate<Record, Record | dia.Cell>`.
 */
export type ArrayUpdate<T, Input = T> =
  | readonly Input[]
  | ((previous: readonly T[]) => readonly Input[]);

/**
 * A batch of container changes applied in one shot by {@link Container.batchSet}.
 *
 * Mirrors the incremental-change shape delivered to `onIncrementalCellsChange`,
 * so the graph projection can build a single change set and feed it to both the
 * container and the incremental callback. All three collections are keyed by
 * cell id; the same id never appears in more than one of them.
 */
export interface ContainerChangeSet<Cell extends AnyCellRecord> {
  /** Cells new to the container, in insertion order (appended to the snapshot). */
  readonly added: ReadonlyMap<CellId, Cell>;
  /** Cells already in the container whose record reference changed (patched in place). */
  readonly changed: ReadonlyMap<CellId, Cell>;
  /** Ids of cells to drop from the container. */
  readonly removed: ReadonlySet<CellId>;
}

/** Read-only view of a cell container, supports reads, lookups, and subscriptions. */
export interface ReadonlyContainer<Cell extends AnyCellRecord> {
  /**
   * The current immutable snapshot array, built lazily and memoised until the
   * next commit. Per-id readers should prefer {@link ReadonlyContainer.get};
   * only whole-list readers need this, and they share one build per commit.
   */
  getSnapshot: () => readonly Cell[];
  get: (id: CellId) => Cell | undefined;
  has: (id: CellId) => boolean;
  /** Number of cells. O(1) — does not materialise the snapshot. */
  getSize: () => number;
  /**
   * The list of ids, memoised and stable **across data-only commits** — the
   * reference changes only when the id SET changes (add/remove). Lets "which ids
   * exist" readers subscribe without doing O(n) work on a drag.
   */
  getIds: () => readonly CellId[];
  /** Subscribe to changes of a single cell by id (the fast per-cell path). */
  subscribeById: (id: CellId, listener: () => void) => () => void;
  /** Subscribe to every commit. */
  subscribe: (listener: () => void) => () => void;
}

/** Mutable cell container, extends {@link ReadonlyContainer} with the batch writer. */
export interface Container<Cell extends AnyCellRecord> extends ReadonlyContainer<Cell> {
  batchSet: (changeSet: ContainerChangeSet<Cell>) => void;
}

/**
 * Wraps a container to expose only read and subscribe operations.
 * @param container - the mutable container to expose read-only.
 */
export function asReadonlyContainer<Cell extends AnyCellRecord>(
  container: Container<Cell>
): ReadonlyContainer<Cell> {
  return {
    get: container.get,
    has: container.has,
    getSize: container.getSize,
    getSnapshot: container.getSnapshot,
    getIds: container.getIds,
    subscribeById: container.subscribeById,
    subscribe: container.subscribe,
  };
}

/**
 * Creates a keyed container backed by a `Map` with a **lazily-materialised,
 * memoised immutable snapshot**.
 *
 * `batchSet` mutates only the backing `Map` and invalidates the memoised
 * snapshot — it is **O(change-set), never O(n)**: no array is copied on a
 * commit. The snapshot array is (re)built on demand by `getSnapshot()` and
 * memoised until the next commit, so:
 *  - per-id readers (`get(id)`, `useCell`) never materialise the array, so a
 *    drag that only changes cell data is O(change-set) per commit;
 *  - whole-list readers (`useCells()`) share ONE build per commit;
 *  - "which ids exist" readers use `getIds()`, which stays a stable reference
 *    across data-only commits, so they do no work on a drag.
 *
 * The memoisation is also what keeps concurrent reads consistent: within a
 * commit the first `getSnapshot()` builds the array and every other reader gets
 * the SAME reference, so React never tears across subscribers.
 */
export function createContainer<Cell extends AnyCellRecord>(): Container<Cell> {
  const byId = new Map<CellId, Cell>();
  // Memoised immutable snapshot; `null` means "dirty — rebuild on next read".
  let snapshot: readonly Cell[] | null = [];
  // Memoised id list; invalidated ONLY when the id set changes (add/remove), so
  // it stays a stable reference across data-only commits (a drag).
  let idsSnapshot: readonly CellId[] | null = [];
  const listeners = new Map<CellId, Set<() => void>>();
  const allListeners = new Set<() => void>();

  /** Fire the per-id listeners registered for `id` (no-op when none). */
  function fireId(id: CellId): void {
    const listenersForId = listeners.get(id);
    if (!listenersForId) return;
    for (const listener of listenersForId) listener();
  }

  return {
    getSnapshot(): readonly Cell[] {
      // Build once per commit, then hand the SAME reference to every reader.
      snapshot ??= Array.from(byId.values());
      return snapshot;
    },
    get(id: CellId): Cell | undefined {
      return byId.get(id);
    },
    has(id: CellId): boolean {
      return byId.has(id);
    },
    getSize(): number {
      return byId.size;
    },
    getIds(): readonly CellId[] {
      idsSnapshot ??= Array.from(byId.keys());
      return idsSnapshot;
    },
    batchSet({ added, changed, removed }: ContainerChangeSet<Cell>): void {
      if (changed.size === 0 && added.size === 0 && removed.size === 0) return;
      // O(change-set): mutate the backing map only. A changed id keeps its Map
      // position; a removed id is dropped; an added id is appended.
      //
      // The id list must invalidate whenever the id SET changes. `added`/`removed`
      // always change it; a `changed` id is normally already present, but a
      // producer may route a genuinely-new cell through `changed` (a new link
      // swept in by a moved element), so detect that here instead of trusting the
      // bucketing — otherwise `getIds()` would tear from `getSnapshot()`.
      let idSetChanged = added.size > 0 || removed.size > 0;
      for (const [id, record] of changed) {
        if (!byId.has(id)) idSetChanged = true;
        byId.set(id, record);
      }
      for (const id of removed) byId.delete(id);
      for (const [id, record] of added) byId.set(id, record);
      // Invalidate the memoised record snapshot every commit; invalidate the id
      // list only when the id set actually changed (so a drag keeps it stable).
      snapshot = null;
      if (idSetChanged) idsSnapshot = null;

      // Wake the touched ids' subscribers, then the all-subscribers once.
      for (const id of changed.keys()) fireId(id);
      for (const id of added.keys()) fireId(id);
      for (const id of removed) fireId(id);
      for (const listener of allListeners) listener();
    },
    subscribeById(id: CellId, listener: () => void) {
      let listenersForId = listeners.get(id);
      if (!listenersForId) {
        listenersForId = new Set();
        listeners.set(id, listenersForId);
      }
      listenersForId.add(listener);
      return () => {
        listenersForId?.delete(listener);
        // Guard the map delete against a re-subscribe replacing this id's Set
        // between the first and a repeated unsubscribe call.
        if (listenersForId?.size === 0 && listeners.get(id) === listenersForId) {
          listeners.delete(id);
        }
      };
    },
    subscribe(listener: () => void) {
      allListeners.add(listener);
      return () => {
        allListeners.delete(listener);
      };
    },
  };
}

/** Updater for atom values — always receives the current value (never undefined). */
type AtomUpdate<T> = ((previous: T) => T) | T;

/** Return type of {@link createAtom}. */
export interface Atom<T> {
  /** Get the current value. */
  readonly get: () => T;
  /** Alias for `get`, compatible with `useSyncExternalStore`. */
  readonly getSnapshot: () => T;
  /** Update the value. Accepts a new value or an updater function. Pass `sync` to notify synchronously. */
  readonly set: (update: AtomUpdate<T>, sync?: boolean) => void;
  /** Alias for `set`, matches the old `createState` API during migration. */
  readonly setState: (update: AtomUpdate<T>, sync?: boolean) => void;
  /** Subscribe to value changes. Returns an unsubscribe function. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Remove all listeners. */
  readonly clean: () => void;
}

/**
 * Creates a simple atomic value container with get/set/subscribe.
 * Items are immutable, the container replaces the value on each update.
 * @param initialValue - The initial value of the atom.
 */
export function createAtom<T>(initialValue: T): Atom<T> {
  let value = initialValue;
  const listeners = new Set<() => void>();

  /**
   * Returns the current atom value.
   */
  function get(): T {
    return value;
  }

  /**
   * Notifies every registered listener of a value change.
   */
  function notifyListeners(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  /**
   * Updates the atom value and notifies listeners if the value changed.
   *
   * By default notifications are batched onto a microtask so cascading updates
   * coalesce into a single React render — and so a write that happens DURING
   * render (e.g. a feature registering itself in `useCreateFeature`'s render
   * path) does not synchronously setState another component. Pass `sync` to
   * notify synchronously — required when the update happens inside an
   * effect/commit and a `useSyncExternalStore` subscriber must observe it
   * deterministically (a deferred notify can be dropped across StrictMode's
   * unmount→remount churn). Never call with `sync` during React's render phase.
   * @param update - New value or a previous-state updater.
   * @param sync - Notify synchronously instead of on a microtask.
   */
  function set(update: AtomUpdate<T>, sync = false): void {
    const newValue = typeof update === 'function' ? (update as (previous: T) => T)(value) : update;
    if (isStrictEqual(value, newValue)) {
      return;
    }
    value = newValue;
    if (sync) {
      notifyListeners();
      return;
    }
    simpleScheduler(notifyListeners);
  }

  /**
   * Registers a listener that is called when the atom value changes.
   * @param listener
   */
  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Removes all registered listeners.
   */
  function clean(): void {
    listeners.clear();
  }

  return { get, getSnapshot: get, set, setState: set, subscribe, clean };
}

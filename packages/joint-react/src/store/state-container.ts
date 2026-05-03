import { isUpdater } from '../utils/is';
import { simpleScheduler } from '../utils/scheduler';
import { isStrictEqual } from '../utils/selector-utils';
import type {
  CellId,
  CellUnion,
  ElementJSONInit,
  LinkJSONInit,
} from '../types/cell.types';

/** Update payload accepted by container setters: a new value or a previous-state updater. */
export type Update<T> = ((previous: T | undefined) => T | undefined) | T;

/**
 * Resolves an update value by applying it if it is a function, or returning it directly.
 * @param previous
 * @param updater
 */
export function getValue<T>(previous: T | undefined, updater: Update<T>): T | undefined {
  return isUpdater(updater) ? updater(previous) : updater;
}

/** Read-only view of a cell container — supports reads, lookups, and subscriptions. */
export interface ReadonlyContainer<
  Cell extends CellUnion<ElementJSONInit, LinkJSONInit>,
> {
  getVersion: () => number;
  getAll: () => readonly Cell[];
  get: (id: CellId) => Cell | undefined;
  has: (id: CellId) => boolean;
  getSize: () => number;
  subscribe: (id: CellId, listener: () => void) => () => void;
  subscribeToSize: (listener: () => void) => () => void;
  subscribeToAll: (listener: () => void) => () => void;
}

/** Mutable cell container — extends {@link ReadonlyContainer} with set/delete/reset operations. */
export interface Container<Cell extends CellUnion<ElementJSONInit, LinkJSONInit>>
  extends ReadonlyContainer<Cell> {
  set: (id: CellId, update: Update<Cell>) => void;
  delete: (id: CellId) => void;
  reset: (next: readonly Cell[]) => void;
  commitChanges: () => void;
}

/**
 * Wraps a container to expose only read and subscribe operations.
 * @param container
 */
export function asReadonlyContainer<
  Cell extends CellUnion<ElementJSONInit, LinkJSONInit>,
>(container: Container<Cell>): ReadonlyContainer<Cell> {
  return {
    get: container.get,
    has: container.has,
    getVersion: container.getVersion,
    getAll: container.getAll,
    getSize: container.getSize,
    subscribe: container.subscribe,
    subscribeToSize: container.subscribeToSize,
    subscribeToAll: container.subscribeToAll,
  };
}

/**
 * Creates a keyed container with per-id subscriptions and batched change notifications.
 *
 * Backed by a mutable `items: T[]` array + `indexById: Map<id, number>` + a
 * monotonic `version` counter. Every mutation is O(1); `reset` is O(n) and is
 * a cold path. Delete uses swap-pop (unstable array order) — callers must
 * not rely on insertion order for identity.
 * @param _name - optional label for debugging
 */
export function createContainer<
  Cell extends CellUnion<ElementJSONInit, LinkJSONInit>,
>(_name?: string): Container<Cell> {
  const items: Cell[] = [];
  const indexById = new Map<CellId, number>();
  const listeners = new Map<CellId, Set<() => void>>();
  const sizeListeners = new Set<() => void>();
  const fullListeners = new Set<() => void>();
  // Array for O(1) insertion — dedup happens on commit via the `fired` Set.
  // A Set-based `changes` was tried but regressed hot insert loops by 15-20%
  // because `Set.add` is measurably slower than `Array.push` when many
  // unique ids accumulate between commits (each add does a hash lookup).
  let changes: CellId[] = [];
  let previousSize = 0;
  let version = 0;
  return {
    get(id: CellId): Cell | undefined {
      const index = indexById.get(id);
      return index === undefined ? undefined : items[index];
    },
    has(id: CellId): boolean {
      return indexById.has(id);
    },
    getAll(): readonly Cell[] {
      return items;
    },
    set(id: CellId, update: Update<Cell>) {
      const index = indexById.get(id);
      const previous = index === undefined ? undefined : items[index];
      const value = getValue(previous, update);
      if (!value) {
        return;
      }
      if (isStrictEqual(previous, value)) {
        return;
      }
      if (index === undefined) {
        indexById.set(id, items.length);
        items.push(value);
      } else {
        items[index] = value;
      }
      changes.push(id);
      version++;
    },
    delete(id: CellId) {
      const index = indexById.get(id);
      if (index === undefined) {
        return;
      }
      const lastIndex = items.length - 1;
      if (index !== lastIndex) {
        const last = items[lastIndex];
        items[index] = last;
        // Stored items are always keyed by id; the optional `id` is for
        // input shapes only.
        indexById.set(last.id as CellId, index);
      }
      items.pop();
      indexById.delete(id);
      changes.push(id);
      version++;
    },
    reset(next: readonly Cell[]) {
      // Stored items are always keyed by id; the optional `id` is for input
      // shapes only.
      for (const previous of items) changes.push(previous.id as CellId);
      items.length = 0;
      indexById.clear();
      let index = 0;
      for (const item of next) {
        items.push(item);
        indexById.set(item.id as CellId, index);
        changes.push(item.id as CellId);
        index++;
      }
      version++;
    },
    getVersion() {
      return version;
    },
    getSize() {
      return items.length;
    },
    commitChanges() {
      simpleScheduler(() => {
        if (changes.length === 0) {
          return;
        }
        const fired = new Set<CellId>();
        for (const id of changes) {
          if (fired.has(id)) continue;
          fired.add(id);
          const listenersForId = listeners.get(id);
          if (!listenersForId) {
            continue;
          }
          for (const listener of listenersForId) {
            listener();
          }
        }
        if (previousSize !== items.length) {
          previousSize = items.length;
          for (const listener of sizeListeners) {
            listener();
          }
        }
        for (const listener of fullListeners) listener();

        changes = [];
      });
    },
    subscribe(id: CellId, listener: () => void) {
      let listenersForId = listeners.get(id);
      if (!listenersForId) {
        listenersForId = new Set();
        listeners.set(id, listenersForId);
      }
      listenersForId.add(listener);
      return () => {
        listenersForId?.delete(listener);
        if (listenersForId?.size === 0) {
          listeners.delete(id);
        }
      };
    },
    subscribeToAll(listener: () => void) {
      fullListeners.add(listener);
      return () => {
        fullListeners.delete(listener);
      };
    },
    subscribeToSize(listener: () => void) {
      sizeListeners.add(listener);
      return () => {
        sizeListeners.delete(listener);
      };
    },
  };
}

/** Updater for atom values — always receives the current value (never undefined). */
export type AtomUpdate<T> = ((previous: T) => T) | T;

/** Return type of {@link createAtom}. */
export interface Atom<T> {
  /** Get the current value. */
  readonly get: () => T;
  /** Alias for `get` — compatible with `useSyncExternalStore`. */
  readonly getSnapshot: () => T;
  /** Update the value. Accepts a new value or an updater function. */
  readonly set: (update: AtomUpdate<T>) => void;
  /** Alias for `set` — matches the old `createState` API during migration. */
  readonly setState: (update: AtomUpdate<T>) => void;
  /** Subscribe to value changes. Returns an unsubscribe function. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Remove all listeners. */
  readonly clean: () => void;
}

/**
 * Creates a simple atomic value container with get/set/subscribe.
 * Items are immutable — the container replaces the value on each update.
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
   * Updates the atom value and notifies all listeners if the value changed.
   * @param update
   */
  function set(update: AtomUpdate<T>): void {
    const newValue = typeof update === 'function' ? (update as (previous: T) => T)(value) : update;
    if (isStrictEqual(value, newValue)) {
      return;
    }
    value = newValue;
    simpleScheduler(() => {
      for (const listener of listeners) {
        listener();
      }
    });
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

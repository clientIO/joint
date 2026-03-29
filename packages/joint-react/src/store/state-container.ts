import { isUpdater } from '../utils/is';
import { simpleScheduler } from '../utils/scheduler';
import { isStrictEqual } from '../utils/selector-utils';

export type Update<T> = ((previous: T | undefined) => T | undefined) | T;

/**
 * Resolves an update value by applying it if it is a function, or returning it directly.
 * @param previous
 * @param updater
 */
export function getValue<T>(previous: T | undefined, updater: Update<T>): T | undefined {
  return isUpdater(updater) ? updater(previous) : updater;
}

export interface ReadonlyContainer<T> {
  getVersion: () => number;
  getFull: () => Map<string, T>;
  get: (id: string) => T | undefined;
  getSize: () => number;
  subscribe: (id: string, listener: () => void) => () => void;
  subscribeToSize: (listener: () => void) => () => void;
  subscribeToFull: (listener: () => void) => () => void;
}

export interface Container<T> extends ReadonlyContainer<T> {
  set: (id: string, update: Update<T>) => void;
  delete: (id: string) => void;
  commitChanges: () => void;
}
/**
 * Wraps a container to expose only read and subscribe operations.
 * @param container
 */
export function asReadonlyContainer<T>(container: Container<T>): ReadonlyContainer<T> {
  return {
    get: container.get,
    getVersion: container.getVersion,
    getFull: container.getFull,
    getSize: container.getSize,
    subscribe: container.subscribe,
    subscribeToSize: container.subscribeToSize,
    subscribeToFull: container.subscribeToFull,
  };
}

/**
 * Creates a keyed container with per-id subscriptions and batched change notifications.
 */
export function createContainer<T>(_name?: string): Container<T> {
  const container = new Map<string, T>();
  const listeners = new Map<string, Set<() => void>>();
  const sizeListeners = new Set<() => void>();
  const fullListeners = new Set<() => void>();
  let changes: string[] = [];
  let previousSize = 0;
  let version = 0;
  return {
    get(id: string): T | undefined {
      return container.get(id);
    },
    getFull() {
      return container;
    },
    set(id: string, update: Update<T>) {
      const previous = container.get(id);
      const value = getValue(previous, update);
      if (!value) {
        return;
      }
      if (isStrictEqual(previous, value)) {
        return;
      }

      container.set(id, value);
      changes.push(id);
      version++;
    },
    delete(id: string) {
      if (!container.has(id)) {
        return;
      }
      container.delete(id);
      changes.push(id);
      version++;
    },
    getVersion() {
      return version;
    },
    getSize() {
      return container.size;
    },
    commitChanges() {
      simpleScheduler(() => {
        if (changes.length === 0) {
          return;
        }
        for (const id of changes) {
          const listenersForId = listeners.get(id);
          if (!listenersForId) {
            continue;
          }
          for (const listener of listenersForId) {
            listener();
          }
        }
        if (previousSize !== container.size) {
          previousSize = container.size;
          for (const listener of sizeListeners) {
            listener();
          }
        }
        for (const listener of fullListeners) listener();

        changes = [];
      });
    },
    subscribe(id: string, listener: () => void) {
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
    subscribeToFull(listener: () => void) {
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

import { isUpdater } from '../utils/is';
import { simpleScheduler } from '../utils/scheduler';
import { isStrictEqual } from '../utils/selector-utils';

export type Update<T> = ((previous: T | undefined) => T) | T;

export function getValue<T>(previous: T, updater: Update<T>): T {
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

export function createContainer<T>(): Container<T> {
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

export function createAtom<T>(initialValue: T) {
  let value = initialValue;
  const listeners = new Set<() => void>();
  return {
    get() {
      return value;
    },
    set(update: Update<T>) {
      const newValue = getValue(value, update);
      if (isStrictEqual(value, newValue)) {
        return;
      }
      value = newValue;
      simpleScheduler(() => {
        for (const listener of listeners) {
          listener();
        }
      });
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

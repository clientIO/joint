import { startTransition } from 'react';
import { sendToDevTool } from './dev-tools';
import { isUpdater } from './is';
import { simpleScheduler } from './scheduler';
import { isStrictEqual } from './selector-utils';

/**
 * Update function or direct value for state updates.
 * Can be either a function that receives the previous state and returns the new state,
 * or a direct value to replace the current state.
 */
export type Update<T> = ((previous: T) => T) | T;

/**
 * Interface compatible with React's useSyncExternalStore and external state management libraries.
 * This interface allows GraphStore to work with any store implementation (Redux, Zustand, etc.).
 * @template T - The type of the store snapshot
 */
export interface ExternalStoreLike<T> {
  /** Returns the current snapshot of the store */
  getSnapshot: () => MarkDeepReadOnly<T>;
  /** Subscribes to store changes. Returns an unsubscribe function */
  subscribe: (listener: () => void) => () => void;
  /** Updates the store state with a new value or updater function */
  setState: (updater: Update<T>) => void;
}

/**
 * Recursively makes all properties in a type readonly.
 * Used to ensure store snapshots are immutable.
 */
export type MarkDeepReadOnly<T> = {
  readonly [K in keyof T]: T[K] extends ReadonlySet<infer U>
    ? ReadonlySet<U>
    : T[K] extends ReadonlyMap<infer K2, infer V>
      ? ReadonlyMap<K2, V>
      : T[K] extends object
        ? MarkDeepReadOnly<T[K]>
        : T[K];
};

/**
 * Recursively removes readonly modifiers from a type.
 * Used when we need to mutate data internally.
 */
export type RemoveDeepReadOnly<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Removes deep readonly modifiers from a type.
 * @param value - The value to remove readonly modifiers from.
 * @returns The value with readonly modifiers removed.
 */
export function removeDeepReadOnly<T>(value: T): RemoveDeepReadOnly<T> {
  return value as RemoveDeepReadOnly<T>;
}
/**
 * Gets the updated value from an updater function or direct value.
 * @param previous - The previous value.
 * @param updater - The updater function or direct value.
 * @returns The updated value.
 */
export function getValue<T>(previous: T, updater: Update<T>): T {
  return isUpdater(updater) ? updater(previous) : updater;
}

/**
 * State management interface with subscription and selection capabilities.
 * Extends ExternalStoreLike to be compatible with React's useSyncExternalStore.
 * @template T - The type of the state
 */
export interface State<T> extends ExternalStoreLike<T> {
  /**
   * Cleans up all subscriptions and resets the state to its initial value.
   */
  clean: () => void;

  /**
   * Updates the state with a new value or updater function.
   * Subscribers will be notified if the state actually changed.
   */
  setState: (updater: Update<T>) => void;
}
/**
 * Options for creating a new state instance.
 * @template T - The type of the state
 */
interface Options<T> {
  /** Function that returns the initial state value */
  readonly newState: () => T;
  /** Optional equality function to determine if state has changed. Defaults to deep equality. */
  readonly isEqual?: (a: T, b: T) => boolean;
  /** Name for the state (used for debugging and dev tools) */
  readonly name: string;
  /** Whether to enable dev tools integration for this state. Defaults to false. */
  readonly isDevToolEnabled?: boolean;
}
const IS_DEV_TOOL_ENABLED_BY_DEFAULT = process.env.NODE_ENV === 'development';
/**
 * Creates a new state instance with subscription support.
 * @param options - The options for creating the state.
 * @returns A State instance with subscription and selection capabilities.
 */
export function createState<T>(options: Options<T>): State<T> {
  const {
    newState,
    isEqual = isStrictEqual,
    name,
    isDevToolEnabled = IS_DEV_TOOL_ENABLED_BY_DEFAULT,
  } = options;

  const stateRef = {
    current: newState(),
  };

  const subscribers = new Set<() => void>();
  if (isDevToolEnabled) {
    sendToDevTool({ name, type: 'set', value: stateRef.current });
  }

  const notifySubscribers = () => {
    if (isDevToolEnabled) {
      sendToDevTool({ name, type: 'set', value: stateRef.current });
    }
    for (const subscriber of subscribers) {
      subscriber();
    }
  };

  const state = {
    // ✅ correct shape for useSyncExternalStore
    subscribe: (onStoreChange: () => void) => {
      subscribers.add(onStoreChange);
      return () => {
        subscribers.delete(onStoreChange);
      };
    },

    getSnapshot: (): MarkDeepReadOnly<T> => stateRef.current as MarkDeepReadOnly<T>,

    setState: (updater: Update<T>) => {
      startTransition(() => {
        const updatedState = isUpdater(updater) ? updater(stateRef.current) : updater;
        // fast compare if the state has changed
        if (isEqual(updatedState, stateRef.current)) {
          return;
        }
        stateRef.current = updatedState;
        simpleScheduler(notifySubscribers);
      });
    },

    reset: () => {
      stateRef.current = newState();
    },

    clean: () => {
      subscribers.clear();
      stateRef.current = newState();
    },
  };
  return state;
}

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
  readonly [K in keyof T]: T[K] extends object ? MarkDeepReadOnly<T[K]> : T[K];
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
   * Creates a derived state by selecting a portion of the current state.
   * The derived state will automatically update when the selected portion changes.
   * @template S - The type of the selected state
   * @param name - Name for the derived state (used for debugging)
   * @param selector - Function that extracts the desired portion from the state
   * @param isSelectorEqual - Optional equality function to prevent unnecessary updates
   * @returns A new State instance for the selected portion
   */
  select: <S>(
    name: string,
    selector: (state: T) => S,
    isSelectorEqual: (a: S, b: S) => boolean
  ) => State<S>;
  /**
   * Cleans up all subscriptions and resets the state to its initial value.
   */
  clean: () => void;
  /**
   * Returns whether components have been notified of the last state change.
   * Used internally for debugging and optimization.
   */
  getAreComponentsNotified: () => boolean;
  /**
   * Updates the state with a new value or updater function.
   * Subscribers will be notified if the state actually changed.
   */
  setState: (updater: Update<T>) => void;
  /**
   * Updates the state with a new value or updater function wrapped in startTransition.
   * Use this for non-urgent updates that can be deferred to keep the UI responsive.
   * Subscribers will be notified if the state actually changed.
   */
  setStateTransition: (updater: Update<T>) => void;
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
  let areComponentsNotified = false;
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
    areComponentsNotified = true;
  };

  const state = {
    // ✅ correct shape for useSyncExternalStore
    subscribe: (onStoreChange: () => void) => {
      subscribers.add(onStoreChange);
      return () => {
        subscribers.delete(onStoreChange);
      };
    },

    getSnapshot: (): MarkDeepReadOnly<T> => stateRef.current,

    setState: (updater: Update<T>) => {
      areComponentsNotified = false;
      const updatedState = isUpdater(updater) ? updater(stateRef.current) : updater;
      // fast compare if the state has changed
      if (isEqual(updatedState, stateRef.current)) {
        return;
      }
      stateRef.current = updatedState;
      simpleScheduler(notifySubscribers);
    },

    setStateTransition: (updater: Update<T>) => {
      startTransition(() => {
        state.setState(updater);
      });
    },

    select: <S>(
      selectName: string,
      selector: (state: T) => S,
      isSelectorEqual: (a: S, b: S) => boolean = (a, b) => a === b
    ) => {
      const selectorState = createState({
        newState: () => selector(stateRef.current),
        isEqual: isSelectorEqual,
        name: `${name}/select/${selectName}`,
      });
      const unsubscribe = state.subscribe(() => {
        const selected = selector(stateRef.current);
        return selectorState.setState(selected);
      });
      const clean = () => {
        unsubscribe();
        selectorState.clean();
      };
      selectorState.clean = clean;
      return selectorState;
    },

    reset: () => {
      stateRef.current = newState();
    },

    clean: () => {
      subscribers.clear();
      stateRef.current = newState();
    },

    getAreComponentsNotified: () => areComponentsNotified,
  };
  return state;
}

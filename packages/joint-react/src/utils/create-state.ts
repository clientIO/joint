import ReactDOM from 'react-dom';
import { sendToDevTool } from './dev-tools';
import { util } from '@joint/core';
import { isUpdater } from './is';

export type Update<T> = ((previous: T) => T) | T;
export interface ExternalStoreLike<T> {
  getSnapshot: () => MarkDeepReadOnly<T>;
  subscribe: (listener: () => void) => () => void;
  setState: (updater: Update<T>) => void;
}

export type MarkDeepReadOnly<T> = {
  readonly [K in keyof T]: T[K] extends object ? MarkDeepReadOnly<T[K]> : T[K];
};
export type RemoveDeepReadOnly<T> = {
  -readonly [K in keyof T]: T[K];
};

export function removeDeepReadOnly<T>(value: T): RemoveDeepReadOnly<T> {
  return value as RemoveDeepReadOnly<T>;
}
export function getValue<T>(previous: T, updater: Update<T>): T {
  return isUpdater(updater) ? updater(previous) : updater;
}

export interface State<T> extends ExternalStoreLike<T> {
  select: <S>(
    name: string,
    selector: (state: T) => S,
    isSelectorEqual: (a: S, b: S) => boolean
  ) => State<S>;
  clean: () => void;
  getAreComponentsNotified: () => boolean;
  setState: (updater: Update<T>) => void;
}
interface Options<T> {
  readonly newState: () => T;
  readonly isEqual?: (a: T, b: T) => boolean;
  readonly name: string;
}

export function createState<T>(options: Options<T>): State<T> {
  const { newState, isEqual = util.isEqual, name } = options;

  const stateRef = {
    current: newState(),
  };

  const subscribers = new Set<() => void>();
  let areComponentsNotified = false;

  const notifySubscribers = () => {
    ReactDOM.unstable_batchedUpdates(() => {
      for (const subscriber of subscribers) {
        subscriber();
      }
      areComponentsNotified = true;
    });
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
      sendToDevTool({ name, type: 'set', value: updatedState });
      notifySubscribers();
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

interface DerivedOptions<T, S> {
  readonly state: ExternalStoreLike<T>;
  readonly selector: (state: T) => S;
  readonly isEqual?: (a: S, b: S) => boolean;
  readonly name: string;
}
export function derivedState<T, S>(options: DerivedOptions<T, S>): State<S> {
  const { state, selector, isEqual = util.isEqual, name } = options;
  const getSnapshot = (): S => {
    return selector(state.getSnapshot() as T);
  };
  const stateValue = createState({
    newState: getSnapshot,
    name,
    isEqual,
  });
  const unsubscribe = state.subscribe(() => {
    stateValue.setState(getSnapshot());
  });
  stateValue.clean = () => {
    unsubscribe();
    stateValue.clean();
  };
  return stateValue;
}

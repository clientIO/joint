import { useLayoutEffect, useRef } from 'react';
import type { AnyCellRecord } from '../types/cell.types';
import type { GraphStateSelector, SelectedEqual } from '../store/graph-state';
import { useGraphStateReader } from './use-graph-state-reader';
import { useLatestRef } from './use-latest-ref';
import { rethrowLater } from '../utils/scheduler';

/**
 * Callback of {@link useOnGraphStateChange}: receives the newly selected value
 * and the one before it, absent on the first call.
 * @group Types
 * @example
 * ```ts
 * import type { OnGraphStateChange } from '@joint/react';
 *
 * const logVersion: OnGraphStateChange<number> = (version, previousVersion) => {
 *   console.info(`sizing version: ${previousVersion ?? '-'} → ${version}`);
 * };
 * ```
 */
export type OnGraphStateChange<Selected> = (value: Selected, previousValue?: Selected) => void;

/**
 * The effect behind {@link useOnGraphStateChange} and {@link useOnCellsChange}.
 * The equality and the callback are read when they are needed, so neither has
 * to be stable. A new selector is read at once and calls back if it selects
 * another value; `watchKey` says what is watched, and a new one starts over.
 * @param selector - Derives the value to watch from the graph state.
 * @param onChange - Called with the new and the previous value.
 * @param isEqual - Custom equality for the selected value.
 * @param watchKey - Identifies what is watched; changing it runs the callback
 *   again with the current value and no previous one.
 * @param hookName - The hook the application called, named in dev warnings.
 * @internal
 */
export function useWatchGraphState<Cell extends AnyCellRecord, Selected>(
  selector: GraphStateSelector<Cell, Selected>,
  onChange: OnGraphStateChange<Selected>,
  isEqual?: SelectedEqual<Selected>,
  watchKey?: unknown,
  hookName = 'useOnGraphStateChange'
): void {
  const reader = useGraphStateReader<Cell, Selected>(hookName);
  const selectorRef = useLatestRef(selector);
  const isEqualRef = useLatestRef(isEqual);
  const onChangeRef = useLatestRef(onChange);

  const checkRef = useRef<() => void>(undefined);

  useLayoutEffect(() => {
    // Never called while rendering, so the subscription can follow each read.
    const read = () => reader.sync(selectorRef.current, isEqualRef.current);
    // `read` returns the last value while it is equal, so identity is the test.
    let previous = read();
    onChangeRef.current(previous);
    const check = () => {
      // This may run inside the store's notification: an error, of the selector
      // or of the callback, must not keep the other subscribers of this change
      // from being notified.
      try {
        const next = read();
        if (next === previous) return;
        const before = previous;
        previous = next;
        onChangeRef.current(next, before);
      } catch (error) {
        rethrowLater(error);
      }
    };
    checkRef.current = check;
    const unsubscribe = reader.subscribe(check);
    return () => {
      checkRef.current = undefined;
      unsubscribe();
    };
  }, [reader, watchKey, selectorRef, isEqualRef, onChangeRef]);

  // A new selector may read other parts of the state, or select another value
  // from the same ones, and the store reports neither. Declared after the
  // effect above, so on mount and on a new `watchKey` it finds nothing to do.
  useLayoutEffect(() => {
    checkRef.current?.();
  }, [selector]);
}

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { AnyCellRecord, CellRecord } from '../types/cell.types';
import type { GraphStateSelector, SelectedEqual } from '../store/graph-state';
import { useGraphStateReader } from './use-graph-state-reader';

/**
 * Subscribe to a value selected from the graph state: the cells and the
 * sizing version. The component re-renders when the selected value changes.
 * The hook subscribes to exactly what the selector reads; `useCells` is built
 * on it.
 * @param selector - Derives the value from the graph state.
 * @param isEqual - Equality test used to skip re-renders. Defaults to a shallow,
 *   array-aware comparison that falls back to `Object.is` for other values.
 * @returns The selected value, the same reference for as long as it is equal.
 * @internal
 */
export function useGraphState<Cell extends AnyCellRecord = CellRecord, Selected = unknown>(
  selector: GraphStateSelector<Cell, Selected>,
  isEqual?: SelectedEqual<Selected>
): Selected {
  return useSelectGraphState('useGraphState', selector, isEqual);
}

/**
 * {@link useGraphState} for a hook built on it, which its dev warnings name.
 * @param hookName - The hook the application called.
 * @param selector - Derives the value from the graph state.
 * @param isEqual - Equality test used to skip re-renders.
 * @returns The selected value, the same reference for as long as it is equal.
 * @internal
 */
export function useSelectGraphState<Cell extends AnyCellRecord, Selected>(
  hookName: string,
  selector: GraphStateSelector<Cell, Selected>,
  isEqual?: SelectedEqual<Selected>
): Selected {
  const reader = useGraphStateReader<Cell, Selected>(hookName);
  const getSnapshot = useCallback(
    () => reader.read(selector, isEqual),
    [reader, selector, isEqual]
  );
  const selected = useSyncExternalStore(reader.subscribe, getSnapshot, getSnapshot);
  // A committed selector may read other parts of the state than the one before
  // it. The subscription follows it here, never while rendering: a render that
  // React throws away must leave it where the committed one needs it. Declared
  // after the store subscription, so on mount it runs once that is in place.
  useEffect(() => {
    reader.sync(selector, isEqual);
  }, [reader, selector, isEqual]);
  return selected;
}

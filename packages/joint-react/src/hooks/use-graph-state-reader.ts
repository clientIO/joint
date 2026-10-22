import { useMemo } from 'react';
import { useGraphStore } from './use-graph-store';
import type { AnyCellRecord } from '../types/cell.types';
import { createGraphStateReader, type GraphStateReader } from '../store/graph-state';

/**
 * The reader behind {@link useGraphState}, one
 * per hook instance and per graph store.
 * @param hookName - The hook the application called, named in dev warnings.
 * @returns The reader of the closest graph store.
 * @internal
 */
export function useGraphStateReader<Cell extends AnyCellRecord, Selected>(
  hookName: string
): GraphStateReader<Cell, Selected> {
  const store = useGraphStore();
  // Should React drop this memo, the new reader selects afresh: correct, at the
  // cost of one new reference for a selected array or object.
  return useMemo(() => createGraphStateReader<Cell, Selected>(store, hookName), [store, hookName]);
}

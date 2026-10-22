import { useMemo } from 'react';
import { useGraphStore } from './use-graph-store';
import type { AnyCellRecord } from '../types/cell.types';
import { createGraphStateReader, type GraphStateReader } from '../store/graph-state';

/**
 * The reader behind {@link useGraphState} and {@link useOnGraphStateChange}, one
 * per hook instance and per graph store.
 * @returns The reader of the closest graph store.
 * @internal
 */
export function useGraphStateReader<Cell extends AnyCellRecord, Selected>(): GraphStateReader<
  Cell,
  Selected
> {
  const store = useGraphStore();
  // Should React drop this memo, the new reader selects afresh: correct, at the
  // cost of one new reference for a selected array or object.
  return useMemo(() => createGraphStateReader<Cell, Selected>(store), [store]);
}

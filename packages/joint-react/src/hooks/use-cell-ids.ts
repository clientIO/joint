import { useCallback, useSyncExternalStore } from 'react';
import { useGraphStore } from './use-graph-store';
import type { CellId } from '../types/cell.types';

/**
 * The ids of every cell currently in the graph, as an array that is
 * referentially stable across data-only commits and changes only when a cell is
 * added or removed.
 *
 * A drag (which changes cell data, not the id set) does **no** work here: the
 * container memoises the id list via `getIds()` and invalidates it only on a
 * structural change, so `useSyncExternalStore` sees the same reference each
 * commit and skips the re-render.
 * @returns readonly array of cell ids, stable across data changes
 * @internal
 */
export function useCellIds(): readonly CellId[] {
  const container = useGraphStore().graphProjection.cells;
  const subscribe = useCallback(
    (onStoreChange: () => void) => container.subscribe(onStoreChange),
    [container]
  );
  return useSyncExternalStore(subscribe, container.getIds, container.getIds);
}

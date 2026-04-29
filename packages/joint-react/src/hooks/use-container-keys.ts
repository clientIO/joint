import { useCallback, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { ReadonlyContainer } from '../store/state-container';
import type {
  CellId,
  CellUnion,
  DiaElementAttributes,
  DiaLinkAttributes,
} from '../types/cell.types';

/**
 * Internal hook: subscribe to container size changes and return a stable array of IDs.
 * Re-renders only when the set of IDs changes (additions or removals).
 * @param container - The container to watch for size changes.
 * @returns A stable array of cell IDs. Same reference when IDs haven't changed.
 * @internal
 */
export function useContainerKeys<
  Cell extends CellUnion<DiaElementAttributes, DiaLinkAttributes>,
>(container: ReadonlyContainer<Cell>): CellId[] {
  const previousKeysRef = useRef<CellId[]>([]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => container.subscribeToSize(onStoreChange),
    [container]
  );

  const getSnapshot = useCallback(() => container.getVersion(), [container]);

  const select = useCallback(() => {
    const items = container.getAll();
    const previous = previousKeysRef.current;

    if (items.length === previous.length) {
      let same = true;
      for (const [index, item] of items.entries()) {
        if (item.id !== previous[index]) {
          same = false;
          break;
        }
      }
      if (same) return previous;
    }

    const currentKeys: CellId[] = Array.from({ length: items.length });
    for (const [index, item] of items.entries()) {
      // Items inside the container always have an id (the container is keyed
      // by id) — the optionality on `WithId.id` exists only for input shapes.
      currentKeys[index] = item.id as CellId;
    }

    previousKeysRef.current = currentKeys;
    return currentKeys;
  }, [container]);

  return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, select, Object.is);
}

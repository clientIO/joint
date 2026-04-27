import { useCallback } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { ReadonlyContainer } from '../store/state-container';
import type { CellId, WithId } from '../types/cell.types';
import { isStrictEqual } from '../utils/selector-utils';

/**
 * Internal hook: subscribe to a single ID in a container with a selector.
 * @param container - The container to subscribe to.
 * @param id - The ID of the item to subscribe to.
 * @param selector - Extracts the desired slice from the item.
 * @param isEqual - Equality check for the selector output. Defaults to strict equality.
 * @returns The selected value from the item, or undefined if the item does not exist.
 * @internal
 */
export function useContainerItem<T extends WithId, R>(
  container: ReadonlyContainer<T>,
  id: CellId,
  selector: (item: T) => R,
  isEqual: (a: R, b: R) => boolean = isStrictEqual
): R | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => container.subscribe(id, onStoreChange),
    [container, id]
  );

  const getSnapshot = useCallback(() => container.getVersion(), [container]);

  const select = useCallback(() => {
    const item = container.get(id);
    return item === undefined ? undefined : selector(item);
  }, [container, id, selector]);

  const compareValues = useCallback(
    (a: R | undefined, b: R | undefined): boolean => {
      if (a === undefined && b === undefined) return true;
      if (a === undefined || b === undefined) return false;
      return isEqual(a, b);
    },
    [isEqual]
  );

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    select,
    compareValues
  );
}

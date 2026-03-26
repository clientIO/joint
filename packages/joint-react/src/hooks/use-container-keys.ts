import { useCallback, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { ReadonlyContainer } from '../store/state-container';

/**
 * Internal hook: subscribe to container changes and return a stable array of IDs.
 * Only re-renders when the set of IDs changes (additions or removals).
 * Used by Paper to know which elements/links to render without subscribing to data changes.
 * @param container - The container to watch for size changes.
 * @returns A stable string array of IDs. Same reference when IDs haven't changed.
 * @internal
 */
export function useContainerKeys(container: ReadonlyContainer<unknown>): string[] {
  const previousKeysRef = useRef<string[]>([]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => container.subscribeToFull(onStoreChange),
    [container]
  );

  const getSnapshot = useCallback(() => container.getVersion(), [container]);

  const select = useCallback(() => {
    const currentKeys = [...container.getFull().keys()];
    const previous = previousKeysRef.current;

    // Return same reference if IDs haven't changed
    if (
      previous.length === currentKeys.length &&
      previous.every((key, index) => key === currentKeys[index])
    ) {
      return previous;
    }

    previousKeysRef.current = currentKeys;
    return currentKeys;
  }, [container]);

  return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, select, Object.is);
}

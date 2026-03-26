import { useCallback, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { ReadonlyContainer } from '../store/state-container';

/**
 * Shallow-compare two Maps by size and key→value identity (`===`).
 * Returns `true` when both maps have the same keys mapping to the same values.
 */
function areMapsShallowEqual<R>(a: Map<string, R>, b: Map<string, R>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    if (!b.has(key) || b.get(key) !== value) return false;
  }
  return true;
}

/**
 * Internal hook: subscribe to a container for collection access with optional ID filter.
 * All plural hooks (useElementsData, useLinksData) delegate to this.
 *
 * Returns a stable Map reference when selected values have not changed.
 * When ids are provided, subscribes only to those IDs.
 * @param container - The container to subscribe to.
 * @param selector - Extracts the desired slice from each item.
 * @param ids - Optional list of IDs to filter. When omitted, returns all items.
 * @returns A Map with selected values. Same reference when values are unchanged.
 * @internal
 */
export function useContainerItems<T, R>(
  container: ReadonlyContainer<T>,
  selector: (item: T) => R,
  ids?: string[],
): Map<string, R> {
  const previousResultRef = useRef<Map<string, R>>(new Map());

  // When specific IDs are requested, subscribe to each ID individually.
  // When no IDs, subscribe to the full container.
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (ids && ids.length > 0) {
        const unsubscribers = ids.map((id) => container.subscribe(id, onStoreChange));
        // Also subscribe to size to catch removals
        const unsubSize = container.subscribeToSize(onStoreChange);
        return () => {
          for (const unsub of unsubscribers) unsub();
          unsubSize();
        };
      }
      return container.subscribeToFull(onStoreChange);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, ids?.join(',')],
  );

  const getSnapshot = useCallback(
    () => container.getVersion(),
    [container],
  );

  const select = useCallback(
    () => {
      const result = new Map<string, R>();
      if (ids && ids.length > 0) {
        for (const id of ids) {
          const item = container.get(id);
          if (item !== undefined) {
            result.set(id, selector(item));
          }
        }
      } else {
        for (const [id, item] of container.getFull()) {
          result.set(id, selector(item));
        }
      }

      // Return previous reference if selected values are identical
      if (areMapsShallowEqual(result, previousResultRef.current)) {
        return previousResultRef.current;
      }

      previousResultRef.current = result;
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, selector, ids?.join(',')],
  );

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    select,
    Object.is,
  );
}

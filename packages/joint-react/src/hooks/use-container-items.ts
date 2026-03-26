import { useCallback, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { ReadonlyContainer } from '../store/state-container';
import { isStrictEqual } from '../utils/selector-utils';

/**
 * Shallow-compare two Maps by size and key→value identity (`===`).
 * Returns `true` when both maps have the same keys mapping to the same values.
 * @param a
 * @param b
 */
function areMapsShallowEqual<R>(a: Map<string, R>, b: Map<string, R>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    if (!b.has(key) || b.get(key) !== value) return false;
  }
  return true;
}

/**
 * Internal hook: subscribe to a container for collection access.
 * Supports 3 modes:
 *
 * - **No args**: subscribes to full container, returns all items as a stable Map.
 * - **IDs**: subscribes per-ID + size, returns filtered Map (best performance for subsets).
 * - **Selector**: subscribes to full container, applies selector to full Map.
 *
 * @param container - The container to subscribe to.
 * @param idsOrSelector - Either an array of IDs to filter, or a selector function for full-Map access.
 * @param isEqual - Equality function for selector mode. Defaults to `Object.is`.
 * @internal
 */
export function useContainerItems<T>(
  container: ReadonlyContainer<T>,
  ids?: string[],
): Map<string, T>;
export function useContainerItems<T, S>(
  container: ReadonlyContainer<T>,
  selector: (items: Map<string, T>) => S,
  isEqual?: (a: S, b: S) => boolean,
): S;
export function useContainerItems<T, S>(
  container: ReadonlyContainer<T>,
  idsOrSelector?: string[] | ((items: Map<string, T>) => S),
  isEqual?: (a: S, b: S) => boolean,
): Map<string, T> | S {
  const isSelectorMode = typeof idsOrSelector === 'function';
  const selector = isSelectorMode ? idsOrSelector : undefined;
  const ids = isSelectorMode ? undefined : idsOrSelector;

  const previousResultRef = useRef<Map<string, T>>(new Map());

  // IDs mode: per-ID + size subscriptions (only fires for targeted changes).
  // No-args / selector mode: full container subscription.
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!selector && ids && ids.length > 0) {
        const unsubscribers = ids.map((id) => container.subscribe(id, onStoreChange));
        const unsubSize = container.subscribeToSize(onStoreChange);
        return () => {
          for (const unsub of unsubscribers) unsub();
          unsubSize();
        };
      }
      return container.subscribeToFull(onStoreChange);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, selector, ids?.join(',')],
  );

  const getSnapshot = useCallback(
    () => container.getVersion(),
    [container],
  );

  const select = useCallback(
    (): Map<string, T> | S => {
      // Selector mode: delegate to user selector over full Map
      if (selector) {
        return selector(container.getFull());
      }

      // IDs / no-args mode: build a Map and stabilize via shallow equality
      const result = new Map<string, T>();
      if (ids && ids.length > 0) {
        for (const id of ids) {
          const item = container.get(id);
          if (item !== undefined) {
            result.set(id, item);
          }
        }
      } else {
        for (const [id, item] of container.getFull()) {
          result.set(id, item);
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

  // Selector mode: use user-provided isEqual (default: strict equality).
  // Map mode: Object.is suffices because we stabilize the reference via previousResultRef.
  const resolvedIsEqual = selector
    ? ((isEqual ?? isStrictEqual) as (a: Map<string, T> | S, b: Map<string, T> | S) => boolean)
    : (Object.is as (a: Map<string, T> | S, b: Map<string, T> | S) => boolean);

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    select,
    resolvedIsEqual,
  );
}

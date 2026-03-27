/* eslint-disable sonarjs/cognitive-complexity */
import { useCallback, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { ReadonlyContainer } from '../store/state-container';
import { isStrictEqual } from '../utils/selector-utils';

/**
 * Shallow-compare two Maps by size and key→value identity (`===`).
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
 *
 * - **Map mode** (`ids?`): returns all/filtered items as a stable Map. Per-ID subscription for IDs.
 * - **Map mode with transform** (`ids?, mapItem`): same, but applies `mapItem` to each value.
 * - **Selector mode** (`selector, isEqual?`): applies selector to full Map, custom equality.
 *
 * @internal
 */
export function useContainerItems<T>(
  container: ReadonlyContainer<T>,
  ids?: string[]
): Map<string, T>;
export function useContainerItems<T, R>(
  container: ReadonlyContainer<T>,
  ids: string[] | undefined,
  mapItem: (item: T) => R
): Map<string, R>;
export function useContainerItems<T, S>(
  container: ReadonlyContainer<T>,
  selector: (items: Map<string, T>) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useContainerItems<T, R, S>(
  container: ReadonlyContainer<T>,
  idsOrSelector?: string[] | ((items: Map<string, T>) => S),
  mapItemOrIsEqual?: ((item: T) => R) | ((a: S, b: S) => boolean)
): Map<string, T | R> | S {
  const isSelectorMode = typeof idsOrSelector === 'function';
  const selector = isSelectorMode ? idsOrSelector : undefined;
  const ids = isSelectorMode ? undefined : idsOrSelector;
  // In map mode, third arg is mapItem. In selector mode, third arg is isEqual.
  const mapItem =
    !isSelectorMode && mapItemOrIsEqual ? (mapItemOrIsEqual as (item: T) => R) : undefined;
  const isEqual =
    isSelectorMode && mapItemOrIsEqual ? (mapItemOrIsEqual as (a: S, b: S) => boolean) : undefined;

  const previousResultRef = useRef<Map<string, T | R>>(new Map());

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
    [container, selector, ids?.join(',')]
  );

  const getSnapshot = useCallback(() => container.getVersion(), [container]);

  const select = useCallback(
    (): Map<string, T | R> | S => {
      // Selector mode: delegate to user selector over full Map
      if (selector) {
        return selector(container.getFull());
      }

      // Map mode: build a Map, optionally transforming each item
      const result = new Map<string, T | R>();
      if (ids && ids.length > 0) {
        for (const id of ids) {
          const item = container.get(id);
          if (item !== undefined) {
            result.set(id, mapItem ? mapItem(item) : item);
          }
        }
      } else {
        for (const [id, item] of container.getFull()) {
          result.set(id, mapItem ? mapItem(item) : item);
        }
      }

      // Return previous reference if values are identical
      if (areMapsShallowEqual(result, previousResultRef.current)) {
        return previousResultRef.current;
      }

      previousResultRef.current = result;
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, selector, mapItem, ids?.join(',')]
  );

  // Selector mode: user-provided isEqual (default: strict equality).
  // Map mode: Object.is suffices because we stabilize the reference via previousResultRef.
  const resolvedIsEqual = selector
    ? ((isEqual ?? isStrictEqual) as (
        a: Map<string, T | R> | S,
        b: Map<string, T | R> | S
      ) => boolean)
    : (Object.is as (a: Map<string, T | R> | S, b: Map<string, T | R> | S) => boolean);

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    select,
    resolvedIsEqual
  );
}

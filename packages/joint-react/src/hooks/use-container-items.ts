/* eslint-disable sonarjs/cognitive-complexity */
import { useCallback, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { ReadonlyContainer } from '../store/state-container';
import type { CellId, WithId } from '../types/cell.types';
import { isStrictEqual } from '../utils/selector-utils';

/**
 * Shallow-compare two Maps by size and key→value identity (`===`).
 * @param a - first map
 * @param b - second map
 * @returns true if both maps have the same keys pointing to the same references
 */
function areMapsShallowEqual<R>(a: Map<CellId, R>, b: Map<CellId, R>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    if (!b.has(key) || b.get(key) !== value) return false;
  }
  return true;
}

/**
 * Internal hook: subscribe to a container for collection access.
 *
 * - **Map mode** (`ids?`): returns all/filtered items as a stable Map keyed by id.
 *   Per-ID subscription for the `ids` case; full-container subscription otherwise.
 * - **Map mode with transform** (`ids?, mapItem`): same, with `mapItem` applied to each value.
 * - **Selector mode** (`selector, isEqual?`): applies selector to the items array.
 */
export function useContainerItems<T extends WithId>(
  container: ReadonlyContainer<T>,
  ids?: CellId[]
): Map<CellId, T>;
export function useContainerItems<T extends WithId, R>(
  container: ReadonlyContainer<T>,
  ids: CellId[] | undefined,
  mapItem: (item: T) => R
): Map<CellId, R>;
export function useContainerItems<T extends WithId, S>(
  container: ReadonlyContainer<T>,
  selector: (items: readonly T[]) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useContainerItems<T extends WithId, R, S>(
  container: ReadonlyContainer<T>,
  idsOrSelector?: CellId[] | ((items: readonly T[]) => S),
  mapItemOrIsEqual?: ((item: T) => R) | ((a: S, b: S) => boolean)
): Map<CellId, T | R> | S {
  const isSelectorMode = typeof idsOrSelector === 'function';
  const selector = isSelectorMode ? idsOrSelector : undefined;
  const ids = isSelectorMode ? undefined : idsOrSelector;
  const mapItem =
    !isSelectorMode && mapItemOrIsEqual ? (mapItemOrIsEqual as (item: T) => R) : undefined;
  const isEqual =
    isSelectorMode && mapItemOrIsEqual ? (mapItemOrIsEqual as (a: S, b: S) => boolean) : undefined;

  const previousResultRef = useRef<Map<CellId, T | R>>(new Map());

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
      return container.subscribeToAll(onStoreChange);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, selector, ids?.join(',')]
  );

  const getSnapshot = useCallback(() => container.getVersion(), [container]);

  const select = useCallback(
    (): Map<CellId, T | R> | S => {
      if (selector) {
        return selector(container.getAll());
      }

      const result = new Map<CellId, T | R>();
      if (ids && ids.length > 0) {
        for (const id of ids) {
          const item = container.get(id);
          if (item !== undefined) {
            result.set(id, mapItem ? mapItem(item) : item);
          }
        }
      } else {
        for (const item of container.getAll()) {
          result.set(item.id, mapItem ? mapItem(item) : item);
        }
      }

      if (areMapsShallowEqual(result, previousResultRef.current)) {
        return previousResultRef.current;
      }

      previousResultRef.current = result;
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, selector, mapItem, ids?.join(',')]
  );

  const resolvedIsEqual = selector
    ? ((isEqual ?? isStrictEqual) as (
        a: Map<CellId, T | R> | S,
        b: Map<CellId, T | R> | S
      ) => boolean)
    : (Object.is as (a: Map<CellId, T | R> | S, b: Map<CellId, T | R> | S) => boolean);

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    select,
    resolvedIsEqual
  );
}

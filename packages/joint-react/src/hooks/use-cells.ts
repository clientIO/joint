import { useCallback, useMemo, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { useGraphStore } from './use-graph-store';
import type { CellId, CellRecord, Cells } from '../types/cell.types';
import type { ReadonlyContainer } from '../store/state-container';

/** Union of all possible `useCells` return shapes (depends on argument form). */
type UseCellsResult<ElementData, LinkData, Selected> =
  | Cells<ElementData, LinkData>
  | CellRecord<ElementData, LinkData>
  | undefined
  | Selected;

/**
 * Subscribe to the full cells array.
 *
 * Returned array reference is stable across data-only mutations (the internal
 * container mutates items in-place). Size changes produce a new snapshot token.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @returns readonly cells array
 */
export function useCells<
  ElementData = unknown,
  LinkData = unknown,
>(): Cells<ElementData, LinkData>;
/**
 * Subscribe to a single cell by id.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @param id - cell id to track
 * @returns current cell, or undefined when missing
 */
export function useCells<ElementData = unknown, LinkData = unknown>(
  id: CellId
): CellRecord<ElementData, LinkData> | undefined;
/**
 * Subscribe via a selector. Runs on every commit; return equal values to skip re-render.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @template Selected - selector return type
 * @param selector - derive a value from the cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useCells<ElementData, LinkData, Selected>(
  selector: (cells: Cells<ElementData, LinkData>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
export function useCells<ElementData, LinkData, Selected>(
  argument1?: CellId | ((cells: Cells<ElementData, LinkData>) => Selected),
  isEqual: (a: Selected, b: Selected) => boolean = Object.is
): UseCellsResult<ElementData, LinkData, Selected> {
  type Container = ReadonlyContainer<CellRecord<ElementData, LinkData>>;
  const store = useGraphStore<
    ElementData extends object ? ElementData : Record<string, unknown>,
    LinkData extends object ? LinkData : Record<string, unknown>
  >();
  const container = store.graphView.cells as unknown as Container;

  const selector = typeof argument1 === 'function' ? argument1 : undefined;
  const targetId = typeof argument1 === 'function' ? undefined : argument1;
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const cachedRef = useRef<{ hasValue: boolean; value: unknown }>({
    hasValue: false,
    value: undefined,
  });

  const subscribe = useCallback(
    (listener: () => void) => {
      if (targetId !== undefined) return container.subscribe(targetId, listener);
      return container.subscribeToAll(listener);
    },
    [container, targetId]
  );

  const getSnapshot = useCallback(() => {
    if (targetId !== undefined) return container.get(targetId);
    return container.getVersion();
  }, [container, targetId]);

  const select = useCallback(
    (): UseCellsResult<ElementData, LinkData, Selected> => {
      if (targetId !== undefined) return container.get(targetId);
      const all = container.getAll() as Cells<ElementData, LinkData>;
      const currentSelector = selectorRef.current;
      if (!currentSelector) return all;
      const next = currentSelector(all);
      if (cachedRef.current.hasValue && isEqual(cachedRef.current.value as Selected, next)) {
        return cachedRef.current.value as Selected;
      }
      cachedRef.current = { hasValue: true, value: next };
      return next;
    },
    [container, targetId, isEqual]
  );

  const resolvedIsEqual = useMemo<(a: unknown, b: unknown) => boolean>(() => {
    if (selector) return isEqual as unknown as (a: unknown, b: unknown) => boolean;
    return Object.is;
  }, [selector, isEqual]);

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    select,
    resolvedIsEqual as (a: unknown, b: unknown) => boolean
  ) as UseCellsResult<ElementData, LinkData, Selected>;
}

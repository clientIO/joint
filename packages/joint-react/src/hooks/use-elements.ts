/* eslint-disable @typescript-eslint/unified-signatures */
import { useMemo } from 'react';
import type { CellId } from '../types/cell-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';
import type { ElementWithLayout } from '../types/data-types';

/** Element container item type. */

/**
 * Hook to access full element items from the graph.
 *
 * Returns items with `data`, `position`, `size`, `angle`, `ports`, etc.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all elements as a stable `Map`.
 * - **IDs**: returns a filtered subset.
 * - **Selector**: applies a selector over the full `Map`.
 *
 * @group Hooks
 */
export function useElements<T extends object | undefined = undefined>(): Map<
  CellId,
  ElementWithLayout<T>
>;
export function useElements<T extends object | undefined = undefined>(
  ...ids: [string, ...string[]]
): Map<CellId, ElementWithLayout<T>>;
export function useElements<
  T extends object | undefined = undefined,
  S = Map<CellId, ElementWithLayout<T>>,
>(selector: (items: Map<CellId, ElementWithLayout<T>>) => S, isEqual?: (a: S, b: S) => boolean): S;
export function useElements<
  T extends object | undefined = undefined,
  S = Map<CellId, ElementWithLayout<T>>,
>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<CellId, ElementWithLayout<T>>) => S, ((a: S, b: S) => boolean)?]
): Map<CellId, ElementWithLayout<T>> | S {
  const {
    graphView: { elements },
  } = useGraphStore<T>();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')]
  );

  const idsOrSelector = isSelectorMode
    ? (args[0] as (items: Map<CellId, ElementWithLayout<T>>) => S)
    : stableIds;
  const isEqual = isSelectorMode ? (args[1] as ((a: S, b: S) => boolean) | undefined) : undefined;

  return useContainerItems(elements, idsOrSelector, isEqual);
}

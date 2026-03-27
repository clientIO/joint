/* eslint-disable @typescript-eslint/unified-signatures */
import { useMemo } from 'react';
import type { CellData, FlatElementData } from '../types/data-types';
import type { CellId } from '../types/cell-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';

/**
 * Hook to access full element items (`FlatElementData`) from the graph.
 *
 * Returns items with `data`, `x`, `y`, `width`, `height`, `angle`, `ports`, etc.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all elements as a stable `Map<CellId, FlatElementData>`.
 * - **IDs**: returns a filtered subset. Subscribes per-ID — best performance for known subsets.
 * - **Selector**: applies a selector over the full `Map`. Re-renders only when the selector output changes.
 *
 * @example
 * ```tsx
 * const all = useElements();
 * const subset = useElements('id1', 'id2');
 * const count = useElements((items) => items.size);
 * ```
 * @group Hooks
 */
export function useElements<T extends object = CellData>(): Map<CellId, FlatElementData<T>>;
export function useElements<T extends object = CellData>(
  ...ids: [string, ...string[]]
): Map<CellId, FlatElementData<T>>;
export function useElements<T extends CellData, S>(
  selector: (items: Map<CellId, FlatElementData<T>>) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useElements<S = Map<CellId, FlatElementData>>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<CellId, FlatElementData>) => S, ((a: S, b: S) => boolean)?]
): Map<CellId, FlatElementData> | S {
  const {
    graphView: { elements },
  } = useGraphStore();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')]
  );

  const idsOrSelector = isSelectorMode
    ? (args[0] as (items: Map<string, FlatElementData>) => S)
    : stableIds;
  const isEqual = isSelectorMode ? (args[1] as ((a: S, b: S) => boolean) | undefined) : undefined;

  return useContainerItems(
    elements,
    idsOrSelector as (items: Map<string, FlatElementData>) => S,
    isEqual
  ) as Map<CellId, FlatElementData> | S;
}

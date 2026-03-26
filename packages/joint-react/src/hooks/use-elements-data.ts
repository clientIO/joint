/* eslint-disable @typescript-eslint/unified-signatures */
import { useMemo } from 'react';
import type { CellData } from '../types/cell-data';
import type { CellId } from '../types/cell-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';

/**
 * Hook to access all graph elements, a filtered subset, or a selector-derived value.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all elements as a stable `Map`. Re-renders only when element data changes.
 * - **IDs**: returns a filtered subset. Subscribes per-ID — best performance for known subsets.
 * - **Selector**: applies a selector over the full `Map`. Re-renders only when the selector output changes.
 *
 * @example
 * ```tsx
 * const all = useElementsData();
 * const subset = useElementsData('id1', 'id2');
 * const count = useElementsData((items) => items.size);
 * ```
 * @group Hooks
 */
export function useElementsData<ElementData extends object = CellData>(): Map<CellId, ElementData>;
export function useElementsData<ElementData extends object = CellData>(
  ...ids: [string, ...string[]]
): Map<CellId, ElementData>;
export function useElementsData<
  ElementData extends object = CellData,
  S = Map<CellId, ElementData>,
>(selector: (items: Map<CellId, ElementData>) => S, isEqual?: (a: S, b: S) => boolean): S;
export function useElementsData<
  ElementData extends object = CellData,
  S = Map<CellId, ElementData>,
>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<CellId, ElementData>) => S, ((a: S, b: S) => boolean)?]
): Map<CellId, ElementData> | S {
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

  const idsOrSelector: string[] | ((items: Map<string, CellData>) => S) | undefined = isSelectorMode
    ? (args[0] as (items: Map<string, CellData>) => S)
    : stableIds;
  const isEqual = isSelectorMode ? (args[1] as ((a: S, b: S) => boolean) | undefined) : undefined;

  return useContainerItems(
    elements,
    idsOrSelector as (items: Map<string, CellData>) => S,
    isEqual
  ) as Map<CellId, ElementData> | S;
}

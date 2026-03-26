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
 * // All elements
 * const all = useElementsData();
 *
 * // Specific elements only — subscribes just to these IDs
 * const subset = useElementsData('id1', 'id2');
 *
 * // Selector — re-renders only when count changes
 * const count = useElementsData((items) => items.size);
 *
 * // Selector with custom equality
 * const positions = useElementsData(
 *   (items) => [...items.values()].map((el) => ({ x: el.x, y: el.y })),
 *   (a, b) => JSON.stringify(a) === JSON.stringify(b),
 * );
 * ```
 * @group Hooks
 */
export function useElementsData<
  ElementData extends CellData = CellData,
>(): Map<CellId, ElementData>;
export function useElementsData<
  ElementData extends CellData = CellData,
>(...ids: [string, ...string[]]): Map<CellId, ElementData>;
export function useElementsData<
  ElementData extends CellData = CellData,
  S = Map<CellId, ElementData>,
>(
  selector: (items: Map<CellId, ElementData>) => S,
  isEqual?: (a: S, b: S) => boolean,
): S;
export function useElementsData<
  ElementData extends CellData = CellData,
  S = Map<CellId, ElementData>,
>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<CellId, ElementData>) => S, ((a: S, b: S) => boolean)?]
): Map<CellId, ElementData> | S {
  const { graphView: { elements } } = useGraphStore();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  // Always called (rules of hooks) — returns undefined in selector mode.
  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')],
  );

  // Single useContainerItems call — pass selector or IDs depending on mode.
  // The union type requires a cast because TS can't narrow across the overloads.
  const idsOrSelector: string[] | ((items: Map<string, CellData>) => S) | undefined = isSelectorMode
    ? (args[0] as (items: Map<string, CellData>) => S)
    : stableIds;
  const isEqual = isSelectorMode
    ? (args[1] as ((a: S, b: S) => boolean) | undefined)
    : undefined;

  // Safe: useContainerItems implementation handles all three argument shapes.
  return useContainerItems(
    elements,
    idsOrSelector as (items: Map<string, CellData>) => S,
    isEqual,
  ) as Map<CellId, ElementData> | S;
}

import { useMemo } from 'react';
import type { CellData } from '../types/cell-data';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';

const selectData = (item: CellData): unknown => (item as { readonly data: unknown }).data;

/**
 * Returns user data for all elements, or a filtered subset when IDs are provided.
 * Subscribes to the elements data container — does NOT re-render on position/size changes.
 * @example
 * ```tsx
 * // All elements
 * const allData = useElementsData();
 *
 * // Specific elements only — subscribes to just these IDs
 * const subset = useElementsData('id1', 'id2');
 * ```
 * @param ids - Optional element IDs to subscribe to. When omitted, returns all.
 * @returns A Map of element IDs to their user data.
 * @group Hooks
 */
export function useElementsData<D extends CellData = CellData>(
  ...ids: string[]
): Map<string, D> {
  const { graphView: { elements } } = useGraphStore();
  const stableIds = useMemo(
    () => (ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(',')],
  );
  return useContainerItems(elements, selectData, stableIds) as Map<string, D>;
}

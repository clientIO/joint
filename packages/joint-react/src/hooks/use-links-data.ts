import { useMemo } from 'react';
import type { CellData } from '../types/cell-data';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';

const selectData = (item: CellData): unknown => (item as { readonly data: unknown }).data;

/**
 * Returns user data for all links, or a filtered subset when IDs are provided.
 * Subscribes to the links data container — does NOT re-render on routing changes.
 *
 * @example
 * ```tsx
 * // All links
 * const allData = useLinksData();
 *
 * // Specific links only — subscribes to just these IDs
 * const subset = useLinksData('l1', 'l2');
 * ```
 * @param ids - Optional link IDs to subscribe to. When omitted, returns all.
 * @returns A Map of link IDs to their user data.
 * @group Hooks
 */
export function useLinksData<D extends CellData = CellData>(
  ...ids: string[]
): Map<string, D> {
  const { graphView: { links } } = useGraphStore();
  const stableIds = useMemo(
    () => (ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(',')],
  );
  return useContainerItems(links, selectData, stableIds) as Map<string, D>;
}

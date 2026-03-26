import type { CellId } from '../types/cell-id';
import type { CellData } from '../types/cell-data';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { isStrictEqual } from '../utils/selector-utils';

// Always returns false so that no-selector mode re-renders on every version change.
const alwaysRerender = () => false;

/**
 * Hook to access all graph links via the per-ID container architecture.
 *
 * - **Without selector**: re-renders on every link change, returns a new Map copy.
 * - **With selector**: re-renders only when the selector output changes.
 * @param selector - A function to select a portion of the links Map.
 * @param isEqual - A function to compare previous and new selector results.
 * @returns The selected value, or a new Map copy if no selector is provided.
 * @group Hooks
 */
export function useLinks<
  LinkData extends CellData = CellData,
  SelectorReturnType = Map<CellId, LinkData>,
>(
  selector?: (items: Map<CellId, LinkData>) => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = isStrictEqual as (
    a: SelectorReturnType,
    b: SelectorReturnType
  ) => boolean
): SelectorReturnType {
  const { graphView: { links } } = useGraphStore();

  const internalSelector = selector
    ? () => selector(links.getFull() as unknown as Map<CellId, LinkData>)
    : () => new Map(links.getFull()) as unknown as SelectorReturnType;

  return useSyncExternalStoreWithSelector(
    links.subscribeToFull,
    links.getVersion,
    links.getVersion,
    internalSelector,
    selector ? isEqual : (alwaysRerender as unknown as typeof isEqual)
  );
}

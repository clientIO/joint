import type { GraphStoreLayoutSnapshot } from '../store';
import { useGraphStore } from './use-graph-store';
import { useStoreSelector } from './use-graph-store-selector';

const DEFAULT_LAYOUTS_SELECTOR = (snapshot: GraphStoreLayoutSnapshot) => snapshot;
/**
 * Hook to select layout-related data from the graph store.
 * @param selector - The selector function to select layout data from the graph store snapshot.
 * @returns The selected layout data.
 * @group Hooks
 * @example
 */
export function useLayouts<Selected>(
  selector: (
    snapshot: GraphStoreLayoutSnapshot
  ) => Selected = DEFAULT_LAYOUTS_SELECTOR as unknown as (
    snapshot: GraphStoreLayoutSnapshot
  ) => Selected
): Selected {
  const { layoutState } = useGraphStore();
  return useStoreSelector(layoutState, selector);
}

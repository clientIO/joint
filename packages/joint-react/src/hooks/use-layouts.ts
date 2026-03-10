import { util } from '@joint/core';
import type { GraphStoreLayoutSnapshot } from '../store';
import { useGraphStore } from './use-graph-store';
import { useStoreSelector } from './use-graph-store-selector';

const DEFAULT_LAYOUTS_SELECTOR = (snapshot: GraphStoreLayoutSnapshot) => snapshot;
/**
 * Hook to select layout-related data from the graph store.
 * @param selector - The selector function to select layout data from the graph store snapshot.
 * @param isEqual - Optional equality function to optimize re-renders.
 * @returns The selected layout data.
 * @group Hooks
 */
export function useLayouts<Selected>(
  selector: (
    snapshot: GraphStoreLayoutSnapshot
  ) => Selected = DEFAULT_LAYOUTS_SELECTOR as unknown as (
    snapshot: GraphStoreLayoutSnapshot
  ) => Selected,
  isEqual: (a: Selected, b: Selected) => boolean = util.isEqual
): Selected {
  const { layoutState } = useGraphStore();
  return useStoreSelector(layoutState, selector, isEqual);
}

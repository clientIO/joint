import type { GraphStoreInternalSnapshot } from '../store/graph-store';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

/**
 * Hook to select data from the internal graph store state.
 * @param selector - The selector function.
 * @param isEqual - The equality function.
 * @returns The selected data.
 */
export function useInternalData<Selection>(
  selector: (snapshot: GraphStoreInternalSnapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const { internalState } = useGraphStore();
  return useSyncExternalStoreWithSelector(
    internalState.subscribe,
    internalState.getSnapshot,
    internalState.getSnapshot,
    selector,
    isEqual ?? Object.is
  );
}

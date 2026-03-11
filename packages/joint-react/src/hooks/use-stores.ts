import { util } from '@joint/core';
import type {
  GraphExternalContextId,
  GraphExternalContextSnapshot,
  GraphStoreSnapshot,
  GraphStoreInternalSnapshot,
  GraphStoreLayoutSnapshot,
} from '../store';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import type { ExternalStoreLike, MarkDeepReadOnly } from '../utils/create-state';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

const DEFAULT_LAYOUTS_SELECTOR = (snapshot: GraphStoreLayoutSnapshot) => snapshot;

/**
 * Generic hook to select data from an external store.
 * @param store - The external store to select from.
 * @param selector - The selector function.
 * @param isEqual - The equality function.
 * @returns The selected data.
 */
export function useStore<Snapshot, Selection>(
  store: ExternalStoreLike<Snapshot>,
  selector: (snapshot: MarkDeepReadOnly<Snapshot>) => Selection,
  isEqual: (a: Selection, b: Selection) => boolean = Object.is
): Selection {
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    selector,
    isEqual
  );
}

/**
 * Hook to select data from the public graph store state.
 * @param selector - The selector function.
 * @param isEqual - The equality function.
 * @returns The selected data.
 */
export function useData<Selection, ElementData = FlatElementData, LinkData = FlatLinkData>(
  selector: (snapshot: MarkDeepReadOnly<GraphStoreSnapshot<ElementData, LinkData>>) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const { dataState } = useGraphStore();
  return useStore(
    dataState as unknown as ExternalStoreLike<GraphStoreSnapshot<ElementData, LinkData>>,
    selector,
    isEqual
  );
}

/**
 * Hook to select data from the internal graph store state.
 * @param selector - The selector function.
 * @param isEqual - The equality function.
 * @returns The selected data.
 */
export function useInternalData<Selection>(
  selector: (snapshot: MarkDeepReadOnly<GraphStoreInternalSnapshot>) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const { internalState } = useGraphStore();
  return useStore(internalState, selector, isEqual);
}

/**
 * Hook to access whether all elements have been measured (have width and height).
 * Computed based on actual graph cell sizes, not state data.
 * @returns true if all elements have been measured, false otherwise.
 */
export function useAreElementsMeasured(): boolean {
  const { areElementsMeasuredState } = useGraphStore();
  return useStore(areElementsMeasuredState, (value) => value);
}

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
  return useStore(layoutState, selector, isEqual);
}

/**
 * Hook to access an external context value stored on the graph store by its ID.
 * @param id - The unique identifier of the external context to access.
 * @returns The current value of the external context with the specified ID, or null if not found.
 */
export function useExternalContext<ContextValue>(id?: GraphExternalContextId): ContextValue | null {
  const graphStore = useGraphStore();
  const version = useStore(graphStore.externalStore.versionState, (snapshot) => {
    if (!id) return null;
    return (snapshot as GraphExternalContextSnapshot).get(id) ?? null;
  });

  if (!version || !id) {
    return null;
  }
  const externalContext = graphStore.externalStore.getExternalContext(id);
  return externalContext ? (externalContext.value as ContextValue) : null;
}

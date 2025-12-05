import type { GraphStoreIdsSnapshot, GraphStorePublicSnapshot, GraphStoreSnapshot } from '../store';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type { ExternalStoreLike, MarkDeepReadOnly } from '../utils/create-state';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

/**
 * Generic hook to select data from an external store.
 * @param store - The external store to select from.
 * @param selector - The selector function.
 * @param isEqual - The equality function.
 * @returns The selected data.
 */
export function useStoreSelector<Snapshot, Selection>(
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
export function useGraphStoreSelector<
  Selection,
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
>(
  selector: (snapshot: MarkDeepReadOnly<GraphStorePublicSnapshot<Element, Link>>) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const { publicState } = useGraphStore();
  return useStoreSelector(publicState, selector, isEqual);
}

/**
 * Hook to select data from the internal graph store state.
 * @param selector - The selector function.
 * @param isEqual - The equality function.
 * @returns The selected data.
 */
export function useGraphInternalStoreSelector<Selection>(
  selector: (snapshot: MarkDeepReadOnly<GraphStoreSnapshot>) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const { internalState } = useGraphStore();
  return useStoreSelector(internalState, selector, isEqual);
}

/**
 * Hook to select data from the ids store state.
 * @param selector - The selector function.
 * @param isEqual - The equality function.
 * @returns The selected data.
 */
export function useIdsStoreSelector<Selection>(
  selector: (snapshot: MarkDeepReadOnly<GraphStoreIdsSnapshot>) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const { idsStore } = useGraphStore();
  return useStoreSelector(idsStore, selector, isEqual);
}

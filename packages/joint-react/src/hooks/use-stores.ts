import type {
  GraphStoreSnapshot,
  GraphStoreInternalSnapshot,
  ElementsLayoutSnapshot,
  LinksLayoutSnapshot,
} from '../store';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import type { ExternalStoreLike, MarkDeepReadOnly } from '../utils/create-state';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { isStrictEqual, identitySelector } from '../utils/selector-utils';

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
 * Hook to select element layout data from the graph store.
 * @param selector - The selector function to select from the elements layout snapshot.
 * @param isEqual - Optional equality function to optimize re-renders.
 * @returns The selected element layout data.
 * @group Hooks
 */
export function useElementsLayout<Selected>(
  selector: (snapshot: ElementsLayoutSnapshot) => Selected = identitySelector as unknown as (
    snapshot: ElementsLayoutSnapshot
  ) => Selected,
  isEqual: (a: Selected, b: Selected) => boolean = isStrictEqual
): Selected {
  const { layoutState } = useGraphStore();
  return useStore(layoutState, (snapshot) => selector(snapshot.elements), isEqual);
}

/**
 * Hook to select link layout data from the graph store.
 * @param selector - The selector function to select from the links layout snapshot.
 * @param isEqual - Optional equality function to optimize re-renders.
 * @returns The selected link layout data.
 * @group Hooks
 */
export function useLinksLayout<Selected>(
  selector: (snapshot: LinksLayoutSnapshot) => Selected = identitySelector as unknown as (
    snapshot: LinksLayoutSnapshot
  ) => Selected,
  isEqual: (a: Selected, b: Selected) => boolean = isStrictEqual
): Selected {
  const { layoutState } = useGraphStore();
  return useStore(layoutState, (snapshot) => selector(snapshot.links), isEqual);
}

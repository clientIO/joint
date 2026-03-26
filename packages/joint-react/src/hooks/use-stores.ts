import type {
  GraphStoreInternalSnapshot,
} from '../store/graph-store';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { isStrictEqual } from '../utils/selector-utils';
import type { ElementLayout, LinkLayout } from '../types/cell-data';

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

const alwaysRerender = () => false;

/**
 * Hook to select element layout data from the graph store.
 * Returns a `Map<string, ElementLayout>` directly from the container.
 * @param selector - Optional selector function to derive data from the elements layout map.
 * @param isEqual - Optional equality function to optimize re-renders.
 * @returns The selected element layout data, or the full map if no selector is provided.
 * @group Hooks
 */
export function useElementsLayout<SelectorReturnType = Map<string, ElementLayout>>(
  selector?: (items: Map<string, ElementLayout>) => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = isStrictEqual as (a: SelectorReturnType, b: SelectorReturnType) => boolean
): SelectorReturnType {
  const { graphView: { elementsLayout } } = useGraphStore();
  const internalSelector = selector
    ? () => selector(elementsLayout.getFull())
    : () => new Map(elementsLayout.getFull()) as unknown as SelectorReturnType;
  return useSyncExternalStoreWithSelector(
    elementsLayout.subscribeToFull,
    elementsLayout.getVersion,
    elementsLayout.getVersion,
    internalSelector,
    selector ? isEqual : (alwaysRerender as unknown as typeof isEqual)
  );
}

/**
 * Hook to select link layout data from the graph store.
 * Returns a `Map<string, Record<string, LinkLayout>>` directly from the container.
 * @param selector - Optional selector function to derive data from the links layout map.
 * @param isEqual - Optional equality function to optimize re-renders.
 * @returns The selected link layout data, or the full map if no selector is provided.
 * @group Hooks
 */
export function useLinksLayout<SelectorReturnType = Map<string, Record<string, LinkLayout>>>(
  selector?: (items: Map<string, Record<string, LinkLayout>>) => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = isStrictEqual as (a: SelectorReturnType, b: SelectorReturnType) => boolean
): SelectorReturnType {
  const { graphView: { linksLayout } } = useGraphStore();
  const internalSelector = selector
    ? () => selector(linksLayout.getFull())
    : () => new Map(linksLayout.getFull()) as unknown as SelectorReturnType;
  return useSyncExternalStoreWithSelector(
    linksLayout.subscribeToFull,
    linksLayout.getVersion,
    linksLayout.getVersion,
    internalSelector,
    selector ? isEqual : (alwaysRerender as unknown as typeof isEqual)
  );
}

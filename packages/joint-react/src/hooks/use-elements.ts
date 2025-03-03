import { useGraphStore } from './use-graph-store';
import { util } from '@joint/core';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { GraphElements } from '../utils/cell/cell-map';
import type { GraphElement } from '../utils/cell/get-cell';

/**
 * A hook to access `dia.graph` elements
 *
 * This hook returns the selected elements from the graph store. It accepts:
 *  - a selector function, which extracts the desired portion from the elements array.
 *    (By default, it returns the full elements array.)
 *  - an optional isEqual function, used to compare previous and new values—ensuring
 *    the component only re-renders when necessary.
 *
 * How it works:
 * 1. The hook subscribes to the elements of the graph store via useSyncExternalStoreWithSelector.
 * 2. It fetches the elements from the store and then applies the selector.
 * 3. To avoid unnecessary re-renders (especially since the selector could produce new
 *    references on each call), the isEqual comparator (defaulting to a deep comparison)
 *    checks if the selected value really changed.
 *
 * @example
 * Using without a selector (returns all elements):
 * ```tsx
 * const elements = useElements();
 * ```
 *
 * @example
 * Using with a selector (extract part of each element):
 * ```tsx
 * const elementIds = useElements((elements) => elements.map((element) => element.id));
 * ```
 *
 * @example
 * Using with a custom isEqual function (e.g. comparing the length of the returned array):
 * ```tsx
 * const elementLength = useElements(
 *   (elements) => elements,
 *   (prev, next) => prev.length === next.length
 * );
 * ```
 *
 * @group Hooks
 *
 * @param {Function} selector The selector function to pick elements. @default defaultElementsSelector
 * @param {Function=} isEqual The function used to decide equality. @default util.isEqual
 * @returns {ReturnedElements} The selected elements.
 */
export function useElements<Data = undefined, Element = GraphElement, ReturnedElements = Element[]>(
  selector: (items: GraphElements<Data>) => ReturnedElements = (items) =>
    items as unknown as ReturnedElements,
  isEqual: (a: ReturnedElements, b: ReturnedElements) => boolean = util.isEqual
): ReturnedElements {
  const { subscribe: subscribeToElements, getElements } = useGraphStore<Data>();
  const elements = useSyncExternalStoreWithSelector(
    subscribeToElements,
    getElements,
    getElements, // Assuming server snapshot is the same
    selector,
    isEqual
  );
  return elements;
}

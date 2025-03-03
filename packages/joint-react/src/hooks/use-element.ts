import { util } from '@joint/core';
import { useCellId } from './use-cell-id';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { GraphElement } from '../data/graph-elements';

/**
 * A hook to access `dia.graph` element inside the Paper context (`renderElement`).
 * It throw error if it's not used inside the `<Paper renderElement />`.
 * @example
 * Using without a selector (returns all elements):
 * ```tsx
 * const element = useElement();
 * ```
 *
 * @group Hooks
 *
 * @param {Function} selector The selector function to pick elements. @default defaultElementSelector
 * @param {Function=} isEqual The function used to decide equality.
 * @returns {ReturnedElements} The selected element.
 *
 * @example
 * Using with a selector (extract part of each element):
 * ```tsx
 * const elementId = useElement((element) => element.id);
 * ```
 */
export function useElement<Data = unknown, Element = GraphElement, ReturnedElements = Element>(
  selector: (items: GraphElement<Data>) => ReturnedElements = (item) =>
    item as unknown as ReturnedElements,
  isEqual: (a: ReturnedElements, b: ReturnedElements) => boolean = util.isEqual
): ReturnedElements {
  const id = useCellId();
  const { subscribe: subscribeToElements, getElement } = useGraphStore();

  const element = useSyncExternalStoreWithSelector(
    subscribeToElements,
    () => getElement(id) as GraphElement<Data>,
    () => getElement(id) as GraphElement<Data>,
    selector,
    isEqual
  );
  return element;
}

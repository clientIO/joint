import { util } from '@joint/core';
import type { BaseElement } from '../types/cell.types';
import { useCellId } from './use-cell-id';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { type GraphElement } from '../utils/cell/get-cell';

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
export function useElement<Data = undefined, Element = BaseElement, ReturnedElements = Element>(
  selector: (items: GraphElement<Data>) => ReturnedElements = (item) =>
    item as unknown as ReturnedElements,
  isEqual: (a: ReturnedElements, b: ReturnedElements) => boolean = util.isEqual
): ReturnedElements {
  const id = useCellId();
  const { subscribe: subscribeToElements, getElement } = useGraphStore<Data>();

  const element = useSyncExternalStoreWithSelector(
    subscribeToElements,
    () => getElement(id),
    () => getElement(id),
    selector, // Use the provided selector here
    isEqual
  );
  return element;
}

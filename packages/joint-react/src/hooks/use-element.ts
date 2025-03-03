import type { dia } from '@joint/core';
import { util } from '@joint/core';
import type { BaseElement } from '../types/cell.types';
import { useCellId } from './use-cell-id';
import { useGraphStore } from './use-graph-store';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { defaultElementSelector } from '../utils/cell/to-react-cell';
import { useCallback } from 'react';

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
export function useElement<Element = BaseElement, ReturnedElements = Element>(
  selector: (items: dia.Element) => ReturnedElements = defaultElementSelector,
  isEqual: (a: ReturnedElements, b: ReturnedElements) => boolean = util.isEqual
): ReturnedElements {
  const id = useCellId();
  const { subscribeToElements, graph, elementsIdsToIndexMap } = useGraphStore();

  const getSnapshot = useCallback(() => {
    const index = elementsIdsToIndexMap.current.get(id);
    if (index === undefined) {
      throw new Error(`Element with id ${id} not found in the graph`);
    }
    const elements = graph.getElements();
    return elements[index].clone();
  }, [elementsIdsToIndexMap, graph, id]);

  const element = useSyncExternalStoreWithSelector(
    subscribeToElements,
    getSnapshot,
    getSnapshot, // Assuming server snapshot is the same
    selector, // Use the provided selector here
    isEqual
  );
  return element;
}

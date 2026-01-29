import { util } from '@joint/core';
import { useCellId } from './use-cell-id';
import type { GraphElement } from '../types/element-types';
import { useGraphStoreSelector } from './use-graph-store-selector';

/**
 * A hook to access a specific graph element from the current `Paper` context.
 * Use it only inside `renderElement` or components rendered from within.
 * This hook returns the selected element based on its cell id. It accepts:
 * - a selector function, which extracts the desired part from the element.
 * (By default, it returns the entire element.)
 * - an optional `isEqual` function, used to determine if the selected value has changed.
 *
 * How it works:
 * 1. The hook retrieves the cell id using `useCellId`.
 * 2. It subscribes to the graph store and fetches the element associated with the cell id.
 * 3. The selector is applied to the fetched element and `isEqual` ensures proper re-rendering behavior.
 * @example
 * // Using without a selector (returns the full element):
 * const element = useElement();
 * @example
 * // Using with a selector (extract a property from the element):
 * const elementId = useElement((element) => element.id);
 * @example
 * // Using with a custom isEqual function:
 * const refinedElement = useElement(
 *   (element) => element,
 *   (prev, next) => prev.width === next.width
 * );
 * @param selector The selector function to pick part of the element. @default identity
 * @param isEqual The function used to check equality. @default util.isEqual
 * @returns The selected element based on the current cell id.
 */
export function useElement<Element extends GraphElement, ReturnedElements = Element>(
  selector: (item: Element) => ReturnedElements = (item) => item as unknown as ReturnedElements,
  isEqual: (a: ReturnedElements, b: ReturnedElements) => boolean = util.isEqual
): ReturnedElements {
  const id = useCellId();

  return useGraphStoreSelector<ReturnedElements>((store) => {
    const element = store.elements[id] as Element | undefined;
    if (!element) {
      return undefined as ReturnedElements;
    }
    return selector(element);
  }, isEqual);
}

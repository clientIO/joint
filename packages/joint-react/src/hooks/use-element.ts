import { useElementId } from './use-element-id';
import type { FlatElementData } from '../types/element-types';
import { useData } from './use-stores';
import { isStrictEqual, identitySelector } from '../utils/selector-utils';

/**
 * A hook to access a specific graph element from the current `Paper` context.
 * Use it only inside `renderElement` or components rendered from within.
 * This hook returns the selected element based on its cell id. It accepts:
 * - a selector function, which extracts the desired part from the element.
 * (By default, it returns the entire element.)
 * - an optional `isEqual` function, used to determine if the selected value has changed.
 *
 * How it works:
 * 1. The hook retrieves the cell id using `useElementId`.
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
 * @param selector - The selector function to pick part of the element. Defaults to returning the entire element.
 * @param isEqual - The function used to check equality. Defaults to strict equality (`Object.is`).
 * @returns The selected element based on the current cell id.
 */
export function useElement<ElementData = FlatElementData, ReturnedElements = ElementData>(
  selector: (item: ElementData) => ReturnedElements = identitySelector as (
    item: ElementData
  ) => ReturnedElements,
  isEqual: (a: ReturnedElements, b: ReturnedElements) => boolean = isStrictEqual
): ReturnedElements {
  const id = useElementId();

  return useData<ReturnedElements>((store) => {
    const element = store.elements[id] as ElementData | undefined;
    if (!element) {
      return undefined as ReturnedElements;
    }
    return selector(element);
  }, isEqual);
}

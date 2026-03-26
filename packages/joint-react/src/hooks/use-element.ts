import { useElementId } from './use-element-id';
import type { CellData } from '../types/cell-data';
import type { ReadonlyContainer } from '../store/state-container';
import { useGraphStore } from './use-graph-store';
import { isStrictEqual, identitySelector } from '../utils/selector-utils';
import { useContainerItem } from './use-container-item';

/**
 * Hook to access a specific graph element from the current Paper context.
 * @deprecated Use `useElementData()` for user data, `useElementSize()` for size, `useElementPosition()` for position.
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
export function useElement<ElementData extends CellData = CellData, ReturnedElements = ElementData>(
  selector: (item: ElementData) => ReturnedElements = identitySelector as (
    item: ElementData
  ) => ReturnedElements,
  isEqual: (a: ReturnedElements, b: ReturnedElements) => boolean = isStrictEqual
): ReturnedElements {
  const id = useElementId();
  const { graphView: { elements } } = useGraphStore();

  // The container stores CellData but users pass a narrower ElementData generic.
  // This boundary cast is safe because the graph populates the container with the same shape.
  const typedElements = elements as ReadonlyContainer<ElementData>;

  return useContainerItem(typedElements, id, selector, isEqual) as ReturnedElements;
}

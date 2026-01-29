import type { dia } from '@joint/core';
import { util } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import { useGraphStoreSelector } from './use-graph-store-selector';

/**
 * Default selector function to return all elements.
 * @param items - The items to select from.
 * @returns - The selected items.
 */
function defaultSelector<Elements extends GraphElement = GraphElement>(
  items: Record<dia.Cell.ID, Elements>
): Record<dia.Cell.ID, Elements> {
  return items;
}

/**
 * A hook to access `dia.graph` elements
 *
 * This hook returns the selected elements from the graph store. It accepts:
 * - a selector function, which extracts the desired portion from the elements record.
 * - an optional `isEqual` function, used to compare previous and new values—ensuring
 * the component only re-renders when necessary.
 *
 * How it works:
 * 1. The hook subscribes to the elements of the graph store.
 * 2. It fetches the elements from the store and then applies the selector.
 * 3. To avoid unnecessary re-renders (especially since the selector could produce new
 * references on each call), the `isEqual` comparator (defaulting to a deep comparison)
 * checks if the selected value really changed.
 * @example
 * Using without a selector (returns all elements as a Record):
 * ```tsx
 * const elements = useElements();
 * // elements is Record<dia.Cell.ID, GraphElement>
 * ```
 * @example
 * Using with a selector (extract part of each element):
 * ```tsx
 * const elementIds = useElements((elements) => Object.keys(elements));
 * ```
 * @example
 * Using with a selector (extract specific element by id):
 * ```tsx
 * const maybeElementById = useElements((elements) => elements['id']);
 * ```
 * @example
 * Using with a custom isEqual function (e.g. comparing the count of elements):
 * ```tsx
 * const elementCount = useElements(
 *   (elements) => elements,
 *   (prev, next) => Object.keys(prev).length === Object.keys(next).length
 * );
 * ```
 * @group Hooks
 * @param selector - A function to select a portion of the elements.
 * @param isEqual - A function to compare the previous and new values.
 * @returns - The selected elements.
 */
export function useElements<
  Elements extends GraphElement = GraphElement,
  SelectorReturnType = Record<dia.Cell.ID, Elements>,
>(
  selector: (items: Record<dia.Cell.ID, Elements>) => SelectorReturnType = defaultSelector as () => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = util.isEqual as (
    a: SelectorReturnType,
    b: SelectorReturnType
  ) => boolean
): SelectorReturnType {
  return useGraphStoreSelector((snapshot) => {
    return selector(snapshot.elements as Record<dia.Cell.ID, Elements>);
  }, isEqual);
}

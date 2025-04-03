import { useGraphStore } from './use-graph-store';
import { util } from '@joint/core';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { GraphElement, GraphElementBase } from '../types/element-types';
import type { CellMap } from 'src/utils/cell/cell-map';

function defaultSelector<Elements extends GraphElementBase = GraphElement>(
  items: CellMap<Elements>
): Elements[] {
  return items.map((item) => item) as Elements[];
}
/**
 * A hook to access `dia.graph` elements
 *
 * This hook returns the selected elements from the graph store. It accepts:
 *  - a selector function, which extracts the desired portion from the elements map.
 *  - an optional `isEqual` function, used to compare previous and new values—ensuring
 *    the component only re-renders when necessary.
 *
 * How it works:
 * 1. The hook subscribes to the elements of the graph store.
 * 2. It fetches the elements from the store and then applies the selector.
 * 3. To avoid unnecessary re-renders (especially since the selector could produce new
 *    references on each call), the `isEqual` comparator (defaulting to a deep comparison)
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
 * Using with a selector (extract id):
 * ```tsx
 * const maybeElementById = useElements((elements) => elements.get('id'));
 * ```
 *
 * @example
 * Using with a custom isEqual function (e.g. comparing the size of the returned map):
 * ```tsx
 * const elementLength = useElements(
 *   (elements) => elements,
 *   (prev, next) => prev.size === next.size
 * );
 * ```
 *
 * @group Hooks
 *
 * @param {Function} selector The selector function to pick elements. @default (items) => items.map((item) => item)
 * @param {Function=} isEqual The function used to decide equality. @default util.isEqual
 * @returns {SelectorReturnType} The selected elements.
 */

export function useElements<
  Elements extends GraphElementBase = GraphElement,
  SelectorReturnType = Elements[],
>(
  selector: (
    items: CellMap<Elements>
  ) => SelectorReturnType = defaultSelector as () => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = util.isEqual
): SelectorReturnType {
  const { subscribe, getElements } = useGraphStore();
  const typedGetElements = getElements as () => CellMap<Elements>;
  const elements = useSyncExternalStoreWithSelector(
    subscribe,
    typedGetElements,
    typedGetElements,
    selector,
    isEqual
  );
  return elements;
}

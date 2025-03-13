import { useGraphStore } from './use-graph-store';
import { util } from '@joint/core';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { GraphElement, GraphElementBase, GraphElements } from '../types/element-types';

/**
 * A hook to access `dia.graph` elements
 *
 * This hook returns the selected elements from the graph store. It accepts:
 *  - a selector function, which extracts the desired portion from the elements map.
 *    (By default, it returns the `GraphElements` map.)
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
 * @returns {R} The selected elements.
 */

export function useElements<T extends GraphElementBase = GraphElement, R = T[]>(
  selector: (items: GraphElements<T>) => R = (items) => items.map((item) => item) as R,
  isEqual: (a: R, b: R) => boolean = util.isEqual
): R {
  const { subscribe, getElements } = useGraphStore();
  const typedGetElements = getElements as () => GraphElements<T>;
  const elements = useSyncExternalStoreWithSelector(
    subscribe,
    typedGetElements,
    typedGetElements,
    selector,
    isEqual
  );
  return elements;
}

import type { CellId } from '../types/cell-id';
import type { FlatElementData } from '../types/element-types';
import { useData } from './use-stores';
import { identitySelector, isStrictEqual } from '../utils/selector-utils';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { useGraphStore } from './use-graph-store';

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
 * references on each call), the `isEqual` comparator (defaulting to strict equality via `Object.is`)
 * checks if the selected value really changed.
 * @example
 * Using without a selector (returns all elements as a Record):
 * ```tsx
 * const elements = useElements();
 * // elements is Record<CellId, FlatElementData>
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
  ElementData = FlatElementData,
  SelectorReturnType = Record<CellId, ElementData>,
>(
  selector: (
    items: Record<CellId, ElementData>
  ) => SelectorReturnType = identitySelector as () => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = isStrictEqual as (
    a: SelectorReturnType,
    b: SelectorReturnType
  ) => boolean
): SelectorReturnType {
  return useData((snapshot) => {
    return selector(snapshot.elements as Record<CellId, ElementData>);
  }, isEqual);
}

/**
 * A hook to access `dia.graph` elements using the new per-id container architecture.
 *
 * The underlying Map is mutated in place (same reference), so we use a version counter
 * as the snapshot signal for React. When the version changes, React knows the Map mutated.
 *
 * - **Without selector**: re-renders on every element change, returns a new Map copy (immutable snapshot).
 * - **With selector**: re-renders only when the selector output changes (compared via `isEqual`).
 *
 * **Important:** Do not pass an identity selector like `(map) => map`. The Map is mutated in place,
 * so it always returns the same reference — `Object.is` will always return `true` and the component
 * will **never re-render**. Use `useElementsNew()` without a selector instead, which returns a
 * new `Map` copy on every change.
 *
 * @param selector - A function to select a portion of the elements Map. Must return a new value
 *   or primitive — returning the Map itself will prevent re-renders.
 * @param isEqual - A function to compare previous and new selector results.
 * @returns The selected value, or a new Map copy if no selector is provided.
 */
// Always returns false so that no-selector mode re-renders on every version change.
// The Map is mutated in place (same reference), so Object.is would always say "equal" and skip re-renders.
const alwaysRerender = () => false;

export function useElementsNew<
  ElementData = FlatElementData,
  SelectorReturnType = Map<CellId, ElementData>,
>(
  selector?: (items: Map<CellId, ElementData>) => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = isStrictEqual as (
    a: SelectorReturnType,
    b: SelectorReturnType
  ) => boolean
): SelectorReturnType {
  const {
    graphView: { elements },
  } = useGraphStore();

  // Version is the snapshot signal — when it changes, React knows the Map mutated.
  // The selector reads the Map directly (ignores the version number).
  //
  // With selector: isEqual prevents re-render if selector output didn't change.
  // Without selector: we return new Map(elements.getFull()) so the caller gets
  // an immutable snapshot. alwaysRerender ensures we re-run on every version bump
  // (the mutable Map reference itself never changes, so Object.is would skip).
  const internalSelector = selector
    ? () => selector(elements.getFull() as Map<CellId, ElementData>)
    : () => new Map(elements.getFull()) as unknown as SelectorReturnType;

  return useSyncExternalStoreWithSelector(
    elements.subscribeToFull,
    elements.getVersion,
    elements.getVersion,
    internalSelector,
    selector ? isEqual : (alwaysRerender as unknown as typeof isEqual)
  );
}

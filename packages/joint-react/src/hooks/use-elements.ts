import type { CellId } from '../types/cell-id';
import type { CellData } from '../types/cell-data';
import { isStrictEqual } from '../utils/selector-utils';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { useGraphStore } from './use-graph-store';

// Always returns false so that no-selector mode re-renders on every version change.
// The Map is mutated in place (same reference), so Object.is would always say "equal" and skip re-renders.
const alwaysRerender = () => false;

/**
 * Hook to access all graph elements via the per-ID container architecture.
 *
 * - **Without selector**: re-renders on every element change, returns a new Map copy.
 * - **With selector**: re-renders only when the selector output changes (compared via `isEqual`).
 *
 * **Important:** Do not pass an identity selector like `(map) => map`. The Map is mutated in place,
 * so it always returns the same reference — `Object.is` will always return `true` and the component
 * will **never re-render**. Use `useElements()` without a selector instead.
 * @param selector - A function to select a portion of the elements Map.
 * @param isEqual - A function to compare previous and new selector results.
 * @returns The selected value, or a new Map copy if no selector is provided.
 * @group Hooks
 */
export function useElements<
  ElementData extends CellData = CellData,
  SelectorReturnType = Map<CellId, ElementData>,
>(
  selector?: (items: Map<CellId, ElementData>) => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = isStrictEqual as (
    a: SelectorReturnType,
    b: SelectorReturnType
  ) => boolean
): SelectorReturnType {
  const { graphView: { elements } } = useGraphStore();

  const internalSelector = selector
    ? () => selector(elements.getFull() as unknown as Map<CellId, ElementData>)
    : () => new Map(elements.getFull()) as unknown as SelectorReturnType;

  return useSyncExternalStoreWithSelector(
    elements.subscribeToFull,
    elements.getVersion,
    elements.getVersion,
    internalSelector,
    selector ? isEqual : (alwaysRerender as unknown as typeof isEqual)
  );
}

/** @deprecated Use `useElements` instead. */
export const useElementsNew = useElements;

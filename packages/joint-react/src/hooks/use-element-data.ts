import type { CellData } from '../types/cell-data';
import { useElementId } from './use-element-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItem } from './use-container-item';

const EMPTY_DATA = {} as CellData;

const selectData = (item: CellData): unknown => (item as { readonly data: unknown }).data ?? EMPTY_DATA;

/**
 * Returns the user data for the current element.
 * Must be used inside `renderElement` or a component rendered within it.
 * Subscribes to the elements data container — does NOT re-render on position/size changes.
 * Always returns an object (defaults to `{}` when no data provided).
 * @returns The user data `D` for the current element.
 * @group Hooks
 */
export function useElementData<D extends object = CellData>(): D {
  const id = useElementId();
  const { graphView: { elements } } = useGraphStore();
  return (useContainerItem(elements, id, selectData) ?? EMPTY_DATA) as D;
}

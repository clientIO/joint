import type { CellData } from '../types/cell-data';
import { useLinkId } from './use-link-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItem } from './use-container-item';

const EMPTY_DATA = {} as CellData;

const selectData = (item: CellData): unknown => (item as { readonly data: unknown }).data ?? EMPTY_DATA;

/**
 * Returns the user data for the current link.
 * Must be used inside `renderLink` or a component rendered within it.
 * Subscribes to the links data container — does NOT re-render on routing changes.
 * Always returns an object (defaults to `{}` when no data provided).
 * @returns The user data `D` for the current link.
 * @group Hooks
 */
export function useLinkData<D extends CellData = CellData>(): D {
  const id = useLinkId();
  const { graphView: { links } } = useGraphStore();
  return (useContainerItem(links, id, selectData) ?? EMPTY_DATA) as D;
}

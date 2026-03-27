import { useContext } from 'react';
import { GraphStoreContext } from '../context';
import type { GraphStore } from '../store';
import type { CellData } from '../types/cell-data';

/**
 * Custom hook to use a JointJS `GraphProvider` graph store.
 * It must be used inside the `GraphProvider`.
 * @group Hooks
 * @returns The JointJS graph store.
 * @throws {Error} An error if the hook is used outside of a GraphProvider.
 */
export function useGraphStore<
  ElementData extends object = CellData,
  LinkData extends object = CellData,
>(): GraphStore<ElementData, LinkData> {
  const store = useContext(GraphStoreContext);
  if (!store) {
    throw new Error('useGraphStore must be used within a GraphProvider');
  }
  return store as GraphStore<ElementData, LinkData>;
}

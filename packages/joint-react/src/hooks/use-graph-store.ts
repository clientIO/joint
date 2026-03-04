import { useContext } from 'react';
import { GraphStoreContext } from '../context';
import type { GraphStore } from '../store';

/**
 * Custom hook to use a JointJS `GraphProvider` graph store.
 * It must be used inside the `GraphProvider`.
 * @group Hooks
 * @internal
 * @returns The JointJS graph store.
 * @throws {Error} An error if the hook is used outside of a GraphProvider.
 */
export function useGraphStore(): GraphStore {
  const store = useContext(GraphStoreContext);
  if (!store) {
    throw new Error('useGraphStore must be used within a GraphProvider');
  }
  return store;
}

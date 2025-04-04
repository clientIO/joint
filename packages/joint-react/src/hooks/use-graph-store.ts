import { useContext } from 'react';
import { GraphStoreContext, type StoreContext } from '../context/graph-store-context';

/**
 * Custom hook to use a JointJS graph store.
 * It retrieves the graph from the GraphContext.
 * @group Hooks
 * @internal
 * @returns The JointJS graph store.
 * @throws An error if the hook is used outside of a GraphProvider.
 */
export function useGraphStore(): StoreContext {
  const store = useContext(GraphStoreContext);
  if (!store) {
    throw new Error('useGraphStore must be used within a GraphProvider');
  }
  return store;
}

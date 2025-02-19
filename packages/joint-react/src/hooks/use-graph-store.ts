import { useContext } from 'react'
import { GraphStoreContext } from '../context/graph-store-context'

/**
 * Custom hook to use a JointJS graph instance.
 * It retrieves the graph from the GraphContext.
 * @returns The JointJS graph instance.
 * @throws An error if the hook is used outside of a GraphProvider.
 */
export function useGraphStore() {
  const store = useContext(GraphStoreContext)
  if (!store) {
    throw new Error('useGraphStore must be used within a GraphProvider')
  }
  return store
}

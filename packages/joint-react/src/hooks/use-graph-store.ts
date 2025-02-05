import { useContext } from 'react'
import { GraphContext } from '../context/graph-context'

/**
 * Custom hook to use a JointJS graph instance.
 * It retrieves the graph from the GraphContext.
 * @returns The JointJS graph instance.
 * @throws An error if the hook is used outside of a GraphProvider.
 */
export function useGraphStore() {
  const store = useContext(GraphContext)
  if (!store) {
    throw new Error('useGraphStore must be used within a GraphProvider')
  }
  return store
}

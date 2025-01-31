import { useContext } from 'react'
import { GraphContext } from '../context/graph-context'

/**
 * Custom hook to use a JointJS graph instance.
 * It retrieves the graph from the GraphContext.
 * @returns The JointJS graph instance.
 * @throws An error if the hook is used outside of a GraphProvider.
 */
export function useGraph() {
  const graph = useContext(GraphContext)
  if (!graph) {
    throw new Error('useGraph must be used within a GraphProvider')
  }
  return graph
}

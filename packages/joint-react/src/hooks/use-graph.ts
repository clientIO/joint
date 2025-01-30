import { useContext } from 'react'
import { GraphContext } from '../context/graph-context'

export function useGraph() {
  const graph = useContext(GraphContext)
  if (!graph) {
    throw new Error('useGraph must be used within a GraphProvider')
  }
  return graph
}

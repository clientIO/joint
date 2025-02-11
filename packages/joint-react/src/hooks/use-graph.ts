import { useGraphStore } from './use-graph-store'

export function useGraph() {
  const { graph } = useGraphStore()
  return graph
}

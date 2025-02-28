import { useGraphStore } from './use-graph-store';

/**
 * Custom hook to retrieve the graph instance from the graph store.
 *
 * @group Hooks
 *
 * @returns The JointJS graph instance.
 */
export function useGraph() {
  const { graph } = useGraphStore();
  return graph;
}

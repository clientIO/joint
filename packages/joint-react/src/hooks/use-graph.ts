import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';

/**
 * Custom hook to retrieve the graph instance from the graph store.
 *
 * Return JointJS graph instance from the graph store.
 * @see https://docs.jointjs.com/api/dia/Graph/
 * @group Hooks
 * @returns The JointJS graph instance.
 * @example
 * ```tsx
 * const graph = useGraph()
 * ```
 */
export function useGraph<Graph extends dia.Graph = dia.Graph>() {
  const { graph } = useGraphStore<Graph>();
  return graph;
}

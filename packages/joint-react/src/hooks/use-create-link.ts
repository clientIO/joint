import type { dia } from '@joint/core';
import { useGraph } from './use-graph';
import { useCallback } from 'react';
import { processLink } from '../utils/cell/set-cells';
import type { GraphLink } from '../types/link-types';

/**
 * A custom hook that adds a link to the graph.
 * @group Hooks
 * @returns A function that adds the link to the graph.
 * @example
 * ```ts
 * const addLink = useCreateLink();
 * addLink({ id: '1', source: { id: '2' }, target: { id: '3' } });
 * ```
 */
export function useCreateLink<T extends dia.Link | GraphLink>() {
  const graph = useGraph();
  return useCallback(
    (link: T) => {
      graph.addCell(processLink(link));
    },
    [graph]
  );
}

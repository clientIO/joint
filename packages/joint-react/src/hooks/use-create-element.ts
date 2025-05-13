import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import { useGraph } from './use-graph';
import { useCallback } from 'react';
import { processElement } from '../utils/cell/set-cells';

type SetElement<T extends dia.Element | GraphElement> = Omit<
  Partial<T> & { id: dia.Cell.ID },
  'isElement' | 'isLink'
>;

/**
 * A custom hook that adds an element to the graph.
 * @group Hooks
 * @returns A function that adds the element to the graph.
 * @example
 * ```ts
 * const addElement = useCreateElement();
 * addElement({ id: '1', label: 'Node 1' });
 * ```
 */
export function useCreateElement<T extends dia.Element | GraphElement>() {
  const graph = useGraph();
  return useCallback(
    (element: SetElement<T>) => {
      graph.addCell(processElement(element));
    },
    [graph]
  );
}

import type { dia } from '@joint/core';
import type { GraphElementBase } from '../types/element-types';
import { useGraph } from './use-graph';
import { useCallback } from 'react';
import { processElement } from '../utils/cell/set-cells';

type SetElement<T extends dia.Element | GraphElementBase> = Omit<
  Partial<T> & { id: dia.Cell.ID },
  'isElement' | 'isLink'
>;

/**
 * A custom hook that adds an element to the graph.
 * @group Hooks
 * @returns A function that adds the element to the graph.
 * @example
 * ```ts
 * const addElement = useAddElement();
 * addElement({ id: '1', data: { label: 'Node 1' } });
 * ```
 */
export function useAddElement<T extends dia.Element | GraphElementBase>() {
  const graph = useGraph();
  return useCallback(
    (element: SetElement<T>) => {
      graph.addCell(processElement(element));
    },
    [graph]
  );
}

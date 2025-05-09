import { useCallback } from 'react';
import { useGraph } from './use-graph';
import type { dia } from '@joint/core';

/**
 * A custom hook that removes an node or link from the graph by its ID.
 * @group Hooks
 * @returns A function that removes the element from the graph.
 * @example
 * ```ts
 * const removeCell = useRemoveCell();
 * removeCell('1');
 * ```
 */
export function useRemoveCell() {
  const graph = useGraph();
  return useCallback(
    (id: dia.Cell.ID) => {
      const cell = graph.getCell(id);
      if (cell) {
        cell.remove();
      }
    },
    [graph]
  );
}
/**
 * A custom hook that removes an element from the graph by its ID.
 * @group Hooks
 * @returns A function that removes the element from the graph.
 * @example
 * ```ts
 * const removeElement = useRemoveElement();
 * removeElement('1');
 * ```
 */
export function useRemoveElement() {
  const graph = useGraph();
  return useCallback(
    (id: dia.Cell.ID) => {
      const cell = graph.getCell(id);
      if (!cell.isElement()) {
        return;
      }
      if (cell) {
        cell.remove();
      }
    },
    [graph]
  );
}

/**
 * A custom hook that removes a link from the graph by its ID.
 * @group Hooks
 * @returns A function that removes the link from the graph.
 * @example
 * ```ts
 * const removeLink = useRemoveLink();
 * removeLink('1');
 * ```
 */
export function useRemoveLink() {
  const graph = useGraph();
  return useCallback(
    (id: dia.Cell.ID) => {
      const cell = graph.getCell(id);
      if (!cell.isLink()) {
        return;
      }
      if (cell) {
        cell.remove();
      }
    },
    [graph]
  );
}

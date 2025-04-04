import type { dia } from '@joint/core';
import { useContext } from 'react';
import { CellIdContext } from '../context/cell-id.context';

/**
 * Return cell id from the paper (paper item).
 * It must be used inside `renderElement` function.
 * @returns - The cell id.
 * @throws - If the hook is not used inside the paper context.
 * @group hooks
 * @description
 * This hook is used to get the cell id from the paper `RenderElement`.
 * It must be used inside the `renderElement` function.
 * @example
 * ```ts
 * const cellId = useCellId();
 * console.log(cellId);
 * ```
 */
export function useCellId(): dia.Cell.ID {
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useCellId is not used inside paper context');
  }
  return id;
}

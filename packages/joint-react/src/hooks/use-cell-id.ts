import type { dia } from '@joint/core';
import { use } from 'react';
import { CellIdContext } from '../context/cell-id.context';

/**
 * Return cell id from the paper (paper item).
 * It must be used inside `renderElement` function.
 *
 * @see `Paper`
 *
 * @group Hooks
 */
export function useCellId(): dia.Cell.ID {
  const id = use(CellIdContext);
  if (id === undefined) {
    throw new Error('useCellId is not used inside paper context');
  }
  return id;
}

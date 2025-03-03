import type { dia } from '@joint/core';
import { use } from 'react';
import { CellIdContext } from '../context/cell-context';

/**
 * Return cell (currently just element) id from the paper (paper item).
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

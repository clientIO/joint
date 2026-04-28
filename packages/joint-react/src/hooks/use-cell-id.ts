import { useContext } from 'react';
import { CellIdContext } from '../context';
import type { CellId } from '../types/cell.types';

/**
 * Read the current cell id from the nearest `CellIdContext`. Populated by
 * `<Paper />` around every `renderElement` / `renderLink` invocation.
 *
 * Use this inside a render callback (or any component mounted from one) when
 * you only need the id — it's cheaper than `useCell()` since
 * it never subscribes to store updates. Throws when used outside a Paper
 * render context.
 * @returns the current cell id
 */
export function useCellId(): CellId {
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useCellId() must be used inside renderElement or renderLink');
  }
  return id;
}

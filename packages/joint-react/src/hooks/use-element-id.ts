import type { CellId } from '../types/cell-id';
import { useContext } from 'react';
import { CellIdContext } from '../context';

/**
 * Returns the current element id within `Paper` element rendering.
 * Use this only inside the `renderElement` function.
 * @returns The current element id.
 * @throws {Error} If called outside the view context.
 * @group hooks
 * @example
 * ```ts
 * const elementId = useElementId();
 * ```
 */
export function useElementId(): CellId {
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useElementId must be used inside Paper renderElement');
  }
  return id;
}

import type { CellId } from '../types/cell-id';
import { useContext } from 'react';
import { CellIdContext } from '../context';

/**
 * Returns the current link id within `Paper` link rendering.
 * Use this only inside the `renderLink` function.
 * @returns The current link id.
 * @throws {Error} If called outside the view context.
 * @group hooks
 * @experimental
 * @example
 * ```ts
 * const linkId = useLinkId();
 * ```
 */
export function useLinkId(): CellId {
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useLinkId must be used inside Paper renderLink');
  }
  return id;
}

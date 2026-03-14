import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import { isString } from './is';

/**
 * Get the link id from the given id.
 * @param id - The id to get the link id from.
 * @returns The link id or undefined if not found.
 * @example
 * ```ts
 * import { getCellId } from '@joint/react';
 *
 * // With string id
 * const id1 = getCellId('element-1'); // 'element-1'
 *
 * // With object id
 * const id2 = getCellId({ id: 'element-1', port: 'port-1' }); // 'element-1'
 * ```
 */
export function getCellId(id: CellId | dia.Link.EndJSON): CellId | undefined {
  if (isString(id)) {
    return id;
  }
  return id.id as CellId | undefined;
}

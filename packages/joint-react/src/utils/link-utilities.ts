import type { dia } from '@joint/core';

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
export function getCellId(id: dia.Cell.ID | dia.Link.EndJSON): dia.Cell.ID | undefined {
  if (typeof id === 'object') {
    return id.id;
  }
  return id;
}

/**
 * Get the link port id from the given id.
 * @param id - The id to get the link port id from.
 * @returns The link port id or undefined if not found.
 * @example
 * ```ts
 * import { getLinkPortId } from '@joint/react';
 *
 * // With string id
 * const port1 = getLinkPortId('element-1'); // undefined
 *
 * // With object id
 * const port2 = getLinkPortId({ id: 'element-1', port: 'port-1' }); // 'port-1'
 * ```
 */
export function getLinkPortId(id: dia.Cell.ID | dia.Link.EndJSON): string | undefined {
  if (typeof id === 'object') {
    return id.port;
  }
  return undefined;
}

/**
 * Get the link magnet from the given id.
 * @param id - The id to get the link magnet from.
 * @returns The link magnet or undefined if not found.
 * @example
 * ```ts
 * import { getLinkMagnet } from '@joint/react';
 *
 * // With string id
 * const magnet1 = getLinkMagnet('element-1'); // undefined
 *
 * // With object id
 * const magnet2 = getLinkMagnet({ id: 'element-1', magnet: 'magnet-1' }); // 'magnet-1'
 * ```
 */
export function getLinkMagnet(id: dia.Cell.ID | dia.Link.EndJSON): string | undefined {
  if (typeof id === 'object') {
    return id.magnet;
  }
  return undefined;
}

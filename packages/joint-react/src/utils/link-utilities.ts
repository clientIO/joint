import type { dia } from '@joint/core';

/**
 * Get the link id from the given id.
 * @param id - The id to get the link id from.
 * @returns The link id or undefined if not found.
 */
export function getLinkId(id: dia.Cell.ID | dia.Link.EndJSON): dia.Cell.ID | undefined {
  if (typeof id === 'object') {
    return id.id;
  }
  return id;
}

/**
 * Get the link source id from the given id.
 * @param id - The id to get the link source id from.
 * @returns The link source id or undefined if not found.
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
 */
export function getLinkMagnet(id: dia.Cell.ID | dia.Link.EndJSON): string | undefined {
  if (typeof id === 'object') {
    return id.magnet;
  }
  return undefined;
}

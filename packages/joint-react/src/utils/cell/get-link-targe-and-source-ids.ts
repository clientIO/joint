import type { dia } from '@joint/core';
/**
 * Get the target or source of a link.
 * @param id - The id of the link.
 * @returns - The target or source of the link.
 * @group utils
 * @description
 * This function is used to get the target or source of a link.
 * It checks if the id is an object or a string and returns the appropriate value.
 */
export function getTargetOrSource(id: dia.Cell.ID | dia.Link.EndJSON | undefined): dia.Link.EndJSON {
  if (id === undefined) {
    return {};
  }
  if (typeof id === 'object') {
    return id;
  }
  return {
    id,
  };
}

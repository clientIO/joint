import type { dia } from '@joint/core';
import { isLinkInstance } from '../is';
import type { GraphLink } from '../../types/link-types';
/**
 * Get the target or source of a link.
 * @param id
 * @returns { dia.Link.EndJSON } - The target or source of the link.
 * @group utils
 * @description
 * This function is used to get the target or source of a link.
 * It checks if the id is an object or a string and returns the appropriate value.
 */
export function getTargetOrSource(id: dia.Cell.ID | dia.Link.EndJSON): dia.Link.EndJSON {
  if (typeof id === 'object') {
    return id;
  }
  return {
    id,
  };
}
/**
 * Get the target and source ids of a link.
 * @param link - The link to get the target and source ids from.
 * @returns - The target and source ids of the link.
 * @group utils
 * @description
 * This function is used to get the target and source ids of a link.
 */
export function getLinkTargetAndSourceIds(link: dia.Link | GraphLink): {
  source?: dia.Cell.ID;
  target?: dia.Cell.ID;
} {
  if (isLinkInstance(link)) {
    return {
      source: link.attributes.source,
      target: link.attributes.target,
    };
  }
  const source = getTargetOrSource(link.source);
  const target = getTargetOrSource(link.target);
  return {
    source: source.id,
    target: target.id,
  };
}

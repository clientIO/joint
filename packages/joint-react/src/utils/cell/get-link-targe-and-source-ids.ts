import type { dia } from '@joint/core';
import { isLinkInstance } from '../is';
import type { GraphLink } from 'src/types/link-types';

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
  return {
    source: link.source,
    target: link.target,
  };
}

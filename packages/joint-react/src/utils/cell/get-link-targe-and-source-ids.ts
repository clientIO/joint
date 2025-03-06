import type { dia } from '@joint/core';
import { isLinkInstance } from '../is';
import type { GraphLink } from 'src/data/graph-links';

export function getLinkTargetAndSourceIds(link: dia.Link | GraphLink): {
  source?: dia.Cell.ID;
  target?: dia.Cell.ID;
} {
  if (isLinkInstance(link)) {
    return {
      source: link.source().id,
      target: link.target().id,
    };
  }
  return {
    source: link.source,
    target: link.target,
  };
}

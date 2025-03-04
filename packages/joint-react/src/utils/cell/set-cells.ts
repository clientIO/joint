import type { dia } from '@joint/core';
import { REACT_TYPE } from '../../models/react-element';
import type { GraphLink } from '../../data/graph-links';
import type { GraphElementBase } from '../../data/graph-elements';
import { isCellInstance, isLinkInstance } from '../is';

// Process a link: convert GraphLink to a standard JointJS link if needed.
function processLink(link: dia.Link | GraphLink) {
  if (isLinkInstance(link)) {
    return link;
  }

  return {
    ...link,
    type: link.type ?? 'standard.Link',
    source: { id: link.source },
    target: { id: link.target },
  };
}

// Process an element: create a ReactElement if applicable, otherwise a standard Cell.
function processElement(element: dia.Element | GraphElementBase) {
  if (isCellInstance(element)) {
    return element;
  }
  const { type = REACT_TYPE, x, y, width, height } = element;
  return {
    type,
    position: { x, y },
    size: { width, height },
    ...element,
  };
}

/**
 * Updating of graph cells inside use graph store - helper function
 */
export function setCells(options: {
  graph: dia.Graph;
  defaultLinks?: Array<dia.Link | GraphLink>;
  defaultElements?: Array<dia.Element | GraphElementBase>;
}) {
  const { graph, defaultElements, defaultLinks } = options;
  // Process links if provided.
  if (defaultLinks !== undefined) {
    graph.addCells(defaultLinks.map(processLink));
  }
  // Process elements if provided.
  if (defaultElements !== undefined) {
    graph.addCells(defaultElements.map(processElement));
  }
}

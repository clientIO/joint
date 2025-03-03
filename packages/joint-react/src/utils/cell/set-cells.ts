import { dia, shapes } from '@joint/core';
import { REACT_TYPE, ReactElement } from '../../models/react-element';
import { isReactElement } from '../../types/cell.types';
import type { GraphLink } from '../../data/graph-links';
import type { GraphElementBase } from '../../data/graph-elements';
import { isGraphLink } from '../is';

// Process a link: convert GraphLink to a standard JointJS link if needed.
function processLink(link: dia.Link | GraphLink): dia.Link {
  if (isGraphLink(link)) {
    return new shapes.standard.Link({
      ...link,
      source: { id: link.source },
      target: { id: link.target },
    });
  }
  return link;
}

// Process an element: create a ReactElement if applicable, otherwise a standard Cell.
function processElement(element: dia.Element | GraphElementBase): dia.Cell {
  if (element instanceof dia.Cell) {
    return element;
  }
  const { type = REACT_TYPE, x, y, width, height } = element;
  if (isReactElement(element)) {
    return new ReactElement({
      type,
      position: { x, y },
      size: { width, height },
      ...element,
    });
  }
  return new dia.Cell({
    type,
    position: { x, y },
    size: { width, height },
    ...element,
  });
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

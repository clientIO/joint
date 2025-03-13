import type { dia } from '@joint/core';
import { REACT_TYPE } from '../../models/react-element';
import type { GraphLink } from '../../types/link-types';
import type { GraphElementBase } from '../../types/element-types';
import { isCellInstance, isLinkInstance, isReactElement, isUnsized } from '../is';
import { getLinkTargetAndSourceIds } from './get-link-targe-and-source-ids';

interface Options {
  readonly graph: dia.Graph;
  readonly defaultLinks?: Array<dia.Link | GraphLink>;
  readonly defaultElements?: Array<dia.Element | GraphElementBase>;
}

// Process a link: convert GraphLink to a standard JointJS link if needed.
export function processLink(link: dia.Link | GraphLink): dia.Link | dia.Cell.JSON {
  if (isLinkInstance(link)) {
    const json = link.toJSON();
    return {
      ...json,
      source: { id: json.source },
      target: { id: json.target },
    };
  }

  return {
    ...link,
    type: link.type ?? 'standard.Link',
    source: { id: link.source },
    target: { id: link.target },
  } as dia.Cell.JSON;
}

export function setLinks(options: Options) {
  const { graph, defaultLinks } = options;
  if (defaultLinks === undefined) {
    return;
  }

  // Process links if provided.
  graph.addCells(defaultLinks.map(processLink));
}

/**
 * Set elements and return unsized elements ids (means that the element is react type and has not size).
 */
function setElements(options: Options) {
  const { graph, defaultElements } = options;
  if (defaultElements === undefined) {
    return new Set<string>();
  }
  const unsizedIds = new Set<string>();

  // Process an element: create a ReactElement if applicable, otherwise a standard Cell.
  function processElement(element: dia.Element | GraphElementBase): dia.Element | dia.Cell.JSON {
    const stringId = String(element.id);
    if (isCellInstance(element)) {
      const size = element.size();
      if (isReactElement(element) && isUnsized(size.width, size.height)) {
        unsizedIds.add(stringId);
      }
      return element;
    }
    const { type = REACT_TYPE, x, y, width, height } = element;
    if (isUnsized(width, height)) {
      unsizedIds.add(stringId);
    }

    return {
      type,
      position: { x, y },
      size: { width, height },
      ...element,
    } as dia.Cell.JSON;
  }
  // Process elements if provided.
  graph.addCells(defaultElements.map(processElement));
  return unsizedIds;
}

/**
 * Updating of graph cells inside use graph store - helper function
 *
 * It also check for the react unsized elements, if the element has not size, it will not render the link immanently.
 * It return callback to set unsized links later.
 */
export function setCells(options: Options) {
  const { defaultLinks = [] } = options;

  // React elements without explicitly defined size.
  const unsizedIds = setElements(options);

  const sizedLinks: Array<dia.Link | GraphLink> = [];
  const unsizedLinks: Map<dia.Cell.ID, dia.Link | GraphLink> = new Map();

  for (const link of defaultLinks) {
    const { source, target } = getLinkTargetAndSourceIds(link);

    if (unsizedIds.has(String(source)) || unsizedIds.has(String(target))) {
      unsizedLinks.set(link.id, link);
      continue;
    }
    sizedLinks.push(link);
  }
  setLinks({ ...options, defaultLinks: sizedLinks });
  return unsizedLinks;
}

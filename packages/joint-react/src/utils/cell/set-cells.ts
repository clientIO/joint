import type { dia } from '@joint/core';
import { REACT_TYPE } from '../../models/react-element';
import type { GraphLink } from '../../types/link-types';
import type { GraphElement } from '../../types/element-types';
import { isCellInstance, isLinkInstance, isUnsized } from '../is';
import { getTargetOrSource } from './get-link-targe-and-source-ids';
import { isReactElement } from '../is-react-element';

interface Options {
  readonly graph: dia.Graph;
  readonly initialLinks?: Array<dia.Link | GraphLink>;
  readonly initialElements?: Array<dia.Element | GraphElement>;
}

/**
 * Process a link: convert GraphLink to a standard JointJS link if needed.
 * @param link - The link to process.
 * @group utils
 * @description
 * This function is used to process a link and convert it to a standard JointJS link if needed.
 * It also converts the source and target of the link to a standard format.
 * @returns
 * A standard JointJS link or a JSON representation of the link.
 */
export function processLink(link: dia.Link | GraphLink): dia.Link | dia.Cell.JSON {
  if (isLinkInstance(link)) {
    const json = link.toJSON();

    const source = getTargetOrSource(json.source);
    const target = getTargetOrSource(json.target);
    return {
      ...json,
      source,
      target,
    };
  }

  const source = getTargetOrSource(link.source);
  const target = getTargetOrSource(link.target);
  return {
    ...link,
    type: link.type ?? 'standard.Link',
    source,
    target,
  } as dia.Cell.JSON;
}

/**
 * Set links to the graph.
 * @param options - The options for setting links.
 * @group utils
 * @description
 * This function is used to set links to the graph.
 * It processes the links and adds them to the graph.
 * It also converts the source and target of the links to a standard format.
 */
export function setLinks(options: Options) {
  const { graph, initialLinks } = options;
  if (initialLinks === undefined) {
    return;
  }

  // Process links if provided.
  graph.addCells(
    initialLinks.map((item) => {
      const link = processLink(item);
      if (link.z === undefined) {
        link.z = 0;
      }
      return link;
    })
  );
}

/**
 * Process an element: create a ReactElement if applicable, otherwise a standard Cell.
 * @param element - The element to process.
 * @param unsizedIds - A set of unsized element IDs.
 * @returns A standard JointJS element or a JSON representation of the element.
 * @group utils
 * @description
 * This function is used to process an element and convert it to a standard JointJS element if needed.
 * It also checks if the element is a ReactElement and if it has a size.
 * If the element is a ReactElement and has no size, it adds its ID to the unsizedIds set.
 * @private
 */
export function processElement<T extends dia.Element | GraphElement>(
  element: T,
  unsizedIds?: Set<string>
): dia.Element | dia.Cell.JSON {
  const stringId = String(element.id);
  if (isCellInstance(element)) {
    const size = element.size();
    if (isReactElement(element) && isUnsized(size.width, size.height)) {
      unsizedIds?.add(stringId);
    }
    return element;
  }
  const { type = REACT_TYPE, x, y, width, height } = element;
  if (isUnsized(width, height)) {
    unsizedIds?.add(stringId);
  }

  return {
    type,
    position: { x, y },
    size: { width, height },
    ...element,
  } as dia.Cell.JSON;
}
/**
 * Set elements to the graph.
 * @param options - The options for setting elements.
 * @group utils
 * @description
 * This function is used to set elements to the graph.
 * @returns A set of unsized element IDs.
 * It processes the elements and adds them to the graph.
 * It also checks for unsized elements and returns their IDs.
 */
export function setElements(options: Options) {
  const { graph, initialElements } = options;
  if (initialElements === undefined) {
    return new Set<string>();
  }
  const unsizedIds = new Set<string>();

  // Process elements if provided.
  graph.addCells(initialElements.map((item) => processElement(item, unsizedIds)));
  return unsizedIds;
}

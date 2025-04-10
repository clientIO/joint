import type { dia } from '@joint/core';
import { REACT_TYPE } from '../../models/react-element';
import type { GraphLink } from '../../types/link-types';
import type { GraphElementBase } from '../../types/element-types';
import { isCellInstance, isLinkInstance, isUnsized } from '../is';
import { getLinkTargetAndSourceIds, getTargetOrSource } from './get-link-targe-and-source-ids';
import { isReactElement } from '../is-react-element';

interface Options {
  readonly graph: dia.Graph;
  readonly defaultLinks?: Array<dia.Link | GraphLink>;
  readonly defaultElements?: Array<dia.Element | GraphElementBase>;
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
  const { graph, defaultLinks } = options;
  if (defaultLinks === undefined) {
    return;
  }

  // Process links if provided.
  graph.addCells(defaultLinks.map(processLink));
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
function setElements(options: Options) {
  const { graph, defaultElements } = options;
  if (defaultElements === undefined) {
    return new Set<string>();
  }
  const unsizedIds = new Set<string>();

  /**
   * Process an element: create a ReactElement if applicable, otherwise a standard Cell.
   * @param element - The element to process.
   * @returns A standard JointJS element or a JSON representation of the element.
   * @group utils
   * @description
   * This function is used to process an element and convert it to a standard JointJS element if needed.
   * It also checks if the element is a ReactElement and if it has a size.
   * If the element is a ReactElement and has no size, it adds its ID to the unsizedIds set.
   * @private
   */
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
 * @description
 * It also check for the react unsized elements, if the element has not size, it will not render the link immanently.
 * It return callback to set unsized links later.
 * @param options - The options for setting cells.
 * @returns
 * A map of unsized link IDs to their corresponding GraphLink objects.
 * @group utils
 * @private
 */
export function setCells(options: Options) {
  const { defaultLinks = [] } = options;

  // React elements without explicitly defined size.
  const unsizedIds = setElements(options);

  const assignedLinks: Array<dia.Link | GraphLink> = [];
  // Some links are not assigned, because react work in async way, that mean:
  // User do not have to define width and height of node, and its computed by react renderer,
  // so we need to wait for the react to render component, then we add size to the graph and then we can assign the link.
  // this will prevent flickering of the link at the start.
  const notAssignedLinks: Map<dia.Cell.ID, dia.Link | GraphLink> = new Map();

  for (const link of defaultLinks) {
    const { source, target } = getLinkTargetAndSourceIds(link);

    if (unsizedIds.has(String(source)) || unsizedIds.has(String(target))) {
      notAssignedLinks.set(link.id, link);
      continue;
    }
    assignedLinks.push(link);
  }
  setLinks({ ...options, defaultLinks: assignedLinks });
  return notAssignedLinks;
}

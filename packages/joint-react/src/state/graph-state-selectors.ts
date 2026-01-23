import { util, type dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import { getTargetOrSource } from '../utils/cell/get-link-targe-and-source-ids';
import { REACT_TYPE } from '../models/react-element';
import { REACT_LINK_TYPE } from '../models/react-link';

export interface ElementToGraphOptions<Element extends GraphElement> {
  readonly element: Element;
  readonly graph: dia.Graph;
  readonly defaultMapper: () => dia.Cell.JSON;
}

export interface GraphToElementOptions<Element extends GraphElement> {
  readonly cell: dia.Element;
  readonly previous?: Element;
  readonly graph: dia.Graph;
  readonly defaultMapper: () => Element;
}

export interface LinkToGraphOptions<Link extends GraphLink> {
  readonly link: Link;
  readonly graph: dia.Graph;
  readonly defaultMapper: () => dia.Cell.JSON;
}

export interface GraphToLinkOptions<Link extends GraphLink> {
  readonly cell: dia.Link;
  readonly previous?: Link;
  readonly graph: dia.Graph;
  readonly defaultMapper: () => Link;
}

export type LinkFromGraphSelector<Link extends GraphLink> = (
  options: GraphToLinkOptions<Link>
) => Link;

export interface GraphStateSelectors<Element extends GraphElement, Link extends GraphLink> {
  readonly elementToGraphSelector?: (options: ElementToGraphOptions<Element>) => dia.Cell.JSON;
  readonly linkToGraphSelector?: (options: LinkToGraphOptions<Link>) => dia.Cell.JSON;
}

/**
 * Creates the default mapper function for element to graph conversion.
 * Separates user data into the `data` property.
 * @param element - The element to convert
 * @returns A function that returns the JointJS Cell JSON representation
 */
export function createDefaultElementMapper<Element extends GraphElement>(
  element: Element
): () => dia.Cell.JSON {
  return () => {
    // Extract built-in JointJS element properties: id, x, y, width, height, angle, z, ports
    // Remaining properties are user data
    const { id, x, y, width, height, angle, z, ports, ...userData } = element as GraphElement & {
      z?: number;
      ports?: { groups?: Record<string, dia.Element.PortGroup>; items?: dia.Element.Port[] };
      attrs?: dia.Cell.Selectors;
      markup?: dia.MarkupJSON;
    };
    const { attrs: elementAttributes, markup, ...restUserData } = userData;

    const model: dia.Cell.JSON = {
      id,
      type: REACT_TYPE,
    };

    if (x !== undefined && y !== undefined) {
      model.position = { x, y };
    }

    if (width !== undefined && height !== undefined) {
      model.size = { width, height };
    }

    if (angle !== undefined) model.angle = angle;
    if (z !== undefined) model.z = z;
    if (ports !== undefined) model.ports = ports;
    if (elementAttributes !== undefined) model.attrs = elementAttributes;
    if (markup !== undefined) model.markup = markup;

    if (Object.keys(restUserData).length > 0) {
      model.data = restUserData;
    }

    return model;
  };
}

/**
 * Applies shape preservation by filtering cellData to only include keys from previous state.
 * @param cellData - The cell data extracted from the graph
 * @param previous - The previous element state used as shape template
 * @returns The filtered element with only properties from the previous state
 */
function applyShapePreservation<Element extends GraphElement>(
  cellData: Record<string, unknown>,
  previous: Element
): Element {
  const filtered: Record<string, unknown> = {};
  const previousRecord = previous as Record<string, unknown>;
  for (const key in previousRecord) {
    if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
      filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
    }
  }
  return filtered as Element;
}

/**
 * Extracts base cell data from a JointJS Element.
 * @param cell - The JointJS Element cell
 * @returns The extracted cell data as a record
 */
function extractBaseCellData(cell: dia.Element): Record<string, unknown> {
  const { size, position, data, type, angle, z, parent, ports } = cell.attributes;

  const cellData: Record<string, unknown> = {
    id: cell.id,
  };

  if (type !== REACT_TYPE) {
    cellData.type = type;
  }

  if (position) {
    cellData.x = position.x;
    cellData.y = position.y;
  }

  if (size) {
    cellData.width = size.width;
    cellData.height = size.height;
  }

  if (angle !== undefined) cellData.angle = angle;
  if (z !== undefined) cellData.z = z;
  if (parent !== undefined) cellData.parent = parent;
  if (ports !== undefined) cellData.ports = ports;

  // Spread user data from data property to top level
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      cellData[key] = value;
    }
  }

  return cellData;
}

/**
 * Creates the default mapper function for graph to element conversion.
 * Extracts user data from the `data` property and spreads it to top level.
 * @param cell - The JointJS Element cell
 * @param previous - Optional previous element state for shape preservation
 * @returns A function that returns the GraphElement representation
 */
export function createDefaultGraphToElementMapper<Element extends GraphElement>(
  cell: dia.Element,
  previous?: Element
): () => Element {
  return () => {
    const cellData = extractBaseCellData(cell);

    if (previous !== undefined) {
      return applyShapePreservation(cellData, previous);
    }

    return cellData as Element;
  };
}

/**
 * Creates the default mapper function for link to graph conversion.
 * Separates user data into the `data` property.
 * @param link - The link to convert
 * @param graph - The JointJS graph instance
 * @returns A function that returns the JointJS Cell JSON representation
 */
export function createDefaultLinkMapper<Link extends GraphLink>(
  link: Link,
  graph: dia.Graph
): () => dia.Cell.JSON {
  return () => {
    // Extract built-in JointJS link properties, remaining properties are user data
    const {
      id,
      source: linkSource,
      target: linkTarget,
      attrs,
      type = REACT_LINK_TYPE,
      z,
      markup,
      defaultLabel,
      labels,
      vertices,
      router,
      connector,
      ...userData
    } = link;

    const source = getTargetOrSource(linkSource);
    const target = getTargetOrSource(linkTarget);

    const typeClass = util.getByPath(graph.layerCollection.cellNamespace, type, '.');
    const defaults = typeClass
      ? util.result(typeClass.prototype, 'defaults', {})
      : {};

    const existingCell = graph.getCell(id);
    const existingAttributes = existingCell?.isLink() ? existingCell.attr() : {};

    const mergedAttributes = util.defaultsDeep({}, attrs || {}, existingAttributes, defaults.attrs);

    const model: dia.Cell.JSON = {
      id,
      type: link.type ?? REACT_LINK_TYPE,
      source,
      target,
      attrs: mergedAttributes as dia.Cell.Selectors,
    };

    if (z !== undefined) model.z = z;
    if (markup !== undefined) model.markup = markup;
    if (defaultLabel !== undefined) model.defaultLabel = defaultLabel;
    if (labels !== undefined) model.labels = labels;
    if (vertices !== undefined) model.vertices = vertices;
    if (router !== undefined) model.router = router;
    if (connector !== undefined) model.connector = connector;

    if (Object.keys(userData).length > 0) {
      model.data = userData;
    }

    return model;
  };
}

/**
 * Creates the default mapper function for graph to link conversion.
 * Extracts user data from the `data` property and spreads it to top level.
 * @param cell - The JointJS Link cell
 * @param previous - Optional previous link state for shape preservation
 * @returns A function that returns the GraphLink representation
 */
export function createDefaultGraphToLinkMapper<Link extends GraphLink>(
  cell: dia.Link,
  previous?: Link
): () => Link {
  return () => {
    const { data, ...attributes } = cell.attributes;

    const cellData: Record<string, unknown> = {
      ...attributes,
      id: cell.id,
      source: cell.get('source') as dia.Cell.ID,
      target: cell.get('target') as dia.Cell.ID,
      type: cell.attributes.type,
      z: cell.get('z'),
      markup: cell.get('markup'),
      defaultLabel: cell.get('defaultLabel'),
    };

    // Spread user data from data property to top level
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        cellData[key] = value;
      }
    }

    // Shape preservation
    if (previous !== undefined) {
      const filtered: Record<string, unknown> = {};
      const previousRecord = previous as Record<string, unknown>;
      for (const key in previousRecord) {
        if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
          filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
        }
      }
      return filtered as Link;
    }

    return cellData as Link;
  };
}

/**
 * Default selector that converts a Link to a JointJS Cell JSON representation.
 * @param options - The options containing the link, graph, and defaultMapper.
 * @returns A JointJS Cell JSON representation of the link.
 * @group state
 * @description
 * This selector uses the defaultMapper to convert the link to a JointJS cell JSON.
 * The defaultMapper handles source/target extraction, attribute merging, and data separation.
 */
export function defaultLinkToGraphSelector<Link extends GraphLink>(
  options: LinkToGraphOptions<Link>
): dia.Cell.JSON {
  const { defaultMapper } = options;
  return defaultMapper();
}

/**
 * Default selector that converts an Element to a JointJS Cell JSON representation.
 * @param options - The options containing the element, graph, and defaultMapper.
 * @returns A JointJS Cell JSON representation of the element.
 * @group state
 * @description
 * This selector uses the defaultMapper to convert the element to a JointJS cell JSON.
 * The defaultMapper handles position/size extraction and data separation.
 */
export function defaultElementToGraphSelector<Element extends GraphElement>(
  options: ElementToGraphOptions<Element>
): dia.Cell.JSON {
  const { defaultMapper } = options;
  return defaultMapper();
}

/**
 * Default selector that converts a JointJS Link cell to a Link representation.
 * @param options - The options containing the cell, previous state, graph, and defaultMapper.
 * @returns A Link representation extracted from the cell.
 * @group state
 * @description
 * This selector uses the defaultMapper to convert the JointJS link cell to a Link.
 * The defaultMapper handles data extraction and shape preservation.
 */
export function defaultGraphToLinkSelector<Link extends GraphLink>(
  options: GraphToLinkOptions<Link>
): Link {
  const { defaultMapper } = options;
  return defaultMapper();
}

/**
 * Default selector that converts a JointJS Element cell to a GraphElement representation.
 * @param options - The options containing the cell, previous state, graph, and defaultMapper.
 * @returns A GraphElement representation extracted from the cell.
 * @group state
 * @description
 * This selector uses the defaultMapper to convert the JointJS element cell to a GraphElement.
 * The defaultMapper handles data extraction and shape preservation.
 */
export function defaultGraphToElementSelector<Element extends GraphElement>(
  options: GraphToElementOptions<Element>
): GraphElement {
  const { defaultMapper } = options;
  return defaultMapper();
}

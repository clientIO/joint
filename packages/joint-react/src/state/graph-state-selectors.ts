/* eslint-disable sonarjs/cognitive-complexity */
import { util, type dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import { getTargetOrSource } from '../utils/cell/get-link-targe-and-source-ids';
import { REACT_TYPE } from '../models/react-element';

export interface ElementToGraphOptions<Element extends GraphElement> {
  readonly element: Element;
  readonly graph: dia.Graph;
}

export interface ElementFromGraphOptions<Element extends GraphElement> {
  readonly cell: dia.Element;
  readonly previous?: Element;
  readonly graph: dia.Graph;
}

export interface LinkToGraphOptions<Link extends GraphLink> {
  readonly link: Link;
  readonly graph: dia.Graph;
}

export interface LinkFromGraphOptions<Link extends GraphLink> {
  readonly cell: dia.Link;
  readonly previous?: Link;
  readonly graph: dia.Graph;
}

export type LinkFromGraphSelector<Link extends GraphLink> = (
  options: LinkFromGraphOptions<Link>
) => Link;

export interface GraphStateSelectors<Element extends GraphElement, Link extends GraphLink> {
  readonly elementToGraphSelector?: (options: ElementToGraphOptions<Element>) => dia.Cell.JSON;
  readonly elementFromGraphSelector?: (options: ElementFromGraphOptions<Element>) => Element;
  readonly linkToGraphSelector?: (options: LinkToGraphOptions<Link>) => dia.Cell.JSON;
  readonly linkFromGraphSelector?: (options: LinkFromGraphOptions<Link>) => Link;
}

/**
 * Default selector that converts a Link to a JointJS Cell JSON representation.
 * @param options - The options containing the link and graph.
 * @param options.link - The link to convert.
 * @param options.graph - The JointJS graph instance.
 * @returns A JointJS Cell JSON representation of the link.
 * @group state
 * @description
 * This selector extracts source and target information from the link and merges it with default attributes
 * from the graph's cell namespace. It handles link type defaults and attribute merging.
 */
export function defaultLinkToGraphSelector<Link extends GraphLink>(
  options: LinkToGraphOptions<Link>
): dia.Cell.JSON {
  const { graph, link } = options;
  const source = getTargetOrSource(link.source);
  const target = getTargetOrSource(link.target);
  const { attrs, type = 'standard.Link', ...rest } = link;

  // TODO: this is not optimal solution
  const defaults = util.result(
    util.getByPath(graph.layerCollection.cellNamespace, type, '.').prototype,
    'defaults',
    {}
  );

  const mergedLink = {
    ...rest,
    type,
    attrs: util.defaultsDeep({}, attrs as never, defaults.attrs),
  };

  return {
    ...mergedLink,
    type: link.type ?? 'standard.Link',
    source,
    target,
  } as unknown as dia.Cell.JSON;
}

/**
 * Default selector that converts an Element to a JointJS Cell JSON representation.
 * @param options - The options containing the element and graph.
 * @param options.element - The element to convert.
 * @param options.graph - The JointJS graph instance.
 * @returns A JointJS Cell JSON representation of the element.
 * @group state
 * @description
 * This selector extracts position (x, y) and size (width, height) from the element and creates
 * a JointJS cell JSON with the appropriate structure. It preserves all element properties.
 */
export function defaultElementToGraphSelector<Element extends GraphElement>(
  options: ElementToGraphOptions<Element>
): dia.Cell.JSON {
  const { element } = options;
  const { type = REACT_TYPE, x, y, width, height } = element;
  const model :dia.Cell.JSON=  {
    type,
    ...element,
  }
  if (x !== undefined && y !== undefined) {
    model.position = { x , y };
  }
  if (width !== undefined && height !== undefined) {
    model.size = { width, height };
  }
  return model
}

/**
 * Default selector that converts a JointJS Link cell to a Link representation.
 * @param options - The options containing the cell, previous state, and graph.
 * @param options.cell - The JointJS Link cell to convert.
 * @param options.previous - Optional previous link state to preserve shape.
 * @param options.graph - The JointJS graph instance.
 * @returns A Link representation extracted from the cell.
 * @group state
 * @description
 * This selector extracts all properties from a JointJS Link cell. If a previous state is provided,
 * it filters the result to only include properties that existed in the previous state, ensuring
 * the state shape remains the source of truth.
 */
export function defaultLinkFromGraphSelector<Link extends GraphLink>(
  options: LinkFromGraphOptions<Link>
): Link {
  const { cell, previous } = options;

  // Extract all properties from cell
  const cellData: Record<string, unknown> = {
    ...cell.attributes,
    id: cell.id,
    source: cell.get('source') as dia.Cell.ID,
    target: cell.get('target') as dia.Cell.ID,
    type: cell.attributes.type,
    z: cell.get('z'),
    markup: cell.get('markup'),
    defaultLabel: cell.get('defaultLabel'),
  };

  // If previous state exists, filter to only include properties that exist in previous state
  // This ensures state shape is the source of truth
  if (previous !== undefined) {
    const filtered: Record<string, unknown> = {};
    const previousRecord = previous as Record<string, unknown>;
    for (const key in previousRecord) {
      if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
        // Include property if it exists in previous (even if undefined)
        // Get value from cellData if available, otherwise use previous value
        filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
      }
    }
    return filtered as Link;
  }

  return cellData as Link;
}

/**
 * Default selector that converts a JointJS Element cell to a GraphElement representation.
 * @param options - The options containing the cell, previous state, and graph.
 * @param options.cell - The JointJS Element cell to convert.
 * @param options.previous - Optional previous element state to preserve shape.
 * @param options.graph - The JointJS graph instance.
 * @returns A GraphElement representation extracted from the cell.
 * @group state
 * @description
 * This selector extracts position and size from the cell's attributes and flattens them into x, y, width, height.
 * If a previous state is provided, it filters the result to only include properties that existed in the
 * previous state, ensuring the state shape remains the source of truth.
 */
export function defaultElementFromGraphSelector<Element extends GraphElement>(
  options: ElementFromGraphOptions<Element>
): GraphElement {
  const { cell, previous } = options;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { size, position, data, attrs, type, ...attributes } = cell.attributes;
  const cellData: Record<string, unknown> = {
    ...attributes,
    ...position,
    ...size,
    id: cell.id,
    ports: cell.get('ports'),
  };
  if (type !== REACT_TYPE) {
    cellData.type = type;
  }

  // If previous state exists, filter to only include properties that exist in previous state
  // This ensures state shape is the source of truth
  // However, we always include core properties (x, y, width, height, id) from cellData
  if (previous !== undefined) {
    const filtered: Record<string, unknown> = {};
    const previousRecord = previous as Record<string, unknown>;
    for (const key in previousRecord) {
      if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
        // Include property if it exists in previous (even if undefined)
        // Get value from cellData if available, otherwise use previous value
        filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
      }
    }
    // Always include core properties from cellData, even if they weren't in previous state
    // This ensures position and size changes are always reflected
    if ('x' in cellData) filtered.x = cellData.x;
    if ('y' in cellData) filtered.y = cellData.y;
    if ('width' in cellData) filtered.width = cellData.width;
    if ('height' in cellData) filtered.height = cellData.height;
    if ('id' in cellData) filtered.id = cellData.id;
    return filtered as Element;
  }

  return cellData as Element;
}

import { util, type dia } from '@joint/core';
import { REACT_TYPE } from '../../models/react-element';
import type { GraphLink } from '../../types/link-types';
import type { GraphElement } from '../../types/element-types';
import { isCellInstance, isLinkInstance } from '../is';
import { getTargetOrSource } from './get-link-targe-and-source-ids';

export type CellOrJsonCell = dia.Cell | dia.Cell.JSON;

/**
 * Converts a link to a graph cell.
 * @param link - The link to convert.
 * @param graph - The graph instance.
 * @returns The cell or JSON cell representation.
 */
export function linkToGraph(link: dia.Link | GraphLink, graph: dia.Graph): CellOrJsonCell {
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
  } as dia.Cell.JSON;
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
 * @example
 * ```ts
 * import { processElement } from '@joint/react';
 *
 * const element = { id: '1', x: 10, y: 20, width: 100, height: 50 };
 * const unsizedIds = new Set<string>();
 * const processed = processElement(element, unsizedIds);
 * ```
 */
export function elementToGraph<T extends dia.Element | GraphElement>(element: T): CellOrJsonCell {
  if (isCellInstance(element)) {
    return element;
  }
  const { type = REACT_TYPE, x, y, width, height } = element;

  return {
    type,
    position: { x, y },
    size: { width, height },
    ...element,
  } as dia.Cell.JSON;
}

export interface Ports {
  readonly groups?: Record<string, dia.Element.PortGroup>;
  readonly items?: dia.Element.Port[];
}

export type GraphCell<Element extends GraphElement = GraphElement> = Element | GraphLink;

/**
 * Get element via cell
 * @param cell - The cell to get the element from.
 * @returns - The element.
 * @group utils
 * @private
 * @description
 * This function is used to get an element from a cell.
 * It extracts the size, position, and attributes from the cell and returns them as an element.
 * It also adds the id, isElement, isLink, data, type, and ports to the element.
 * @example
 * ```ts
 * const element = getElement(cell);
 * console.log(element);
 * ```
 */
export function elementFromGraph<Element extends dia.Element | GraphElement = GraphElement>(
  cell: dia.Cell
): Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { size, position, data, attrs, type, ...attributes } = cell.attributes;
  const element: GraphElement = {
    ...attributes,
    ...position,
    ...size,
    id: cell.id,
    ports: cell.get('ports'),
  };
  if (type !== REACT_TYPE) {
    element.type = type;
  }

  return element as Element;
}

/**
 * Get link via cell
 * @param cell - The cell to get the link from.
 * @returns - The link.
 * @group utils
 * @private
 * @description
 * This function is used to get a link from a cell.
 * It extracts the source, target, and attributes from the cell and returns them as a link.
 * It also adds the id, isElement, isLink, type, z, markup, and defaultLabel to the link.
 * @example
 * ```ts
 * const link = getLink(cell);
 * console.log(link);
 * ```
 */
export function linkFromGraph<Link extends dia.Link | GraphLink = GraphLink>(
  cell: dia.Cell<dia.Cell.Attributes>
): Link {
  return {
    ...cell.attributes,
    id: cell.id,
    source: cell.get('source') as dia.Cell.ID,
    target: cell.get('target') as dia.Cell.ID,
    type: cell.attributes.type,
    z: cell.get('z'),
    markup: cell.get('markup'),
    defaultLabel: cell.get('defaultLabel'),
  } as Link;
}

export interface SyncGraphOptions {
  readonly graph: dia.Graph;
  readonly elements?: Array<dia.Element | GraphElement>;
  readonly links?: Array<dia.Link | GraphLink>;
}

/**
 * Synchronizes elements and links with the graph.
 * @param options - The options containing graph, elements, and links.
 */
export function syncGraph(options: SyncGraphOptions) {
  const { graph, elements = [], links = [] } = options;
  const items = [
    ...elements.map((element) => elementToGraph(element)),
    ...links.map((link) => linkToGraph(link, graph)),
  ];

  // syncCells already wraps itself in a batch internally (see joint-core Graph.mjs:428-459)
  // So we don't need to wrap it again - it will trigger batch:start and batch:stop events
  graph.syncCells(items, { remove: true });
}

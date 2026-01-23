import { util, type dia } from '@joint/core';
import { REACT_TYPE } from '../../models/react-element';
import type { GraphLink } from '../../types/link-types';
import type { GraphElement } from '../../types/element-types';
import { getTargetOrSource } from './get-link-targe-and-source-ids';

export type CellOrJsonCell = dia.Cell | dia.Cell.JSON;

/**
 * Converts a link to a graph cell.
 * @param link - The link to convert.
 * @param graph - The graph instance.
 * @returns The cell or JSON cell representation.
 */
export function mapLinkToGraph(link: GraphLink, graph: dia.Graph): CellOrJsonCell {
  const source = getTargetOrSource(link.source);
  const target = getTargetOrSource(link.target);
  const { attrs, type = 'standard.Link', ...rest } = link;

  // Note: Accessing prototype defaults directly. Consider caching defaults for performance.
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
 * Maps a GraphElement to a JointJS Cell or JSON representation.
 * @param element - The element to process.
 * @returns A standard JointJS element or a JSON representation of the element.
 * @group utils
 * @description
 * This function is used to process an element and convert it to a standard JointJS element if needed.
 * It extracts position and size information from the element and creates the appropriate cell representation.
 * @private
 * @example
 * ```ts
 * import { mapElementToGraph } from '@joint/react';
 *
 * const element = { id: '1', x: 10, y: 20, width: 100, height: 50 };
 * const processed = mapElementToGraph(element);
 * ```
 */
export function mapElementToGraph<T extends GraphElement>(element: T): CellOrJsonCell {
  const { type = REACT_TYPE, x, y, width, height } = element;

  return {
    type,
    position: { x, y },
    size: { width, height },
    ...element,
  } as dia.Cell.JSON;
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
export function mapElementFromGraph<Element extends GraphElement = GraphElement>(
  cell: dia.Cell
): Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { size, position, data: userData, attrs, type, ...attributes } = cell.attributes;
  const data: GraphElement = {
    ...attributes,
    ...position,
    ...size,
    id: cell.id,
    ports: cell.get('ports'),
  };
  if (type !== REACT_TYPE) {
    data.type = type;
  }

  return data as Element;
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
export function mapLinkFromGraph<Link extends dia.Link | GraphLink = GraphLink>(
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

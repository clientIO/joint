import { type dia } from '@joint/core';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';

export interface Ports {
  readonly groups?: Record<string, dia.Element.PortGroup>;
  readonly items?: dia.Element.Port[];
}

export type JointAttributes = Omit<dia.Element.Attributes, 'size' | 'position'>;

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
export function getElement<Element extends GraphElement = GraphElement>(
  cell: dia.Cell<JointAttributes>
): Element {
  const { size, position, ...attributes } = cell.attributes;
  return {
    ...attributes,
    ...position,
    ...size,
    id: cell.id,
    isElement: true,
    isLink: false,
    data: cell.attributes.data,
    type: cell.attributes.type,
    ports: cell.get('ports'),
  };
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
export function getLink(cell: dia.Cell<dia.Cell.Attributes>): GraphLink {
  return {
    ...cell.attributes,
    id: cell.id,
    isElement: false,
    isLink: true,
    source: cell.get('source') as dia.Cell.ID,
    target: cell.get('target') as dia.Cell.ID,
    type: cell.attributes.type,
    z: cell.get('z'),
    markup: cell.get('markup'),
    defaultLabel: cell.get('defaultLabel'),
  };
}

/**
 * Get cell via cell
 * @param cell - The cell to get the cell from.
 * @returns - The cell.
 * @group utils
 * @private
 * @description
 * This function is used to get a cell from a cell.
 * It checks if the cell is an element or a link and returns the appropriate value.
 * @example
 * ```ts
 * const cell = getCell(cell);
 * console.log(cell);
 * ```
 */
export function getCell<Element extends GraphElement = GraphElement>(
  cell: dia.Cell<dia.Cell.Attributes>
): GraphCell<Element> {
  if (cell.isElement()) {
    return getElement<Element>(cell);
  }
  return getLink(cell);
}

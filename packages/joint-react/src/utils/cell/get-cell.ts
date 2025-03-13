import { type dia } from '@joint/core';
import type { GraphElement, GraphElementBase } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';

export interface Ports {
  readonly groups?: Record<string, dia.Element.PortGroup>;
  readonly items?: dia.Element.Port[];
}

export type Attributes = Omit<dia.Element.Attributes, 'size' | 'position'>;

export type GraphCell<Element extends GraphElementBase = GraphElement> = Element | GraphLink;

export function getElement<Element extends GraphElementBase = GraphElement>(
  cell: dia.Cell<Attributes>
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
export function getCell<Element extends GraphElementBase = GraphElement>(
  cell: dia.Cell<dia.Cell.Attributes>
): GraphCell<Element> {
  if (cell.isElement()) {
    return getElement<Element>(cell);
  }
  return getLink(cell);
}

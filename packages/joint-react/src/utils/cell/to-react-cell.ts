import type { dia } from '@joint/core';
import type { BaseElement, BaseLink } from '../../types/cell.types';

export function defaultElementSelector<Element>(cell: dia.Cell): Element {
  const position: dia.Point = cell.get('position');

  const { x, y } = position;

  const size: dia.Size = cell.get('size');
  return {
    id: cell.id,
    type: cell.get('type'),
    data: cell.attributes.data,
    x,
    y,
    angle: cell.get('angle'),
    height: size?.height,
    width: size?.width,
    ports: cell.get('ports'),
  } as unknown as Element;
}

export function defaultElementsSelector<Element = BaseElement, R = Element[]>(cell: dia.Cell[]): R {
  return cell.map(defaultElementSelector) as unknown as R;
}

export function toBaseElement<Element = BaseElement>(
  cells: dia.Cell,
  selector: (item: dia.Cell) => Element = defaultElementSelector
): Element {
  return selector(cells);
}

export function toBaseElements<Element = BaseElement>(
  cells: dia.Cell[],
  selector: (item: dia.Cell) => Element = defaultElementSelector
): Element[] {
  return cells.map(selector);
}

export function defaultLinkSelector<Link>(cell: dia.Cell): Link {
  return {
    id: cell.id,
    target: cell.get('target'),
    source: cell.get('source'),
  } as unknown as Link;
}

export function defaultLinksSelector<Link = BaseLink, R = Link[]>(cell: dia.Cell[]): R {
  return cell.map(defaultLinkSelector) as unknown as R;
}

export function toBaseLink<Link = BaseElement>(
  cells: dia.Cell,
  selector: (item: dia.Cell) => Link = defaultLinkSelector
): Link {
  return selector(cells);
}

export function toBaseLinks<Link = BaseLink>(
  cells: dia.Cell[],
  selector: (item: dia.Cell) => Link = defaultLinkSelector
): Link[] {
  return cells.map(selector);
}

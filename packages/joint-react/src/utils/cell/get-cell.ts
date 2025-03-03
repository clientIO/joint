import { type dia } from '@joint/core';
import { isRecord } from '../is';

export interface GraphElement<Data = undefined> extends dia.Element.Attributes {
  readonly id: dia.Cell.ID;
  readonly isElement: true;
  readonly isLink: false;
  readonly data: Data;
  readonly type: string;
}

export interface GraphLink extends dia.Link.EndJSON {
  readonly target: dia.Cell.ID;
  readonly source: dia.Cell.ID;
  readonly id: dia.Cell.ID;
  readonly isElement: false;
  readonly isLink: true;
  readonly type: string;
}

export type GraphCell<Data = undefined> = GraphElement<Data> | GraphLink;

export function isGraphCell<Data = undefined>(value: unknown): value is GraphCell<Data> {
  return isRecord(value) && 'isElement' in value && 'isLink' in value;
}

export function isGraphElement(value: unknown): value is GraphElement {
  return isGraphCell(value) && value.isElement;
}

export function isGraphLink(value: unknown): value is GraphLink {
  return isGraphCell(value) && value.isLink;
}

export function getElement<Data = undefined>(
  cell: dia.Cell<dia.Cell.Attributes, dia.ModelSetOptions>
): GraphElement<Data> {
  return {
    ...cell.attributes,
    id: cell.id,
    isElement: true,
    isLink: false,
    data: cell.attributes.data,
    type: cell.attributes.type,
  };
}

export function getLink(cell: dia.Cell<dia.Cell.Attributes, dia.ModelSetOptions>): GraphLink {
  return {
    ...cell.attributes,
    id: cell.id,
    isElement: false,
    isLink: true,
    source: cell.get('source') as dia.Cell.ID,
    target: cell.get('target') as dia.Cell.ID,
    type: cell.attributes.type,
  };
}
export function getCell<Data = undefined>(
  cell: dia.Cell<dia.Cell.Attributes, dia.ModelSetOptions>
): GraphCell<Data> {
  if (cell.isElement()) {
    return {
      ...cell.attributes,
      id: cell.id,
      isElement: true,
      isLink: false,
      data: cell.attributes.data,
      type: cell.attributes.type,
    };
  }
  return {
    ...cell.attributes,
    id: cell.id,
    isElement: false,
    isLink: true,
    source: cell.get('source') as dia.Cell.ID,
    target: cell.get('target') as dia.Cell.ID,
    type: cell.attributes.type,
  };
}

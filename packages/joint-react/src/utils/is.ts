import { dia, util } from '@joint/core';
import type { GraphCell } from './cell/get-cell';
import type { GraphLink } from '../types/link-types';
import type { GraphElement, GraphElementBase } from '../types/element-types';
import { ReactElement } from 'src/models/react-element';

export type Setter<Value> = (item: Value) => Value;

export function isSetter(value: unknown): value is Setter<unknown> {
  // check if value is a function and there is parameter
  return typeof value === 'function' && value.length === 1;
}

export function isDiaId(value: unknown): value is dia.Cell.ID {
  return util.isString(value) || util.isNumber(value);
}

export function isDefined<Value>(value: Value | undefined): value is Value {
  return value !== undefined;
}

export function isAttribute<Value>(value: unknown): value is keyof Value {
  return util.isString(value);
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return util.isObject(value);
}

export function isGraphCell<Element extends GraphElementBase = GraphElement>(
  value: unknown
): value is GraphCell<Element> {
  return isRecord(value) && 'isElement' in value && 'isLink' in value;
}

export function isGraphElement(value: unknown): value is GraphElement {
  return isGraphCell(value) && value.isElement;
}

export function isGraphLink(value: unknown): value is GraphLink {
  return isGraphCell(value) && value.isLink;
}

export function isLinkInstance(value: unknown): value is dia.Link {
  return value instanceof dia.Link;
}

export function isCellInstance(value: unknown): value is dia.Cell {
  return value instanceof dia.Cell;
}

export function isReactElement(value: unknown): value is dia.Cell {
  return value instanceof ReactElement;
}

export function isUnsized(width: number | undefined, height: number | undefined) {
  return width === undefined || height === undefined;
}

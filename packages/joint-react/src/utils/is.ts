import { util, type dia } from '@joint/core';
import type { GraphCell } from './cell/get-cell';
import type { GraphLink } from '../data/graph-links';
import type { GraphElement } from '../data/graph-elements';

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

export function isGraphCell<Data = unknown>(value: unknown): value is GraphCell<Data> {
  return isRecord(value) && 'isElement' in value && 'isLink' in value;
}

export function isGraphElement(value: unknown): value is GraphElement {
  return isGraphCell(value) && value.isElement;
}

export function isGraphLink(value: unknown): value is GraphLink {
  return isGraphCell(value) && value.isLink;
}

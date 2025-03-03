import { util, type dia } from '@joint/core';

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

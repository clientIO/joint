import { util, type dia } from '@joint/core'

export type Setter<T> = (item: T) => T

export function isSetter(value: unknown): value is Setter<unknown> {
  // check if value is a function and there is parameter
  return typeof value === 'function' && value.length === 1
}

export function isDiaId(value: unknown): value is dia.Cell.ID {
  return util.isString(value) || util.isNumber(value)
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

export function isAttribute<T>(value: unknown): value is keyof T {
  return util.isString(value)
}

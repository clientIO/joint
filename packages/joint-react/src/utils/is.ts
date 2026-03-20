/* eslint-disable jsdoc/require-jsdoc */
import { util } from '@joint/core';
import type { FunctionComponent, JSX } from 'react';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return util.isObject(value);
}

function hasChildren(props: Record<string, unknown>) {
  return 'children' in props;
}
export function isString(value: unknown): value is string {
  return util.isString(value);
}

export function isNumber(value: unknown): value is number {
  return util.isNumber(value);
}
export function isBoolean(value: unknown): value is boolean {
  return util.isBoolean(value);
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isReactComponentFunction(value: unknown): value is FunctionComponent {
  return typeof value === 'function';
}

export function isWithChildren(value: unknown): value is { children: JSX.Element[] } {
  return isRecord(value) && hasChildren(value);
}

export function isUpdater<T>(updater: ((previous: T) => T) | T): updater is (previous: T) => T {
  return typeof updater === 'function' && 'call' in updater;
}

export function isRef<T>(value: unknown): value is React.RefObject<T> {
  return isRecord(value) && 'current' in value;
}

/**
 * Returns `true` when both `width` and `height` are defined numbers in the given data.
 * When `false`, the element is considered auto-sized (size determined by `useMeasureNode`).
 * @param data - The element data record to check for width and height
 * @returns Whether both width and height are defined numbers
 */
export function hasDefinedSize(data: Record<string, unknown>): boolean {
  return isNumber(data.width) && isNumber(data.height);
}

export function hasProperty<T extends Record<string, unknown>>(
  object?: T,
  property?: string
): object is T {
  if (!object || !property) {
    return false;
  }
  return property in object;
}

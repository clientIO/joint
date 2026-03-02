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

/* eslint-disable jsdoc/require-jsdoc */
import { dia, util } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { FunctionComponent, JSX } from 'react';
import type { GraphLink } from '../types/link-types';

/**
 * Represents a cell in the graph (either element or link).
 */
export type GraphCell<Element extends GraphElement = GraphElement> = Element | GraphLink;

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

export function isGraphCell<Element extends GraphElement = GraphElement>(
  value: unknown
): value is GraphCell<Element> {
  return isRecord(value) && 'isElement' in value && 'isLink' in value;
}

export function isLinkInstance(value: unknown): value is dia.Link {
  return value instanceof dia.Link;
}

export function isCellInstance(value: unknown): value is dia.Cell {
  return value instanceof dia.Cell;
}

export function hasChildren(props: Record<string, unknown>) {
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

export function assertGraph<Graph extends dia.Graph>(graph?: Graph): asserts graph is Graph {
  if (!graph) {
    throw new Error('Graph instance is required');
  }
}

export function isUpdater<T>(updater: ((previous: T) => T) | T): updater is (previous: T) => T {
  return typeof updater === 'function' && 'call' in updater;
}

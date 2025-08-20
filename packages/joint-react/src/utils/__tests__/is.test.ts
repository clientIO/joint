/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable unicorn/no-useless-undefined */
import { dia } from '@joint/core';
import type { FunctionComponent, JSX } from 'react';
import * as is from '../is';

describe('is.ts utility functions', () => {
  test('isSetter', () => {
    expect(is.isSetter((x: number) => x + 1)).toBe(true);
    expect(is.isSetter(() => {})).toBe(false);
    expect(is.isSetter(123)).toBe(false);
  });

  test('isDiaId', () => {
    expect(is.isDiaId('cell-id')).toBe(true);
    expect(is.isDiaId(123)).toBe(true);
    expect(is.isDiaId({})).toBe(false);
  });

  test('isDefined', () => {
    expect(is.isDefined(0)).toBe(true);
    expect(is.isDefined(undefined)).toBe(false);
    expect(is.isDefined(null)).toBe(true);
  });

  test('isAttribute', () => {
    expect(is.isAttribute<{ foo: string }>('foo')).toBe(true);
    expect(is.isAttribute<{ foo: string }>(123)).toBe(false);
  });

  test('isRecord', () => {
    expect(is.isRecord({})).toBe(true);
    expect(is.isRecord([])).toBe(true);
    expect(is.isRecord('str')).toBe(false);
    expect(is.isRecord(null)).toBe(false);
  });

  test('isGraphCell', () => {
    const cell = { isElement: true, isLink: false };
    expect(is.isGraphCell(cell)).toBe(true);
    expect(is.isGraphCell({})).toBe(false);
    expect(is.isGraphCell(null)).toBe(false);
  });

  test('isLinkInstance', () => {
    const link = new dia.Link();
    expect(is.isLinkInstance(link)).toBe(true);
    expect(is.isLinkInstance({})).toBe(false);
  });

  test('isCellInstance', () => {
    const cell = new dia.Cell();
    expect(is.isCellInstance(cell)).toBe(true);
    expect(is.isCellInstance({})).toBe(false);
  });

  test('isUnsized', () => {
    expect(is.isUnsized(undefined, 10)).toBe(true);
    expect(is.isUnsized(10, undefined)).toBe(true);
    expect(is.isUnsized(10, 10)).toBe(false);
  });

  test('hasChildren', () => {
    expect(is.hasChildren({ children: [] })).toBe(true);
    expect(is.hasChildren({})).toBe(false);
  });

  test('isString', () => {
    expect(is.isString('abc')).toBe(true);
    expect(is.isString(123)).toBe(false);
  });

  test('isNumber', () => {
    expect(is.isNumber(123)).toBe(true);
    expect(is.isNumber('abc')).toBe(false);
  });

  test('isBoolean', () => {
    expect(is.isBoolean(true)).toBe(true);
    expect(is.isBoolean(false)).toBe(true);
    expect(is.isBoolean('true')).toBe(false);
  });

  test('isNull', () => {
    expect(is.isNull(null)).toBe(true);
    expect(is.isNull(undefined)).toBe(false);
    expect(is.isNull(0)).toBe(false);
  });

  test('isReactComponentFunction', () => {
    const Comp: FunctionComponent = () => null;
    expect(is.isReactComponentFunction(Comp)).toBe(true);
    expect(is.isReactComponentFunction({})).toBe(false);
  });

  test('isWithChildren', () => {
    const fakeJSX: JSX.Element = {} as JSX.Element;
    expect(is.isWithChildren({ children: [fakeJSX] })).toBe(true);
    expect(is.isWithChildren({})).toBe(false);
  });
});

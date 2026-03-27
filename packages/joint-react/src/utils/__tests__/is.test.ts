/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable unicorn/no-useless-undefined */
import type { FunctionComponent, JSX } from 'react';
import * as is from '../is';

describe('is.ts utility functions', () => {
  test('isRecord', () => {
    expect(is.isRecord({})).toBe(true);
    expect(is.isRecord([])).toBe(true);
    expect(is.isRecord('str')).toBe(false);
    expect(is.isRecord(null)).toBe(false);
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

  describe('hasDefinedSize', () => {
    test('returns true when both width and height are numbers', () => {
      expect(is.hasDefinedSize({ width: 100, height: 50 })).toBe(true);
      expect(is.hasDefinedSize({ width: 0, height: 0 })).toBe(true);
    });

    test('returns false when width is undefined', () => {
      expect(is.hasDefinedSize({ height: 50 })).toBe(false);
      expect(is.hasDefinedSize({ width: undefined, height: 50 })).toBe(false);
    });

    test('returns false when height is undefined', () => {
      expect(is.hasDefinedSize({ width: 100 })).toBe(false);
      expect(is.hasDefinedSize({ width: 100, height: undefined })).toBe(false);
    });

    test('returns false when both are undefined', () => {
      expect(is.hasDefinedSize({})).toBe(false);
    });

    test('returns false for non-number values', () => {
      expect(is.hasDefinedSize({ width: '100', height: 50 })).toBe(false);
      expect(is.hasDefinedSize({ width: null, height: 50 })).toBe(false);
    });

    test('works with generic user data containing extra properties', () => {
      expect(is.hasDefinedSize({ x: 0, y: 0, width: 100, height: 50, label: 'test' })).toBe(true);
      expect(is.hasDefinedSize({ x: 0, y: 0, label: 'test' })).toBe(false);
    });
  });
});

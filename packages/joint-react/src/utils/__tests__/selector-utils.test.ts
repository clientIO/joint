import {
  identitySelector,
  isShallowEqual,
  isSizeEqual,
  isPositionEqual,
  isStrictEqual,
} from '../selector-utils';

describe('selector-utils', () => {
  describe('identitySelector', () => {
    it('returns the same value', () => {
      const value = { foo: 1 };
      expect(identitySelector(value)).toBe(value);
      expect(identitySelector(42)).toBe(42);
    });
  });

  describe('isStrictEqual', () => {
    it('is Object.is', () => {
      expect(isStrictEqual).toBe(Object.is);
    });
  });

  describe('isShallowEqual', () => {
    it('returns true for same reference', () => {
      const value = { a: 1 };
      expect(isShallowEqual(value, value)).toBe(true);
    });

    it('returns false when first is undefined', () => {
      expect(isShallowEqual(undefined, { a: 1 })).toBe(false);
    });

    it('returns false when second is undefined', () => {
      const noObject: undefined = undefined;
      expect(isShallowEqual({ a: 1 }, noObject)).toBe(false);
    });

    it('returns true when both are undefined (same reference)', () => {
      const noObject: undefined = undefined;
      expect(isShallowEqual(noObject, noObject)).toBe(true);
    });

    it('returns false when keys differ in length', () => {
      expect(isShallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('returns false when a value differs', () => {
      expect(isShallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    });

    it('returns true for objects with the same keys/values', () => {
      expect(isShallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });
  });

  describe('isSizeEqual', () => {
    it('returns true for same reference (including undefined)', () => {
      expect(isSizeEqual()).toBe(true);
      const size = { width: 1, height: 2 };
      expect(isSizeEqual(size, size)).toBe(true);
    });

    it('returns false when only one is defined', () => {
      expect(isSizeEqual({ width: 1, height: 2 })).toBe(false);
      expect(isSizeEqual(undefined, { width: 1, height: 2 })).toBe(false);
    });

    it('returns true when width and height match', () => {
      expect(isSizeEqual({ width: 3, height: 4 }, { width: 3, height: 4 })).toBe(true);
    });

    it('returns false when width or height differs', () => {
      expect(isSizeEqual({ width: 3, height: 4 }, { width: 5, height: 4 })).toBe(false);
      expect(isSizeEqual({ width: 3, height: 4 }, { width: 3, height: 5 })).toBe(false);
    });
  });

  describe('isPositionEqual', () => {
    it('returns true for same reference (including undefined)', () => {
      expect(isPositionEqual()).toBe(true);
      const position = { x: 1, y: 2 };
      expect(isPositionEqual(position, position)).toBe(true);
    });

    it('returns false when only one is defined', () => {
      expect(isPositionEqual({ x: 1, y: 2 })).toBe(false);
      expect(isPositionEqual(undefined, { x: 1, y: 2 })).toBe(false);
    });

    it('returns true when x and y match', () => {
      expect(isPositionEqual({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(true);
    });

    it('returns false when x or y differs', () => {
      expect(isPositionEqual({ x: 3, y: 4 }, { x: 5, y: 4 })).toBe(false);
      expect(isPositionEqual({ x: 3, y: 4 }, { x: 3, y: 5 })).toBe(false);
    });
  });
});

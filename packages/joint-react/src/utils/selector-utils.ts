import type { ElementPosition, ElementSize } from '../types/cell-data';

// eslint-disable-next-line unicorn/prevent-abbreviations
export const isStrictEqual = Object.is;
export const identitySelector = <T>(item: T) => item;

/**
 * Shallow-compares two objects by their own enumerable keys.
 * Returns true if both have the same keys with strictly equal values.
 */
export function isShallowEqual(
  a: object | undefined,
  b: object | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }
  return true;
}

export function isSizeEqual(a?: ElementSize, b?: ElementSize): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.width === b.width && a.height === b.height;
}

export function isPositionEqual(a?: ElementPosition, b?: ElementPosition): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
}

import type { ElementPosition, ElementSize } from '../types/cell.types';

 
export const isStrictEqual = Object.is;
export const identitySelector = <T>(item: T) => item;

/**
 * Shallow-compares two objects by their own enumerable keys.
 * Returns true if both have the same keys with strictly equal values.
 * @param a
 * @param b
 */
export function isShallowEqual(
  a: object | undefined,
  b: object | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const objectA = a as Record<string, unknown>;
  const objectB = b as Record<string, unknown>;
  const keysA = Object.keys(objectA);
  const keysB = Object.keys(objectB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (objectA[key] !== objectB[key]) return false;
  }
  return true;
}

/**
 * Returns true when both sizes have the same width and height.
 * @param a
 * @param b
 */
export function isSizeEqual(a?: ElementSize, b?: ElementSize): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.width === b.width && a.height === b.height;
}

/**
 * Returns true when both positions have the same x and y.
 * @param a
 * @param b
 */
export function isPositionEqual(a?: ElementPosition, b?: ElementPosition): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
}

/**
 * Shallow-compare two readonly arrays by length and element identity (`===`).
 * @param a - first array
 * @param b - second array
 * @returns true when both arrays have the same length and the same element refs
 */
export function areArraysShallowEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (const [index, value] of a.entries()) {
    if (value !== b[index]) return false;
  }
  return true;
}

/**
 * Shallow equality with an array-aware fallthrough: when both inputs are
 * arrays, compare them shallowly by length and element identity; otherwise
 * fall back to `Object.is`.
 * @param a - previous result
 * @param b - next result
 * @returns true when both inputs are equal under shallow array or `Object.is`
 */
export function arrayAwareEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return areArraysShallowEqual(a, b);
  }
  return Object.is(a, b);
}

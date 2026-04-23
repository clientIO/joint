import type { ElementPosition, ElementSize } from '../types/cell-data';

 
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

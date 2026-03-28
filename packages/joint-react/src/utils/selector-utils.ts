import type { ElementPosition, ElementSize } from '../types/cell-data';

// eslint-disable-next-line unicorn/prevent-abbreviations
export const isStrictEqual = Object.is;
export const identitySelector = <T>(item: T) => item;

/**
 * Shallow-compares two objects by their own enumerable keys.
 * Returns true if both have the same keys with strictly equal values.
 */
export function isShallowEqual(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function isSizeEqual(a?: ElementSize, b?: ElementSize): boolean {
  return isShallowEqual(a as Record<string, unknown>, b as Record<string, unknown>);
}

export function isPositionEqual(a?: ElementPosition, b?: ElementPosition): boolean {
  return isShallowEqual(a as Record<string, unknown>, b as Record<string, unknown>);
}

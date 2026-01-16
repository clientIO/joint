import { util } from '@joint/core';
import type { GraphElement } from '../types/element-types';

/**
 * Fast equality check for arrays of graph elements.
 * Optimized for position-only updates by checking IDs first, then only comparing changed elements.
 * @template T - The type of elements (must have an id property)
 * @param a - First array to compare
 * @param b - Second array to compare
 * @param compareFunction - Optional deep comparison function. Defaults to util.isEqual
 * @returns True if arrays are equal, false otherwise
 */
export function fastElementArrayEqual<T extends GraphElement>(
  a: T[],
  b: T[],
  compareFunction: (a: T, b: T) => boolean = util.isEqual
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  if (a === b) {
    return true;
  }

  // Fast path: check IDs first (O(n) instead of O(n²) deep comparison)
  for (const [index, element] of a.entries()) {
    if (element.id !== b[index].id) {
      return false;
    }
  }

  // Only deep compare if IDs match (most common case: only positions changed)
  for (const [index, element] of a.entries()) {
    if (!compareFunction(element, b[index])) {
      return false;
    }
  }
  return true;
}

/**
 * Extracts all properties except x and y from an element.
 * @param element - The element to extract properties from
 * @returns Record of properties excluding x and y
 */
function extractNonPositionProperties(element: GraphElement): Record<string, unknown> {
  const rest: Record<string, unknown> = {};
  for (const key in element) {
    if (key !== 'x' && key !== 'y') {
      rest[key] = element[key as keyof GraphElement];
    }
  }
  return rest;
}

/**
 * Checks if an update only changed element positions (x, y) without changing other properties.
 * This is a fast path optimization for position-only updates.
 * @param previous - Previous array of elements
 * @param next - Next array of elements
 * @returns True if only positions changed, false otherwise
 */
export function isPositionOnlyUpdate(previous: GraphElement[], next: GraphElement[]): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  for (const [index, previousElement] of previous.entries()) {
    const nextElement = next[index];

    // Check IDs match
    if (previousElement.id !== nextElement.id) {
      return false;
    }

    // Check if position changed
    const positionChanged =
      previousElement.x !== nextElement.x || previousElement.y !== nextElement.y;

    if (!positionChanged) {
      continue;
    }

    // Position changed - check if other properties are unchanged
    const previousRest = extractNonPositionProperties(previousElement);
    const nextRest = extractNonPositionProperties(nextElement);

    // If other properties changed, this is not a position-only update
    if (!util.isEqual(previousRest, nextRest)) {
      return false;
    }
  }

  return true;
}

/**
 * Shallow equality check for arrays.
 * Only compares array length and reference equality of elements.
 * @template T - The type of array elements
 * @param a - First array to compare
 * @param b - Second array to compare
 * @returns True if arrays are shallowly equal, false otherwise
 */
export function shallowArrayEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  if (a === b) {
    return true;
  }
  for (const [index, element] of a.entries()) {
    if (element !== b[index]) {
      return false;
    }
  }
  return true;
}

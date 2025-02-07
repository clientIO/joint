import { dia } from '@joint/core'

/**
 * Checks if a value is strictly an object (not null, not an array).
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
  )
}

/**
 * Checks if a value is an array.
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Performs a shallow comparison between two values, assuming
 * both are plain objects. Returns true if they have:
 * - The same set of keys
 * - The same values for each key (using strict equality)
 * Otherwise returns false.
 */
function shallowObjectEqual(a: unknown, b: unknown): boolean {
  // Quick reference check
  if (a === b) {
    return true
  }

  // Both must be non-null objects, and not arrays, or else fail
  if (!isObject(a) || !isObject(b)) {
    return false
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  // Different number of keys => not equal
  if (aKeys.length !== bKeys.length) {
    return false
  }

  // Check each key’s value for strict equality
  for (const key of aKeys) {
    // If b doesn't have the same key, fail
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false
    }

    if (!elementsEqual(a[key], b[key])) {
      return false
    }
  }

  return true
}

function elementsEqual(elementA: unknown, elementB: unknown): boolean {
  if (isObject(elementA) && isObject(elementB)) {
    return shallowObjectEqual(elementA, elementB)
  }

  if (isArray(elementA) && isArray(elementB)) {
    return shallowArrayEqual(elementA, elementB)
  }

  if (elementA instanceof Date && elementB instanceof Date) {
    return elementA.getTime() === elementB.getTime()
  }

  return elementA === elementB
}

function shallowArrayEqual(a: unknown[], b: unknown[]): boolean {
  // Quick reference check
  if (a === b) {
    return true
  }

  // Both must be arrays, or else fail
  if (!isArray(a) || !isArray(b)) {
    return false
  }

  // Different number of keys => not equal
  if (a.length !== b.length) {
    return false
  }

  // Check each key’s value for strict equality
  for (const [index, elementA] of a.entries()) {
    const elementB = b[index]

    if (!elementsEqual(elementA, elementB)) {
      return false
    }
  }

  return true
}

export function shallow<A, B>(a: A, b: B): boolean {
  if (a instanceof dia.Cell && b instanceof dia.Cell) {
    return shallowObjectEqual(a, b)
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }
  if (isObject(a) && isObject(b)) {
    return shallowObjectEqual(a, b)
  }
  if (isArray(a) && isArray(b)) {
    return shallowArrayEqual(a, b)
  }
  return (a as unknown) === (b as unknown)
}

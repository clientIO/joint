/* eslint-disable @typescript-eslint/no-explicit-any */

import { util } from '@joint/core';

/**
 * Make options and avoid to generate undefined values.
 * @param options - An object containing options where keys are strings and values can be of any type.
 * @returns - A new object with the same properties as the input options, but without any properties that have undefined
 * @example
 * ```ts
 * import { makeOptions } from '@joint/react';
 *
 * const options = makeOptions({
 *   width: 100,
 *   height: 50,
 *   color: undefined, // This will be removed
 * });
 * // Result: { width: 100, height: 50 }
 * ```
 */
export function makeOptions<T extends Record<string, any>>(options: T): T {
  const result: T = {} as T;
  for (const key in options) {
    if (options[key] !== undefined) {
      result[key] = options[key];
    }
  }
  return result;
}

/**
 * Assign new properties to an instance, ignoring undefined values.
 * @param props - The instance to which new properties will be assigned.
 * @param newProps - An object containing new properties to assign to the instance.
 * @returns - The updated instance with the new properties assigned, excluding any properties that were undefined.
 * @example
 * ```ts
 * import { assignOptions } from '@joint/react';
 *
 * const props = { width: 100, height: 50 };
 * const updated = assignOptions(props, {
 *   width: 200,
 *   color: undefined, // This will be ignored
 * });
 * // Result: { width: 200, height: 50 }
 * ```
 */
export function assignOptions<T extends Record<string, any>>(props: T, newProps: Partial<T>): T {
  for (const key in newProps) {
    // in jointjs settings property as undefined make it as property. So we avoid to set undefined at all.
    if (newProps[key] === undefined) {
      continue;
    }
    // now we have to check if the properties are equal, if not we assign the new value with fast ref path
    if (props[key] === newProps[key]) {
      continue;
    }
    // now we check same as well for objects and shallow objects
    if (util.isEqual(props[key], newProps[key])) {
      continue;
    }
    props[key] = newProps[key] as T[Extract<keyof T, string>];
  }
  return props;
}

/**
 *  Extracts the values of specified keys from an object and returns them as an array.
 * @param object - The source object from which to extract values.
 * @param picked - An array of keys whose corresponding values need to be extracted from the object.
 * @returns - An array containing the values associated with the specified keys in the same order as the keys array.
 * @example
 * ```ts
 * import { dependencyExtract } from '@joint/react';
 *
 * const obj = { width: 100, height: 50, color: 'red' };
 * const values = dependencyExtract(obj, new Set(['width', 'height']));
 * // Result: [100, 50]
 * ```
 */
export function dependencyExtract<T extends Record<string, any>, K extends keyof T = keyof T>(
  object: T,
  picked?: Set<K>
): unknown[] {
  if (!object) return [];

  const allKeys = Object.keys(object) as K[];

  // Fast path: no Set → return all values
  if (!picked) {
    const { length } = allKeys;
    const result = Array.from({ length });
    for (let index = 0; index < length; index++) {
      result[index] = object[allKeys[index]];
    }
    return result;
  }

  // Filter by Set membership (O(1) lookup per key)
  const result: Array<T[K]> = [];
  for (const key of allKeys) {
    if (picked.has(key)) {
      result.push(object[key]);
    }
  }
  return result;
}

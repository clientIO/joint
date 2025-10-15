/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Make options and avoid to generate undefined values.
 * @param options - An object containing options where keys are strings and values can be of any type.
 * @returns - A new object with the same properties as the input options, but without any properties that have undefined
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
 * @param instance - The instance to which new properties will be assigned.
 * @param newProperties - An object containing new properties to assign to the instance.
 * @returns - The updated instance with the new properties assigned, excluding any properties that were undefined.
 */
export function assignOptions<T extends Record<string, any>>(
  instance: T,
  newProperties: Partial<T>
): T {
  for (const key in newProperties) {
    if (newProperties[key] !== undefined) {
      instance[key] = newProperties[key] as T[Extract<keyof T, string>];
    }
  }
  return instance;
}

/**
 *  Extracts the values of specified keys from an object and returns them as an array.
 * @param object - The source object from which to extract values.
 * @param picked - An array of keys whose corresponding values need to be extracted from the object.
 * @returns - An array containing the values associated with the specified keys in the same order as the keys array.
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

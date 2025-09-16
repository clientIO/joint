/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Make options and avoid to generate undefined values.
 * @param options - An object containing options where keys are strings and values can be of any type.
 * @returns - A new object with the same properties as the input options, but without any properties that have undefined
 */
export function makeOptions<T extends Record<string, any>>(options: T): T {
  const result: T = {} as T;
  // We must avoid
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
 * @param keys - An array of keys whose corresponding values need to be extracted from the object.
 * @returns - An array containing the values associated with the specified keys in the same order as the keys array.
 */
export function dependencyExtract<
  T extends Record<string, any>,
  PickedKeys extends keyof T = keyof T,
>(object: T, keys?: PickedKeys[]): Array<T[PickedKeys]> {
  if (!keys) {
    const allKeys = Object.keys(object) as PickedKeys[];
    return allKeys.map((key) => object[key]);
  }
  return keys.map((key) => object[key]);
}

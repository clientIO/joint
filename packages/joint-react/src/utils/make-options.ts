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

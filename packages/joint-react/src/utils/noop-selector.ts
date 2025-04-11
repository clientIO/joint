/**
 * Application selector that does nothing.
 * @param value - The value to return.
 * @returns The value passed as an argument.
 * @group Utils
 */
export function noopSelector<T>(value: T): T {
  return value;
}

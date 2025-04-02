/**
 * Just returns the value passed to it with correct typing.
 */
export function noopSelector<T>(value: T): T {
  return value;
}

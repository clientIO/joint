import { useElement } from './use-element';

const EMPTY_DATA = {};

/**
 * Returns the user data for the current element.
 * Must be used inside `renderElement` or a component rendered within it.
 * Only re-renders when the element's `data` field reference changes.
 * @returns The user data `D` for the current element.
 * @group Hooks
 */
export function useElementData<D extends object | undefined = undefined>(): D {
  return useElement((element) => element.data ?? EMPTY_DATA) as D;
}

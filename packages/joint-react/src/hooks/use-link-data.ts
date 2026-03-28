import { useLink } from './use-link';

const EMPTY_DATA = {};

/**
 * Returns the user data for the current link.
 * Must be used inside `renderLink` or a component rendered within it.
 * Only re-renders when the link's `data` field reference changes.
 * @returns The user data `D` for the current link.
 * @group Hooks
 */
export function useLinkData<D extends object | undefined = undefined>(): D {
  return useLink((l) => l.data ?? EMPTY_DATA) as D;
}

import { useRef } from 'react';

/**
 * Custom hook to memoize a value returned by a callback function.
 * @param callback - A function that returns a value to be memoized.
 * @returns The memoized value.
 * @group Hooks
 * @description
 * This hook is used to memoize a value returned by a callback function.
 * @internal
 */
export function useCallbackValue<T>(callback: () => T): T {
  const graphStoreRef = useRef<T>(null);
  if (!graphStoreRef.current) {
    graphStoreRef.current = callback();
  }
  return graphStoreRef.current;
}

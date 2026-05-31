import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * `useLayoutEffect` logs a warning during server rendering ("useLayoutEffect
 * does nothing on the server") because layout effects never run there. This
 * alias swaps to `useEffect` when there is no DOM, silencing the warning while
 * preserving synchronous, pre-paint timing in the browser.
 */
export const useIsomorphicLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;

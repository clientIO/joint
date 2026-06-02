import { useEffect, useLayoutEffect } from 'react';
import { isServerEnvironment } from '../utils/ssr';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * `useLayoutEffect` logs a warning during server rendering ("useLayoutEffect
 * does nothing on the server") because layout effects never run there. This
 * alias swaps to `useEffect` on the server (including when the DOM shim has
 * installed a headless `document`), silencing the warning while preserving
 * synchronous, pre-paint timing in the browser.
 */
export const useIsomorphicLayoutEffect = isServerEnvironment() ? useEffect : useLayoutEffect;

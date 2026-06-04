/**
 * Shared primitives for the SVG-geometry polyfills: the structural window shape,
 * the SVG namespace constant, and a typed prototype reader. Split out so the
 * polyfill modules (`svg-text-bbox`, `svg-element-proxies`, `svg-polyfills`) share
 * one definition without a circular dependency.
 */

/** Structural shape of the DOM window the polyfills patch. */
export interface PolyfillWindow {
  document: Document;
  [key: string]: unknown;
}

export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

interface PrototypeHolder {
  prototype: Record<string, unknown>;
}

/**
 * Reads a constructor's prototype from a window without `any`.
 * @param window - the DOM window to read the constructor from.
 * @param constructorName - the global constructor name (e.g. `'SVGElement'`).
 * @returns the constructor's prototype, or `undefined` when absent.
 */
export function getPrototype(
  window: PolyfillWindow,
  constructorName: string
): Record<string, unknown> | undefined {
  const constructor = window[constructorName] as PrototypeHolder | undefined;
  return constructor?.prototype;
}

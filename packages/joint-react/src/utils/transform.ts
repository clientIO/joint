import { V } from '@joint/core';

/**
 * Convert a CSS transform string or `DOMMatrix` to the `SVGMatrix` form.
 * Strings are parsed via the native `DOMMatrix` constructor; `DOMMatrix`
 * instances pass through `V.createSVGMatrix` for legacy-Safari interop
 * where `DOMMatrix !== SVGMatrix` at runtime.
 * @param value - CSS transform string or `DOMMatrix`
 * @returns `SVGMatrix`
 */
export function toSVGMatrix(value: string | DOMMatrix): SVGMatrix {
  const domMatrix = typeof value === 'string' ? new DOMMatrix(value) : value;
  return V.createSVGMatrix(domMatrix);
}

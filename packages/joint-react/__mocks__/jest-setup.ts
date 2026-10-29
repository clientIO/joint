// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
// Installs the SVG globals JSDOM does not implement but JointJS relies on.
// Note: it mocks `checkVisibility()` on SVG elements only (an empty `getBBox()`
// reads as not rendered); HTML elements have none in JSDOM.
import '@joint/mock-svg';

configure({ reactStrictMode: true });

// Mocks
// -----

/**
 * @description Minimal DOMMatrix polyfill — JSDOM doesn't ship it, and
 * `@joint/mock-svg` does not mock it.
 * Always returns the identity matrix. Tests don't validate transform math;
 * they only need the constructor to not throw and produce a/b/c/d/e/f
 * fields readable by `V.createSVGMatrix`.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix
 */
class MockDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
}
Object.defineProperty(globalThis, 'DOMMatrix', {
  writable: true,
  value: MockDOMMatrix,
});

// `@joint/mock-svg` installs its mocks once per test file. Tests that drive
// their own `ResizeObserver` replace the global, so restore the library one
// before every test to keep each test isolated from the previous one.
const { ResizeObserver: MockResizeObserver } = globalThis;
beforeEach(() => {
  globalThis.ResizeObserver = MockResizeObserver;
});

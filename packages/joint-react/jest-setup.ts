/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable @typescript-eslint/no-require-imports */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock method which is not implemented in JSDOM
globalThis.SVGPathElement = jest.fn();

// Mock SVGAngle which is used for sanity checks in Vectorizer library
Object.defineProperty(globalThis, 'SVGAngle', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    new: jest.fn(),
    prototype: jest.fn(),
    SVG_ANGLETYPE_UNKNOWN: 0,
    SVG_ANGLETYPE_UNSPECIFIED: 1,
    SVG_ANGLETYPE_DEG: 2,
    SVG_ANGLETYPE_RAD: 3,
    SVG_ANGLETYPE_GRAD: 4,
  })),
});

beforeEach(() => {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })),
  });

  Object.defineProperty(globalThis.SVGElement.prototype, 'getComputedTextLength', {
    writable: true,
    value: jest.fn().mockImplementation(() => 200),
  });

  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      martix: jest.fn(() => [[]]),
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
      flipX: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      flipY: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      inverse: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      multiply: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      rotate: jest.fn().mockImplementation(() => ({
        translate: jest.fn().mockImplementation(() => ({
          rotate: jest.fn(),
        })),
      })),
      rotateFromVector: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      scale: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      scaleNonUniform: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      skewX: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      skewY: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
      translate: jest.fn().mockImplementation(() => ({
        multiply: jest.fn().mockImplementation(() => ({
          multiply: jest.fn().mockImplementation(() => globalThis.SVGSVGElement),
        })),
      })),
    })),
  });

  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      matrixTransform: jest.fn().mockImplementation(() => ({
        x: 0,
        y: 0,
      })),
    })),
  });

  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      angle: 0,
      matrix: {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
        multiply: jest.fn(),
      },
      setMatrix: jest.fn(),
      setTranslate: jest.fn(),
    })),
  });
});

jest.mock('@joint/core', () => {
  const actual = require('@joint/core/build/joint');
  return actual;
});

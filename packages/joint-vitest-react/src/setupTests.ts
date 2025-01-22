import { beforeEach, vi } from 'vitest';

// Mock method which is not implemented in JSDOM
globalThis.SVGPathElement = vi.fn();

// Mock SVGAngle which is used for sanity checks in Vectorizer library
Object.defineProperty(globalThis, 'SVGAngle', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
      new: vi.fn(),
      prototype: vi.fn(),
      SVG_ANGLETYPE_UNKNOWN: 0,
      SVG_ANGLETYPE_UNSPECIFIED: 1,
      SVG_ANGLETYPE_DEG: 2,
      SVG_ANGLETYPE_RAD: 3,
      SVG_ANGLETYPE_GRAD: 4
  }))
});

beforeEach(()=>{

  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matrix: vi.fn(() => [[]]),
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0,
      flipX: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      flipY: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      inverse: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      multiply: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      rotate: vi.fn().mockImplementation(() => ({
        translate: vi.fn().mockImplementation(() => ({
          rotate: vi.fn(),
        })),
      })),
      rotateFromVector: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      scale: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      scaleNonUniform: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      skewX: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      skewY: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
      translate: vi.fn().mockImplementation(() => ({
        multiply: vi.fn().mockImplementation(() => ({
          multiply: vi.fn().mockImplementation(() => globalThis.SVGSVGElement),
        })),
      })),
    })),
  });

  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      matrixTransform: vi.fn().mockImplementation(() => ({
        x: 0,
        y: 0,
      })),
    })),
  });

  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      angle: 0,
      matrix: {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
        multiply: vi.fn(),
      },
      setMatrix: vi.fn(),
      setTranslate: vi.fn(),
    })),
  });

});

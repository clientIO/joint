import { vi } from 'vitest';

// Mock method which is not implemented in JSDOM

/**
 * @type {jest.Mocked<SVGPathElement>}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement
 */

globalThis.SVGPathElement = vi.fn();

/**
 * @type {jest.Mocked<ResizeObserver>}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

/**
 * @type {jest.Mocked<SVGAngle>}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */

Object.defineProperty(globalThis, 'SVGAngle', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGAngle),
});

const SVGAngle = ({
    SVG_ANGLETYPE_UNKNOWN: 0,
    SVG_ANGLETYPE_UNSPECIFIED: 1,
    SVG_ANGLETYPE_DEG: 2,
    SVG_ANGLETYPE_RAD: 3,
    SVG_ANGLETYPE_GRAD: 4,
});

/**
 * @type {jest.Mocked<SVGMatrix>}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix
 * @description SVGMatrix is deprecated, use DOMMatrix instead
 */

Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGMatrix),
});

const SVGMatrix = ({
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0,
    flipX: vi.fn().mockImplementation(() => SVGMatrix),
    flipY: vi.fn().mockImplementation(() => SVGMatrix),
    inverse: vi.fn().mockImplementation(() => SVGMatrix),
    multiply: vi.fn().mockImplementation(() => SVGMatrix),
    rotate: vi.fn().mockImplementation(() => SVGMatrix),
    rotateFromVector: vi.fn().mockImplementation(() => SVGMatrix),
    scale: vi.fn().mockImplementation(() => SVGMatrix),
    scaleNonUniform: vi.fn().mockImplementation(() => SVGMatrix),
    skewX: vi.fn().mockImplementation(() => SVGMatrix),
    skewY: vi.fn().mockImplementation(() => SVGMatrix),
    translate: vi.fn().mockImplementation(() => SVGMatrix),
});

/**
 * @type {jest.Mocked<SVGTransform>}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
 */

Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGTransform),
});

const SVGTransform = ({
    type: 0,
    angle: 0,
    matrix: SVGMatrix,
    SVG_TRANSFORM_UNKNOWN: 0,
    SVG_TRANSFORM_MATRIX: 1,
    SVG_TRANSFORM_TRANSLATE: 2,
    SVG_TRANSFORM_SCALE: 3,
    SVG_TRANSFORM_ROTATE: 4,
    SVG_TRANSFORM_SKEWX: 5,
    SVG_TRANSFORM_SKEWY: 6,
    setMatrix: vi.fn(),
    setRotate: vi.fn(),
    setScale: vi.fn(),
    setSkewX: vi.fn(),
    setSkewY: vi.fn(),
    setTranslate: vi.fn(),
});

/**
 * @type {jest.Mocked<SVGPoint>}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 * @description SVGPoint is deprecated, use DOMPoint instead
 */

Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGPoint),
});

const SVGPoint = ({
    x: 0,
    y: 0,
    matrixTransform: vi.fn().mockImplementation(() => SVGPoint),
});

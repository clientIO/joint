import { vi } from 'vitest';

// Mocks
// -----

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement
 */
globalThis.SVGPathElement = vi.fn();

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */
Object.defineProperty(globalThis, 'SVGAngle', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGAngle),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/createSVGMatrix
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGMatrix),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGTransform),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGPoint),
});

/**
 * @description used in `util.breakText()` method
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTextContentElement/getComputedTextLength
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getComputedTextLength', {
    writable: true,
    value: vi.fn().mockImplementation(() => 0),
});

/**
 * @description used in `util.breakText()` method
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGRect)
});

// Interfaces
// ----------

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */
const SVGAngle = ({
    SVG_ANGLETYPE_UNKNOWN: 0,
    SVG_ANGLETYPE_UNSPECIFIED: 1,
    SVG_ANGLETYPE_DEG: 2,
    SVG_ANGLETYPE_RAD: 3,
    SVG_ANGLETYPE_GRAD: 4,
});

/**
 * @description SVGMatrix is deprecated, we should use DOMMatrix instead
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix
 */
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
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
 */
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
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
const SVGPoint = ({
    x: 0,
    y: 0,
    matrixTransform: vi.fn().mockImplementation(() => SVGPoint),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGRect
 */
const SVGRect = ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
});

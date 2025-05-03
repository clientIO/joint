import { vi } from 'vitest';

// Interfaces
// ----------

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */
const createSVGAngle = () => ({
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
const createSVGMatrix = () => ({
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0,
    flipX: vi.fn().mockImplementation(createSVGMatrix),
    flipY: vi.fn().mockImplementation(createSVGMatrix),
    inverse: vi.fn().mockImplementation(createSVGMatrix),
    multiply: vi.fn().mockImplementation(createSVGMatrix),
    rotate: vi.fn().mockImplementation(createSVGMatrix),
    rotateFromVector: vi.fn().mockImplementation(createSVGMatrix),
    scale: vi.fn().mockImplementation(createSVGMatrix),
    scaleNonUniform: vi.fn().mockImplementation(createSVGMatrix),
    skewX: vi.fn().mockImplementation(createSVGMatrix),
    skewY: vi.fn().mockImplementation(createSVGMatrix),
    translate: vi.fn().mockImplementation(createSVGMatrix),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
 */
const createSVGTransform = () => ({
    type: 0,
    angle: 0,
    matrix: createSVGMatrix(),
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
 * @description SVGPoint is deprecated, we should use DOMPoint instead
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
const createSVGPoint = () => ({
    x: 0,
    y: 0,
    matrixTransform: vi.fn().mockImplementation(createSVGPoint),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGRect
 */
const createSVGRect = () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
});

// Mocks
// -----

/**
 * @description Mock method which is not implemented in JSDOM
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement
 */
globalThis.SVGPathElement = vi.fn();

/**
 * @description Mock SVGAngle which is used for sanity checks in Vectorizer library
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */
Object.defineProperty(globalThis, 'SVGAngle', {
    writable: true,
    value: vi.fn().mockImplementation(createSVGAngle),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/createSVGMatrix
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: vi.fn().mockImplementation(createSVGMatrix),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: vi.fn().mockImplementation(createSVGTransform),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: vi.fn().mockImplementation(createSVGPoint),
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
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
 * Note: JSDOM SVGGraphicsElement does not encompass all SVG elements that might be needed,
 * whereas SVGElement provides broader compatibility.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getScreenCTM', {
    writable: true,
    value: vi.fn().mockImplementation(createSVGMatrix),
});

/**
 * @description used in `util.breakText()` method
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: vi.fn().mockImplementation(createSVGRect),
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility
 * @see https://github.com/jsdom/jsdom/issues/3695
 * @description This method is not implemented in JSDOM yet.
 * We are adding it only to SVGElement.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'checkVisibility', {
    writable: true,
    value: function () {
        const bbox = this.getBBox();
        return bbox.width > 0 && bbox.height > 0;
    }
});

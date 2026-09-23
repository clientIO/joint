// Mocks for the SVG APIs JSDOM does not implement but JointJS relies on.
//
// Importing this module installs them on `globalThis`. It is deliberately free
// of any test-runner dependency - no spies of any kind - for two reasons:
//
//   * it can then be consumed from any runner, so one implementation serves
//     them all rather than each keeping a copy;
//   * a plain function is not a mock function, so the reset-between-tests
//     options runners offer cannot strip its implementation. A spy-based
//     version has to be reinstalled in a `beforeEach` to survive those; this
//     one does not.
//
// Nothing here is ever asserted on, so nothing here needs to be a spy.

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

/** Shared no-op, for the many mocked methods whose return value is unused. */
const noop = () => {};

/**
 * @description SVGMatrix is deprecated, we should use DOMMatrix instead
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix
 */
const createSVGMatrix = (): Record<string, unknown> => ({
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0,
    // Every operation returns a fresh matrix, so chains of any length resolve.
    flipX: createSVGMatrix,
    flipY: createSVGMatrix,
    inverse: createSVGMatrix,
    multiply: createSVGMatrix,
    rotate: createSVGMatrix,
    rotateFromVector: createSVGMatrix,
    scale: createSVGMatrix,
    scaleNonUniform: createSVGMatrix,
    skewX: createSVGMatrix,
    skewY: createSVGMatrix,
    translate: createSVGMatrix,
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
    setMatrix: noop,
    setRotate: noop,
    setScale: noop,
    setSkewX: noop,
    setSkewY: noop,
    setTranslate: noop,
});

/**
 * @description SVGPoint is deprecated, we should use DOMPoint instead
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
const createSVGPoint = (): Record<string, unknown> => ({
    x: 0,
    y: 0,
    matrixTransform: createSVGPoint,
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

/** `writable` so that a consumer can still override any of these itself. */
const define = (target: object, property: string, value: unknown) =>
    Object.defineProperty(target, property, { writable: true, value });

// Mocks
// -----

// Guard rather than throw: the mocks are meaningless outside a DOM, and a
// clear message beats `Cannot read properties of undefined (reading
// 'prototype')` from the first `define` below.
if (typeof globalThis.SVGSVGElement === 'undefined') {
    throw new Error(
        '@joint/mock-svg requires a DOM environment (e.g. JSDOM). ' +
        'Set your test environment to `jsdom` before importing it.'
    );
}

/**
 * @description Mock method which is not implemented in JSDOM
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement
 */
define(globalThis, 'SVGPathElement', function SVGPathElement() {});

/**
 * @description Mock SVGAngle which is used for sanity checks in Vectorizer library
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */
define(globalThis, 'SVGAngle', function SVGAngle() {
    return createSVGAngle();
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
define(globalThis, 'ResizeObserver', function ResizeObserver() {
    return { observe: noop, unobserve: noop, disconnect: noop };
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/createSVGMatrix
 */
define(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', createSVGMatrix);

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
 */
define(globalThis.SVGSVGElement.prototype, 'createSVGTransform', createSVGTransform);

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
define(globalThis.SVGSVGElement.prototype, 'createSVGPoint', createSVGPoint);

/**
 * @description used in `util.breakText()` method
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTextContentElement/getComputedTextLength
 */
define(globalThis.SVGElement.prototype, 'getComputedTextLength', () => 0);

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
 * Note: JSDOM SVGGraphicsElement does not encompass all SVG elements that might be needed,
 * whereas SVGElement provides broader compatibility.
 */
define(globalThis.SVGElement.prototype, 'getScreenCTM', createSVGMatrix);

/**
 * @description used in `util.breakText()` method
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
 */
define(globalThis.SVGElement.prototype, 'getBBox', createSVGRect);

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility
 * @see https://github.com/jsdom/jsdom/issues/3695
 * @description This method is not implemented in JSDOM yet.
 * We are adding it only to SVGElement.
 */
define(globalThis.SVGElement.prototype, 'checkVisibility', function(this: SVGGraphicsElement) {
    const bbox = this.getBBox();
    return bbox.width > 0 && bbox.height > 0;
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList
 * @description SVGElement.transform.baseVal is not implemented in JSDOM yet.
 */
define(globalThis.SVGElement.prototype, 'transform', {
    baseVal: {
        numberOfItems: 0,
        length: 0,
        appendItem: createSVGTransform,
        clear: noop,
        consolidate: createSVGTransform,
        getItem: createSVGTransform,
        initialize: createSVGTransform,
        insertItemBefore: createSVGTransform,
        removeItem: createSVGTransform,
        replaceItem: createSVGTransform,
        createSVGTransformFromMatrix: createSVGTransform,
    },
});

export {};

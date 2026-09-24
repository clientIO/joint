// Mocks for the SVG APIs JSDOM does not implement but JointJS relies on.
//
// Importing this module installs them on `globalThis`. It is deliberately free
// of any test-runner dependency.

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
const createSVGMatrix = (): Record<string, unknown> => ({
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0,
    // Each callback needs to be a separate function.
    flipX: () => createSVGMatrix(),
    flipY: () => createSVGMatrix(),
    inverse: () => createSVGMatrix(),
    multiply: () => createSVGMatrix(),
    rotate: () => createSVGMatrix(),
    rotateFromVector: () => createSVGMatrix(),
    scale: () => createSVGMatrix(),
    scaleNonUniform: () => createSVGMatrix(),
    skewX: () => createSVGMatrix(),
    skewY: () => createSVGMatrix(),
    translate: () => createSVGMatrix(),
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
    // Each callback needs to be a separate function.
    setMatrix: () => {},
    setRotate: () => {},
    setScale: () => {},
    setSkewX: () => {},
    setSkewY: () => {},
    setTranslate: () => {},
});

/**
 * @description SVGPoint is deprecated, we should use DOMPoint instead
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
const createSVGPoint = (): Record<string, unknown> => ({
    x: 0,
    y: 0,
    matrixTransform: () => createSVGPoint(),
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
(globalThis as Record<string, unknown>).SVGPathElement = function SVGPathElement() {};

/**
 * @description Mock SVGAngle which is used for sanity checks in Vectorizer library
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */
Object.defineProperty(globalThis, 'SVGAngle', {
    writable: true,
    value: function SVGAngle() {
        return createSVGAngle();
    }, // constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
(globalThis as Record<string, unknown>).ResizeObserver = function ResizeObserver() {
    return {
        // Each callback needs to be a separate function.
        observe: () => {},
        unobserve: () => {},
        disconnect: () => {},
    };
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/createSVGMatrix
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: () => createSVGMatrix(), // non-constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: () => createSVGTransform(), // non-constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: () => createSVGPoint(), // non-constructible on purpose
});

/**
 * @description used in `util.breakText()` method
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTextContentElement/getComputedTextLength
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getComputedTextLength', {
    writable: true,
    value: () => 0,
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
 * Note: JSDOM SVGGraphicsElement does not encompass all SVG elements that might be needed,
 * whereas SVGElement provides broader compatibility.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getScreenCTM', {
    writable: true,
    value: () => createSVGMatrix(), // non-constructible on purpose
});

/**
 * @description used in `util.breakText()` method
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => createSVGRect(), // non-constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility
 * @see https://github.com/jsdom/jsdom/issues/3695
 * @description This method is not implemented in JSDOM yet.
 * We are adding it only to SVGElement.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'checkVisibility', {
    writable: true,
    value: function(this: SVGGraphicsElement) {
        const bbox = this.getBBox();
        return bbox.width > 0 && bbox.height > 0;
    },
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList
 * @description SVGElement.transform.baseVal is not implemented in JSDOM yet.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'transform', {
    writable: true,
    value: {
        baseVal: {
            numberOfItems: 0,
            length: 0,
            // Each callback needs to be a separate function.
            appendItem: () => createSVGTransform(),
            clear: () => {},
            consolidate: () => createSVGTransform(),
            getItem: () => createSVGTransform(),
            initialize: () => createSVGTransform(),
            insertItemBefore: () => createSVGTransform(),
            removeItem: () => createSVGTransform(),
            replaceItem: () => createSVGTransform(),
            createSVGTransformFromMatrix: () => createSVGTransform(),
        },
    },
});

export {};

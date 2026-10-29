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
 * @description Needed for JointJS's `paper.scale()` method.
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: () => createSVGMatrix(), // non-constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/createSVGTransform
 * @description Needed for JointJS's `V.transform()` method.
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: () => createSVGTransform(), // non-constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/createSVGPoint
 * @description Needed for JointJS's `V.transformPoint()` method.
 */
Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: () => createSVGPoint(), // non-constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTextContentElement/getComputedTextLength
 * @description According to `lib.DOM`, this belongs on SVGTextContentElement.
 * But in JSDOM, `<text>` are SVGElements, not SVGTextContentElements.
 * So we need to mock the function on SVGElement.
 * Needed for JointJS's `util.breakText()` method.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getComputedTextLength', {
    writable: true,
    value: () => 0,
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
 * @description According to `lib.DOM`, this belongs on SVGGraphicsElement.
 * But in JSDOM, not all SVG elements (e.g. `<rect>`) are SVGGraphicsElements.
 * So we need to mock the function on SVGElement, the common denominator.
 * Needed for JointJS's `paper.clientToLocalPoint()` method.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getScreenCTM', {
    writable: true,
    value: () => createSVGMatrix(), // non-constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
 * @description According to `lib.DOM`, this belongs on SVGGraphicsElement.
 * But in JSDOM, not all SVG elements (e.g. `<rect>`) are SVGGraphicsElements.
 * So we need to mock the function on SVGElement, the common denominator.
 * Needed for JointJS's `util.breakText()` method.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => createSVGRect(), // non-constructible on purpose
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility
 * @see https://github.com/jsdom/jsdom/issues/3695
 * @description According to `lib.DOM`, this belongs on Element.
 * But in JSDOM, it is not implemented.
 * We only need it on SVGElement, so we only mock it there.
 * So this mock is covered by `lib.DOM` types.
 * Needed for JointJS's `cellView.getNodeBBox()` and `util.breakText()` methods.
 */
Object.defineProperty(globalThis.SVGElement.prototype, 'checkVisibility', {
    writable: true,
    value: function(this: SVGGraphicsElement) {
        const bbox = this.getBBox();
        return bbox.width > 0 && bbox.height > 0;
    },
});

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/transform
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimatedTransformList
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList
 * @description According to `lib.DOM`, this belongs on SVGGraphicsElement.
 * But in JSDOM, not all SVG elements (e.g. `<rect>`) are SVGGraphicsElements.
 * So we need to mock the property on SVGElement, the common denominator.
 * Also, in JSDOM, SVGAnimatedTransformList is not implemented.
 * We only need `transform.baseVal` from there, so we only mock that.
 * Needed for JointJS's `vel.transform()` method.
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

// Types
// ----------

// Where do the mocks expand upon `lib.DOM`?
export interface MockedSVGElement extends SVGElement {
    getBBox(options?: SVGBoundingBoxOptions): DOMRect;
    getScreenCTM(): DOMMatrix | null;
    getComputedTextLength(): number;
    readonly transform: { readonly baseVal: SVGTransformList };
}

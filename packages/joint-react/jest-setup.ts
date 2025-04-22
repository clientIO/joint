// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mocks
// -----

/**
 * @description Mock method which is not implemented in JSDOM
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement
 */
globalThis.SVGPathElement = jest.fn();

/**
 * @description Mock SVGAngle which is used for sanity checks in Vectorizer library
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */
Object.defineProperty(globalThis, 'SVGAngle', {
  writable: true,
  value: jest.fn().mockImplementation(() => SVGAngle),
});

beforeEach(() => {
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
   */
  globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/createSVGMatrix
   */
  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: jest.fn().mockImplementation(() => SVGMatrix),
  });

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
   */
  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: jest.fn().mockImplementation(() => SVGTransform),
  });

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
   */
  Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: jest.fn().mockImplementation(() => SVGPoint),
  });

  /**
   * @description used in `util.breakText()` method
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTextContentElement/getComputedTextLength
   */
  Object.defineProperty(globalThis.SVGElement.prototype, 'getComputedTextLength', {
    writable: true,
    value: jest.fn().mockImplementation(() => 0),
  });

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
   * Note: JSDOM SVGGraphicsElement does not encompass all SVG elements that might be needed,
   * whereas SVGElement provides broader compatibility.
   */
  Object.defineProperty(globalThis.SVGElement.prototype, 'getScreenCTM', {
    writable: true,
    value: jest.fn().mockImplementation(() => SVGMatrix),
  });

  /**
   * @description used in `util.breakText()` method
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
   */
  Object.defineProperty(globalThis.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: jest.fn().mockImplementation(() => SVGRect),
  });
});

// Interfaces
// ----------

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGAngle
 */
const SVGAngle = {
  SVG_ANGLETYPE_UNKNOWN: 0,
  SVG_ANGLETYPE_UNSPECIFIED: 1,
  SVG_ANGLETYPE_DEG: 2,
  SVG_ANGLETYPE_RAD: 3,
  SVG_ANGLETYPE_GRAD: 4,
};

/**
 * @description SVGMatrix is deprecated, we should use DOMMatrix instead
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix
 */
const SVGMatrix = {
  a: 0,
  b: 0,
  c: 0,
  d: 0,
  e: 0,
  f: 0,
  flipX: jest.fn().mockImplementation(() => SVGMatrix),
  flipY: jest.fn().mockImplementation(() => SVGMatrix),
  inverse: jest.fn().mockImplementation(() => SVGMatrix),
  multiply: jest.fn().mockImplementation(() => SVGMatrix),
  rotate: jest.fn().mockImplementation(() => SVGMatrix),
  rotateFromVector: jest.fn().mockImplementation(() => SVGMatrix),
  scale: jest.fn().mockImplementation(() => SVGMatrix),
  scaleNonUniform: jest.fn().mockImplementation(() => SVGMatrix),
  skewX: jest.fn().mockImplementation(() => SVGMatrix),
  skewY: jest.fn().mockImplementation(() => SVGMatrix),
  translate: jest.fn().mockImplementation(() => SVGMatrix),
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
 */
const SVGTransform = {
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
  setMatrix: jest.fn(),
  setRotate: jest.fn(),
  setScale: jest.fn(),
  setSkewX: jest.fn(),
  setSkewY: jest.fn(),
  setTranslate: jest.fn(),
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
 */
const SVGPoint = {
  x: 0,
  y: 0,
  matrixTransform: jest.fn().mockImplementation(() => SVGPoint),
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGRect
 */
const SVGRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

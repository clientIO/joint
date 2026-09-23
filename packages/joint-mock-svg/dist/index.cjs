'use strict';

const createSVGAngle = () => ({
  SVG_ANGLETYPE_UNKNOWN: 0,
  SVG_ANGLETYPE_UNSPECIFIED: 1,
  SVG_ANGLETYPE_DEG: 2,
  SVG_ANGLETYPE_RAD: 3,
  SVG_ANGLETYPE_GRAD: 4
});
const noop = () => {
};
const createSVGMatrix = () => ({
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
  translate: createSVGMatrix
});
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
  setTranslate: noop
});
const createSVGPoint = () => ({
  x: 0,
  y: 0,
  matrixTransform: createSVGPoint
});
const createSVGRect = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0
});
const define = (target, property, value) => Object.defineProperty(target, property, { writable: true, value });
if (typeof globalThis.SVGSVGElement === "undefined") {
  throw new Error(
    "@joint/mock-svg requires a DOM environment (e.g. JSDOM). Set your test environment to `jsdom` before importing it."
  );
}
define(globalThis, "SVGPathElement", function SVGPathElement() {
});
define(globalThis, "SVGAngle", function SVGAngle() {
  return createSVGAngle();
});
define(globalThis, "ResizeObserver", function ResizeObserver() {
  return { observe: noop, unobserve: noop, disconnect: noop };
});
define(globalThis.SVGSVGElement.prototype, "createSVGMatrix", createSVGMatrix);
define(globalThis.SVGSVGElement.prototype, "createSVGTransform", createSVGTransform);
define(globalThis.SVGSVGElement.prototype, "createSVGPoint", createSVGPoint);
define(globalThis.SVGElement.prototype, "getComputedTextLength", () => 0);
define(globalThis.SVGElement.prototype, "getScreenCTM", createSVGMatrix);
define(globalThis.SVGElement.prototype, "getBBox", createSVGRect);
define(globalThis.SVGElement.prototype, "checkVisibility", function() {
  const bbox = this.getBBox();
  return bbox.width > 0 && bbox.height > 0;
});
define(globalThis.SVGElement.prototype, "transform", {
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
    createSVGTransformFromMatrix: createSVGTransform
  }
});
//# sourceMappingURL=index.cjs.map

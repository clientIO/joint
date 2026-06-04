/**
 * Patches the SVG-geometry surface that fake DOMs (jsdom) do not implement but
 * `@joint/core`'s Vectorizer requires. This is the single "plug the missing SVG
 * pieces" point; every method here is something joint-core calls that jsdom
 * lacks. Exported so a custom DOM provider can apply the same polyfills.
 *
 * `getBBox`/`getComputedTextLength` measure text via `./svg-text-bbox` (exact with
 * `@napi-rs/canvas`, else estimated) so text-sized geometry — link-label backgrounds
 * especially — is correct; for non-text nodes they return an empty box, since
 * element/link positions come from the JointJS model (the `measureNode` preset).
 * `getScreenCTM`/`getCTM` return identity. `transform.baseVal` returns the real
 * matrix parsed from the `transform` attribute.
 *
 * The element-level proxies (`className`, `transform`, font-size coercion) live in
 * `./svg-element-proxies`; text measurement in `./svg-text-bbox`.
 */
import {
  createIdentityMatrix,
  createPoint,
  createTransform,
  createTransformFromMatrix,
  type SvgMatrixLike,
} from './svg-matrix';
import { getPrototype, SVG_NAMESPACE, type PolyfillWindow } from './svg-prototype';
import { estimateBBox, measureNodeText, type TextMetricsNode } from './svg-text-bbox';
import {
  applyClassNamePolyfill,
  applyFontSizeCoercion,
  applyTransformPolyfill,
} from './svg-element-proxies';

// Re-exported so `install-dom-shim.ts` can keep importing `PolyfillWindow` from
// here, the public polyfill entry point.
export type { PolyfillWindow } from './svg-prototype';

/** Fills the missing `createSVG*` factory methods on `SVGSVGElement.prototype`. */
function applyFactoryPolyfills(svgSvgPrototype: Record<string, unknown> | undefined): void {
  if (!svgSvgPrototype) return;
  if (typeof svgSvgPrototype.createSVGMatrix !== 'function') {
    svgSvgPrototype.createSVGMatrix = () => createIdentityMatrix();
  }
  if (typeof svgSvgPrototype.createSVGPoint !== 'function') {
    svgSvgPrototype.createSVGPoint = () => createPoint(0, 0);
  }
  if (typeof svgSvgPrototype.createSVGTransform !== 'function') {
    svgSvgPrototype.createSVGTransform = () => createTransform();
  }
  if (typeof svgSvgPrototype.createSVGTransformFromMatrix !== 'function') {
    svgSvgPrototype.createSVGTransformFromMatrix = (matrix: SvgMatrixLike) =>
      createTransformFromMatrix(matrix);
  }
}

/** Whether the provider already returns real text metrics (e.g. svgdom) — then we leave it alone. */
function providerMeasuresText(window: PolyfillWindow): boolean {
  try {
    const probe = window.document.createElementNS(SVG_NAMESPACE, 'text') as unknown as {
      textContent: string;
      getBBox?: () => { width?: number };
    };
    probe.textContent = 'measure';
    const width = probe.getBBox?.().width;
    return typeof width === 'number' && width > 0;
  } catch {
    return false;
  }
}

// jsdom creates SVG elements it doesn't fully implement (e.g. `<text>`) as plain
// `SVGElement`s, and defines `getBBox` only on `SVGGraphicsElement` — which those
// elements don't inherit from. So a single target is unreliable: we install on
// every SVG prototype the window exposes, so text elements get ours whatever
// their concrete class, and overrides on a subclass can't shadow a base one.
const MEASUREMENT_PROTOTYPE_NAMES = [
  'SVGElement',
  'SVGGraphicsElement',
  'SVGTextPositioningElement',
  'SVGTextContentElement',
  'SVGTextElement',
] as const;

/**
 * Installs text-aware `getBBox` + `getComputedTextLength` (and identity CTMs) on
 * every SVG prototype, replacing jsdom's zero-returning stubs. Skipped for the
 * measuring methods when the provider already returns real text metrics.
 */
function applyMeasurementPolyfills(window: PolyfillWindow): void {
  const prototypes = MEASUREMENT_PROTOTYPE_NAMES.map((name) => getPrototype(window, name)).filter(
    (prototype): prototype is Record<string, unknown> => prototype !== undefined
  );

  for (const prototype of prototypes) {
    if (typeof prototype.getScreenCTM !== 'function') {
      prototype.getScreenCTM = () => createIdentityMatrix();
    }
    if (typeof prototype.getCTM !== 'function') {
      prototype.getCTM = () => createIdentityMatrix();
    }
  }

  if (providerMeasuresText(window)) {
    return;
  }

  for (const prototype of prototypes) {
    prototype.getBBox = function getBBox(this: TextMetricsNode) {
      return estimateBBox(this);
    };
    prototype.getComputedTextLength = function getComputedTextLength(this: TextMetricsNode) {
      return measureNodeText(this).width;
    };
  }
}

/**
 * Applies every SVG-geometry polyfill to a DOM window's prototypes. Only fills
 * genuinely-missing methods, so a provider that ships real implementations wins.
 * @param window - the DOM window to patch.
 */
export function applySvgGeometryPolyfills(window: PolyfillWindow): void {
  applyFactoryPolyfills(getPrototype(window, 'SVGSVGElement'));
  applyFontSizeCoercion(window);

  const elementPrototype = getPrototype(window, 'Element');
  if (elementPrototype && typeof elementPrototype.checkVisibility !== 'function') {
    elementPrototype.checkVisibility = () => true;
  }

  applyMeasurementPolyfills(window);

  const svgPrototype = getPrototype(window, 'SVGElement');
  applyClassNamePolyfill(window, svgPrototype);
  applyTransformPolyfill(window, svgPrototype);
}

/**
 * `@joint/svg-shim` — a headless DOM + SVG-geometry shim that lets JointJS's
 * SVG/Vectorizer code run in Node (server-side rendering).
 *
 * Two ways to use it:
 * - Side-effect entry: `import '@joint/svg-shim/install';` installs the shim
 *   (jsdom by default) before anything that pulls in `@joint/core`.
 * - Programmatic: call {@link installDomShim} with a {@link DomProvider} (jsdom,
 *   happy-dom, or a custom factory), and register a {@link TextStyleResolver} via
 *   {@link setTextStyleResolver} so themed text is measured at the right size.
 */
export {
  installDomShim,
  isDomShimInstalled,
  DEFAULT_DOM_PROVIDER,
} from './install-dom-shim';
export type {
  DomShimOptions,
  DomProvider,
  ShimWindow,
  ShimWindowFactory,
} from './install-dom-shim';

export { setTextStyleResolver, resolveTextStyle } from './text-style-resolver';
export type { TextStyle, TextStyleResolver } from './text-style-resolver';

export { measureText } from './text-metrics';
export type { TextBox, TextMeasureOptions } from './text-metrics';

export { getNodeRequire } from './node-require';

export { DOM_SHIM_FLAG } from './dom-shim-flag';

export { applySvgGeometryPolyfills } from './svg-polyfills';
export type { PolyfillWindow } from './svg-polyfills';

/**
 * Headless DOM environment for server-side rendering of a JointJS paper.
 *
 * `@joint/core`'s `dia.Paper` builds real SVG DOM via `document.createElementNS`
 * and the Vectorizer. In Node there is no `document`, and even a fake DOM (jsdom)
 * implements no SVG **layout** — so `createSVGMatrix`, `getBBox`, `transform`,
 * etc. are missing. This module installs a DOM window as the process globals and
 * applies the SVG-geometry polyfills (see `./svg-polyfills`), so a paper can be
 * constructed and serialized.
 *
 * **Ordering contract:** this must run *before* `@joint/core` is first evaluated
 * (the Vectorizer captures `window.SVGAngle` at module-eval time). Import the
 * `@joint/svg-shim/install` side-effect entry before anything that pulls in
 * `@joint/core`.
 *
 * The install is idempotent and reuses a single window for the lifetime of the
 * process — per-render work allocates only a host element + paper.
 */
import { DOM_SHIM_FLAG } from './dom-shim-flag';
import { getNodeRequire } from './node-require';
import { applySvgGeometryPolyfills, type PolyfillWindow } from './svg-polyfills';

/**
 * Structural shape of the DOM window the shim needs. jsdom's `window` satisfies
 * it, so a custom provider factory can return a different implementation.
 */
export interface ShimWindow extends PolyfillWindow {
  navigator: Navigator;
}

/** A factory returning the DOM window to install. */
export type ShimWindowFactory = () => ShimWindow;

/**
 * DOM provider for the shim:
 * - `'jsdom'` (default) — the bundled provider. jsdom creates real `SVGElement`s
 *   with a spec-compliant `className`, both of which the Vectorizer requires.
 * - `'happy-dom'` — a lighter optional backend (install the `happy-dom` peer).
 *   happy-dom also creates real `SVGElement`s (with `SVGSVGElement` /
 *   `SVGTextElement` and the `SVGElement` prototype chain), so the same global
 *   bridge + polyfill flow applies; the polyfills override its stub
 *   `getBBox`/`createSVGMatrix` with real geometry.
 * - a custom factory — bring your own window (e.g. a pooled instance). It must
 *   yield real `SVGElement`s, since the Vectorizer reads SVG-specific surfaces.
 */
export type DomProvider = 'jsdom' | 'happy-dom' | ShimWindowFactory;

/** Options for {@link installDomShim}. */
export interface DomShimOptions {
  /** DOM provider. Defaults to `'jsdom'`. */
  readonly provider?: DomProvider;
}

/** The provider used when none is specified. */
export const DEFAULT_DOM_PROVIDER = 'jsdom';

/** Bare DOM constructors / helpers JointJS references as globals (not via `window.`). */
const GLOBAL_BRIDGE_KEYS = [
  'SVGElement',
  'SVGSVGElement',
  'SVGGraphicsElement',
  'SVGPathElement',
  'SVGGElement',
  'SVGTextElement',
  'SVGTextContentElement',
  'Element',
  'Node',
  'HTMLElement',
  // `dia.Paper.drawBackground` checks `img instanceof HTMLImageElement` even with
  // no background image — without the bridge that `instanceof` throws a
  // ReferenceError. `Image` is the matching constructor consumers may use.
  'HTMLImageElement',
  'Image',
  'DocumentFragment',
  'Event',
  'CustomEvent',
  'MutationObserver',
  'DOMParser',
  'XMLSerializer',
  'NodeFilter',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
] as const;

/** Loads an optional peer DOM library, with an actionable error when missing. */
function loadOptionalModule<T>(moduleName: string): T {
  try {
    return getNodeRequire()(moduleName) as T;
  } catch {
    throw new Error(
      `The headless SVG shim requires the "${moduleName}" package for server-side ` +
        `rendering but it is not installed. Install it with \`yarn add ${moduleName}\`, ` +
        'or pass a custom DOM provider factory.'
    );
  }
}

/** Minimal surface of the jsdom module the shim uses (optional peer dependency). */
interface JsdomModule {
  JSDOM: new (
    html: string,
    options?: { pretendToBeVisual?: boolean }
  ) => { window: ShimWindow };
}

/** Creates a jsdom window (the bundled default provider). */
function createJsdomWindow(): ShimWindow {
  const { JSDOM } = loadOptionalModule<JsdomModule>('jsdom');
  const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    pretendToBeVisual: true,
  });
  return window;
}

/** Minimal surface of the happy-dom module the shim uses (optional peer dependency). */
interface HappyDomModule {
  Window: new () => ShimWindow;
}

/** Creates a happy-dom window (the lighter optional provider). */
function createHappyDomWindow(): ShimWindow {
  const { Window } = loadOptionalModule<HappyDomModule>('happy-dom');
  return new Window() as unknown as ShimWindow;
}

/** Resolves a {@link DomProvider} to a window factory. */
function resolveWindowFactory(provider: DomProvider): ShimWindowFactory {
  if (typeof provider === 'function') {
    return provider;
  }
  if (provider === 'happy-dom') {
    return createHappyDomWindow;
  }
  return createJsdomWindow;
}

/**
 * Bridges bare globals, ensures the Vectorizer's `SVGAngle` guard passes, applies
 * the SVG-geometry polyfills, and marks the shim installed.
 * @param window - the DOM window now backing the globals.
 * @param globalScope - the global object to attach bridges and the flag to.
 */
function finalizeShim(window: ShimWindow, globalScope: ShimWindow & Record<string, unknown>): void {
  // Vectorizer's `isSVGSupported` guard is `typeof window === 'object' && !!window.SVGAngle`.
  if (window.SVGAngle === undefined) {
    window.SVGAngle = function SVGAngle() {};
  }
  if (globalScope.SVGAngle === undefined) {
    globalScope.SVGAngle = window.SVGAngle;
  }
  for (const key of GLOBAL_BRIDGE_KEYS) {
    const value = window[key];
    if (value !== undefined && globalScope[key] === undefined) {
      globalScope[key] = value;
    }
  }
  // A no-op ResizeObserver so code that constructs one doesn't crash. It never
  // fires: jsdom has no layout, so a real one would report 0×0 and overwrite the
  // model-provided element sizes — element sizes must come from the model on the
  // server.
  if (globalScope.ResizeObserver === undefined) {
    globalScope.ResizeObserver = class ResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }
  applySvgGeometryPolyfills(window);
  globalScope[DOM_SHIM_FLAG] = true;
}

/**
 * Installs the headless DOM globals required to render a JointJS paper in Node.
 *
 * Idempotent: the first call creates the window (jsdom by default) or reuses an
 * existing DOM, bridges the bare-global constructors, and applies the SVG
 * polyfills. Subsequent calls are no-ops.
 * @param options - optional DOM provider override.
 * @returns the installed `document`.
 */
export function installDomShim(options: DomShimOptions = {}): Document {
  const globalScope = globalThis as ShimWindow & Record<string, unknown>;
  // `globalThis.document` is `Document` in the lib types but genuinely absent in Node.
  const existingDocument = globalScope.document as Document | undefined;
  if (globalScope[DOM_SHIM_FLAG] === true && existingDocument !== undefined) {
    return existingDocument;
  }

  // Reuse an existing DOM (e.g. a jsdom test environment) instead of creating a
  // second window that would clobber it — only the SVG polyfills are applied.
  if (existingDocument !== undefined) {
    const existingWindow = (globalScope.window ?? globalScope) as ShimWindow;
    finalizeShim(existingWindow, globalScope);
    return existingWindow.document;
  }

  const window = resolveWindowFactory(options.provider ?? DEFAULT_DOM_PROVIDER)();
  globalScope.window = window;
  globalScope.document = window.document;
  // Modern Node (21+) exposes a read-only global `navigator` getter — assigning
  // to it throws. Only set ours when the runtime has none (older Node, where the
  // jsdom navigator is needed). Cast: the lib types say `navigator` is always
  // defined, but at runtime it genuinely can be absent.
  if ((globalScope as { navigator?: unknown }).navigator === undefined) {
    globalScope.navigator = window.navigator;
  }
  finalizeShim(window, globalScope);
  return window.document;
}

/**
 * Whether the headless DOM shim has been installed in the current process.
 * @returns `true` when {@link installDomShim} has run.
 */
export function isDomShimInstalled(): boolean {
  return (globalThis as Record<string, unknown>)[DOM_SHIM_FLAG] === true;
}

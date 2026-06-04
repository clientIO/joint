/**
 * Element-level SVG polyfills the Vectorizer needs but fake DOMs (jsdom) may not
 * supply: a spec-compliant `className` (`SVGAnimatedString`), a working
 * `transform.baseVal` transform list backed by the `transform` attribute, and a
 * bare-number `style.font-size` → `px` coercion. Each is a no-op when the provider
 * is already compliant.
 */
import {
  createTransform,
  createTransformFromMatrix,
  matrixToTransformString,
  parseTransformString,
  type SvgMatrixLike,
  type SvgTransformLike,
} from './svg-matrix';
import { getPrototype, SVG_NAMESPACE, type PolyfillWindow } from './svg-prototype';

const BARE_NUMBER = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;

/** Minimal element surface the `className` / `transform` accessors need. */
export interface AttributeHost {
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
}

/** Builds an `SVGAnimatedString`-like accessor backed by a node's `class` attribute. */
export function createClassNameProxy(node: AttributeHost) {
  return {
    get baseVal(): string {
      return node.getAttribute('class') ?? '';
    },
    set baseVal(value: string) {
      node.setAttribute('class', value);
    },
    get animVal(): string {
      return node.getAttribute('class') ?? '';
    },
  };
}

/**
 * Ensures SVG elements expose `className` as a spec-compliant `SVGAnimatedString`
 * (with `baseVal`), which the Vectorizer requires. jsdom already does; some
 * providers return a plain string. No-op when already compliant.
 * @param window - the DOM window to probe.
 * @param svgPrototype - `SVGElement.prototype`, when present.
 */
export function applyClassNamePolyfill(
  window: PolyfillWindow,
  svgPrototype: Record<string, unknown> | undefined
): void {
  if (!svgPrototype) return;
  let current: unknown;
  try {
    const probe = window.document.createElementNS(SVG_NAMESPACE, 'g') as unknown as { className: unknown };
    current = probe.className;
  } catch {
    return;
  }
  const isCompliant = current !== null && typeof current === 'object' && 'baseVal' in (current as object);
  if (isCompliant) return;

  try {
    Object.defineProperty(svgPrototype, 'className', {
      configurable: true,
      get(this: AttributeHost) {
        return createClassNameProxy(this);
      },
    });
  } catch {
    // Provider's `className` is non-configurable — leave it as-is.
  }
}

/** A minimal `SVGTransformList` backed by a node's `transform` attribute. */
export function createTransformList(node: AttributeHost) {
  return {
    get numberOfItems(): number {
      return node.getAttribute('transform') ? 1 : 0;
    },
    consolidate(): SvgTransformLike | null {
      const value = node.getAttribute('transform');
      if (!value) return null;
      const transform = createTransform();
      transform.setMatrix(parseTransformString(value));
      return transform;
    },
    getItem(): SvgTransformLike {
      const transform = createTransform();
      transform.setMatrix(parseTransformString(node.getAttribute('transform') ?? ''));
      return transform;
    },
    appendItem(item: SvgTransformLike): SvgTransformLike {
      const current = parseTransformString(node.getAttribute('transform') ?? '');
      node.setAttribute('transform', matrixToTransformString(current.multiply(item.matrix)));
      return item;
    },
    initialize(item: SvgTransformLike): SvgTransformLike {
      node.setAttribute('transform', matrixToTransformString(item.matrix));
      return item;
    },
    clear(): void {
      node.setAttribute('transform', '');
    },
    createSVGTransformFromMatrix(matrix: SvgMatrixLike): SvgTransformLike {
      return createTransformFromMatrix(matrix);
    },
  };
}

/**
 * Adds `SVGElement.prototype.transform` (with a working `baseVal` transform list)
 * when the provider lacks it — the Vectorizer reads
 * `node.transform.baseVal.consolidate()` for some geometry. Returns the real
 * matrix parsed from the `transform` attribute. No-op when already implemented.
 * @param window - the DOM window to probe.
 * @param svgPrototype - `SVGElement.prototype`, when present.
 */
export function applyTransformPolyfill(
  window: PolyfillWindow,
  svgPrototype: Record<string, unknown> | undefined
): void {
  if (!svgPrototype) return;
  let hasTransformList = false;
  try {
    const probe = window.document.createElementNS(SVG_NAMESPACE, 'g') as unknown as {
      transform?: { baseVal?: { consolidate?: unknown } };
    };
    hasTransformList = typeof probe.transform?.baseVal?.consolidate === 'function';
  } catch {
    return;
  }
  if (hasTransformList) return;

  try {
    Object.defineProperty(svgPrototype, 'transform', {
      configurable: true,
      get(this: AttributeHost) {
        return { baseVal: createTransformList(this) };
      },
    });
  } catch {
    // Provider's `transform` is non-configurable — leave it as-is.
  }
}

/**
 * Coerces a bare numeric `style.font-size` (e.g. `12`) to `px`, like the browser
 * and React do. JointJS sets numeric font sizes via `element.style.fontSize`;
 * jsdom otherwise rejects them as invalid CSS and drops the value — so the server
 * would lose the inline size the browser actually applies (and over-size text to
 * the theme class instead).
 * @param window - the DOM window whose `CSSStyleDeclaration` is patched.
 */
export function applyFontSizeCoercion(window: PolyfillWindow): void {
  const stylePrototype = getPrototype(window, 'CSSStyleDeclaration');
  const descriptor = stylePrototype && Object.getOwnPropertyDescriptor(stylePrototype, 'fontSize');
  if (!descriptor || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') {
    return;
  }
  const originalSet = descriptor.set;
  try {
    Object.defineProperty(stylePrototype, 'fontSize', {
      configurable: true,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(value: unknown) {
        if (typeof value === 'number' || (typeof value === 'string' && BARE_NUMBER.test(value.trim()))) {
          originalSet.call(this, `${value}px`);
          return;
        }
        originalSet.call(this, value);
      },
    });
  } catch {
    // Provider's `fontSize` is non-configurable — leave it as-is.
  }
}

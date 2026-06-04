import { applySvgGeometryPolyfills, type PolyfillWindow } from '../svg-polyfills';
import { createMatrix } from '../svg-matrix';

type Prototype = Record<string, unknown>;

/** A node backed by an in-memory attribute map (the `AttributeHost` surface). */
function createAttributeHost(): Record<string, unknown> {
  const attributes = new Map<string, string>();
  return {
    getAttribute: (name: string): string | null => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string): void => {
      attributes.set(name, value);
    },
  };
}

/**
 * A minimal non-jsdom window whose SVG prototypes are empty and whose probe
 * element is intentionally non-compliant (string `className`, no `transform`),
 * so every polyfill branch runs. This isolates the polyfill from any DOM
 * implementation, keeping the assertions deterministic.
 */
function createFakeWindow(): PolyfillWindow {
  const probe = { className: '', ...createAttributeHost() };
  return {
    SVGSVGElement: { prototype: {} as Prototype },
    SVGElement: { prototype: {} as Prototype },
    Element: { prototype: {} as Prototype },
    document: { createElementNS: () => probe } as unknown as Document,
  } as unknown as PolyfillWindow;
}

/** Reads a constructor's prototype off the fake window. */
function prototypeOf(window: PolyfillWindow, constructorName: string): Prototype {
  return (window[constructorName] as { prototype: Prototype }).prototype;
}

/** An SVG node whose prototype carries the polyfilled accessors. */
function createNodeWith(prototype: Prototype): Record<string, unknown> {
  return Object.assign(Object.create(prototype) as object, createAttributeHost());
}

/** A constant fill-if-missing method used to assert provider methods are preserved. */
const alwaysVisible = (): boolean => true;

/** A text node carrying the polyfilled accessors, with attributes set. */
function createTextNode(
  window: PolyfillWindow,
  text: string,
  attributes: Readonly<Record<string, string>> = {}
): Record<string, unknown> {
  const node = createNodeWith(prototypeOf(window, 'SVGElement')) as Record<string, unknown> & {
    setAttribute: (name: string, value: string) => void;
  };
  node.localName = 'text';
  node.textContent = text;
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  return node;
}

describe('applySvgGeometryPolyfills — factory methods', () => {
  it('adds createSVGMatrix / Point / Transform returning identity primitives', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const svgSvg = prototypeOf(window, 'SVGSVGElement') as Record<string, () => { a?: number; x?: number }>;

    expect(typeof svgSvg.createSVGMatrix).toBe('function');
    expect(svgSvg.createSVGMatrix().a).toBe(1);
    expect(svgSvg.createSVGPoint().x).toBe(0);
    expect(typeof svgSvg.createSVGTransform).toBe('function');
  });

  it('createSVGTransformFromMatrix carries the supplied matrix', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const svgSvg = prototypeOf(window, 'SVGSVGElement') as Record<
      string,
      (matrix: ReturnType<typeof createMatrix>) => { matrix: { a: number; e: number } }
    >;

    const transform = svgSvg.createSVGTransformFromMatrix(createMatrix(2, 0, 0, 2, 5, 6));
    expect(transform.matrix.a).toBe(2);
    expect(transform.matrix.e).toBe(5);
  });
});

describe('applySvgGeometryPolyfills — measurement + visibility', () => {
  it('getBBox / getComputedTextLength / getCTM return geometry-free defaults', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const svg = prototypeOf(window, 'SVGElement') as Record<string, () => unknown>;

    expect(svg.getBBox()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    expect(svg.getComputedTextLength()).toBe(0);
    expect((svg.getScreenCTM() as { a: number }).a).toBe(1);
    expect((svg.getCTM() as { a: number }).a).toBe(1);
  });

  it('checkVisibility reports true (no layout culling on the server)', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const element = prototypeOf(window, 'Element') as Record<string, () => boolean>;
    expect(element.checkVisibility()).toBe(true);
  });

  it('keeps a provider-supplied fill-if-missing method (checkVisibility)', () => {
    const window = createFakeWindow();
    prototypeOf(window, 'Element').checkVisibility = alwaysVisible;
    applySvgGeometryPolyfills(window);
    expect(prototypeOf(window, 'Element').checkVisibility).toBe(alwaysVisible);
  });
});

describe('applySvgGeometryPolyfills — text measurement', () => {
  it('getBBox measures text width and stays empty for non-text nodes', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);

    const text = createTextNode(window, 'Hello', { 'font-size': '16' }) as { getBBox: () => { width: number } };
    expect(text.getBBox().width).toBeGreaterThan(0);

    const rect = createNodeWith(prototypeOf(window, 'SVGElement')) as Record<string, unknown> & {
      getBBox: () => unknown;
    };
    rect.localName = 'rect';
    expect(rect.getBBox()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('honors text-anchor=middle by centering the bbox (x = -width / 2)', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const text = createTextNode(window, 'Centered', { 'font-size': '16', 'text-anchor': 'middle' }) as {
      getBBox: () => { x: number; width: number };
    };
    const bbox = text.getBBox();
    expect(bbox.x).toBeCloseTo(-bbox.width / 2);
  });

  it('getComputedTextLength returns the measured text width', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const text = createTextNode(window, 'Hello', { 'font-size': '16' }) as { getComputedTextLength: () => number };
    expect(text.getComputedTextLength()).toBeGreaterThan(0);
  });
});

describe('applySvgGeometryPolyfills — className accessor', () => {
  it('exposes an SVGAnimatedString-like className backed by the class attribute', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const node = createNodeWith(prototypeOf(window, 'SVGElement')) as {
      className: { baseVal: string; animVal: string };
      getAttribute: (name: string) => string | null;
    };

    node.className.baseVal = 'shape selected';
    expect(node.getAttribute('class')).toBe('shape selected');
    expect(node.className.baseVal).toBe('shape selected');
    expect(node.className.animVal).toBe('shape selected');
  });
});

describe('applySvgGeometryPolyfills — transform list', () => {
  it('reports no items and a null consolidate when there is no transform', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const node = createNodeWith(prototypeOf(window, 'SVGElement')) as {
      transform: { baseVal: { numberOfItems: number; consolidate: () => unknown } };
    };

    expect(node.transform.baseVal.numberOfItems).toBe(0);
    expect(node.transform.baseVal.consolidate()).toBeNull();
  });

  it('consolidate parses the transform attribute into a real matrix', () => {
    const window = createFakeWindow();
    applySvgGeometryPolyfills(window);
    const node = createNodeWith(prototypeOf(window, 'SVGElement')) as {
      transform: { baseVal: { numberOfItems: number; consolidate: () => { matrix: { e: number; f: number } } } };
      setAttribute: (name: string, value: string) => void;
    };

    node.setAttribute('transform', 'translate(10,20)');
    expect(node.transform.baseVal.numberOfItems).toBe(1);
    const consolidated = node.transform.baseVal.consolidate();
    expect(consolidated.matrix.e).toBe(10);
    expect(consolidated.matrix.f).toBe(20);
  });
});

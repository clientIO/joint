/**
 * @jest-environment node
 *
 * Runs in the `node` environment (no ambient `document`) so the shim exercises
 * its real create-the-DOM path with the default `jsdom` provider.
 */
import { JSDOM } from 'jsdom';
import { installDomShim, isDomShimInstalled, type ShimWindow } from '../install-dom-shim';
import { DOM_SHIM_FLAG } from '../dom-shim-flag';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** Clears the process-global shim state so each test installs from scratch. */
function resetShim(): void {
  const globalScope = globalThis as Record<string, unknown>;
  Reflect.deleteProperty(globalScope, DOM_SHIM_FLAG);
  Reflect.deleteProperty(globalScope, 'document');
  Reflect.deleteProperty(globalScope, 'window');
}

beforeEach(resetShim);
afterAll(resetShim);

describe('installDomShim', () => {
  it('reports not-installed before the first call', () => {
    expect(isDomShimInstalled()).toBe(false);
  });

  it('installs a working document and flips the installed flag', () => {
    const document = installDomShim();

    expect(typeof document.createElementNS).toBe('function');
    expect(isDomShimInstalled()).toBe(true);
    expect((globalThis as Record<string, unknown>).document).toBe(document);
  });

  it('bridges the bare SVG globals, SVGAngle, and a no-op ResizeObserver', () => {
    installDomShim();
    const globalScope = globalThis as Record<string, unknown>;

    // The bridge copies whatever SVG constructors the provider exposes; jsdom
    // ships `SVGElement` / `SVGSVGElement` / `SVGGElement` (but not every leaf
    // class such as `SVGPathElement`).
    expect(globalScope.SVGElement).toBeDefined();
    expect(globalScope.SVGSVGElement).toBeDefined();
    expect(globalScope.SVGGElement).toBeDefined();
    // The Vectorizer's `isSVGSupported` guard reads `window.SVGAngle`.
    expect(globalScope.SVGAngle).toBeDefined();

    expect(typeof globalScope.ResizeObserver).toBe('function');
    const ResizeObserverClass = globalScope.ResizeObserver as new () => {
      observe: () => void;
      disconnect: () => void;
    };
    const observer = new ResizeObserverClass();
    expect(() => {
      observer.observe();
      observer.disconnect();
    }).not.toThrow();
  });

  it('applies the SVG geometry polyfills to the created window', () => {
    const document = installDomShim();

    const svg = document.createElementNS(SVG_NAMESPACE, 'svg') as unknown as {
      createSVGMatrix: () => { a: number; d: number };
    };
    expect(svg.createSVGMatrix().a).toBe(1);
    expect(svg.createSVGMatrix().d).toBe(1);

    const group = document.createElementNS(SVG_NAMESPACE, 'g') as unknown as {
      getBBox: () => { width: number; height: number };
    };
    expect(group.getBBox()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('does not throw when global navigator is a read-only getter (modern Node 21+)', () => {
    const globalScope = globalThis as Record<string, unknown>;
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalScope, 'navigator');
    Object.defineProperty(globalScope, 'navigator', {
      configurable: true,
      get: () => ({ userAgent: 'read-only-navigator' }),
    });

    try {
      expect(() => installDomShim()).not.toThrow();
      expect(isDomShimInstalled()).toBe(true);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalScope, 'navigator', originalDescriptor);
      } else {
        delete globalScope.navigator;
      }
    }
  });

  it('is idempotent — a second call returns the same document', () => {
    const first = installDomShim();
    const second = installDomShim();
    expect(second).toBe(first);
  });

  it('honors a custom DOM provider factory', () => {
    let factoryCalls = 0;
    const provider = (): ShimWindow => {
      factoryCalls += 1;
      const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        pretendToBeVisual: true,
      });
      return window as unknown as ShimWindow;
    };

    const document = installDomShim({ provider });

    expect(factoryCalls).toBe(1);
    expect((globalThis as Record<string, unknown>).document).toBe(document);
  });
});

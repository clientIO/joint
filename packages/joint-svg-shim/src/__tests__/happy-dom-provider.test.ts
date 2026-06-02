/**
 * @jest-environment node
 *
 * Runs in the `node` environment (no ambient `document`) so the shim exercises
 * its real create-the-DOM path with the `happy-dom` provider.
 */
import { installDomShim, isDomShimInstalled } from '../install-dom-shim';
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

describe('installDomShim with the happy-dom provider', () => {
  it('installs a working document and flips the installed flag', () => {
    const document = installDomShim({ provider: 'happy-dom' });

    expect(typeof document.createElementNS).toBe('function');
    expect(isDomShimInstalled()).toBe(true);
  });

  it('measures non-empty text via the polyfilled getBBox (width > 0)', () => {
    const document = installDomShim({ provider: 'happy-dom' });

    const text = document.createElementNS(SVG_NAMESPACE, 'text') as unknown as {
      textContent: string;
      setAttribute: (name: string, value: string) => void;
      getBBox: () => { width: number };
    };
    text.setAttribute('font-size', '16');
    text.textContent = 'Hello';

    expect(text.getBBox().width).toBeGreaterThan(0);
  });
});

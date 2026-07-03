import { SCROLLABLE_ATTRIBUTE, wheelGuard } from '../wheel-guard';

interface FakeEvent {
  readonly type: string;
  readonly target: EventTarget | null;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
}

function fakeWheel(target: EventTarget | null, overrides: Partial<FakeEvent> = {}): FakeEvent {
  return { type: 'wheel', target, ...overrides };
}

/** Attaches an element to the document so the browser reports non-zero client/scroll dims. */
function mount(element: Element): void {
  document.body.append(element);
}

function makeOverflowingDiv(): HTMLDivElement {
  const div = document.createElement('div');
  div.setAttribute(SCROLLABLE_ATTRIBUTE, '');
  // JSDOM doesn't run layout; stub the geometry getters so `overflows()` sees a scroll gap.
  Object.defineProperty(div, 'scrollHeight', { value: 200, configurable: true });
  Object.defineProperty(div, 'clientHeight', { value: 100, configurable: true });
  Object.defineProperty(div, 'scrollWidth', { value: 0, configurable: true });
  Object.defineProperty(div, 'clientWidth', { value: 0, configurable: true });
  return div;
}

function makeFlatDiv(): HTMLDivElement {
  const div = document.createElement('div');
  div.setAttribute(SCROLLABLE_ATTRIBUTE, '');
  Object.defineProperty(div, 'scrollHeight', { value: 100, configurable: true });
  Object.defineProperty(div, 'clientHeight', { value: 100, configurable: true });
  Object.defineProperty(div, 'scrollWidth', { value: 0, configurable: true });
  Object.defineProperty(div, 'clientWidth', { value: 0, configurable: true });
  return div;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('wheelGuard', () => {
  test('returns false for non-wheel events', () => {
    const div = makeOverflowingDiv();
    mount(div);
    expect(wheelGuard({ type: 'click', target: div })).toBe(false);
    expect(wheelGuard({ type: 'pointerdown', target: div })).toBe(false);
  });

  test('returns false when ctrlKey is set (pinch-zoom passthrough)', () => {
    const div = makeOverflowingDiv();
    mount(div);
    expect(wheelGuard(fakeWheel(div, { ctrlKey: true }))).toBe(false);
  });

  test('returns false when metaKey is set (pinch-zoom passthrough)', () => {
    const div = makeOverflowingDiv();
    mount(div);
    expect(wheelGuard(fakeWheel(div, { metaKey: true }))).toBe(false);
  });

  test('returns false when target is null', () => {
    expect(wheelGuard(fakeWheel(null))).toBe(false);
  });

  test('returns false when target is not an Element (e.g. document)', () => {
    expect(wheelGuard(fakeWheel(document))).toBe(false);
  });

  test('returns true for wheel over an overflowing marked div', () => {
    const div = makeOverflowingDiv();
    mount(div);
    expect(wheelGuard(fakeWheel(div))).toBe(true);
  });

  test('returns false for wheel over a non-overflowing marked div', () => {
    const div = makeFlatDiv();
    mount(div);
    expect(wheelGuard(fakeWheel(div))).toBe(false);
  });

  test('returns true for wheel over an overflowing textarea', () => {
    const textarea = document.createElement('textarea');
    Object.defineProperty(textarea, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(textarea, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(textarea, 'scrollWidth', { value: 0, configurable: true });
    Object.defineProperty(textarea, 'clientWidth', { value: 0, configurable: true });
    mount(textarea);
    expect(wheelGuard(fakeWheel(textarea))).toBe(true);
  });

  test('returns false for a non-overflowing textarea', () => {
    const textarea = document.createElement('textarea');
    Object.defineProperty(textarea, 'scrollHeight', { value: 20, configurable: true });
    Object.defineProperty(textarea, 'clientHeight', { value: 20, configurable: true });
    Object.defineProperty(textarea, 'scrollWidth', { value: 0, configurable: true });
    Object.defineProperty(textarea, 'clientWidth', { value: 0, configurable: true });
    mount(textarea);
    expect(wheelGuard(fakeWheel(textarea))).toBe(false);
  });

  test('walks up marked ancestors when the inner one does not overflow', () => {
    const outer = makeOverflowingDiv();
    const inner = document.createElement('textarea');
    // Inner does not overflow — should fall through to outer, which does.
    Object.defineProperty(inner, 'scrollHeight', { value: 10, configurable: true });
    Object.defineProperty(inner, 'clientHeight', { value: 10, configurable: true });
    Object.defineProperty(inner, 'scrollWidth', { value: 0, configurable: true });
    Object.defineProperty(inner, 'clientWidth', { value: 0, configurable: true });
    outer.append(inner);
    mount(outer);
    expect(wheelGuard(fakeWheel(inner))).toBe(true);
  });

  test('returns false when target is outside any marked ancestor', () => {
    const outside = document.createElement('span');
    mount(outside);
    expect(wheelGuard(fakeWheel(outside))).toBe(false);
  });

  test('detects horizontal overflow', () => {
    const div = document.createElement('div');
    div.setAttribute(SCROLLABLE_ATTRIBUTE, '');
    Object.defineProperty(div, 'scrollHeight', { value: 0, configurable: true });
    Object.defineProperty(div, 'clientHeight', { value: 0, configurable: true });
    Object.defineProperty(div, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(div, 'clientWidth', { value: 100, configurable: true });
    mount(div);
    expect(wheelGuard(fakeWheel(div))).toBe(true);
  });
});

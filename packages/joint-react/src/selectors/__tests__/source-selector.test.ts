import { createSourceSelector, getSelectorSource, type SelectorSource } from '../source-selector';
import type { GraphStore } from '../../store/graph-store';

const store = {} as GraphStore;
const unsubscribe = () => {};
const source: SelectorSource<number> = { subscribe: () => unsubscribe, get: () => 7 };

describe('source-selector', () => {
  it('resolves the source of a selector made by createSourceSelector', () => {
    const resolve = jest.fn(() => source);
    const selector = createSourceSelector(resolve, 0);

    expect(getSelectorSource(selector, store)).toBe(source);
    expect(resolve).toHaveBeenCalledWith(store);
  });

  it('has no source for a plain selector or a missing one', () => {
    expect(getSelectorSource(() => 1, store)).toBeUndefined();
    expect(getSelectorSource(undefined, store)).toBeUndefined();
  });

  it('returns the fallback and warns when called directly', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const selector = createSourceSelector(() => source, 42);

    expect(selector()).toBe(42);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

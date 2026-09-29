import { warnUnstableSelector } from '../dev-warnings';

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('warnUnstableSelector', () => {
  it('warns when arrays have same-length objects with identical shallow values', () => {
    const previous = [{ id: 'a', x: 1 }, { id: 'b', x: 2 }];
    const next = [{ id: 'a', x: 1 }, { id: 'b', x: 2 }];
    warnUnstableSelector('useCells', previous, next, false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useCells] Selector returns a new array of objects')
    );
  });

  it('does not warn when custom isEqual is provided', () => {
    const previous = [{ id: 'a' }];
    const next = [{ id: 'a' }];
    warnUnstableSelector('useCells', previous, next, true);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn for primitive arrays', () => {
    warnUnstableSelector('useCells', ['a', 'b'], ['a', 'b'], false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn when arrays have different lengths', () => {
    const previous = [{ id: 'a' }];
    const next = [{ id: 'a' }, { id: 'b' }];
    warnUnstableSelector('useCells', previous, next, false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn when object values actually differ', () => {
    const previous = [{ id: 'a', x: 1 }];
    const next = [{ id: 'a', x: 999 }];
    warnUnstableSelector('useCells', previous, next, false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn for non-array values', () => {
    warnUnstableSelector('useCells', 42, 42, false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn for empty arrays', () => {
    warnUnstableSelector('useCells', [], [], false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns only once per unique key shape', () => {
    const previous1 = [{ id: 'a' }];
    const next1 = [{ id: 'a' }];
    warnUnstableSelector('useCell', previous1, next1, false);
    warnUnstableSelector('useCell', previous1, next1, false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('does not warn when first element refs are identical', () => {
    const record = { id: 'a' };
    warnUnstableSelector('useCells', [record], [record], false);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

import { noopSelector } from '../noop-selector';

describe('noop-selector', () => {
  it('should return the value passed as argument', () => {
    const value = { test: 'value' };
    const result = noopSelector(value);

    expect(result).toBe(value);
  });

  it('should work with primitive values', () => {
    expect(noopSelector(42)).toBe(42);
    expect(noopSelector('string')).toBe('string');
    expect(noopSelector(true)).toBe(true);
    expect(noopSelector(null)).toBe(null);
    expect(noopSelector(undefined as never)).toBe(undefined);
  });

  it('should work with arrays', () => {
    const array = [1, 2, 3];
    const result = noopSelector(array);

    expect(result).toBe(array);
  });

  it('should work with objects', () => {
    const object = { a: 1, b: 2 };
    const result = noopSelector(object);

    expect(result).toBe(object);
  });
});










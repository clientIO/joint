import { makeOptions, assignOptions, dependencyExtract } from '../object-utilities';

describe('object-utilities', () => {
  describe('makeOptions', () => {
    it('should remove undefined values', () => {
      const options = makeOptions({
        width: 100,
        height: 50,
        color: undefined,
      });

      expect(options).toEqual({
        width: 100,
        height: 50,
      });
      expect(options).not.toHaveProperty('color');
    });

    it('should keep all defined values', () => {
      const options = makeOptions({
        width: 100,
        height: 50,
        color: 'red',
      });

      expect(options).toEqual({
        width: 100,
        height: 50,
        color: 'red',
      });
    });

    it('should handle empty object', () => {
      const options = makeOptions({});

      expect(options).toEqual({});
    });
  });

  describe('assignOptions', () => {
    it('should assign new properties and ignore undefined', () => {
      const props = { width: 100, height: 50 };
      const updated = assignOptions(props, {
        width: 200,
        color: undefined as never as string,
      } as never);

      expect(updated).toEqual({
        width: 200,
        height: 50,
      });
      expect(updated).not.toHaveProperty('color');
    });

    it('should not assign if values are equal', () => {
      const props = { width: 100, height: 50 };
      const updated = assignOptions(props, {
        width: 100,
        height: 50,
      });

      expect(updated).toBe(props);
    });

    it('should not assign if values are deeply equal', () => {
      const props = { width: 100, nested: { a: 1 } };
      const updated = assignOptions(props, {
        nested: { a: 1 },
      });

      expect(updated).toBe(props);
    });

    it('should assign new properties', () => {
      const props: Record<string, number> = { width: 100 };
      const updated = assignOptions(props, {
        height: 50,
      });

      expect(updated).toEqual({
        width: 100,
        height: 50,
      });
    });
  });

  describe('dependencyExtract', () => {
    it('should extract all values when no picked set is provided', () => {
      const object = { width: 100, height: 50, color: 'red' };
      const values = dependencyExtract(object);

      expect(values).toEqual([100, 50, 'red']);
    });

    it('should extract only picked values', () => {
      const object = { width: 100, height: 50, color: 'red' };
      const values = dependencyExtract(object, new Set(['width', 'height']));

      expect(values).toEqual([100, 50]);
    });

    it('should return empty array for null object', () => {
      const values = dependencyExtract(null as never);

      expect(values).toEqual([]);
    });

    it('should return empty array for undefined object', () => {
      const values = dependencyExtract(undefined as never);

      expect(values).toEqual([]);
    });

    it('should extract values in object key order', () => {
      const object = { a: 1, b: 2, c: 3, d: 4 };
      const values = dependencyExtract(object, new Set(['c', 'a', 'd']));

      // The function iterates over object keys in insertion order (a, b, c, d)
      // and filters by Set membership, so result is in object key order: a (1), c (3), d (4)
      expect(values).toEqual([1, 3, 4]);
    });
  });
});

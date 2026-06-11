import { element, link, type InferElement, type InferLink } from '../create';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { LINK_MODEL_TYPE } from '../../mvc/link-model';
import type { Computed } from '../../types/cell.types';

/** Compile-time equality assertion — verified by `tsc`, not at runtime. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

describe('element()', () => {
  test('defaults type to "element"', () => {
    expect(element({ id: 'a' }).type).toBe(ELEMENT_MODEL_TYPE);
  });

  test('preserves an explicit (e.g. built-in shape) type', () => {
    expect(element({ id: 'a', type: 'standard.Rectangle' }).type).toBe('standard.Rectangle');
  });

  test('keeps the original data reference (no clone)', () => {
    const data = { label: 'A' };
    const node = element({ id: 'a', data });
    expect(node.data).toBe(data);
  });

  test('does not mutate the input object', () => {
    const input = { id: 'a', position: { x: 1, y: 2 } };
    const node = element(input);
    expect(node).not.toBe(input);
    expect(input).toEqual({ id: 'a', position: { x: 1, y: 2 } });
  });

  test('produces a record GraphProvider-ready shape', () => {
    expect(element({ id: 'a', data: { label: 'A' }, position: { x: 0, y: 0 } })).toEqual({
      id: 'a',
      type: ELEMENT_MODEL_TYPE,
      data: { label: 'A' },
      position: { x: 0, y: 0 },
    });
  });
});

describe('link()', () => {
  test('defaults type to "link"', () => {
    expect(link({ id: 'e', source: 'a', target: 'b' }).type).toBe(LINK_MODEL_TYPE);
  });

  test('preserves an explicit type', () => {
    expect(link({ id: 'e', source: 'a', target: 'b', type: 'standard.Link' }).type).toBe(
      'standard.Link'
    );
  });

  test('keeps the original data reference (no clone)', () => {
    const data = { weight: 2 };
    expect(link({ id: 'e', source: 'a', target: 'b', data }).data).toBe(data);
  });
});

describe('InferElement / InferLink', () => {
  const cells = [
    element({ id: 'a', data: { label: 'A' } }),
    link({ id: 'e', source: 'a', target: 'b', data: { weight: 2 } }),
  ];

  test('runtime cells discriminate by type', () => {
    expect(cells.filter((cell) => cell.type === ELEMENT_MODEL_TYPE)).toHaveLength(1);
    expect(cells.filter((cell) => cell.type === LINK_MODEL_TYPE)).toHaveLength(1);
  });

  // Type-level: InferElement/InferLink pick the right member and data shape.
  type Node = InferElement<typeof cells>;
  type Edge = InferLink<typeof cells>;
  type Assertions = [
    Expect<Equal<Node['data'], { label: string }>>,
    Expect<Equal<Edge['data'], { weight: number }>>,
    // The element variant is selected, not the link variant.
    Expect<Equal<Node['type'], typeof ELEMENT_MODEL_TYPE>>,
    Expect<Equal<Edge['type'], typeof LINK_MODEL_TYPE>>,
    // Composes with Computed for reading hooks.
    Expect<Equal<Computed<Node>['data'], { label: string }>>,
  ];

  test('type assertions hold (placeholder so the block runs)', () => {
    const _assertions: Assertions = [true, true, true, true, true];
    expect(_assertions).toHaveLength(5);
  });
});

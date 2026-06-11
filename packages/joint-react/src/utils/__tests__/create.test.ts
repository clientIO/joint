import type { InferElement, InferLink } from '../create';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { LINK_MODEL_TYPE } from '../../mvc/link-model';
import type { Computed, ElementRecord, LinkRecord } from '../../types/cell.types';

/** Compile-time equality assertion — verified by `tsc`, not at runtime. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

describe('InferElement / InferLink', () => {
  const cells: Array<ElementRecord<{ label: string }> | LinkRecord<{ weight: number }>> = [
    { id: 'a', type: ELEMENT_MODEL_TYPE, data: { label: 'A' } },
    { id: 'e', type: LINK_MODEL_TYPE, source: 'a', target: 'b', data: { weight: 2 } },
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

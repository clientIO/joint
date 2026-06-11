/* eslint-disable @typescript-eslint/no-unused-vars */
import { dia } from '@joint/core';
import { ElementModel } from '../element-model';
import { LinkModel } from '../link-model';
import type { ElementRecord, LinkRecord } from '../../types/cell.types';

/**
 * Type-level contract for {@link ElementModel} / {@link LinkModel} generics —
 * verified by `tsc`. The generic must behave like JointJS's `dia.Element<A>`:
 * the type argument is the FULL attributes hash, so a typed `data` slice (e.g.
 * via `ElementRecord<MyData>`) flows through to `.attributes`.
 *
 * `.attributes` is `Partial<A>` in JointJS core (intentional — Backbone models
 * hold partial attributes), so the resolved `data` type is `MyData | undefined`.
 * The bug this guards against is the OLD intersection signature, which widened
 * `data` to `any` (the base `dia.Element.Attributes` has an `[k: string]: any`
 * index signature that absorbed the typed `data`).
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface NodeData {
  readonly label: string;
  readonly count: number;
}

interface EdgeData {
  readonly weight: number;
}

type ElementData = NonNullable<ElementModel<ElementRecord<NodeData>>['attributes']['data']>;
type LinkData = NonNullable<LinkModel<LinkRecord<EdgeData>>['attributes']['data']>;

type Assertions = [
  // `data` is the typed slice, NOT `any` (Equal<any, NodeData> is false).
  Expect<Equal<ElementData, NodeData>>,
  Expect<Equal<LinkData, EdgeData>>,
  // `ElementModel<A>` is exactly `dia.Element<A>` — the JointJS generic surface.
  Expect<
    ElementModel<ElementRecord<NodeData>> extends dia.Element<ElementRecord<NodeData>>
      ? true
      : false
  >,
  Expect<LinkModel<LinkRecord<EdgeData>> extends dia.Link<LinkRecord<EdgeData>> ? true : false>,
];

describe('ElementModel / LinkModel — JointJS generics', () => {
  it('types the data slice (not any) and constructs', () => {
    const _assertions: Assertions = [true, true, true, true];
    expect(_assertions).toHaveLength(4);

    const node = new ElementModel<ElementRecord<NodeData>>({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      angle: 0,
      data: { label: 'A', count: 1 },
    });
    // Strongly-typed read: `data` is `NodeData | undefined`, `.label` is `string`.
    const label: string | undefined = node.attributes.data?.label;
    expect(label).toBe('A');

    const edge = new LinkModel<LinkRecord<EdgeData>>({
      id: 'e',
      type: 'link',
      source: { id: 'a' },
      target: { id: 'b' },
      data: { weight: 2 },
    });
    const weight: number | undefined = edge.attributes.data?.weight;
    expect(weight).toBe(2);

    // Assignable to the matching dia generic — confirms the jointjs surface.
    const asDiaElement: dia.Element<ElementRecord<NodeData>> = node;
    const asDiaLink: dia.Link<LinkRecord<EdgeData>> = edge;
    expect(asDiaElement).toBeInstanceOf(dia.Element);
    expect(asDiaLink).toBeInstanceOf(dia.Link);
  });

  it('typed get("data") — consumer pattern (e.g. SelectionFramesOptions.style)', () => {
    interface ColorData {
      readonly color: string;
    }
    const model = new ElementModel<ElementRecord<ColorData>>({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      angle: 0,
      data: { color: '#fff' },
    });

    // `Model.get<K>(key): T[K] | undefined`, so `get('data')` is the typed slice.
    const data = model.get('data');
    type GetDataIsTyped = Expect<Equal<typeof data, ColorData | undefined>>;
    const _check: GetDataIsTyped = true;
    expect(_check).toBe(true);

    // `.color` is `string` — the goal. Needs `?.` because `get` is `| undefined`.
    const color: string = model.get('data')?.color ?? 'fallback';
    expect(color).toBe('#fff');
  });
});

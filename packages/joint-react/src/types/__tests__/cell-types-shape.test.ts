import type {
  ElementRecord,
  LinkRecord,
  ResolvedElementRecord,
  ResolvedLinkRecord,
  BaseElementRecord,
  BaseLinkRecord,
} from '../cell.types';

describe('cell.types shape', () => {
  it('ElementRecord absorbs dia.Element.Attributes pass-through', () => {
    const el: ElementRecord<{ label: string }> = {
      id: 'a',
      type: 'element',
      data: { label: 'x' },
      markup: [],
      attrs: { body: { fill: 'red' } },
      embeds: [],
      z: 1,
    };
    expect(el.id).toBe('a');
  });

  it('LinkRecord absorbs dia.Link.Attributes pass-through', () => {
    const link: LinkRecord<{ kind: string }> = {
      id: 'b',
      type: 'link',
      data: { kind: 'sub' },
      router: { name: 'manhattan' },
      connector: { name: 'rounded' },
      labels: [],
    };
    expect(link.id).toBe('b');
  });

  it('ResolvedElementRecord requires position/size/angle/data', () => {
    const r: ResolvedElementRecord<{ x: number }> = {
      id: 'c',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      angle: 0,
      data: { x: 1 },
    };
    expect(r.position.x).toBe(0);
  });

  it('ResolvedLinkRecord requires source/target/data', () => {
    const r: ResolvedLinkRecord<{ k: string }> = {
      id: 'd',
      type: 'link',
      source: { id: 'a' },
      target: { id: 'b' },
      data: { k: 'v' },
    };
    expect(r.data.k).toBe('v');
  });

  it('Base records accept any extra fields (index signature)', () => {
    const b: BaseElementRecord = { type: 'custom', anything: 1 };
    expect(b.anything).toBe(1);
    const l: BaseLinkRecord = { type: 'custom', extra: 'x' };
    expect(l.extra).toBe('x');
  });
});

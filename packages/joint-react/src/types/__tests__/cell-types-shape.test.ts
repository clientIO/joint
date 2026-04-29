import type {
  ElementRecord,
  LinkRecord,
  Computed,
  DiaElementAttributes,
  DiaLinkAttributes,
} from '../cell.types';

describe('cell.types shape', () => {
  it('ElementRecord absorbs dia.Element.Attributes pass-through', () => {
    const element: ElementRecord<{ label: string }> = {
      id: 'a',
      type: 'element',
      data: { label: 'x' },
      markup: [],
      attrs: { body: { fill: 'red' } },
      embeds: [],
      z: 1,
    };
    expect(element.id).toBe('a');
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

  it('Computed<ElementRecord> requires position/size/angle/data', () => {
    const r: Computed<ElementRecord<{ x: number }>> = {
      id: 'c',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      angle: 0,
      data: { x: 1 },
    };
    expect(r.position.x).toBe(0);
  });

  it('Computed<LinkRecord> requires source/target/data', () => {
    const r: Computed<LinkRecord<{ k: string }>> = {
      id: 'd',
      type: 'link',
      source: { id: 'a' },
      target: { id: 'b' },
      data: { k: 'v' },
    };
    expect(r.data.k).toBe('v');
  });

  it('Base records accept any extra fields (index signature)', () => {
    const b: DiaElementAttributes = { type: 'custom', anything: 1 };
    expect(b.anything).toBe(1);
    const l: DiaLinkAttributes = { type: 'custom', extra: 'x' };
    expect(l.extra).toBe('x');
  });
});

import type { dia } from '@joint/core';
import { mapAttributesToLink, mapLinkToAttributes } from '../link-mapper';
import { LINK_MODEL_TYPE } from '../../../models/link-model';
import type { DiaLinkRecord } from '../../../types/cell.types';

describe('mapLinkToAttributes', () => {
  it('preserves a custom type', () => {
    const result = mapLinkToAttributes({
      type: 'custom.Link',
      source: { id: 'a' },
      target: { id: 'b' },
    } as unknown as DiaLinkRecord);
    expect(result.type).toBe('custom.Link');
  });
});

describe('mapAttributesToLink', () => {
  it('returns attrs as-is when no style is present', () => {
    const attributes = { line: { stroke: 'red' } };
    const result = mapAttributesToLink({
      type: LINK_MODEL_TYPE,
      attrs: attributes,
      source: { id: 'a' },
      target: { id: 'b' },
    } as dia.Link.Attributes);

    expect(result.attrs).toEqual(attributes);
    expect(result).not.toHaveProperty('style');
  });

  it('returns style when present and ignores native attrs', () => {
    const style = { stroke: 'red' };
    const result = mapAttributesToLink({
      type: LINK_MODEL_TYPE,
      style,
      attrs: { line: { stroke: 'blue' } },
      source: { id: 'a' },
      target: { id: 'b' },
    } as dia.Link.Attributes);

    expect(result.style).toEqual(style);
    expect(result).not.toHaveProperty('attrs');
  });

  it('returns labels as-is when no labelMap is present', () => {
    const labels: dia.Link.Label[] = [
      { attrs: {}, position: { distance: 0.5 } } as dia.Link.Label,
    ];
    const result = mapAttributesToLink({
      type: LINK_MODEL_TYPE,
      labels,
      source: { id: 'a' },
      target: { id: 'b' },
    } as dia.Link.Attributes);

    expect(result.labels).toEqual(labels);
    expect(result).not.toHaveProperty('labelMap');
  });

  it('merges labelMap from native labels when both are present', () => {
    const labelMap = { a: { text: 'A', position: 0.5, offset: 1 } };
    const labels = [
      {
        id: 'a',
        position: { distance: 0.7, offset: 9 },
      } as dia.Link.Label & { id: string },
    ];
    const result = mapAttributesToLink({
      type: LINK_MODEL_TYPE,
      labelMap,
      labels,
      source: { id: 'a' },
      target: { id: 'b' },
    } as dia.Link.Attributes);

    expect(result.labelMap?.a.position).toBe(0.7);
    expect(result.labelMap?.a.offset).toBe(9);
    expect(result).not.toHaveProperty('labels');
  });
});

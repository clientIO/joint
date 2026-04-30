import type { dia } from '@joint/core';
import { mergeLabelsFromAttributes } from '../convert-labels-reverse';
import type { LinkLabel } from '../../../presets/link-labels';

describe('mergeLabelsFromAttributes', () => {
  it('skips attributeLabels missing id or with id not in dataLabels', () => {
    const dataLabels: Record<string, LinkLabel> = {
      a: { text: 'A' } as LinkLabel,
    };
    const attributeLabels: dia.Link.Label[] = [
      // no id at all -> skipped
      { position: { distance: 0.5 } } as dia.Link.Label,
      // id not in dataLabels -> skipped
      { id: 'missing', position: { distance: 0.7 } } as dia.Link.Label & { id: string },
      // valid case
      { id: 'a', position: { distance: 0.3, offset: 5 } } as dia.Link.Label & { id: string },
    ];

    const result = mergeLabelsFromAttributes(dataLabels, attributeLabels);
    expect(Object.keys(result)).toEqual(['a']);
    expect(result.a.position).toBe(0.3);
    expect(result.a.offset).toBe(5);
  });

  it('removes flat label position when pos.distance is undefined', () => {
    const dataLabels: Record<string, LinkLabel> = {
      a: { text: 'A', position: 0.5, offset: 1 } as LinkLabel,
    };
    const attributeLabels: dia.Link.Label[] = [
      { id: 'a', position: { offset: 7 } } as dia.Link.Label & { id: string },
    ];

    const result = mergeLabelsFromAttributes(dataLabels, attributeLabels);
    expect(result.a.position).toBeUndefined();
    expect(result.a.offset).toBe(7);
  });

  it('removes flat label offset when pos.offset is undefined', () => {
    const dataLabels: Record<string, LinkLabel> = {
      a: { text: 'A', position: 0.5, offset: 2 } as LinkLabel,
    };
    const attributeLabels: dia.Link.Label[] = [
      { id: 'a', position: { distance: 0.9 } } as dia.Link.Label & { id: string },
    ];

    const result = mergeLabelsFromAttributes(dataLabels, attributeLabels);
    expect(result.a.position).toBe(0.9);
    expect(result.a.offset).toBeUndefined();
  });

  it('returns empty merged record when attributeLabels is empty', () => {
    expect(mergeLabelsFromAttributes({}, [])).toEqual({});
  });

  it('keeps the flat label unchanged when the attribute label has no position', () => {
    const dataLabels: Record<string, LinkLabel> = {
      a: { text: 'A', position: 0.5, offset: 1 } as LinkLabel,
    };
    const attributeLabels: dia.Link.Label[] = [
      { id: 'a', attrs: {} } as dia.Link.Label & { id: string },
    ];

    const result = mergeLabelsFromAttributes(dataLabels, attributeLabels);
    expect(result.a.position).toBe(0.5);
    expect(result.a.offset).toBe(1);
  });
});

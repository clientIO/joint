import { linkLabel, linkLabels, type LinkLabel } from '../link-labels';
import { linkAttributes } from '../link-attributes';
import { LinkModel } from '../../mvc/link-model';
import { mapAttributesToLink } from '../../state/data-mapping/link-mapper';

describe('presets / link-labels / linkLabel', () => {
  it('builds a rect-shaped label by default', () => {
    const label = linkLabel({ text: 'hello' });
    expect(label.markup).toBeDefined();
    expect(Array.isArray(label.markup)).toBe(true);
    const [body] = label.markup as Array<{ tagName: string }>;
    expect(body.tagName).toBe('rect');
    expect(label).not.toHaveProperty('size');
  });

  it.each([
    { width: 90, height: 20 },
    { width: 0, height: 0 },
  ])('preserves an explicit size of $width by $height', (size) => {
    const input: LinkLabel = { text: 'label', size };
    const label = linkLabel(input);
    expect(label.size).toEqual(size);
    expect(input).toEqual({ text: 'label', size });
  });

  it('builds an ellipse-shaped label', () => {
    const label = linkLabel({ text: 'x', backgroundShape: 'ellipse' });
    const [body] = label.markup as Array<{ tagName: string }>;
    expect(body.tagName).toBe('ellipse');
    const labelBackgroundAttributes = (label.attrs as { labelBackground: Record<string, unknown> })
      .labelBackground;
    expect(labelBackgroundAttributes.cx).toBe('0');
    expect(labelBackgroundAttributes.rx).toBeDefined();
  });

  it('builds a path-shaped label using SVG path d', () => {
    const label = linkLabel({ text: 'x', backgroundShape: 'M 0 0 L 10 10' });
    const [body] = label.markup as Array<{ tagName: string }>;
    expect(body.tagName).toBe('path');
    const labelBackgroundAttributes = (label.attrs as { labelBackground: Record<string, unknown> })
      .labelBackground;
    expect(labelBackgroundAttributes.d).toBe('M 0 0 L 10 10');
  });

  it('uses calc-expression path with ref', () => {
    const label = linkLabel({ text: 'x', backgroundShape: 'M calc(w) 0 L 10 10' });
    const [body] = label.markup as Array<{ tagName: string }>;
    expect(body.tagName).toBe('path');
    const labelBackgroundAttributes = (label.attrs as { labelBackground: Record<string, unknown> })
      .labelBackground;
    expect(labelBackgroundAttributes.ref).toBe('label');
  });

  it('applies opacity when provided', () => {
    const label = linkLabel({ text: 'x', backgroundOpacity: 0.5 });
    const labelBackgroundAttributes = (label.attrs as { labelBackground: Record<string, unknown> })
      .labelBackground;
    expect(labelBackgroundAttributes.opacity).toBe(0.5);
  });

  it('applies offset when provided', () => {
    const label = linkLabel({ text: 'x', offset: 12 });
    const position = label.position as { distance: number; offset?: number };
    expect(position.offset).toBe(12);
  });

  it('handles numeric backgroundPadding', () => {
    const label = linkLabel({ text: 'x', backgroundPadding: 5 });
    const labelBackgroundAttributes = (label.attrs as { labelBackground: Record<string, unknown> })
      .labelBackground;
    expect(labelBackgroundAttributes.x).toContain('5');
  });

  it('handles partial backgroundPadding object', () => {
    const label = linkLabel({ text: 'x', backgroundPadding: {} });
    expect(label.attrs).toBeDefined();
  });

  it('forwards className and backgroundClassName', () => {
    const label = linkLabel({
      text: 'hi',
      className: 'my-text',
      backgroundClassName: 'my-bg',
    });
    const markup = label.markup as Array<{ className?: string }>;
    expect(markup[0].className).toContain('my-bg');
    expect(markup[1].className).toContain('my-text');
  });
});

describe('presets / link-labels / linkLabels', () => {
  it('converts a record of labels into an array with ids', () => {
    const out = linkLabels({
      a: { text: 'A' },
      b: { text: 'B' },
    });
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('a');
    expect(out[1].id).toBe('b');
  });

  it('merges label style into each label', () => {
    const out = linkLabels(
      { a: { text: 'A' } },
      { color: '#fff' }
    );
    const attributes = out[0].attrs as { label: { style: { fill: string } } };
    expect(attributes.label.style.fill).toBe('#fff');
  });

  it('per-label fields override label style', () => {
    const out = linkLabels(
      { a: { text: 'A', color: '#000' } },
      { color: '#fff' }
    );
    const attributes = out[0].attrs as { label: { style: { fill: string } } };
    expect(attributes.label.style.fill).toBe('#000');
  });

  it('keeps distinct and inherited sizes on the native link labels', () => {
    const input = {
      labelMap: {
        cardinality: { text: '1', size: { width: 16, height: 16 } },
        name: { text: 'authenticate', size: { width: 90, height: 20 } },
        shared: { text: 'shared' },
      },
      labelStyle: { fontSize: 12, size: { width: 70, height: 18 } },
    };
    const link = new LinkModel(linkAttributes(input));
    expect(link.labels().map((label) => label.size)).toEqual([
      { width: 16, height: 16 },
      { width: 90, height: 20 },
      { width: 70, height: 18 },
    ]);
    expect(link.labels().map((label) => label.id)).toEqual(['cardinality', 'name', 'shared']);
    expect(input.labelMap.shared).not.toHaveProperty('size');
    expect(input.labelStyle.size).toEqual({ width: 70, height: 18 });
    link.label(0, { position: { distance: 0.2 } });
    const roundTrip = mapAttributesToLink(link.attributes);
    expect(roundTrip.labelMap?.cardinality.size).toEqual({ width: 16, height: 16 });
    expect(roundTrip.labelMap?.cardinality.position).toBeCloseTo(0.2);
    expect(roundTrip.labelMap?.shared).not.toHaveProperty('size');
  });

  it('leaves a cleared shared size absent for native defaultLabel fallback', () => {
    const input = {
      labelMap: { name: { text: 'request', size: undefined } },
      labelStyle: { fontSize: 12, size: { width: 70, height: 18 } },
      defaultLabel: { size: { width: 50, height: 10 } },
    };
    const link = new LinkModel(linkAttributes(input));
    expect(link.label(0)).not.toHaveProperty('size');
    expect(link.get('defaultLabel').size).toEqual({ width: 50, height: 10 });
  });
});

import { linkLabel, linkLabels } from '../link-labels';

describe('presets / link-labels / linkLabel', () => {
  it('builds a rect-shaped label by default', () => {
    const label = linkLabel({ text: 'hello' });
    expect(label.markup).toBeDefined();
    expect(Array.isArray(label.markup)).toBe(true);
    const [body] = label.markup as Array<{ tagName: string }>;
    expect(body.tagName).toBe('rect');
  });

  it('builds an ellipse-shaped label', () => {
    const label = linkLabel({ text: 'x', backgroundShape: 'ellipse' });
    const [body] = label.markup as Array<{ tagName: string }>;
    expect(body.tagName).toBe('ellipse');
    const labelBodyAttributes = (label.attrs as { labelBody: Record<string, unknown> }).labelBody;
    expect(labelBodyAttributes.cx).toBe('0');
    expect(labelBodyAttributes.rx).toBeDefined();
  });

  it('builds a path-shaped label using SVG path d', () => {
    const label = linkLabel({ text: 'x', backgroundShape: 'M 0 0 L 10 10' });
    const [body] = label.markup as Array<{ tagName: string }>;
    expect(body.tagName).toBe('path');
    const labelBodyAttributes = (label.attrs as { labelBody: Record<string, unknown> }).labelBody;
    expect(labelBodyAttributes.d).toBe('M 0 0 L 10 10');
  });

  it('uses calc-expression path with ref', () => {
    const label = linkLabel({ text: 'x', backgroundShape: 'M calc(w) 0 L 10 10' });
    const [body] = label.markup as Array<{ tagName: string }>;
    expect(body.tagName).toBe('path');
    const labelBodyAttributes = (label.attrs as { labelBody: Record<string, unknown> }).labelBody;
    expect(labelBodyAttributes.ref).toBe('labelText');
  });

  it('applies opacity when provided', () => {
    const label = linkLabel({ text: 'x', backgroundOpacity: 0.5 });
    const labelBodyAttributes = (label.attrs as { labelBody: Record<string, unknown> }).labelBody;
    expect(labelBodyAttributes.opacity).toBe(0.5);
  });

  it('applies offset when provided', () => {
    const label = linkLabel({ text: 'x', offset: 12 });
    const position = label.position as { distance: number; offset?: number };
    expect(position.offset).toBe(12);
  });

  it('handles numeric backgroundPadding', () => {
    const label = linkLabel({ text: 'x', backgroundPadding: 5 });
    const labelBodyAttributes = (label.attrs as { labelBody: Record<string, unknown> }).labelBody;
    expect(labelBodyAttributes.x).toContain('5');
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
    const attributes = out[0].attrs as { labelText: { style: { fill: string } } };
    expect(attributes.labelText.style.fill).toBe('#fff');
  });

  it('per-label fields override label style', () => {
    const out = linkLabels(
      { a: { text: 'A', color: '#000' } },
      { color: '#fff' }
    );
    const attributes = out[0].attrs as { labelText: { style: { fill: string } } };
    expect(attributes.labelText.style.fill).toBe('#000');
  });
});

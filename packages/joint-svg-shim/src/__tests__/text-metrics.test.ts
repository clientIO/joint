/**
 * @jest-environment node
 *
 * Runs in the `node` environment (no `document`). With `@napi-rs/canvas` installed
 * (the package's dev/test setup) widths are exact, font-matched metrics; without
 * it they fall back to a coarse average-glyph estimate. The scaling and ordering
 * properties asserted here hold for both backends — exact-canvas widths are
 * subject to per-glyph kerning, so only font-size scaling is asserted to be
 * strictly linear, not character count.
 */
import { measureText } from '../text-metrics';

describe('measureText', () => {
  it('returns zero width for empty text', () => {
    expect(measureText('', { fontSize: 16 }).width).toBe(0);
  });

  it('produces a positive width and vertical metrics for non-empty text', () => {
    const box = measureText('renderToString', { fontSize: 16 });
    expect(box.width).toBeGreaterThan(0);
    expect(box.ascent).toBeGreaterThan(0);
    expect(box.descent).toBeGreaterThan(0);
  });

  it('scales width linearly with font size', () => {
    const at16 = measureText('renderToString', { fontSize: 16 }).width;
    const at32 = measureText('renderToString', { fontSize: 32 }).width;
    expect(at32).toBeCloseTo(at16 * 2);
  });

  it('scales the vertical box with font size', () => {
    const small = measureText('X', { fontSize: 16 });
    const large = measureText('X', { fontSize: 32 });
    expect(large.ascent + large.descent).toBeCloseTo((small.ascent + small.descent) * 2);
  });

  it('width grows roughly with the character count', () => {
    // Exact canvas metrics include per-glyph kerning, so repeating a glyph is not
    // perfectly N× a single glyph; assert monotonic growth within a loose band.
    const one = measureText('a', { fontSize: 16 }).width;
    const five = measureText('aaaaa', { fontSize: 16 }).width;
    expect(five).toBeGreaterThan(one);
    expect(five).toBeLessThanOrEqual(one * 5 + 1);
    expect(five).toBeGreaterThanOrEqual(one * 4);
  });

  it('width grows with text length', () => {
    const short = measureText('Hi', { fontSize: 16 }).width;
    const long = measureText('a considerably longer label', { fontSize: 16 }).width;
    expect(long).toBeGreaterThan(short);
  });

  it('bold text is at least as wide as regular', () => {
    const regular = measureText('Bold?', { fontSize: 16 }).width;
    const bold = measureText('Bold?', { fontSize: 16, bold: true }).width;
    expect(bold).toBeGreaterThanOrEqual(regular);
  });
});

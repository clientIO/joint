/**
 * @jest-environment node
 *
 * Unit coverage for the theme-font CSS parser. The server measures SVG text at
 * the font the theme applies via CSS classes, so this parsing drives link-label
 * background sizing — it must resolve `var()`, ignore non-text rules, and reject
 * anything that isn't a lone single-class rule.
 *
 * `getTextStyle` (which reads `@joint/react/styles.css` from disk) is exercised
 * end-to-end by the SSR tests; here jest maps `*.css` to a stub, so this file
 * tests the parser directly against synthetic stylesheets.
 */
import { parseTextStyles } from '../text-style';

describe('parseTextStyles — single-class font rules', () => {
  it('collects font properties from a lone single-class rule', () => {
    const map = parseTextStyles('.label { font-size: 11px; font-family: Arial; font-weight: 700; }');
    expect(map.get('label')).toEqual({ fontSize: '11px', fontFamily: 'Arial', fontWeight: '700' });
  });

  it('omits classes that declare no font properties', () => {
    const map = parseTextStyles('.box { fill: red; stroke: blue; }');
    expect(map.has('box')).toBe(false);
  });

  it('merges multiple rules for the same class, later declarations winning', () => {
    const map = parseTextStyles('.label { font-size: 10px; font-family: Arial; } .label { font-size: 12px; }');
    expect(map.get('label')).toEqual({ fontSize: '12px', fontFamily: 'Arial' });
  });
});

describe('parseTextStyles — selector rejection', () => {
  it.each([
    ['descendant', '.a .label { font-size: 11px; }'],
    ['tag-qualified', 'text.label { font-size: 11px; }'],
    ['child combinator', '.a > .label { font-size: 11px; }'],
    ['attribute selector', '.label[data-x] { font-size: 11px; }'],
  ])('ignores a %s selector', (_name, css) => {
    expect(parseTextStyles(css).has('label')).toBe(false);
  });

  it('ignores grouped selectors (only the lone-class member would be ambiguous)', () => {
    const map = parseTextStyles('.a, .label { font-size: 11px; }');
    expect(map.has('label')).toBe(false);
    expect(map.has('a')).toBe(false);
  });
});

describe('parseTextStyles — var() resolution', () => {
  it('resolves a class font from a :root custom property', () => {
    const css = ':root { --label-size: 11px; } .label { font-size: var(--label-size); }';
    expect(parseTextStyles(css).get('label')).toEqual({ fontSize: '11px' });
  });

  it('uses the var() fallback when the property is undefined', () => {
    const map = parseTextStyles('.label { font-size: var(--missing, 9px); }');
    expect(map.get('label')).toEqual({ fontSize: '9px' });
  });

  it('captures the first var in a block and is not corrupted by a `:` in a value', () => {
    const css =
      ':root { --first: 11px; --image: url(http://example.com/x.png); }' +
      ' .label { font-size: var(--first); }';
    expect(parseTextStyles(css).get('label')).toEqual({ fontSize: '11px' });
  });

  it('chains var() references across passes', () => {
    const css = ':root { --base: 11px; --label-size: var(--base); } .label { font-size: var(--label-size); }';
    expect(parseTextStyles(css).get('label')).toEqual({ fontSize: '11px' });
  });
});

describe('parseTextStyles — comments', () => {
  it('strips a comment that would otherwise swallow a rule', () => {
    const css = '.label { font-size: 11px; } /* .other { font-size: 99px; } */ .next { font-size: 12px; }';
    const map = parseTextStyles(css);
    expect(map.get('label')).toEqual({ fontSize: '11px' });
    expect(map.get('next')).toEqual({ fontSize: '12px' });
    expect(map.has('other')).toBe(false);
  });

  it('ignores a `:` inside a comment between declarations', () => {
    const css = ':root { --a: 11px; /* note: keep */ --b: 12px; } .label { font-size: var(--b); }';
    expect(parseTextStyles(css).get('label')).toEqual({ fontSize: '12px' });
  });
});

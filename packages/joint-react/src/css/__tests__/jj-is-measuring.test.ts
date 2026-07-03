import fs from 'node:fs';
import path from 'node:path';

// Regression guard for "HTMLHost focuses only after a requestAnimationFrame":
// useMeasureElement adds `.jj-is-measuring` to the cell view's <g> while it
// measures (to hide a one-frame position flash). That class must NOT make the
// content unfocusable — `visibility: hidden` and `display: none` both block
// programmatic .focus(), so a synchronous focus() on a just-measured node would
// no-op until the class is removed a frame later. Hide via opacity instead,
// which keeps the element focusable.
describe('.jj-is-measuring CSS', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'joint-react.css'), 'utf8');
  const block = /\.jj-is-measuring\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

  it('defines a rule', () => {
    expect(block).not.toBe('');
  });

  it('does not block focus (no visibility:hidden / display:none)', () => {
    expect(block).not.toMatch(/visibility\s*:\s*hidden/);
    expect(block).not.toMatch(/display\s*:\s*none/);
  });

  it('still hides the measurement flash via opacity', () => {
    expect(block).toMatch(/opacity\s*:\s*0/);
  });
});

/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/**
 * @jest-environment node
 *
 * Comprehensive SSR coverage for ELEMENTS: geometry (position, size, angle,
 * z-order), embedding/containers, ports, and raw SVG correctness. Asserts the
 * static `renderToString` output.
 */
import '..';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import type { CellRecord } from '../../types/cell.types';

/**
 * Renders a graph. With no `renderElement` the package default (an `HTMLBox` in
 * a `<foreignObject>`) applies; pass one to render custom SVG instead.
 */
function render(cells: readonly CellRecord[], renderElement?: () => ReactNode): string {
  return renderToString(
    <GraphProvider initialCells={cells}>
      <Paper renderElement={renderElement} style={{ width: 600, height: 420 }} />
    </GraphProvider>
  );
}

describe('SSR elements — geometry', () => {
  it('positions elements via translate(x,y) from the model', () => {
    const html = render([
      { id: 'a', type: 'element', position: { x: 40, y: 40 }, size: { width: 80, height: 40 }, data: {} } as CellRecord,
      { id: 'b', type: 'element', position: { x: 300, y: 200 }, size: { width: 80, height: 40 }, data: {} } as CellRecord,
    ]);
    expect(html).toContain('translate(40,40)');
    expect(html).toContain('translate(300,200)');
  });

  it('rotates elements via a transform attribute', () => {
    const html = render([
      { id: 'r', type: 'element', position: { x: 120, y: 120 }, size: { width: 80, height: 80 }, angle: 45, data: {} } as CellRecord,
    ]);
    expect(html).toContain('rotate(45');
  });

  it('renders elements in ascending z-order', () => {
    const html = render([
      { id: 'high', type: 'element', position: { x: 80, y: 80 }, size: { width: 60, height: 60 }, z: 5, data: {} } as CellRecord,
      { id: 'low', type: 'element', position: { x: 40, y: 40 }, size: { width: 60, height: 60 }, z: 1, data: {} } as CellRecord,
    ]);
    expect(html.indexOf('model-id="low"')).toBeLessThan(html.indexOf('model-id="high"'));
  });
});

describe('SSR elements — embedding / containers', () => {
  it('renders a parent container with its embedded children and an inner link, in order', () => {
    const html = render([
      { id: 'c', type: 'element', position: { x: 40, y: 40 }, size: { width: 320, height: 220 }, z: 1, data: {} } as CellRecord,
      { id: 'k1', type: 'element', position: { x: 70, y: 90 }, size: { width: 80, height: 40 }, parent: 'c', z: 2, data: {} } as CellRecord,
      { id: 'k2', type: 'element', position: { x: 240, y: 160 }, size: { width: 80, height: 40 }, parent: 'c', z: 2, data: {} } as CellRecord,
      { id: 'l', type: 'link', source: { id: 'k1' }, target: { id: 'k2' }, parent: 'c', z: 2 } as CellRecord,
    ]);

    for (const id of ['c', 'k1', 'k2', 'l']) {
      expect(html).toContain(`model-id="${id}"`);
    }
    // Parent before children before the inner link (z-order preserved).
    const order = ['c', 'k1', 'k2', 'l'].map((id) => html.indexOf(`model-id="${id}"`));
    expect(order).toEqual(order.toSorted((first, second) => first - second));
  });
});

describe('SSR elements — ports', () => {
  it('renders a port shape with fill, magnet and label', () => {
    const html = render([
      {
        id: 'p',
        type: 'element',
        position: { x: 40, y: 40 },
        size: { width: 120, height: 60 },
        data: {},
        portMap: { out: { cx: 120, cy: 30, color: '#00ff00', shape: 'ellipse', label: 'OUT' } },
      } as CellRecord,
    ]);

    expect(html).toContain('jj-port');
    expect(html).toMatch(/<ellipse[^>]*jj-port/);
    expect(html).toContain('#00ff00');
    expect(html).toContain('magnet="active"');
    expect(html).toContain('OUT');
  });

  it('supports a rectangular port shape', () => {
    const html = render([
      {
        id: 'p',
        type: 'element',
        position: { x: 40, y: 40 },
        size: { width: 120, height: 60 },
        data: {},
        portMap: { r: { cx: 0, cy: 30, shape: 'rect', color: '#ff8800' } },
      } as CellRecord,
    ]);
    expect(html).toMatch(/<rect[^>]*jj-port/);
  });
});

describe('SSR elements — SVG correctness', () => {
  it('emits a valid <svg> root', () => {
    const html = render([
      { id: 'a', type: 'element', position: { x: 10, y: 10 }, size: { width: 40, height: 40 }, data: {} } as CellRecord,
    ]);
    expect(html).toContain('<svg');
    expect(html).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });

  it('renders <foreignObject> with the correct camelCase casing', () => {
    const html = render([
      { id: 'a', type: 'element', position: { x: 10, y: 10 }, size: { width: 120, height: 60 }, data: { label: 'Hi' } } as CellRecord,
    ]);
    expect(html).toContain('foreignObject');
    expect(html).not.toContain('foreignobject');
    expect(html).toContain('Hi');
  });

  it('serializes SVG presentation attributes from a custom renderElement', () => {
    const html = render(
      [{ id: 'a', type: 'element', position: { x: 10, y: 10 }, size: { width: 80, height: 40 }, data: {} } as CellRecord],
      () => <rect width={80} height={40} fill="red" strokeWidth={2} strokeLinejoin="round" />
    );
    expect(html).toContain('stroke-width="2"');
    expect(html).toContain('stroke-linejoin="round"');
  });
});

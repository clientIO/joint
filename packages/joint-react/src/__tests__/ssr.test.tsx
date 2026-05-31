/**
 * @jest-environment node
 *
 * Server-side rendering smoke tests, run in a real Node environment (no DOM).
 * Contract:
 * - `GraphProvider` (data + context) renders on the server, including children
 *   and data read via hooks like `useCells`.
 * - `Paper` (DOM rendering) degrades gracefully to its host element — it must
 *   not crash the server render.
 */
import { renderToString } from 'react-dom/server';
import { GraphProvider } from '../components/graph/graph-provider';
import { Paper } from '../components/paper/paper';
import { useCells } from '../hooks/use-cells';
import { ELEMENT_MODEL_TYPE } from '../models/element-model';
import type { CellRecord } from '../types/cell.types';

const CELLS: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
];

function CellIds() {
  const cells = useCells();
  return (
    <ul>
      {cells.map((cell) => (
        <li key={cell.id}>{String(cell.id)}</li>
      ))}
    </ul>
  );
}

describe('SSR: node environment, no DOM', () => {
  it('is a real server environment (no DOM globals)', () => {
    expect(globalThis.document).toBeUndefined();
    expect(globalThis.window).toBeUndefined();
    expect(globalThis.ResizeObserver).toBeUndefined();
  });

  it('GraphProvider renders its children on the server', () => {
    let html = '';
    expect(() => {
      html = renderToString(
        <GraphProvider initialCells={CELLS}>
          <div>server-child</div>
        </GraphProvider>
      );
    }).not.toThrow();
    expect(html).toContain('server-child');
  });

  it('exposes graph data to hooks during SSR (useCells works on the server)', () => {
    const html = renderToString(
      <GraphProvider initialCells={CELLS}>
        <CellIds />
      </GraphProvider>
    );
    expect(html).toContain('<li>a</li>');
    expect(html).toContain('<li>b</li>');
  });

  it('Paper degrades gracefully on the server (renders host element, no crash)', () => {
    let html = '';
    expect(() => {
      html = renderToString(
        <GraphProvider initialCells={CELLS}>
          {/* eslint-disable-next-line react-perf/jsx-no-new-function-as-prop */}
          <Paper renderElement={() => <rect />} />
        </GraphProvider>
      );
    }).not.toThrow();
    // The host container renders; the SVG/portal content is client-only.
    expect(html).toContain('<div');
  });
});

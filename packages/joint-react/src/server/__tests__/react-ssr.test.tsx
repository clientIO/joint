/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-array-as-prop */
/**
 * @jest-environment node
 *
 * The headline SSR flow: a plain `<GraphProvider><Paper /></GraphProvider>`
 * tree, rendered with `renderToString`, produces a COMPLETE diagram HTML on the
 * server — positioned nodes, links, and `renderElement` content — with no
 * `ssrMarkup` prop and no separate `renderPaperToStaticMarkup` call.
 *
 * `..` is imported first: it installs the DOM shim (before `@joint/core`
 * is evaluated by the component imports) and registers the server paper renderer
 * that `<Paper>` uses automatically.
 */
import '..';
import { renderToString } from 'react-dom/server';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import { useCell } from '../../hooks/use-cell';
import { useCellId } from '../../hooks/use-cell-id';
import { useCells } from '../../hooks/use-cells';
import { linkRoutingOrthogonal } from '../../presets/link-routing';
import type { CellRecord } from '../../types/cell.types';

const LINK_LINE_TAG = /<path[^>]*jj-link-line[^>]*>/;
const PATH_D_ATTRIBUTE = /\bd="([^"]*)"/;

/** Extracts the `d` of the rendered link line (`jj-link-line`) from SSR HTML. */
function linkLinePath(html: string): string {
  const tag = LINK_LINE_TAG.exec(html)?.[0] ?? '';
  return PATH_D_ATTRIBUTE.exec(tag)?.[1] ?? '';
}

/** Counts path segment commands (`L`/`C`) — more segments means more bends. */
function segmentCount(pathData: string): number {
  return (pathData.match(/[LC]/g) ?? []).length;
}

const CELLS: readonly CellRecord[] = [
  {
    id: 'a',
    type: 'element',
    position: { x: 40, y: 40 },
    size: { width: 120, height: 60 },
    data: { label: 'Node A' },
  } as CellRecord,
  {
    id: 'b',
    type: 'element',
    position: { x: 300, y: 200 },
    size: { width: 120, height: 60 },
    data: { label: 'Node B' },
  } as CellRecord,
  { id: 'l', type: 'link', source: { id: 'a' }, target: { id: 'b' } } as CellRecord,
];

const renderRect = () => <rect width={120} height={60} fill="#3366ff" />;

describe('SSR: <GraphProvider><Paper /> renders a full diagram on the server', () => {
  it('renders positioned nodes, links and SVG renderElement content', () => {
    const html = renderToString(
      <GraphProvider initialCells={CELLS}>
        <Paper renderElement={renderRect} style={{ width: 500, height: 320 }} />
      </GraphProvider>
    );

    expect(html).toContain('<svg');
    expect(html).toContain('<rect');
    expect(html).toContain('<path'); // link
    // Node positions come from the model.
    expect(html).toContain('translate(40,40)');
    expect(html).toContain('translate(300,200)');
    // Links must be visible — not left hidden waiting for client measurement.
    expect(html).not.toContain('visibility:hidden');
    expect(html).not.toContain('visibility: hidden');
  });

  it('renders preset link style (custom arrowhead markup) on the server', () => {
    const cells: readonly CellRecord[] = [
      { id: 'a', type: 'element', position: { x: 40, y: 40 }, size: { width: 120, height: 60 }, data: {} } as CellRecord,
      { id: 'b', type: 'element', position: { x: 300, y: 200 }, size: { width: 120, height: 60 }, data: {} } as CellRecord,
      {
        id: 'l',
        type: 'link',
        source: { id: 'a' },
        target: { id: 'b' },
        style: {
          color: '#38bdf8',
          width: 2,
          targetMarker: { markup: [{ tagName: 'path', attributes: { d: 'M 0 0 L 8 4 L 8 -4 Z' } }] },
        },
      } as CellRecord,
    ];

    const html = renderToString(
      <GraphProvider initialCells={cells}>
        <Paper renderElement={renderRect} style={{ width: 500, height: 320 }} />
      </GraphProvider>
    );

    expect(html).toContain('jj-link-line'); // preset line class applied
    expect(html).toContain('M 0 0 L 8 4'); // custom arrowhead markup rendered
    expect(html).toContain('#38bdf8'); // link color applied to the line
  });

  it('forwards linkRouting to the server so links route identically (no JS-off mismatch)', () => {
    const cells: readonly CellRecord[] = [
      { id: 'a', type: 'element', position: { x: 40, y: 40 }, size: { width: 120, height: 60 }, data: {} } as CellRecord,
      { id: 'b', type: 'element', position: { x: 320, y: 240 }, size: { width: 120, height: 60 }, data: {} } as CellRecord,
      { id: 'l', type: 'link', source: { id: 'a' }, target: { id: 'b' } } as CellRecord,
    ];

    const straightHtml = renderToString(
      <GraphProvider initialCells={cells}>
        <Paper renderElement={renderRect} style={{ width: 520, height: 360 }} />
      </GraphProvider>
    );
    const orthogonalHtml = renderToString(
      <GraphProvider initialCells={cells}>
        <Paper
          renderElement={renderRect}
          style={{ width: 520, height: 360 }}
          linkRouting={linkRoutingOrthogonal({ cornerType: 'line' })}
        />
      </GraphProvider>
    );

    const straightPath = linkLinePath(straightHtml);
    const orthogonalPath = linkLinePath(orthogonalHtml);

    expect(orthogonalPath).not.toBe('');
    // Orthogonal routing bends the link (right-angle segments), so its path has
    // strictly more segments than the straight diagonal default.
    expect(orthogonalPath).not.toBe(straightPath);
    expect(segmentCount(orthogonalPath)).toBeGreaterThan(segmentCount(straightPath));
  });

  it('renders rotated elements via a plain transform attribute', () => {
    const cells: readonly CellRecord[] = [
      {
        id: 'rot',
        type: 'element',
        position: { x: 120, y: 120 },
        size: { width: 80, height: 80 },
        angle: 30,
        data: { label: 'Rotated' },
      } as CellRecord,
    ];
    let html = '';
    expect(() => {
      html = renderToString(
        <GraphProvider initialCells={cells}>
          <Paper renderElement={renderRect} style={{ width: 300, height: 300 }} />
        </GraphProvider>
      );
    }).not.toThrow();
    expect(html).toContain('model-id="rot"');
    expect(html).toContain('rotate(30');
  });

  it('renders the default HTMLBox renderElement with labels', () => {
    const html = renderToString(
      <GraphProvider initialCells={CELLS}>
        <Paper style={{ width: 500, height: 320 }} />
      </GraphProvider>
    );

    expect(html).toContain('foreignObject');
    expect(html).toContain('Node A');
    expect(html).toContain('Node B');
  });

  it('runs useSyncExternalStore hooks (useCell/useCellId/useCells) inside renderElement on the server', () => {
    function NodeWithHooks() {
      const id = useCellId();
      const width = useCell((cell) => cell.size?.width ?? 0);
      const total = useCells((cells) => cells.length);
      return (
        <foreignObject width={120} height={60}>
          <div className="hooked" data-id={String(id)} data-width={width} data-total={total} />
        </foreignObject>
      );
    }

    const html = renderToString(
      <GraphProvider initialCells={CELLS}>
        <Paper renderElement={NodeWithHooks} style={{ width: 500, height: 320 }} />
      </GraphProvider>
    );

    expect(html).toContain('class="hooked"');
    expect(html).toContain('data-id="a"');
    expect(html).toContain('data-id="b"');
    expect(html).toContain('data-width="120"'); // useCell selector resolved from the model
    expect(html).toContain('data-total="3"'); // useCells counted all cells (2 elements + 1 link)
  });

  it('renders custom renderElement reading element data', () => {
    const renderLabel = ({ label }: { label?: string }) => (
      <foreignObject width={120} height={60}>
        <div className="custom-node">{label}</div>
      </foreignObject>
    );
    const html = renderToString(
      <GraphProvider initialCells={CELLS}>
        <Paper renderElement={renderLabel} style={{ width: 500, height: 320 }} />
      </GraphProvider>
    );

    expect(html).toContain('custom-node');
    expect(html).toContain('Node A');
  });
});

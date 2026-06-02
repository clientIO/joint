/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-array-as-prop */
/**
 * @jest-environment node
 *
 * Comprehensive SSR coverage for LINKS: endpoints, vertices, presets (style,
 * markers, routing) and labels. Each case asserts the STATIC `renderToString`
 * output so the JS-disabled first paint matches the interactive client.
 *
 * `..` is imported first so the DOM shim + server renderer install before
 * `@joint/core` is evaluated.
 */
import '..';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import { linkRoutingStraight, linkRoutingSmooth } from '../../presets/link-routing';
import type { LinkStyle } from '../../presets/link-style';
import type { CellRecord } from '../../types/cell.types';
import type { LinkRouting } from '../../presets/link-routing';

const noElement = (): ReactNode => null;

/** Renders a two-element graph joined by one configurable link, returns the HTML. */
function renderLinkGraph(link: Record<string, unknown>, linkRouting?: LinkRouting): string {
  const cells: readonly CellRecord[] = [
    { id: 'a', type: 'element', position: { x: 40, y: 40 }, size: { width: 80, height: 40 }, data: {} } as CellRecord,
    { id: 'b', type: 'element', position: { x: 320, y: 240 }, size: { width: 80, height: 40 }, data: {} } as CellRecord,
    { id: 'l', type: 'link', source: { id: 'a' }, target: { id: 'b' }, ...link } as CellRecord,
  ];
  return renderToString(
    <GraphProvider initialCells={cells}>
      <Paper renderElement={noElement} style={{ width: 520, height: 360 }} linkRouting={linkRouting} />
    </GraphProvider>
  );
}

const LINK_PATH_D = /d="(M[^"]*)"/;

/** First link line `d` in the HTML. */
function linkPath(html: string): string {
  return LINK_PATH_D.exec(html)?.[1] ?? '';
}

describe('SSR links — endpoints & geometry', () => {
  it('renders a link path between two elements', () => {
    const html = renderLinkGraph({ style: { color: '#38bdf8', width: 2 } satisfies LinkStyle });
    expect(html).toContain('jj-link-line');
    expect(linkPath(html)).toMatch(/^M /);
    expect(html).not.toContain('visibility:hidden');
  });

  it('routes through explicit vertices', () => {
    const html = renderLinkGraph({ vertices: [{ x: 250, y: 60 }] });
    // The path must pass through the vertex coordinate.
    expect(linkPath(html)).toContain('250 60');
  });

  it('supports point endpoints (no connected element)', () => {
    const cells: readonly CellRecord[] = [
      { id: 'l', type: 'link', source: { x: 30, y: 30 }, target: { x: 200, y: 150 } } as CellRecord,
    ];
    const html = renderToString(
      <GraphProvider initialCells={cells}>
        <Paper renderElement={noElement} style={{ width: 300, height: 220 }} />
      </GraphProvider>
    );
    expect(linkPath(html)).toBe('M 30 30 L 200 150');
  });
});

describe('SSR links — preset style', () => {
  it('applies color, width, dasharray and a custom class', () => {
    const html = renderLinkGraph({
      style: { color: '#abcdef', width: 3, dasharray: '5,5', className: 'my-link' } satisfies LinkStyle,
    });
    expect(html).toContain('jj-link-line');
    expect(html).toContain('my-link');
    expect(html).toContain('#abcdef');
    expect(html).toMatch(/stroke-dasharray:\s*5,\s*5/);
  });
});

describe('SSR links — markers / arrows', () => {
  it.each(['arrow', 'arrow-open', 'arrow-sunken', 'circle', 'diamond'] as const)(
    'renders the named "%s" target marker',
    (markerName) => {
      const html = renderLinkGraph({ style: { targetMarker: markerName } satisfies LinkStyle });
      expect(html).toContain('<marker');
    }
  );

  it('colors the marker with the link color', () => {
    const html = renderLinkGraph({ style: { color: '#ff00ff', targetMarker: 'diamond' } satisfies LinkStyle });
    expect(html).toMatch(/<marker[^>]*(?:stroke|fill)="#ff00ff"/);
  });

  it('renders both a source and a target marker', () => {
    const html = renderLinkGraph({ style: { sourceMarker: 'circle', targetMarker: 'arrow' } satisfies LinkStyle });
    expect((html.match(/<marker/g) ?? []).length).toBe(2);
  });

  it('renders a custom arrowhead markup', () => {
    const html = renderLinkGraph({
      style: {
        targetMarker: { markup: [{ tagName: 'path', attributes: { d: 'M 0 0 L 8 4 L 8 -4 Z' } }] },
      } satisfies LinkStyle,
    });
    expect(html).toContain('M 0 0 L 8 4');
  });

  it('renders no marker by default', () => {
    const html = renderLinkGraph({ style: { color: '#38bdf8' } satisfies LinkStyle });
    expect(html).not.toContain('<marker');
  });
});

describe('SSR links — routing presets', () => {
  it('smooth routing produces cubic bezier (C) segments', () => {
    const html = renderLinkGraph({}, linkRoutingSmooth());
    expect(linkPath(html)).toContain('C');
  });

  it('straight routing produces a single line segment (no curves)', () => {
    const html = renderLinkGraph({}, linkRoutingStraight());
    const path = linkPath(html);
    expect(path).not.toContain('C');
    expect((path.match(/L/g) ?? []).length).toBe(1);
  });
});

describe('SSR links — labels', () => {
  it('renders a labelMap label as text on the link', () => {
    const html = renderLinkGraph({ labelMap: { main: { text: 'HELLO', backgroundColor: '#222' } } });
    expect(html).toContain('HELLO');
    expect(html).toContain('class="labels"');
  });

  // NOTE: label-background *sizing* depends on `getBBox`/`getComputedTextLength`,
  // which the jest setup (mock-svg in `__mocks__/jest-setup.ts`) stubs to 0. The
  // real text measurement that drives label size is covered deterministically by
  // `text-metrics.test.ts` and `svg-polyfills.test.ts` instead.
});

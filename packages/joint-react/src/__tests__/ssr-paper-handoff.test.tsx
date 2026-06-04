/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/**
 * The SSR round-trip for the automatic `<Paper>` server render:
 *  1. on the server the full diagram (nodes + `renderElement` content) is in the
 *     HTML — first paint with no client JS, and
 *  2. on the client the same tree hydrates and the live, interactive paper takes
 *     over (events drive React state).
 *
 * `../server/register` registers the server renderer; the DOM-shim flag is
 * toggled to reproduce the server→client boundary.
 */
import { useState } from 'react';
import { act, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import type { dia } from '@joint/core';
import '../server';
import { GraphProvider } from '../components/graph/graph-provider';
import { Paper } from '../components/paper/paper';
import { DOM_SHIM_FLAG } from '../utils/ssr';
import type { CellRecord } from '../types/cell.types';

const CELLS: readonly CellRecord[] = [
  { id: '1', type: 'element', position: { x: 10, y: 10 }, size: { width: 60, height: 40 }, data: { label: 'A' } } as CellRecord,
];
const renderRect = () => <rect width={60} height={40} fill="#444" />;
const fakeEvent = {} as dia.Event;

function App({ onClick }: Readonly<{ onClick?: () => void }>) {
  return (
    <GraphProvider initialCells={CELLS}>
      <Paper style={{ width: 100, height: 100 }} renderElement={renderRect} onElementPointerClick={onClick} />
    </GraphProvider>
  );
}

it('server-renders the full diagram (nodes + renderElement) as HTML', () => {
  const globalScope = globalThis as Record<string, unknown>;
  globalScope[DOM_SHIM_FLAG] = true;
  let html = '';
  try {
    html = renderToString(<App />);
  } finally {
    Reflect.deleteProperty(globalScope, DOM_SHIM_FLAG);
  }
  expect(html).toContain('joint-cells');
  expect(html).toContain('translate(10,10)'); // node position from the model
  expect(html).toContain('<rect'); // renderElement content
});

it('hydrates to a live interactive paper on the client (events drive state)', async () => {
  let paper: dia.Paper | null = null;
  const setPaper = (instance: dia.Paper | null) => {
    if (instance) paper = instance;
  };

  function ClientApp() {
    const [clicks, setClicks] = useState(0);
    return (
      <GraphProvider initialCells={CELLS}>
        <output data-testid="clicks">{clicks}</output>
        <Paper
          ref={setPaper}
          style={{ width: 100, height: 100 }}
          renderElement={renderRect}
          onElementPointerClick={() => setClicks((value) => value + 1)}
        />
      </GraphProvider>
    );
  }

  const container = document.createElement('div');
  document.body.append(container);
  await act(async () => {
    hydrateRoot(container, <ClientApp />);
  });

  await waitFor(() => {
    expect(paper).not.toBeNull();
    expect(container.querySelector('.joint-cells')).toBeTruthy();
  });

  const livePaper = paper as unknown as dia.Paper;
  const view = livePaper.findViewByModel(livePaper.model.getCell('1'));
  expect(view).toBeTruthy();
  act(() => {
    livePaper.trigger('element:pointerclick', view, fakeEvent, 5, 5);
  });
  await waitFor(() => {
    expect(container.querySelector('[data-testid="clicks"]')?.textContent).toBe('1');
  });
});

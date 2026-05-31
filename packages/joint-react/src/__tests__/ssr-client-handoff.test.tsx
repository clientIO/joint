/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/**
 * SSR → client handoff: a tree authored to be server-rendered is hydrated on
 * the client, and we assert the full interactive surface works afterwards —
 * Paper mounts its real canvas, JointJS events fire, the normalized event
 * props invoke their handlers, and React state updates re-render.
 *
 * (jsdom = the client/browser side of the handoff. The server side — that
 * `GraphProvider` renders to HTML at all — is covered by `ssr.test.tsx`.)
 */
import { useState } from 'react';
import { act, waitFor } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import type { dia } from '@joint/core';
import { GraphProvider } from '../components/graph/graph-provider';
import { Paper } from '../components/paper/paper';
import { ELEMENT_MODEL_TYPE } from '../models/element-model';
import type { CellRecord } from '../types/cell.types';

const CELLS: readonly CellRecord[] = [
  { id: '1', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 50, height: 50 } } as CellRecord,
];
const renderRect = () => <rect />;
const fakeEvent = {} as dia.Event;

it('hydrates a server tree and Paper is fully interactive on the client (events + state)', async () => {
  let paper: dia.Paper | null = null;
  const setPaper = (instance: dia.Paper | null) => {
    if (instance) paper = instance;
  };

  function App() {
    // React state driven by a JointJS paper event — proves the full loop.
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

  // Hydrate on the client (as it would after SSR delivered the markup).
  await act(async () => {
    hydrateRoot(container, <App />);
  });

  // 1) Paper mounted its real canvas on the client.
  await waitFor(() => {
    expect(container.querySelector('svg')).toBeTruthy();
    expect(paper).not.toBeNull();
  });

  const livePaper = paper as unknown as dia.Paper;

  // 2) The element view exists (JointJS rendered the cell).
  const view = livePaper.findViewByModel(livePaper.model.getCell('1'));
  expect(view).toBeTruthy();

  // 3) A paper event fires → normalized handler runs → React state updates → re-render.
  act(() => {
    livePaper.trigger('element:pointerclick', view, fakeEvent, 5, 5);
  });
  await waitFor(() => {
    expect(container.querySelector('[data-testid="clicks"]')?.textContent).toBe('1');
  });

  // 4) It keeps working — second event, state advances again.
  act(() => {
    livePaper.trigger('element:pointerclick', view, fakeEvent, 6, 6);
  });
  await waitFor(() => {
    expect(container.querySelector('[data-testid="clicks"]')?.textContent).toBe('2');
  });
});

/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { StrictMode } from 'react';
import { dia } from '@joint/core';
import { render } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { PaperView } from '../../mvc/paper';

/**
 * An *external* paper passed via `<Paper paper={...}>` is owned by whoever
 * created it (e.g. `<Stencil>`'s drag paper), not by the `<Paper>` wrapper.
 * The wrapper adopts it for rendering, so it must never remove or disable it —
 * otherwise StrictMode's mount → cleanup → mount cycle (and ordinary unmounts)
 * kill a paper its owner still relies on, which surfaces as
 * "can not unfreeze the paper after it was removed" and a dead drag preview.
 */
describe('useCreatePortalPaper — external (adopted) paper lifecycle', () => {
  it('does not throw "can not unfreeze" when mounted under StrictMode', () => {
    const graph = new dia.Graph();
    const externalPaper = new PaperView({ model: graph, async: true });

    expect(() =>
      render(
        <StrictMode>
          <GraphProvider graph={graph}>
            <Paper paper={externalPaper} renderElement={() => <rect />} />
          </GraphProvider>
        </StrictMode>
      )
    ).not.toThrow();
  });

  it('leaves the external paper alive after the wrapper unmounts', () => {
    const graph = new dia.Graph();
    const externalPaper = new PaperView({ model: graph, async: true });

    const { unmount } = render(
      <GraphProvider graph={graph}>
        <Paper paper={externalPaper} renderElement={() => <rect />} />
      </GraphProvider>
    );

    unmount();

    // A removed async paper throws on `unfreeze()`. If the wrapper wrongly
    // removed the adopted paper, this throws; the owner is still free to use it.
    expect(() => externalPaper.unfreeze()).not.toThrow();
  });
});

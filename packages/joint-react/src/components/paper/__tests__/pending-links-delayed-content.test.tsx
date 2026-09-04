import { useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { GraphProvider, Paper } from '../../..';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import { PaperView } from '../../../mvc/paper';
import { DEFAULT_CELL_NAMESPACE } from '../../../store/graph-store';

const PAPER_STYLE = { width: 400, height: 400 } as const;

// Reveal setters captured per mounted node so the test can flip content
// through CHILD-ONLY state updates — the parent portal hook must not
// re-render for the link to become visible.
const reveals: Array<(ready: boolean) => void> = [];

function DelayedNode() {
  const [ready, setReady] = useState(false);
  reveals.push(setReady);
  return ready ? <text>content</text> : null;
}
const renderDelayed = () => <DelayedNode />;

function elementJSON(id: string, x: number): dia.Cell.JSON {
  return {
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x, y: 0 },
    size: { width: 20, height: 20 },
  };
}

// A link is parked with `visibility: hidden` while its endpoints' React
// content has not painted. Content that arrives LATER through a child-only
// update (local state, Suspense) mounts into the portal without re-rendering
// the portal hook and without any joint render — the link must still be
// revealed.
describe('pending links — endpoint content mounting after a delay', () => {
  it('reveals the link once delayed endpoint content paints', async () => {
    reveals.length = 0;
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    graph.addCells([
      elementJSON('e1', 0),
      elementJSON('e2', 100),
      { id: 'l1', type: 'standard.Link', source: { id: 'e1' }, target: { id: 'e2' } },
    ]);

    const { container } = render(
      <GraphProvider graph={graph}>
        <Paper style={PAPER_STYLE} id="delayed-content-paper" renderElement={renderDelayed} />
      </GraphProvider>
    );

    // Both endpoints render null → the link parks hidden.
    await waitFor(() => {
      expect(reveals.length).toBeGreaterThanOrEqual(2);
      const linkNode = container.querySelector('[model-id="l1"]') as HTMLElement | null;
      expect(linkNode).not.toBeNull();
      expect(linkNode!.style.visibility).toBe('hidden');
    });

    // Child-only updates: only the node components re-render.
    await act(async () => {
      for (const reveal of reveals) reveal(true);
    });

    await waitFor(() => {
      const linkNode = container.querySelector('[model-id="l1"]') as HTMLElement | null;
      expect(linkNode!.style.visibility).not.toBe('hidden');
    });
  });

  it('parking many links stays linear in portal lookups', async () => {
    // Regression guard for the O(N²) shape: observing endpoints must not
    // re-walk every already-parked link (each walk pays portal lookups per
    // link). With N chained links, linear bookkeeping needs a few lookups
    // per link; the quadratic walk needs ~N²/2 and blows the budget.
    reveals.length = 0;
    const LINKS = 300;
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    const cells: dia.Cell.JSON[] = [];
    for (let index = 0; index <= LINKS; index += 1) cells.push(elementJSON(`e${index}`, index * 30));
    for (let index = 0; index < LINKS; index += 1) {
      cells.push({
        id: `l${index}`,
        type: 'standard.Link',
        source: { id: `e${index}` },
        target: { id: `e${index + 1}` },
      });
    }
    graph.addCells(cells);

    const spy = jest.spyOn(PaperView.prototype, 'getCellViewPortalNode');
    const { container } = render(
      <GraphProvider graph={graph}>
        <Paper style={PAPER_STYLE} id="linear-park-paper" renderElement={renderDelayed} />
      </GraphProvider>
    );
    await waitFor(() => {
      const linkNode = container.querySelector('[model-id="l0"]') as HTMLElement | null;
      expect(linkNode!.style.visibility).toBe('hidden');
    });

    expect(spy.mock.calls.length).toBeLessThan(LINKS * 20);
    spy.mockRestore();
  });
});

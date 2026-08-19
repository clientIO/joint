import { Component, type ReactNode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { GraphProvider, Paper } from '../..';
import { useCell } from '../../../hooks/use-cell';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import { DEFAULT_CELL_NAMESPACE } from '../../../store/graph-store';
import type { Computed, ElementRecord } from '../../../types/cell.types';

interface NodeData {
  readonly label: string;
}

// Surfaces an error thrown anywhere in its subtree so the test can assert on
// it instead of the throw tearing down the whole test render.
class CatchErrorBoundary extends Component<
  Readonly<{ onCatch: (error: Error) => void; children: ReactNode }>,
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    this.props.onCatch(error);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

const caughtState: { error: Error | null } = { error: null };
function captureError(error: Error) {
  caughtState.error = error;
}

// Subscribes to its own cell — the same shape a content-sized node gets from
// useMeasureElement, so the scenario needs no explicit useCell in app code.
function SubscribingNode() {
  const label = useCell((cell: Computed<ElementRecord<NodeData>>) => cell.data.label);
  return <text>{label}</text>;
}
const renderSubscribing = () => <SubscribingNode />;

const PAPER_STYLE = { width: 400, height: 400 } as const;

function elementJSON(id: string, index = 0): dia.Cell.JSON {
  return {
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x: (index % 10) * 20, y: Math.floor(index / 10) * 20 },
    size: { width: 10, height: 10 },
    data: { label: `label-${id}` },
  };
}

function createExternalGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

// Customer scenario: the app owns an external dia.Graph and mutates it
// imperatively (fromJSON load, stencil drop add→remove→re-add churn,
// CommandManager undo/redo). React content must follow every membership
// change of the graph — even when a coalesced commit keeps the cell COUNT
// unchanged while swapping ids.
describe('GraphProvider — imperative external-graph churn', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('paints a cell swapped in during a same-tick remove+add (stencil churn)', async () => {
    const graph = createExternalGraph();
    graph.addCell(elementJSON('a'));

    const { container } = render(
      <GraphProvider graph={graph}>
        <Paper style={PAPER_STYLE} id="churn-swap-paper" renderElement={renderSubscribing} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(container.textContent).toContain('label-a');
    });

    // Same tick: remove 'a', add 'b'. Both mutations coalesce into a single
    // container commit whose net size is unchanged.
    await act(async () => {
      graph.removeCells([graph.getCell('a')]);
      graph.addCell(elementJSON('b', 1));
    });

    await waitFor(() => {
      expect(container.textContent).toContain('label-b');
      expect(container.textContent).not.toContain('label-a');
    });
  });

  it('paints new cells after graph.fromJSON reload with the same cell count', async () => {
    const graph = createExternalGraph();
    graph.addCell(elementJSON('a'));
    graph.addCell(elementJSON('b', 1));

    const { container } = render(
      <GraphProvider graph={graph}>
        <Paper style={PAPER_STYLE} id="churn-fromjson-paper" renderElement={renderSubscribing} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(container.textContent).toContain('label-a');
      expect(container.textContent).toContain('label-b');
    });

    // Imperative reload: same count, entirely different ids.
    await act(async () => {
      graph.fromJSON({ cells: [elementJSON('c'), elementJSON('d', 1)] });
    });

    await waitFor(() => {
      expect(container.textContent).toContain('label-c');
      expect(container.textContent).toContain('label-d');
      expect(container.textContent).not.toContain('label-a');
    });
  });

  it('survives delete + undo-style re-add above the deferred-rendering threshold (>100 cells)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    caughtState.error = null;

    const graph = createExternalGraph();
    const cellCount = 120;
    for (let index = 0; index < cellCount; index++) {
      graph.addCell(elementJSON(`el-${index}`, index));
    }

    const { container } = render(
      <CatchErrorBoundary onCatch={captureError}>
        <GraphProvider graph={graph}>
          <Paper style={PAPER_STYLE} id="churn-undo-paper" renderElement={renderSubscribing} />
        </GraphProvider>
      </CatchErrorBoundary>
    );

    await waitFor(() => {
      expect(container.textContent).toContain('label-el-119');
    });

    const removedJSON = graph.getCell('el-115').toJSON();

    // Delete — above the threshold the portal tree renders once more from the
    // deferred (stale) id list while the store no longer has the cell.
    await act(async () => {
      graph.removeCells([graph.getCell('el-115')]);
    });

    await waitFor(() => {
      expect(container.textContent).not.toContain('label-el-115');
    });
    expect(caughtState.error).toBeNull();

    // Undo — CommandManager restores the cell by re-adding the same JSON.
    await act(async () => {
      graph.addCell(removedJSON);
    });

    await waitFor(() => {
      expect(container.textContent).toContain('label-el-115');
    });
    expect(caughtState.error).toBeNull();
  });
});

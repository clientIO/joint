/**
 * Specification for how many events `useOnElementsMeasured` delivers.
 *
 * The hook exists so an application can run a layout once element sizes are
 * known. That only works if one settled change delivers exactly one event: a
 * layout must not run while a newly added element is still at its `{0,0}`
 * default, and it must not run several times for the same change.
 *
 * "Settled" means every element in the graph has a size. An element added with
 * a size is settled on arrival; one added without a size settles when the
 * measurement pipeline writes its measured size, which these tests simulate
 * with an `autoSize` write, the same option `GraphStore` uses.
 *
 * The probe is mounted beside `<Paper>`, not inside `renderElement`, so exactly
 * one instance of the hook is under test. Mounting it inside `renderElement`
 * would create one instance per element and count their separate events.
 *
 * These tests describe intended behaviour and several of them fail today.
 */
import { render, waitFor, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import { useOnElementsMeasured } from '../use-on-elements-measured';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { AUTO_SIZE_OPTION } from '../../store/graph-store';
import type { CellRecord } from '../../types/cell.types';
import type { dia } from '@joint/core';

const PAPER_ID = 'events-paper';
const PAPER_STYLE = { width: 100, height: 100 };
const renderElement = () => <rect />;

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/** An element that arrives with a size: nothing to measure. */
const sized = (id: string): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  }) as CellRecord;

/** An element that arrives without a size: `ElementModel` defaults it to `{0,0}`. */
const unsized = (id: string): CellRecord =>
  ({ id, type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 } }) as CellRecord;

/**
 * One delivered event, reduced to what these tests assert on. Keeping the full
 * payload would print the whole `paper` on any failure.
 */
interface RecordedEvent {
  readonly isInitial: boolean;
}

interface Harness {
  readonly graph: dia.Graph;
  readonly events: RecordedEvent[];
}

/** Renders a graph with one hook instance mounted beside the paper. */
function renderGraph(initialCells: CellRecord[]): Harness {
  const events: RecordedEvent[] = [];
  let graph: dia.Graph | undefined;

  function Probe() {
    const { graph: currentGraph } = useGraphStore();
    graph = currentGraph;
    useOnElementsMeasured(PAPER_ID, ({ isInitial }) => {
      events.push({ isInitial });
    });
    return null;
  }

  render(
    <GraphProvider initialCells={initialCells}>
      <Paper id={PAPER_ID} style={PAPER_STYLE} renderElement={renderElement} />
      <Probe />
    </GraphProvider>
  );

  return { graph: graph as dia.Graph, events };
}

/** Simulates the measurement pipeline writing a measured size. */
function measure(graph: dia.Graph, ...ids: string[]) {
  act(() => {
    for (const id of ids) {
      (graph.getCell(id) as dia.Element).set(
        'size',
        { width: 120, height: 40 },
        { [AUTO_SIZE_OPTION]: true } as object
      );
    }
  });
}

/** Waits for the seed pass, then clears it so a test counts only its own events. */
async function settleAndClear(harness: Harness) {
  await waitFor(() => expect(harness.events.length).toBeGreaterThan(0));
  await flush();
  harness.events.length = 0;
}

describe('useOnElementsMeasured — one event per settled change', () => {
  it('delivers one event for the seed pass', async () => {
    const harness = renderGraph([sized('a')]);

    await waitFor(() => expect(harness.events.length).toBeGreaterThan(0));
    await flush();

    expect(harness.events).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });

  it('delivers one event when an element that needs no measuring is added', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(sized('b') as never);
    });
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('delivers no event while an added element is still unmeasured', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(unsized('b') as never);
    });
    await flush();

    expect(harness.events).toHaveLength(0);
  });

  it('delivers one event once the added element has been measured', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(unsized('b') as never);
    });
    await flush();
    measure(harness.graph, 'b');
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('delivers one event for two added elements that both arrive with a size', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCells([sized('b'), sized('c')] as never);
    });
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('delivers one event for two added elements that both need measuring', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCells([unsized('b'), unsized('c')] as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    measure(harness.graph, 'b', 'c');
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('delivers one event for a mixed batch, once the unmeasured element is measured', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCells([sized('b'), unsized('c')] as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    measure(harness.graph, 'c');
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('reports isInitial on the first event only', async () => {
    const harness = renderGraph([sized('a')]);

    await waitFor(() => expect(harness.events.length).toBeGreaterThan(0));
    await flush();

    act(() => {
      harness.graph.addCell(unsized('b') as never);
    });
    await flush();
    measure(harness.graph, 'b');
    await flush();

    act(() => {
      harness.graph.addCell(sized('c') as never);
    });
    await flush();

    const initial = harness.events.filter((event) => event.isInitial);
    expect(initial).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });
});

describe('useOnElementsMeasured — a graph reset starts a new measurement history', () => {
  // Resetting the graph replaces the diagram, so the next pass is that
  // diagram's first one: a consumer that fits the paper on `isInitial` has a
  // new set of contents to fit.
  it('reports isInitial again after the graph is reset with sized elements', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.resetCells([sized('x'), sized('y')] as never);
    });
    await flush();

    expect(harness.events).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });

  it('reports isInitial again after a reset, once the new elements are measured', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.resetCells([unsized('x'), unsized('y')] as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    measure(harness.graph, 'x', 'y');
    await flush();

    expect(harness.events).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });

  it('reports isInitial once per reset, not on later changes', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.resetCells([sized('x')] as never);
    });
    await flush();
    act(() => {
      harness.graph.addCell(sized('y') as never);
    });
    await flush();

    const initial = harness.events.filter((event) => event.isInitial);
    expect(initial).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });
});

describe('useOnElementsMeasured — sizes written by the application', () => {
  // An application may size elements itself rather than leave it to the
  // measurement pipeline, for instance by measuring its own text and calling
  // `resize()`. Whether such a write is worth an event depends on what it does
  // to the graph, not on who wrote it.

  // #3514: a layout that resizes cells must not re-enter its own callback. The
  // graph was settled before the write and is settled after it, so nothing
  // about readiness changed.
  it('delivers no event when the application resizes an element that already has a size', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      (harness.graph.getCell('a') as dia.Element).resize(70, 70);
    });
    await flush();

    expect(harness.events).toHaveLength(0);
  });

  // The mirror image: this write is what makes the graph settled, so it is the
  // event a consumer is waiting for. Suppressing every application resize
  // loses it, and the graph is then fully sized with nobody told.
  it('delivers one event when the application sizes an element that had none', async () => {
    const harness = renderGraph([sized('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(unsized('b') as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    harness.events.length = 0;
    act(() => {
      (harness.graph.getCell('b') as dia.Element).resize(120, 40);
    });
    await flush();

    expect(harness.events).toHaveLength(1);
  });
});

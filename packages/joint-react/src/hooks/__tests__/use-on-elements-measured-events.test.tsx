/**
 * Specification for when `useOnElementsMeasured` delivers an event.
 *
 * The hook exists so an application can run a layout once element sizes are
 * known. That only works if one settled change delivers exactly one event: a
 * layout must not run while an element is still waiting to be measured, and it
 * must not run several times for the same change.
 *
 * An element is pending only when something is actually going to measure it.
 * Here that is real: a `plain()` element renders as an SVG `<rect>` and nothing
 * ever measures it, so it is settled the moment it is added, whatever its size.
 * A `pending()` element renders through `<HTMLHost>`, which calls
 * `useMeasureElement` and registers the node with the store's observer, so it
 * stays outstanding until a measured size arrives. `measured()` writes that
 * size with the `autoSize` option, exactly as the observer pipeline does —
 * jsdom's `ResizeObserver` is a no-op mock, so it never reports on its own.
 *
 * The probe is mounted beside `<Paper>`, not inside `renderElement`, so exactly
 * one instance of the hook is under test. Mounting it inside `renderElement`
 * would create one instance per element and count their separate events.
 *
 * These tests describe intended behaviour. Several fail today, because the
 * store bumps its measure state whenever any element has a size rather than
 * when nothing is left outstanding.
 */
import { render, waitFor, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import { HTMLHost } from '../../components/html-host';
import { useOnElementsMeasured } from '../use-on-elements-measured';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { AUTO_SIZE_OPTION } from '../../store/graph-store';
import type { CellRecord } from '../../types/cell.types';
import type { dia } from '@joint/core';

const PAPER_ID = 'events-paper';
const PAPER_STYLE = { width: 100, height: 100 };

/**
 * Lets everything settle: React effects, the scheduler's microtask batch, and
 * the commit in which a newly added element's portal mounts and registers with
 * the observer. A microtask alone lands before that portal exists.
 */
const flush = () =>
  act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });

/** Elements flagged in their `data` render through a host that measures itself. */
const renderElement = ({ measured }: { measured?: boolean }) =>
  measured ? <HTMLHost>node</HTMLHost> : <rect width={50} height={50} />;

/** Renders as a plain `<rect>`: nothing measures it, so it is settled on arrival. */
const plain = (id: string): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    data: {},
  }) as CellRecord;

/** Renders through `<HTMLHost>`: registers for measurement and waits for a size. */
const pending = (id: string): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    data: { measured: true },
  }) as CellRecord;

/** One delivered event, reduced to what these tests assert on. */
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

/** The write the measurement pipeline makes once a node has been measured. */
function reportMeasurement(graph: dia.Graph, ...ids: string[]) {
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
    const harness = renderGraph([plain('a')]);

    await waitFor(() => expect(harness.events.length).toBeGreaterThan(0));
    await flush();

    expect(harness.events).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });

  it('delivers one event when an element nothing measures is added', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(plain('b') as never);
    });
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('delivers no event while an added element is waiting to be measured', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(pending('b') as never);
    });
    await flush();

    expect(harness.events).toHaveLength(0);
  });

  it('delivers one event once the added element has been measured', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(pending('b') as never);
    });
    await flush();
    reportMeasurement(harness.graph, 'b');
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('delivers one event for two added elements that nothing measures', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCells([plain('b'), plain('c')] as never);
    });
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('delivers one event for two added elements that both wait to be measured', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCells([pending('b'), pending('c')] as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    reportMeasurement(harness.graph, 'b', 'c');
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  // The mixed diagram: one element is settled on arrival, the other is not.
  // The event belongs to the batch, not to either element, so it waits for the
  // one that is still outstanding and then fires once.
  it('delivers one event for a batch mixing a plain element with one that waits', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCells([plain('b'), pending('c')] as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    reportMeasurement(harness.graph, 'c');
    await flush();

    expect(harness.events).toHaveLength(1);
  });

  it('reports isInitial on the first event only', async () => {
    const harness = renderGraph([plain('a')]);

    await waitFor(() => expect(harness.events.length).toBeGreaterThan(0));
    await flush();

    act(() => {
      harness.graph.addCell(pending('b') as never);
    });
    await flush();
    reportMeasurement(harness.graph, 'b');
    await flush();

    act(() => {
      harness.graph.addCell(plain('c') as never);
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
  it('reports isInitial again after the graph is reset', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.resetCells([plain('x'), plain('y')] as never);
    });
    await flush();

    expect(harness.events).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });

  it('reports isInitial after a reset, once the new elements are measured', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.resetCells([pending('x'), pending('y')] as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    reportMeasurement(harness.graph, 'x', 'y');
    await flush();

    expect(harness.events).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });

  it('reports isInitial once per reset, not on later changes', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.resetCells([plain('x')] as never);
    });
    await flush();
    act(() => {
      harness.graph.addCell(plain('y') as never);
    });
    await flush();

    const initial = harness.events.filter((event) => event.isInitial);
    expect(initial).toHaveLength(1);
    expect(harness.events[0].isInitial).toBe(true);
  });
});

// A size written by the application never produces an event. Either the
// element is settled already, in which case nothing about readiness changed, or
// it is waiting to be measured, in which case the measurement is still owed and
// will overwrite the write anyway.
describe('useOnElementsMeasured — sizes written by the application', () => {
  // #3514: a layout that resizes cells must not re-enter its own callback.
  // Nothing was outstanding before the write and nothing is after it.
  it('delivers no event when the application resizes an element nothing measures', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      (harness.graph.getCell('a') as dia.Element).resize(70, 70);
    });
    await flush();

    expect(harness.events).toHaveLength(0);
  });

  // A resize does not discharge a pending measurement. The element is still
  // registered, the measured size will overwrite this one, and the library
  // already warns about it (`warnResizeOnAutoSizedElement`). So the element is
  // outstanding until it is measured, whatever size it happens to hold: what
  // the hook waits on is the measurement, not the presence of a size.
  it('delivers no event when the application sizes an element that is waiting', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(pending('b') as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    act(() => {
      (harness.graph.getCell('b') as dia.Element).resize(120, 40);
    });
    await flush();

    expect(harness.events).toHaveLength(0);

    reportMeasurement(harness.graph, 'b');
    await flush();

    expect(harness.events).toHaveLength(1);
  });
});

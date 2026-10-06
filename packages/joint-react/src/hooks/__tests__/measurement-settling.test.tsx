/**
 * Scenarios beyond the #3520 specification in `measurement-events`:
 * an element the paper does not render, a waiting element that is removed, and
 * a content change that re-measures. Same harness and helpers as the spec,
 * except that `flush()` also awaits the paper's render frame, in which a newly
 * added element's view mounts and its portal content registers a measurer.
 */
import { render, waitFor, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import { HTMLHost } from '../../components/html-host';
import { useOnCellsChange } from '../use-on-cells-change';
import { useGraphStore } from '../use-graph-store';
import { selectMeasuredState } from '../../selectors';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';
import type { PaperProps } from '../../components/paper/paper.types';
import type { dia } from '@joint/core';

const PAPER_ID = 'events-paper';
const PAPER_STYLE = { width: 100, height: 100 };

/**
 * Lets everything settle: React effects, the scheduler's microtask batch, the
 * paper's render frame (`requestAnimationFrame`) in which a newly added
 * element's view mounts, and the commit after it in which the element's portal
 * content mounts and registers with the observer. A microtask, or a plain
 * `setTimeout`, lands before that frame, while the portal does not exist yet.
 */
const flush = () =>
  act(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });

/** Elements flagged in their `data` render through a host that measures itself. */
const renderElement = ({ measured, label = 'node' }: { measured?: boolean; label?: string }) =>
  measured ? <HTMLHost>{label}</HTMLHost> : <rect width={50} height={50} />;

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

/**
 * Zero-sized on purpose and never measured: a layout anchor, the shape a
 * `scalable`-free diagram uses to mark a position without drawing anything.
 * Its size is its real size, not a size it is waiting for.
 */
const anchor = (id: string): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    data: {},
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
function renderGraph(initialCells: CellRecord[], paperProps: Partial<PaperProps> = {}): Harness {
  const events: RecordedEvent[] = [];
  let graph: dia.Graph | undefined;

  function Probe() {
    const { graph: currentGraph } = useGraphStore();
    graph = currentGraph;
    // An event is a change to a non-zero version; it is the initial one when
    // the version before it was `0` (nothing measured) or the hook just mounted.
    useOnCellsChange(selectMeasuredState, (version, previousMeasuredState) => {
      if (version) events.push({ isInitial: !previousMeasuredState });
    });
    return null;
  }

  render(
    <GraphProvider initialCells={initialCells}>
      <Paper id={PAPER_ID} style={PAPER_STYLE} renderElement={renderElement} {...paperProps} />
      <Probe />
    </GraphProvider>
  );

  return { graph: graph as dia.Graph, events };
}

/** Waits for the seed pass, then clears it so a test counts only its own events. */
async function settleAndClear(harness: Harness) {
  await waitFor(() => expect(harness.events.length).toBeGreaterThan(0));
  await flush();
  harness.events.length = 0;
}

// An element the paper never renders: culled by `cellVisibility` (or by the
// viewport). Nothing can measure it while it is unmounted, so it is settled
// with the size it has, whatever that is; when it mounts and registers a
// measurer, it becomes outstanding then.
const hideAnchor: PaperProps['cellVisibility'] = ({ model }) => model.id !== 'anchor';

describe('selectMeasuredState — an element the paper does not render', () => {
  it('delivers the seed pass with a culled zero-sized element in the graph', async () => {
    const harness = renderGraph([plain('a'), anchor('anchor')], { cellVisibility: hideAnchor });

    await waitFor(() => expect(harness.events.length).toBeGreaterThan(0));
    await flush();

    expect(harness.events).toEqual([{ isInitial: true }]);
  });

  it('delivers the batch that adds a culled zero-sized element', async () => {
    const harness = renderGraph([plain('a')], { cellVisibility: hideAnchor });
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCells([plain('b'), anchor('anchor')] as never);
    });
    await flush();

    expect(harness.events).toHaveLength(1);
  });
});

// What else ends the wait: the waiting element leaves the graph.
describe('selectMeasuredState — a waiting element is removed', () => {
  it('delivers the batch once the waiting element is removed before it is measured', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCells([plain('b'), pending('c')] as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    act(() => {
      harness.graph.getCell('c').remove();
    });
    await flush();

    expect(harness.events).toHaveLength(1);
  });
});

// Regression: an element that stopped measuring before it was measured stayed
// "waiting" forever and held back every later event.
describe('selectMeasuredState — a waiting element stops measuring', () => {
  it('delivers the batch, and later changes, once nothing measures the element any more', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(pending('b') as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    // Its content switches to a plain shape: the measuring node unmounts.
    act(() => {
      harness.graph.getCell('b').set('data', {});
    });
    await flush();
    expect(harness.events).toHaveLength(1);

    act(() => {
      harness.graph.addCell(plain('c') as never);
    });
    await flush();
    expect(harness.events).toHaveLength(2);
  });
});

// A removal changes what a layout has to arrange, so it is a settled change too.
describe('selectMeasuredState — a settled element is removed', () => {
  it('delivers one event for the removal', async () => {
    const harness = renderGraph([plain('a'), plain('b')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.getCell('b').remove();
    });
    await flush();

    expect(harness.events).toEqual([{ isInitial: false }]);
  });
});

// The case the hook exists for in a live diagram: `renderElement` renders
// something else (a longer label, an expanded card), the node grows, the
// ResizeObserver reports the new size and the layout runs again. jsdom has no
// layout, so a local ResizeObserver mock delivers the entry the browser would.
describe('selectMeasuredState — the content of an element changes', () => {
  class TestResizeObserver {
    static readonly instances: TestResizeObserver[] = [];
    readonly observed = new Set<Element>();
    private readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      TestResizeObserver.instances.push(this);
    }
    observe(target: Element) {
      this.observed.add(target);
    }
    unobserve(target: Element) {
      this.observed.delete(target);
    }
    disconnect() {
      this.observed.clear();
    }
    /** What the browser reports after layout: the node's new border box. */
    report(target: Element, width: number, height: number) {
      const entry = { target, borderBoxSize: [{ inlineSize: width, blockSize: height }] };
      this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
  }

  beforeEach(() => {
    TestResizeObserver.instances.length = 0;
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
  });

  /**
   * The observer holding the node `<HTMLHost>` registered. The paper observes
   * its own host with another `ResizeObserver`, so the instance is found by
   * the node: the measured one lives inside the element's `foreignObject`.
   */
  function findMeasuredNode() {
    for (const observer of TestResizeObserver.instances) {
      for (const node of observer.observed) {
        if (node.closest('foreignObject')) return { observer, node };
      }
    }
    throw new Error('no ResizeObserver has the measured node registered');
  }

  /** Mounts one measured element, lets it register, and measures it once. */
  async function mountMeasured() {
    const harness = renderGraph([pending('b')]);
    await flush();
    const { observer, node } = findMeasuredNode();

    act(() => {
      observer.report(node, 120, 40);
    });
    await flush();
    expect(harness.events).toEqual([{ isInitial: true }]);
    harness.events.length = 0;

    const element = harness.graph.getCell('b') as dia.Element;
    return { harness, observer, node, element };
  }

  it('delivers one event when the re-rendered content measures larger', async () => {
    const { harness, observer, node, element } = await mountMeasured();

    // The application changes what `renderElement` shows; the browser lays the
    // node out larger and the observer reports it.
    act(() => {
      element.set('data', { measured: true, label: 'a much longer label' });
    });
    await flush();
    expect(node.textContent).toBe('a much longer label');
    expect(harness.events).toHaveLength(0);

    act(() => {
      observer.report(node, 240, 40);
    });
    await flush();

    expect(harness.events).toEqual([{ isInitial: false }]);
    expect(element.size()).toEqual({ width: 240, height: 40 });
  });

  it('delivers no event when the re-rendered content measures the same', async () => {
    const { harness, observer, node, element } = await mountMeasured();

    act(() => {
      element.set('data', { measured: true, label: 'same size' });
    });
    await flush();
    expect(node.textContent).toBe('same size');
    act(() => {
      observer.report(node, 120, 40);
    });
    await flush();

    expect(harness.events).toHaveLength(0);
    expect(element.size()).toEqual({ width: 120, height: 40 });
  });

  it('measures an element the application pre-sized to what it will measure', async () => {
    const harness = renderGraph([pending('b')]);
    await flush();
    const { observer, node } = findMeasuredNode();

    act(() => {
      (harness.graph.getCell('b') as dia.Element).resize(120, 40);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    // Same size as the model: the observer writes nothing, yet the element is
    // measured now and the pass is delivered.
    act(() => {
      observer.report(node, 120, 40);
    });
    await flush();

    expect(harness.events).toEqual([{ isInitial: true }]);
  });
});

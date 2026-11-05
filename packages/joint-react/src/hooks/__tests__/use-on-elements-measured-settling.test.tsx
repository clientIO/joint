/**
 * Scenarios beyond the #3520 specification in `use-on-elements-measured-events`:
 * an element the paper does not render, a waiting element that is removed, and
 * a content change that re-measures. Same harness and helpers as the spec,
 * except that `flush()` also awaits the paper's render frame, in which a newly
 * added element's view mounts and its portal content registers a measurer.
 */
import { useRef } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import { HTMLHost } from '../../components/html-host';
import { useOnElementsMeasured, type OnElementsMeasured } from '../use-on-elements-measured';
import { useGraphStore } from '../use-graph-store';
import { useMeasureElement } from '../use-measure-element';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { AUTO_SIZE_OPTION } from '../../store/measurement';
import type { GraphStore } from '../../store/graph-store';
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
  readonly getPaper: () => dia.Paper;
  /**
   * Mounts a second hook instance beside the first one, from now on, recording
   * its events and calling `onMeasured` after each.
   */
  readonly mountLateProbe: (onMeasured?: OnElementsMeasured) => RecordedEvent[];
}

/** Renders a graph with one hook instance mounted beside the paper. */
function renderGraph(
  initialCells: CellRecord[],
  paperProps: Partial<PaperProps> = {},
  isStrictMode = true
): Harness {
  const events: RecordedEvent[] = [];
  const lateEvents: RecordedEvent[] = [];
  let onLateMeasured: OnElementsMeasured | undefined;
  let graph: dia.Graph | undefined;
  let graphStore: GraphStore | undefined;

  function Probe({ recorded }: Readonly<{ recorded: RecordedEvent[] }>) {
    graphStore = useGraphStore();
    ({ graph } = graphStore);
    useOnElementsMeasured(PAPER_ID, (params) => {
      recorded.push({ isInitial: params.isInitial });
      if (recorded === lateEvents) onLateMeasured?.(params);
    });
    return null;
  }

  const renderTree = (hasLateProbe: boolean) => (
    <GraphProvider initialCells={initialCells}>
      <Paper id={PAPER_ID} style={PAPER_STYLE} renderElement={renderElement} {...paperProps} />
      <Probe recorded={events} />
      {hasLateProbe && <Probe recorded={lateEvents} />}
    </GraphProvider>
  );
  const { rerender } = render(renderTree(false), { reactStrictMode: isStrictMode });

  const getPaper = () => {
    const paperStore = graphStore?.getPaperStore(PAPER_ID);
    if (!paperStore) throw new Error(`Paper "${PAPER_ID}" is not mounted`);
    return paperStore.paper;
  };
  const mountLateProbe = (onMeasured?: OnElementsMeasured) => {
    onLateMeasured = onMeasured;
    rerender(renderTree(true));
    return lateEvents;
  };

  return { graph: graph as dia.Graph, events, getPaper, mountLateProbe };
}

/** Waits for the seed pass, then clears it so a test counts only its own events. */
async function settleAndClear(harness: Harness) {
  await waitFor(() => expect(harness.events.length).toBeGreaterThan(0));
  await flush();
  harness.events.length = 0;
}

/**
 * Switches the settled plain `a` to `<HTMLHost>`, which registers a measurer,
 * together with `otherChange` in the same task.
 */
async function startMeasuring(harness: Harness, otherChange?: () => void) {
  act(() => {
    harness.graph.getCell('a').set('data', { measured: true });
    otherChange?.();
  });
  await flush();
}

// An element the paper never renders: culled by `cellVisibility` (or by the
// viewport). Nothing can measure it while it is unmounted, so it is settled
// with the size it has, whatever that is; when it mounts and registers a
// measurer, it becomes outstanding then.
const hideAnchor: PaperProps['cellVisibility'] = ({ model }) => model.id !== 'anchor';

describe('useOnElementsMeasured — an element the paper does not render', () => {
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

  // Regression: a pass that only culls updates no view, so the paper fires no
  // `render:done`, and the culled element waited for one forever.
  it('delivers an addition the paper culls entirely', async () => {
    const harness = renderGraph([plain('a')], { cellVisibility: hideAnchor });
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(anchor('anchor') as never);
    });
    await flush();
    await flush();

    expect(harness.events).toEqual([{ isInitial: false }]);
  });
});

// What else ends the wait: the waiting element leaves the graph.
describe('useOnElementsMeasured — a waiting element is removed', () => {
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
describe('useOnElementsMeasured — a waiting element stops measuring', () => {
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
describe('useOnElementsMeasured — a settled element is removed', () => {
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
describe('useOnElementsMeasured — the content of an element changes', () => {
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

  // Regression: with no paper mounted yet, the seed was delivered unmeasured,
  // and a paper mounted later replayed that pass as initial, on placeholder sizes.
  it('waits for the measurement when the paper mounts after the graph', async () => {
    const events: Array<RecordedEvent & { readonly width: number }> = [];
    function Probe() {
      useOnElementsMeasured(PAPER_ID, ({ isInitial, graph }) => {
        events.push({ isInitial, width: (graph.getCell('b') as dia.Element).size().width });
      });
      return null;
    }
    const initialCells = [pending('b')];
    const renderTree = (hasPaper: boolean) => (
      <GraphProvider initialCells={initialCells}>
        {hasPaper && (
          <>
            <Paper id={PAPER_ID} style={PAPER_STYLE} renderElement={renderElement} />
            <Probe />
          </>
        )}
      </GraphProvider>
    );
    const { rerender } = render(renderTree(false));
    await flush();

    rerender(renderTree(true));
    await flush();
    expect(events).toHaveLength(0);

    const { observer, node } = findMeasuredNode();
    act(() => {
      observer.report(node, 120, 40);
    });
    await flush();

    expect(events).toEqual([{ isInitial: true, width: 120 }]);
  });

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

  describe('a settled element starts measuring', () => {
    // Regression: the newly registered measurer did not hold delivery back, so
    // the removal fired with the old size and the first report fired again.
    it('delivers one event for a change made while its first report is due', async () => {
      const harness = renderGraph([plain('a'), plain('c')]);
      await settleAndClear(harness);

      await startMeasuring(harness, () => {
        harness.graph.getCell('c').remove();
      });
      expect(harness.events).toHaveLength(0);
      const { observer, node } = findMeasuredNode();

      act(() => {
        observer.report(node, 120, 40);
      });
      await flush();

      expect(harness.events).toEqual([{ isInitial: false }]);
    });

    // Regression: a hook mounted before the first report replayed the old size.
    it('does not replay to a hook mounted before its first report', async () => {
      const harness = renderGraph([plain('a')]);
      await settleAndClear(harness);
      await startMeasuring(harness);
      const { observer, node } = findMeasuredNode();

      const lateEvents = harness.mountLateProbe();
      await flush();
      expect(lateEvents).toHaveLength(0);

      act(() => {
        observer.report(node, 120, 40);
      });
      await flush();

      expect(lateEvents).toEqual([{ isInitial: true }]);
      expect(harness.events).toEqual([{ isInitial: false }]);
    });

    it('delivers no event when its first report matches its size', async () => {
      const harness = renderGraph([plain('a')]);
      await settleAndClear(harness);
      await startMeasuring(harness);
      const { observer, node } = findMeasuredNode();

      act(() => {
        observer.report(node, 50, 50);
      });
      await flush();
      expect(harness.events).toHaveLength(0);

      act(() => {
        harness.graph.addCell(plain('d') as never);
      });
      await flush();
      expect(harness.events).toEqual([{ isInitial: false }]);
    });

    it('delivers the waiting change once it stops measuring before its first report', async () => {
      const harness = renderGraph([plain('a'), plain('c')]);
      await settleAndClear(harness);
      await startMeasuring(harness, () => {
        harness.graph.getCell('c').remove();
      });
      expect(harness.events).toHaveLength(0);

      act(() => {
        harness.graph.getCell('a').set('data', {});
      });
      await flush();

      expect(harness.events).toEqual([{ isInitial: false }]);
    });
  });
});

// Only a reset (or a new mount) starts a new history: emptying the diagram is
// an ordinary change, however the elements come back.
describe('useOnElementsMeasured — the diagram is emptied and filled again', () => {
  it('does not report the next event as initial, with a pass in between', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.getCell('a').remove();
    });
    await flush();
    act(() => {
      harness.graph.addCell(plain('b') as never);
    });
    await flush();

    expect(harness.events.every(({ isInitial }) => !isInitial)).toBe(true);
    expect(harness.events.length).toBeGreaterThan(0);
  });

  it('does not report the next event as initial, in the same task', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.clear();
      harness.graph.addCell(plain('b') as never);
    });
    await flush();

    expect(harness.events).toEqual([{ isInitial: false }]);
  });
});

describe('useOnElementsMeasured — a graph reset', () => {
  // Regression: a same-id reset whose replacement views rendered before React
  // committed kept the element item mounted with a new portal target, so its
  // content never reported as rendered and the reset was never delivered.
  it('delivers the reset when the replacement views render before React commits', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.resetCells([plain('a')] as never);
      harness.getPaper().updateViews();
    });
    await flush();

    expect(harness.events).toEqual([{ isInitial: true }]);
  });
});

// Regression: a hook mounted while a change was still waiting replayed the
// previous version at once, so its layout ran on the waiting element's
// placeholder size, then ran again when the measurement arrived.
describe('useOnElementsMeasured — mounted while a change is waiting', () => {
  it('delivers nothing until the change settles, then one initial event', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);

    act(() => {
      harness.graph.addCell(pending('b') as never);
    });
    await flush();
    expect(harness.events).toHaveLength(0);

    const lateEvents = harness.mountLateProbe();
    await flush();
    expect(lateEvents).toHaveLength(0);

    act(() => {
      harness.graph
        .getCell('b')
        .set('size', { width: 80, height: 20 }, { [AUTO_SIZE_OPTION]: true });
    });
    await flush();

    expect(lateEvents).toEqual([{ isInitial: true }]);
    expect(harness.events).toEqual([{ isInitial: false }]);
  });
});

// Regression: the mount-time replay ran on an emptied diagram, whose kept
// version describes elements that are gone.
describe('useOnElementsMeasured — mounted on an emptied diagram', () => {
  it('delivers nothing until elements return', async () => {
    const harness = renderGraph([plain('a')]);
    await settleAndClear(harness);
    act(() => {
      harness.graph.getCell('a').remove();
    });
    await flush();

    const lateEvents = harness.mountLateProbe();
    await flush();
    expect(lateEvents).toHaveLength(0);

    act(() => {
      harness.graph.addCell(plain('b') as never);
    });
    await flush();
    expect(lateEvents).toEqual([{ isInitial: true }]);
  });
});

// Regression: the mount-time replay ran before the subscription, so a callback
// that reset the graph missed the reset, and the replacement diagram's first
// event was reported as not initial.
describe('useOnElementsMeasured — a replayed callback resets the graph', () => {
  it('reports the replacement diagram as initial', async () => {
    // Without StrictMode: its second mount replays after the reset, which
    // hides the missed notification. Production mounts once.
    const harness = renderGraph([plain('a')], {}, false);
    await settleAndClear(harness);

    let hasReset = false;
    const lateEvents = harness.mountLateProbe(({ graph }) => {
      if (hasReset) return;
      hasReset = true;
      graph.resetCells([plain('x')] as never);
    });
    await flush();
    await flush();

    // The replay, then the replacement diagram's first pass.
    expect(lateEvents).toEqual([{ isInitial: true }, { isInitial: true }]);
  });
});

// With `useHTMLOverlay`, every element renders into one overlay container that
// never changes, so React keeps the content of an id removed and added back in
// one task, and with it the measured node and its registration. A browser
// reports a node once when it starts observing it, then only when its box
// changes: this mock does the same, with a fixed box.
describe('useOnElementsMeasured — the HTML overlay keeps a re-added element', () => {
  const MEASURED_BOX = { inlineSize: 120, blockSize: 40 };

  class FirstReportResizeObserver {
    readonly observed = new Set<Element>();
    private readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      this.observed.add(target);
      // Only element content: the paper observes its own host too.
      if (!target.closest('[model-id]')) return;
      queueMicrotask(() => {
        if (!this.observed.has(target)) return;
        const entry = { target, borderBoxSize: [MEASURED_BOX] };
        this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
      });
    }
    unobserve(target: Element) {
      this.observed.delete(target);
    }
    disconnect() {
      this.observed.clear();
    }
  }

  beforeEach(() => {
    globalThis.ResizeObserver = FirstReportResizeObserver as unknown as typeof ResizeObserver;
  });

  function MeasuredCard() {
    const nodeRef = useRef<HTMLDivElement>(null);
    useMeasureElement(nodeRef);
    return <div ref={nodeRef}>card</div>;
  }
  const overlayProps: Partial<PaperProps> = { useHTMLOverlay: true, renderElement: MeasuredCard };

  // Regression: the re-added element waited for a report the browser never sent
  // again, and held back this event and every later one.
  it('delivers one event when an element is removed and added back in one task', async () => {
    const harness = renderGraph([pending('b')], overlayProps);
    await settleAndClear(harness);
    const element = harness.graph.getCell('b') as dia.Element;
    expect(element.size()).toEqual({ width: 120, height: 40 });

    act(() => {
      element.remove();
      harness.graph.addCell(element);
    });
    await flush();
    await flush();
    expect(harness.events).toEqual([{ isInitial: false }]);

    act(() => {
      harness.graph.addCell(plain('c') as never);
    });
    await flush();
    expect(harness.events).toEqual([{ isInitial: false }, { isInitial: false }]);
  });
});

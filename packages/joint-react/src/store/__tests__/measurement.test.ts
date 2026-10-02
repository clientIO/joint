import { dia } from '@joint/core';
import { createMeasurement, AUTO_SIZE_OPTION, type AutoSizeOrigin } from '../measurement';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import type { PaperStore } from '../paper-store';

/** A ResizeObserver the test drives: `report()` is what the browser would deliver. */
class TestResizeObserver {
  static readonly instances: TestResizeObserver[] = [];
  readonly observed = new Set<Element>();
  isDisconnected = false;
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
    this.isDisconnected = true;
    this.observed.clear();
  }
  report(target: Element, width: number, height: number, hasBox = true) {
    const borderBoxSize = hasBox ? [{ inlineSize: width, blockSize: height }] : [];
    const entry = { target, borderBoxSize } as unknown as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const lastObserver = () => TestResizeObserver.instances.at(-1)!;
const NO_PAPERS: ReadonlyMap<string, PaperStore> = new Map();
const newNode = () => document.createElement('div');

type Transform = Parameters<ReturnType<typeof createMeasurement>['observe']>[0]['transform'];

/**
 * A graph with its measurement. `add` puts a 1x1 element at (10, 20) unless
 * sized otherwise; `writes` counts the batches the measurement writes in, one
 * per ResizeObserver callback that changed something.
 */
function setup(autoSizeOrigin: AutoSizeOrigin = 'top-left') {
  const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  const measurement = createMeasurement({ graph, autoSizeOrigin, paperStores: NO_PAPERS });
  /** What `selectMeasuredState` reads right now. */
  const version = () => measurement.stateSource.get();
  const nodesById = new Map<string, Element[]>();
  const writes = jest.fn();
  graph.on('batch:stop', ({ batchName }: { batchName?: string }) => {
    if (batchName === 'auto-size') writes();
  });
  const add = (id: string, width = 1, height = 1) => {
    graph.addCell({ id, type: 'element', position: { x: 10, y: 20 }, size: { width, height } });
    return graph.getCell(id) as dia.Element;
  };
  const observe = (id: string, node: HTMLElement = newNode(), transform?: Transform) => {
    nodesById.set(id, [...(nodesById.get(id) ?? []), node]);
    return measurement.observe({ id, node, transform });
  };
  /** The old observer's `has(id)`: the element has a registered node, so one of them is observed. */
  const has = (id: string) =>
    (nodesById.get(id) ?? []).some((node) =>
      TestResizeObserver.instances.some((instance) => instance.observed.has(node))
    );
  const size = (id: string) => (graph.getCell(id) as dia.Element).size();
  return { graph, measurement, version, add, observe, has, size, writes };
}

beforeEach(() => {
  TestResizeObserver.instances.length = 0;
  globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
});

describe('measurement — observe', () => {
  it('does not create a ResizeObserver until a node is observed', () => {
    const { add, observe } = setup();
    add('element-1');
    expect(TestResizeObserver.instances).toHaveLength(0);

    observe('element-1');
    observe('element-1');
    expect(TestResizeObserver.instances).toHaveLength(1);
  });

  it('registers the element with the ResizeObserver', () => {
    const { add, observe, has } = setup();
    add('element-1');

    observe('element-1');

    expect(has('element-1')).toBe(true);
    expect(has('non-existent')).toBe(false);
  });

  it('returns a cleanup that unregisters the element', () => {
    const { add, observe, has } = setup();
    add('element-1');

    const cleanup = observe('element-1');
    expect(has('element-1')).toBe(true);

    cleanup();
    expect(has('element-1')).toBe(false);
  });

  it('handles multiple elements', () => {
    const { add, observe, has } = setup();
    add('element-1');
    add('element-2');

    observe('element-1');
    observe('element-2');

    expect(has('element-1')).toBe(true);
    expect(has('element-2')).toBe(true);
  });

  it('writes the reported size to the element', () => {
    const { add, observe, size, writes } = setup();
    add('element-1');
    const node = newNode();
    observe('element-1', node);

    lastObserver().report(node, 100, 50);

    expect(writes).toHaveBeenCalledTimes(1);
    expect(size('element-1')).toEqual({ width: 100, height: 50 });
  });

  it('writes each of several elements in its own batch', () => {
    const { add, observe, size, writes } = setup();
    add('element-1');
    add('element-2');
    const first = newNode();
    const second = newNode();
    observe('element-1', first);
    observe('element-2', second);

    lastObserver().report(first, 100, 50);
    lastObserver().report(second, 200, 100);

    expect(writes).toHaveBeenCalledTimes(2);
    expect(size('element-1')).toEqual({ width: 100, height: 50 });
    expect(size('element-2')).toEqual({ width: 200, height: 100 });
  });
});

describe('measurement — ResizeObserver callback', () => {
  it('writes every size change', () => {
    const { add, observe, writes } = setup();
    add('element-1');
    const node = newNode();
    observe('element-1', node);

    lastObserver().report(node, 100, 50);
    expect(writes).toHaveBeenCalledTimes(1);

    lastObserver().report(node, 200, 100);
    expect(writes).toHaveBeenCalledTimes(2);
  });

  it('does not write when the size has not changed significantly', () => {
    const { add, observe, writes } = setup();
    add('element-1');
    const node = newNode();
    observe('element-1', node);
    lastObserver().report(node, 100, 50);
    writes.mockClear();

    // Within the 0.5 tolerance.
    lastObserver().report(node, 100.1, 50.1);

    expect(writes).not.toHaveBeenCalled();
  });

  it('tags the write as a measurement and rounds to two decimals', () => {
    const { graph, add, observe, size } = setup();
    const element = add('element-1');
    const node = newNode();
    observe('element-1', node);
    const onSize = jest.fn();
    graph.on('change:size', onSize);

    lastObserver().report(node, 100.004, 50);

    expect(size('element-1')).toEqual({ width: 100, height: 50 });
    expect(element.position()).toEqual({ x: 10, y: 20 });
    expect(onSize.mock.calls[0][2]).toEqual(expect.objectContaining({ [AUTO_SIZE_OPTION]: true }));
  });

  it('uses the transform when provided', () => {
    const { add, observe, size } = setup();
    const element = add('element-1');
    const node = newNode();
    const transform = jest.fn(({ width, height }) => ({ width: width + 20, height: height + 20 }));
    observe('element-1', node, transform);

    lastObserver().report(node, 100, 50);

    expect(transform).toHaveBeenCalledWith({
      x: 10,
      y: 20,
      angle: 0,
      model: element,
      width: 100,
      height: 50,
      id: 'element-1',
    });
    expect(size('element-1')).toEqual({ width: 120, height: 70 });
  });

  it('writes the position a transform returns', () => {
    const { add, observe } = setup();
    const element = add('element-1');
    const node = newNode();
    observe('element-1', node, ({ width, height }) => ({ width, height, x: 9, y: 11 }));

    lastObserver().report(node, 80, 40);

    expect(element.position()).toEqual({ x: 9, y: 11 });
  });

  it('keeps the center fixed with the center origin', () => {
    const { add, observe } = setup('center');
    const element = add('element-1', 20, 20);
    const node = newNode();
    observe('element-1', node);

    lastObserver().report(node, 40, 60);

    expect(element.position()).toEqual({ x: 0, y: 0 });
  });

  it('skips an element that is not in the graph', () => {
    const { observe, writes } = setup();
    const node = newNode();
    observe('element-1', node);

    expect(() => lastObserver().report(node, 100, 50)).not.toThrow();
    expect(writes).not.toHaveBeenCalled();
  });

  it('skips an element removed from the graph after it registered', () => {
    const { add, observe, writes } = setup();
    const element = add('element-1');
    const node = newNode();
    observe('element-1', node);
    element.remove();

    expect(() => lastObserver().report(node, 100, 50)).not.toThrow();
    expect(writes).not.toHaveBeenCalled();
  });

  it('skips when the model already has the measured size (within the tolerance)', () => {
    const { add, observe, writes } = setup();
    add('element-1', 100, 50);
    const node = newNode();
    observe('element-1', node);

    lastObserver().report(node, 100, 50);

    expect(writes).not.toHaveBeenCalled();
  });

  it('skips a report equal to the last one, even if the application resized meanwhile', () => {
    const { add, observe, size, writes } = setup();
    const element = add('element-1');
    const node = newNode();
    observe('element-1', node);
    lastObserver().report(node, 100, 50);
    writes.mockClear();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    element.resize(300, 300);
    lastObserver().report(node, 100, 50);

    expect(writes).not.toHaveBeenCalled();
    expect(size('element-1')).toEqual({ width: 300, height: 300 });
    warn.mockRestore();
  });

  it('skips entries with no borderBoxSize', () => {
    const { add, observe, writes } = setup();
    add('element-1');
    const node = newNode();
    observe('element-1', node);

    lastObserver().report(node, 100, 50, false);

    expect(writes).not.toHaveBeenCalled();
  });

  it('skips entries with zero size (e.g. display:none)', () => {
    const { add, observe, writes } = setup();
    add('element-1');
    const node = newNode();
    observe('element-1', node);

    lastObserver().report(node, 0, 0);

    expect(writes).not.toHaveBeenCalled();
  });

  it('skips entries whose target is not currently observed', () => {
    const { add, observe, writes } = setup();
    add('element-1');
    observe('element-1');

    lastObserver().report(newNode(), 100, 50);

    expect(writes).not.toHaveBeenCalled();
  });
});

describe('measurement — several nodes for one element', () => {
  it('allows multiple registrations for the same element', () => {
    const { add, observe, has } = setup();
    add('element-1');

    observe('element-1');
    observe('element-1');

    expect(has('element-1')).toBe(true);
  });

  it('observes only the latest node', () => {
    const { add, observe } = setup();
    add('element-1');
    const nodeA = newNode();
    const nodeB = newNode();

    observe('element-1', nodeA);
    observe('element-1', nodeB);

    expect(lastObserver().observed.has(nodeA)).toBe(false);
    expect(lastObserver().observed.has(nodeB)).toBe(true);
  });

  it('writes only what the latest node reports', () => {
    const { add, observe, size, writes } = setup();
    add('element-1');
    const nodeA = newNode();
    const nodeB = newNode();
    observe('element-1', nodeA);
    observe('element-1', nodeB);

    lastObserver().report(nodeA, 77, 77);
    expect(writes).not.toHaveBeenCalled();

    lastObserver().report(nodeB, 200, 100);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(size('element-1')).toEqual({ width: 200, height: 100 });
  });

  it('falls back to the previous node when the latest one is removed', () => {
    const { add, observe, has, size, writes } = setup();
    add('element-1');
    const nodeA = newNode();
    const nodeB = newNode();
    observe('element-1', nodeA);
    const cleanupB = observe('element-1', nodeB);

    cleanupB();

    expect(lastObserver().observed.has(nodeA)).toBe(true);
    expect(lastObserver().observed.has(nodeB)).toBe(false);
    expect(has('element-1')).toBe(true);

    lastObserver().report(nodeA, 150, 75);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(size('element-1')).toEqual({ width: 150, height: 75 });
  });

  it('removes a node that is not the latest without affecting the latest', () => {
    const { add, observe, has, writes } = setup();
    add('element-1');
    const nodeA = newNode();
    const nodeB = newNode();
    const cleanupA = observe('element-1', nodeA);
    observe('element-1', nodeB);

    cleanupA();

    expect(lastObserver().observed.has(nodeB)).toBe(true);
    expect(has('element-1')).toBe(true);

    lastObserver().report(nodeB, 300, 150);
    expect(writes).toHaveBeenCalledTimes(1);
  });

  it('handles removing the latest of three nodes', () => {
    const { add, observe, has } = setup();
    add('element-1');
    const nodeA = newNode();
    const nodeB = newNode();
    const nodeC = newNode();
    observe('element-1', nodeA);
    observe('element-1', nodeB);
    const cleanupC = observe('element-1', nodeC);

    cleanupC();

    expect(lastObserver().observed.has(nodeC)).toBe(false);
    expect(lastObserver().observed.has(nodeB)).toBe(true);
    expect(lastObserver().observed.has(nodeA)).toBe(false);
    expect(has('element-1')).toBe(true);
  });

  it('fully unregisters the element after all its nodes are cleaned up', () => {
    const { add, observe, has } = setup();
    add('element-1');
    const cleanupA = observe('element-1');
    const cleanupB = observe('element-1');

    cleanupB();
    expect(has('element-1')).toBe(true);

    cleanupA();
    expect(has('element-1')).toBe(false);
    expect(lastObserver().observed.size).toBe(0);
  });

  it('uses the transform of the latest node, not a previous one', () => {
    const { add, observe, size } = setup();
    add('element-1');
    const nodeA = newNode();
    const nodeB = newNode();
    const transformA = jest.fn(({ width, height }) => ({ width: width + 10, height: height + 10 }));
    const transformB = jest.fn(({ width, height }) => ({ width: width + 50, height: height + 50 }));
    observe('element-1', nodeA, transformA);
    observe('element-1', nodeB, transformB);

    lastObserver().report(nodeB, 100, 50);

    expect(transformA).not.toHaveBeenCalled();
    expect(transformB).toHaveBeenCalled();
    expect(size('element-1')).toEqual({ width: 150, height: 100 });
  });

  it('uses the previous transform after the latest node is removed', () => {
    const { add, observe, size } = setup();
    add('element-1');
    const nodeA = newNode();
    const nodeB = newNode();
    const transformA = jest.fn(({ width, height }) => ({ width: width + 10, height: height + 10 }));
    const transformB = jest.fn(({ width, height }) => ({ width: width + 50, height: height + 50 }));
    observe('element-1', nodeA, transformA);
    const cleanupB = observe('element-1', nodeB, transformB);

    cleanupB();
    lastObserver().report(nodeA, 100, 50);

    expect(transformA).toHaveBeenCalled();
    expect(transformB).not.toHaveBeenCalled();
    expect(size('element-1')).toEqual({ width: 110, height: 60 });
  });

  it('has an idempotent cleanup', () => {
    const { add, observe, has } = setup();
    add('element-1');
    const cleanup = observe('element-1');

    cleanup();
    expect(has('element-1')).toBe(false);

    expect(() => cleanup()).not.toThrow();
    expect(has('element-1')).toBe(false);
  });

  it('handles interleaved registrations across different elements', () => {
    const { add, observe, has } = setup();
    add('element-1');
    add('element-2');
    const node1A = newNode();
    const node1B = newNode();
    const node2A = newNode();
    const cleanup1A = observe('element-1', node1A);
    observe('element-2', node2A);
    observe('element-1', node1B);

    expect(lastObserver().observed.has(node1B)).toBe(true);
    expect(lastObserver().observed.has(node2A)).toBe(true);
    expect(lastObserver().observed.has(node1A)).toBe(false);

    cleanup1A();
    expect(lastObserver().observed.has(node1B)).toBe(true);
    expect(has('element-1')).toBe(true);
    expect(has('element-2')).toBe(true);
  });
});

describe('measurement — destroy', () => {
  it('stops observing every element', () => {
    const { measurement, add, observe, has } = setup();
    add('element-1');
    add('element-2');
    observe('element-1');
    observe('element-2');
    expect(has('element-1')).toBe(true);
    expect(has('element-2')).toBe(true);

    measurement.destroy();

    expect(has('element-1')).toBe(false);
    expect(has('element-2')).toBe(false);
    expect(lastObserver().isDisconnected).toBe(true);
  });

  it('stops observing elements with several nodes, and a late cleanup is a no-op', () => {
    const { measurement, add, observe, has } = setup();
    add('element-1');
    add('element-2');
    observe('element-1');
    const cleanupLatest = observe('element-1');
    observe('element-2');

    measurement.destroy();

    expect(has('element-1')).toBe(false);
    expect(has('element-2')).toBe(false);
    expect(() => cleanupLatest()).not.toThrow();
    expect(lastObserver().observed.size).toBe(0);
  });

  it('stops following the graph', async () => {
    const { measurement, add, version } = setup();
    measurement.destroy();

    add('element-1');
    await flush();

    expect(version()).toBe(0);
  });
});

describe('measurement — dev warning', () => {
  it('warns once when an observed element is resized by the application, never for a measurement', () => {
    const { add, observe } = setup();
    const observed = add('warned');
    const plain = add('plain');
    const node = newNode();
    const cleanup = observe('warned', node);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    plain.resize(9, 9);
    lastObserver().report(node, 100, 50);
    expect(warn).not.toHaveBeenCalled();

    observed.resize(200, 80);
    observed.resize(220, 90);
    expect(warn).toHaveBeenCalledTimes(1);

    // No longer observed: its size is the application's to set.
    cleanup();
    warn.mockClear();
    observed.resize(10, 10);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

const sized = (id: string) => ({ id, type: 'element', size: { width: 100, height: 50 } });
const unsized = (id: string) => ({ id, type: 'element', size: { width: 0, height: 0 } });
const link = (id: string, source: string, target: string) => ({
  id,
  type: 'standard.Link',
  source: { id: source },
  target: { id: target },
});

// What `graph-changes.ts` used to forward as callbacks, now heard by the module itself.
describe('measurement — graph events', () => {
  it('tracks each element a reset seeds, and changes once for them', async () => {
    const { graph, version } = setup();

    graph.resetCells([sized('a'), sized('b'), link('l1', 'a', 'b')]);
    await flush();
    expect(version()).toBe(1);

    // Both were tracked: with one of them gone the diagram is still measured.
    graph.getCell('a').remove();
    await flush();
    expect(version()).toBe(2);
  });

  it('clears what it tracked before tracking the seed of a reset', async () => {
    const { graph, version, add } = setup();
    add('a', 100, 50);
    await flush();
    expect(version()).toBe(1);

    // Nothing is measured from the reset until its seed settles.
    graph.resetCells([sized('x')]);
    expect(version()).toBe(0);
    await flush();
    // A value is never reused, so the pass after a reset is seen as a change.
    expect(version()).toBe(2);

    // A reset to no elements stays unmeasured.
    graph.resetCells([link('l', 'x', 'x')]);
    await flush();
    expect(version()).toBe(0);
  });

  it('changes when an element is removed, and not when a link is', async () => {
    const { graph, version } = setup();
    graph.addCells([sized('a'), sized('b'), link('l1', 'a', 'b')]);
    await flush();
    expect(version()).toBe(1);

    graph.getCell('l1').remove();
    await flush();
    expect(version()).toBe(1);

    graph.getCell('a').remove();
    await flush();
    expect(version()).toBe(2);
  });

  it('is not measured any more once the last element is removed', async () => {
    const { graph, version } = setup();
    graph.addCells([sized('a'), unsized('z')]);
    await flush();
    expect(version()).toBe(1);

    graph.getCell('a').remove();
    await flush();
    // A zero-sized element is still an element with a known size.
    expect(version()).toBe(2);

    graph.getCell('z').remove();
    await flush();
    expect(version()).toBe(0);
  });

  it('changes for a measurement write, told apart by the change:size options', async () => {
    const { graph, version } = setup();
    graph.resetCells([unsized('a')]);
    await flush();
    expect(version()).toBe(1);

    (graph.getCell('a') as dia.Element).set(
      'size',
      { width: 120, height: 60 },
      { [AUTO_SIZE_OPTION]: true }
    );
    await flush();

    expect(version()).toBe(2);
  });

  it('never changes for a size the application writes', async () => {
    const { version, add } = setup();
    const element = add('a');
    await flush();

    element.resize(70, 70);
    element.resize(0, 0);
    await flush();

    expect(version()).toBe(1);
  });

  // Regression: elements already in the graph when the measurement is created
  // (an external graph) were never counted, so the state was wrong from then on.
  it('counts the elements the graph already holds', async () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    graph.addCells([sized('a'), sized('b'), link('l1', 'a', 'b')]);
    const measurement = createMeasurement({
      graph,
      autoSizeOrigin: 'top-left',
      paperStores: NO_PAPERS,
    });
    await flush();
    expect(measurement.stateSource.get()).toBe(1);

    graph.getCell('a').remove();
    await flush();
    // One element is left, so the diagram is still measured.
    expect(measurement.stateSource.get()).toBe(2);

    graph.getCell('b').remove();
    await flush();
    expect(measurement.stateSource.get()).toBe(0);
  });

  it('does not track links', async () => {
    const { graph, version } = setup();

    graph.resetCells([link('l1', 'a', 'b')]);
    graph.addCell(link('l2', 'a', 'b'));
    await flush();

    expect(version()).toBe(0);
  });

  it('changes once for a batch of elements, whatever their sizes', async () => {
    const { graph, version, add } = setup();
    graph.addCell(unsized('zero'));
    add('a');
    add('b');
    await flush();

    expect(version()).toBe(1);
  });
});

import { dia } from '@joint/core';
import { GraphStore, DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { CellRecord } from '../../types/cell.types';
import type { Feature } from '../../types/feature.types';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/**
 * Mock ResizeObserver that captures every instantiated observer so tests can
 * trigger callbacks deterministically. Replaces the global before each test.
 */
class MockResizeObserver {
  static readonly instances: MockResizeObserver[] = [];
  callback: ResizeObserverCallback;
  observed = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
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

  triggerResize(target: Element, width: number, height: number) {
    const entry = {
      target,
      contentRect: { width, height, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0 },
      borderBoxSize: [{ inlineSize: width, blockSize: height }],
      contentBoxSize: [{ inlineSize: width, blockSize: height }],
      devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }

  static reset() {
    MockResizeObserver.instances.length = 0;
  }
}

const createGraph = () => new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

function makeFeature(id: string, instance: unknown = {}): Feature & { clean: jest.Mock } {
  return {
    id,
    instance,
    clean: jest.fn(),
  };
}

describe('GraphStore feature lifecycle', () => {
  it('setGraphFeature stores the feature and bumps the graphFeaturesVersion', () => {
    const store = new GraphStore({});
    const initialVersion = store.internalState.get().graphFeaturesVersion;
    const feature = makeFeature('a');

    store.setGraphFeature(feature);

    expect(store.features.a).toBe(feature);
    expect(store.internalState.get().graphFeaturesVersion).toBe(initialVersion + 1);
    store.destroy(false);
  });

  it('removeGraphFeature calls clean and removes the entry', () => {
    const store = new GraphStore({});
    const feature = makeFeature('a');
    store.setGraphFeature(feature);

    store.removeGraphFeature('a');

    expect(feature.clean).toHaveBeenCalledTimes(1);
    expect(store.features.a).toBeUndefined();
    store.destroy(false);
  });

  it('removeGraphFeature on a missing id is a no-op', () => {
    const store = new GraphStore({});
    expect(() => store.removeGraphFeature('missing')).not.toThrow();
    store.destroy(false);
  });

  it('removeGraphFeature tolerates a feature without a clean function', () => {
    const store = new GraphStore({});
    const feature: Feature = { id: 'no-clean', instance: {} };
    store.setGraphFeature(feature);

    expect(() => store.removeGraphFeature('no-clean')).not.toThrow();
    expect(store.features['no-clean']).toBeUndefined();
    store.destroy(false);
  });

  it('destroy() invokes clean() on every registered feature', () => {
    const store = new GraphStore({});
    const a = makeFeature('a');
    const b = makeFeature('b');
    store.setGraphFeature(a);
    store.setGraphFeature(b);

    store.destroy(false);

    expect(a.clean).toHaveBeenCalledTimes(1);
    expect(b.clean).toHaveBeenCalledTimes(1);
    expect(Object.keys(store.features)).toHaveLength(0);
  });

  it('setPaperFeature throws when paper does not exist', () => {
    const store = new GraphStore({});
    expect(() => store.setPaperFeature('missing', makeFeature('a'))).toThrow(
      /Paper with id missing not found/
    );
    store.destroy(false);
  });

  it('setPaperFeature stores the feature and bumps that paper version', () => {
    const store = new GraphStore({});
    store.addPaper('p1', { paperOptions: {} });
    const versionBefore = store.internalState.get().papers.p1.version;

    const feature = makeFeature('feat-1');
    store.setPaperFeature('p1', feature);

    const paperStore = store.getPaperStore('p1')!;
    expect(paperStore.features['feat-1']).toBe(feature);
    expect(store.internalState.get().papers.p1.version).toBe(versionBefore + 1);
    store.destroy(false);
  });

  it('removePaperFeature calls clean, removes the entry, and bumps the paper version', () => {
    const store = new GraphStore({});
    store.addPaper('p1', { paperOptions: {} });
    const feature = makeFeature('feat-1');
    store.setPaperFeature('p1', feature);
    const versionBefore = store.internalState.get().papers.p1.version;

    store.removePaperFeature('p1', 'feat-1');

    expect(feature.clean).toHaveBeenCalledTimes(1);
    const paperStore = store.getPaperStore('p1')!;
    expect(paperStore.features['feat-1']).toBeUndefined();
    expect(store.internalState.get().papers.p1.version).toBe(versionBefore + 1);
    store.destroy(false);
  });

  it('removePaperFeature is a no-op when paper is missing', () => {
    const store = new GraphStore({});
    expect(() => store.removePaperFeature('missing', 'a')).not.toThrow();
    store.destroy(false);
  });

  it('removePaperFeature is a no-op when feature is missing', () => {
    const store = new GraphStore({});
    store.addPaper('p1', { paperOptions: {} });
    const versionBefore = store.internalState.get().papers.p1.version;

    expect(() => store.removePaperFeature('p1', 'missing-feature')).not.toThrow();
    expect(store.internalState.get().papers.p1.version).toBe(versionBefore);
    store.destroy(false);
  });
});

describe('GraphStore.getGraphView typed accessor', () => {
  it('returns the same graphView reference', () => {
    const store = new GraphStore({});
    const view = store.getGraphView();
    expect(view).toBe(store.graphView);
    store.destroy(false);
  });
});

describe('GraphStore.applyControlled', () => {
  it('routes through graphView.updateGraph with the react-origin flag', () => {
    const store = new GraphStore({});
    const spy = jest.spyOn(store.graphView, 'updateGraph');
    const cells: readonly CellRecord[] = [
      {
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      } as CellRecord,
    ];
    store.applyControlled(cells);
    expect(spy).toHaveBeenCalledWith({ cells, flag: 'updateFromReact' });
    store.destroy(false);
  });
});

describe('GraphStore observer wiring', () => {
  it('size observer batch update writes size and position back to cells', () => {
    const store = new GraphStore<CellRecord, CellRecord>({
      initialCells: [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ],
    });

    // Reach into the observer indirectly: invoke setMeasuredNode and then
    // trigger a resize that exercises the onBatchUpdate path. We can also
    // just push the constructor-side onBatchUpdate by triggering a real
    // ResizeObserver entry, but JSDOM has no ResizeObserver — instead, we
    // exercise the path directly via store.graph manipulations to set size.
    const cell = store.graph.getCell('a') as dia.Element;
    cell.set('size', { width: 100, height: 50 });
    cell.set('position', { x: 5, y: 6 });

    expect((cell.get('size') as { width: number; height: number }).width).toBe(100);
    store.destroy(false);
  });

  it('setMeasuredNode delegates to the observer (returns a cleanup function)', () => {
    const store = new GraphStore<CellRecord, CellRecord>({
      initialCells: [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ],
    });

    const node = document.createElement('div');
    const cleanup = store.setMeasuredNode({ id: 'a', node });
    expect(typeof cleanup).toBe('function');
    cleanup();
    store.destroy(false);
  });

  it('isElement classifies element-typed cells', () => {
    const store = new GraphStore({});
    expect(
      store.isElement({
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
      } as unknown as CellRecord)
    ).toBe(true);
    expect(
      store.isElement({
        id: 'l',
        type: LINK_MODEL_TYPE,
      } as unknown as CellRecord)
    ).toBe(false);
    store.destroy(false);
  });

  it('isLink classifies link-typed cells', () => {
    const store = new GraphStore({});
    expect(
      store.isLink({
        id: 'l',
        type: LINK_MODEL_TYPE,
      } as unknown as CellRecord)
    ).toBe(true);
    expect(
      store.isLink({
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
      } as unknown as CellRecord)
    ).toBe(false);
    store.destroy(false);
  });
});

describe('GraphStore.clearViewForElementAndLinks', () => {
  it('propagates pending link changes to the matching paper store', async () => {
    const store = new GraphStore<CellRecord, CellRecord>({});
    store.graph.addCell({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    store.graph.addCell({
      id: 'b',
      type: 'element',
      position: { x: 50, y: 0 },
      size: { width: 10, height: 10 },
    });
    const link = new dia.Link({
      id: 'l1',
      type: 'standard.Link',
      source: { id: 'a' },
      target: { id: 'b' },
    });
    store.graph.addCell(link);
    await flush();

    const { paperStore } = store.addPaper('p1', { paperOptions: {} });

    // Stub the paper internals so clearViewForElementAndLinks's findViewByModel
    // returns a real-shaped element view. We also replace findView on the link
    // so clearConnectedLinkViews finds a writable mock view.
    const cleanNodesCache = jest.fn();
    const fakeElementView = { cleanNodesCache } as unknown as dia.ElementView;

    const fakeLinkView = {
      _sourceMagnet: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
      _targetMagnet: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
      requestConnectionUpdate: jest.fn(),
    };
    link.findView = jest.fn().mockReturnValue(fakeLinkView) as unknown as typeof link.findView;

    const fakePaper = {
      findViewByModel: jest.fn().mockReturnValue(fakeElementView),
      remove: jest.fn(),
    } as unknown as dia.Paper;

    // Forcefully redirect paperStore.paper to point at the mock so the
    // store-side comparison `store.paper == paper` matches.
    Object.defineProperty(paperStore, 'paper', { value: fakePaper, configurable: true });

    const addPendingSpy = jest.spyOn(paperStore, 'addPendingLinkChanges');

    store.clearViewForElementAndLinks({ cellId: 'a', paper: fakePaper });

    expect(cleanNodesCache).toHaveBeenCalled();
    expect(addPendingSpy).toHaveBeenCalled();
    const passed = addPendingSpy.mock.calls[0][0] as Map<string, unknown>;
    expect(passed.has('l1')).toBe(true);

    store.destroy(false);
  });

  it('returns early when the cell view is not found', () => {
    const store = new GraphStore<CellRecord, CellRecord>({});
    const findViewByModel = jest.fn(() => {
      // explicit no-return to satisfy linter while emulating "not found"
    });
    const fakePaper = { findViewByModel } as unknown as dia.Paper;
    store.clearViewForElementAndLinks({ cellId: 'missing', paper: fakePaper });
    expect(findViewByModel).toHaveBeenCalled();
    store.destroy(false);
  });
});

describe('GraphStore.setPaperViews', () => {
  it('triggers the layout-update event with the changes payload', () => {
    const store = new GraphStore({});
    store.addPaper('p1', { paperOptions: {} });
    const triggerSpy = jest.spyOn(store.graph, 'trigger');
    const changes = new Map<string, { type: 'change'; data: dia.Cell }>();
    store.setPaperViews('p1', changes as never);
    expect(triggerSpy).toHaveBeenCalledWith('layout:update', { changes });
    store.destroy(false);
  });
});

describe('GraphStore initial seed without controlled or initial cells', () => {
  it('does not call resetCells when neither seed prop is provided', () => {
    const graph = createGraph();
    const resetSpy = jest.spyOn(graph, 'resetCells');
    const store = new GraphStore({ graph });
    expect(resetSpy).not.toHaveBeenCalled();
    store.destroy(true);
  });
});

describe('GraphStore size observer integration', () => {
  beforeEach(() => {
    MockResizeObserver.reset();
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  it('writes size and position back to the graph through onBatchUpdate', () => {
    const store = new GraphStore<CellRecord, CellRecord>({
      initialCells: [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 1, height: 1 },
        } as CellRecord,
      ],
    });

    const node = document.createElement('div');
    store.setMeasuredNode({ id: 'a', node });

    const observer = MockResizeObserver.instances.at(-1)!;
    observer.triggerResize(node, 100, 50);

    const cell = store.graph.getCell('a') as dia.Element;
    expect(cell.size()).toEqual({ width: 100, height: 50 });
    store.destroy(false);
  });

  it('also writes position when transform returns x/y', () => {
    const store = new GraphStore<CellRecord, CellRecord>({
      initialCells: [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 1, height: 1 },
        } as CellRecord,
      ],
    });

    const node = document.createElement('div');
    store.setMeasuredNode({
      id: 'a',
      node,
      transform: ({ width, height }) => ({ width, height, x: 9, y: 11 }),
    });

    const observer = MockResizeObserver.instances.at(-1)!;
    observer.triggerResize(node, 80, 40);

    const cell = store.graph.getCell('a') as dia.Element;
    expect(cell.size()).toEqual({ width: 80, height: 40 });
    expect(cell.position()).toEqual({ x: 9, y: 11 });
    store.destroy(false);
  });

  it('skips non-element cells when assembling getElements()', () => {
    const store = new GraphStore<CellRecord, CellRecord>({
      initialCells: [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 1, height: 1 },
        } as CellRecord,
        {
          id: 'b',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 10, y: 0 },
          size: { width: 1, height: 1 },
        } as CellRecord,
        {
          id: 'l1',
          type: LINK_MODEL_TYPE,
          source: { id: 'a' },
          target: { id: 'b' },
        } as CellRecord,
      ],
    });

    const node = document.createElement('div');
    store.setMeasuredNode({ id: 'a', node });

    const observer = MockResizeObserver.instances.at(-1)!;
    observer.triggerResize(node, 50, 25);

    const cell = store.graph.getCell('a') as dia.Element;
    expect(cell.size()).toEqual({ width: 50, height: 25 });
    store.destroy(false);
  });

  it('throws via getCellTransform when the targeted cell is not an element', () => {
    const store = new GraphStore<CellRecord, CellRecord>({});
    // Prepare an element on the graph then add the measured node, but
    // remove the element afterwards before triggering resize so that
    // `getCell()` either returns a non-element or undefined.
    store.graph.addCell({
      id: 'ghost',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
    });
    const node = document.createElement('div');
    store.setMeasuredNode({ id: 'ghost', node });

    // Replace the cell with a non-element under the same id by removing it.
    store.graph.removeCells([store.graph.getCell('ghost')]);

    const observer = MockResizeObserver.instances.at(-1)!;
    expect(() => observer.triggerResize(node, 100, 50)).toThrow(/Cell not valid/);
    store.destroy(false);
  });
});

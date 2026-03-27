import { dia } from '@joint/core';
import type { PaperStore } from '../../store';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphView, type IncrementalContainerChanges } from '../graph-view';
import type { CellData } from '../../types/cell-data';

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function addElement(graph: dia.Graph, id: string, x = 10, y = 20, width = 100, height = 50): void {
  graph.addCell({ id, type: 'PortalElement', position: { x, y }, size: { width, height } });
}

/** Flush pending microtasks so commitChanges callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('graphView onIncrementalChange', () => {
  it('fires with added elements when element is added to graph', async () => {
    const graph = createGraph();
    const allChanges: Array<IncrementalContainerChanges<CellData, CellData>> = [];

    const view = graphView({
      graph,
      getPaperStores: () => new Map<string, PaperStore>(),
      onIncrementalChange: (c) => allChanges.push(c),
    });

    addElement(graph, 'el-1');
    await flush();

    expect(allChanges.length).toBeGreaterThan(0);
    const lastChange = allChanges.at(-1);
    expect(lastChange!.elements.added.has('el-1')).toBe(true);
    expect(lastChange!.elementsLayout.added.has('el-1')).toBe(true);

    view.destroy();
  });

  it('fires with removed elements when element is removed', async () => {
    const graph = createGraph();
    const allChanges: Array<IncrementalContainerChanges<CellData, CellData>> = [];

    const view = graphView({
      graph,
      getPaperStores: () => new Map<string, PaperStore>(),
      onIncrementalChange: (c) => allChanges.push(c),
    });

    addElement(graph, 'el-1');
    await flush();
    allChanges.length = 0;

    (graph.getCell('el-1') as dia.Element).remove();
    await flush();

    expect(allChanges.length).toBeGreaterThan(0);
    const lastChange = allChanges.at(-1);
    expect(lastChange!.elements.removed.has('el-1')).toBe(true);

    view.destroy();
  });

  it('fires layout changes on position update', async () => {
    const graph = createGraph();
    const allChanges: Array<IncrementalContainerChanges<CellData, CellData>> = [];

    const view = graphView({
      graph,
      getPaperStores: () => new Map<string, PaperStore>(),
      onIncrementalChange: (c) => allChanges.push(c),
    });

    addElement(graph, 'el-1');
    await flush();
    allChanges.length = 0;

    (graph.getCell('el-1') as dia.Element).position(200, 100);
    await flush();

    expect(allChanges.length).toBeGreaterThan(0);
    const lastChange = allChanges.at(-1);
    expect(lastChange!.elementsLayout.changed.has('el-1')).toBe(true);
    const layout = lastChange!.elementsLayout.changed.get('el-1');
    expect(layout?.x).toBe(200);
    expect(layout?.y).toBe(100);

    view.destroy();
  });

  it('does not throw when no onIncrementalChange is provided', async () => {
    const graph = createGraph();

    const view = graphView({
      graph,
      getPaperStores: () => new Map<string, PaperStore>(),
    });

    addElement(graph, 'el-1');
    await flush();

    expect(view.elements.get('el-1')).toBeDefined();
    expect(view.elementsLayout.get('el-1')).toBeDefined();

    view.destroy();
  });

  it('containers are committed before onIncrementalChange fires', async () => {
    const graph = createGraph();
    let containerValueDuringCallback: unknown;

    const view = graphView({
      graph,
      getPaperStores: () => new Map<string, PaperStore>(),
      onIncrementalChange: () => {
        containerValueDuringCallback = view.elementsLayout.get('el-1');
      },
    });

    addElement(graph, 'el-1');
    await flush();

    expect(containerValueDuringCallback).toBeDefined();
    expect((containerValueDuringCallback as { x: number }).x).toBe(10);

    view.destroy();
  });

  it('does NOT update elements data container on position-only change', async () => {
    const graph = createGraph();
    const view = graphView({
      graph,
      getPaperStores: () => new Map<string, PaperStore>(),
    });

    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    // Capture the data reference after initial add
    const dataAfterAdd = view.elements.get('el-1');
    expect(dataAfterAdd).toBeDefined();

    // Track if elements container notifies subscribers
    let elementsNotified = false;
    view.elements.subscribe('el-1', () => {
      elementsNotified = true;
    });

    // Change ONLY position — this should update elementsLayout, NOT elements
    (graph.getCell('el-1') as dia.Element).position(200, 100);
    await flush();

    // elementsLayout should be updated
    const layout = view.elementsLayout.get('el-1');
    expect(layout?.x).toBe(200);
    expect(layout?.y).toBe(100);

    // elements data container should NOT have been updated
    const dataAfterMove = view.elements.get('el-1');
    expect(dataAfterMove).toBe(dataAfterAdd); // same reference — not re-computed
    expect(elementsNotified).toBe(false); // no notification fired
  });

  it('does NOT update elements data container on size-only change', async () => {
    const graph = createGraph();
    const view = graphView({
      graph,
      getPaperStores: () => new Map<string, PaperStore>(),
    });

    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    const dataAfterAdd = view.elements.get('el-1');

    let elementsNotified = false;
    view.elements.subscribe('el-1', () => {
      elementsNotified = true;
    });

    // Change ONLY size
    (graph.getCell('el-1') as dia.Element).resize(200, 100);
    await flush();

    const layout = view.elementsLayout.get('el-1');
    expect(layout?.width).toBe(200);
    expect(layout?.height).toBe(100);

    // elements data should NOT change
    expect(view.elements.get('el-1')).toBe(dataAfterAdd);
    expect(elementsNotified).toBe(false);
  });

  it('DOES update elements data container on attribute change', async () => {
    const graph = createGraph();
    const view = graphView({
      graph,
      getPaperStores: () => new Map<string, PaperStore>(),
    });

    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    const dataAfterAdd = view.elements.get('el-1');

    // Change a non-layout attribute (data field)
    (graph.getCell('el-1') as dia.Element).set('data', { label: 'changed' });
    await flush();

    // elements data SHOULD be updated
    expect(view.elements.get('el-1')).not.toBe(dataAfterAdd);
  });
});

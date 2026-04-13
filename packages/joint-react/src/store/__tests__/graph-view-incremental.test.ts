import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphView, type IncrementalContainerChanges } from '../graph-view';

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function addElement(graph: dia.Graph, id: string, x = 10, y = 20, width = 100, height = 50): void {
  graph.addCell({ id, type: 'ElementModel', position: { x, y }, size: { width, height } });
}

/** Flush pending microtasks so commitChanges callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/** Clone incremental changes to capture snapshot (source Maps are cleared after callback). */
function cloneChanges(c: IncrementalContainerChanges): IncrementalContainerChanges {
  return {
    elements: {
      added: new Map(c.elements.added),
      changed: new Map(c.elements.changed),
      removed: new Set(c.elements.removed),
    },
    links: {
      added: new Map(c.links.added),
      changed: new Map(c.links.changed),
      removed: new Set(c.links.removed),
    },
  };
}

describe('graphView onIncrementalChange', () => {
  it('fires with added elements when element is added to graph', async () => {
    const graph = createGraph();
    const allChanges: IncrementalContainerChanges[] = [];

    const view = graphView({
      graph,

      onIncrementalChange: (c) => allChanges.push(cloneChanges(c)),
    });

    addElement(graph, 'el-1');
    await flush();

    expect(allChanges.length).toBeGreaterThan(0);
    const lastChange = allChanges.at(-1);
    expect(lastChange!.elements.added.has('el-1')).toBe(true);

    view.destroy();
  });

  it('fires with removed elements when element is removed', async () => {
    const graph = createGraph();
    const allChanges: IncrementalContainerChanges[] = [];

    const view = graphView({
      graph,

      onIncrementalChange: (c) => allChanges.push(cloneChanges(c)),
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

  it('fires element changes on position update', async () => {
    const graph = createGraph();
    const allChanges: IncrementalContainerChanges[] = [];

    const view = graphView({
      graph,

      onIncrementalChange: (c) => allChanges.push(cloneChanges(c)),
    });

    addElement(graph, 'el-1');
    await flush();
    allChanges.length = 0;

    (graph.getCell('el-1') as dia.Element).position(200, 100);
    await flush();

    expect(allChanges.length).toBeGreaterThan(0);
    const lastChange = allChanges.at(-1);
    expect(lastChange!.elements.changed.has('el-1')).toBe(true);
    const changed = lastChange!.elements.changed.get('el-1');
    expect(changed?.position?.x).toBe(200);
    expect(changed?.position?.y).toBe(100);

    view.destroy();
  });

  it('does not throw when no onIncrementalChange is provided', async () => {
    const graph = createGraph();

    const view = graphView({
      graph,


    });

    addElement(graph, 'el-1');
    await flush();

    expect(view.elements.get('el-1')).toBeDefined();

    view.destroy();
  });

  it('containers are committed before onIncrementalChange fires', async () => {
    const graph = createGraph();
    let containerValueDuringCallback: unknown;

    const view = graphView({
      graph,

      onIncrementalChange: () => {
        containerValueDuringCallback = view.elements.get('el-1');
      },

    });

    addElement(graph, 'el-1');
    await flush();

    expect(containerValueDuringCallback).toBeDefined();
    expect((containerValueDuringCallback as { position: { x: number } }).position.x).toBe(10);

    view.destroy();
  });

  it('updates elements container on position change', async () => {
    const graph = createGraph();
    const view = graphView({
      graph,


    });

    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    // Change position
    (graph.getCell('el-1') as dia.Element).position(200, 100);
    await flush();

    // Elements container should reflect the new position
    const elementData = view.elements.get('el-1');
    expect(elementData?.position?.x).toBe(200);
    expect(elementData?.position?.y).toBe(100);
  });

  it('updates elements container on size change', async () => {
    const graph = createGraph();
    const view = graphView({
      graph,


    });

    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    // Change size
    (graph.getCell('el-1') as dia.Element).resize(200, 100);
    await flush();

    const elementData = view.elements.get('el-1');
    expect(elementData?.size?.width).toBe(200);
    expect(elementData?.size?.height).toBe(100);
  });

  it('DOES update elements data container on attribute change', async () => {
    const graph = createGraph();
    const view = graphView({
      graph,


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

import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { graphView, type IncrementalCellsChange } from '../graph-view';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { ElementRecord } from '../../types/cell.types';

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function addElement(
  graph: dia.Graph,
  id: string,
  x = 10,
  y = 20,
  width = 100,
  height = 50
): void {
  graph.addCell({ id, type: ELEMENT_MODEL_TYPE, position: { x, y }, size: { width, height } });
}

function addLink(graph: dia.Graph, id: string, source: string, target: string): void {
  graph.addCell({
    id,
    type: LINK_MODEL_TYPE,
    source: { id: source },
    target: { id: target },
  });
}

/** Flush pending microtasks so commitChanges callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/** Clone incremental changes to capture snapshot (source maps are cleared after callback). */
function cloneChanges(c: IncrementalCellsChange): IncrementalCellsChange {
  return {
    added: new Map(c.added),
    changed: new Map(c.changed),
    removed: new Set(c.removed),
  };
}

describe('graphView onIncrementalChange', () => {
  it('fires with added cell when an element is added to the graph', async () => {
    const graph = createGraph();
    const allChanges: IncrementalCellsChange[] = [];

    const view = graphView({
      graph,
      onIncrementalChange: (c) => allChanges.push(cloneChanges(c)),
    });

    addElement(graph, 'el-1');
    await flush();

    expect(allChanges.length).toBeGreaterThan(0);
    const last = allChanges.at(-1)!;
    expect(last.added.has('el-1')).toBe(true);

    view.destroy();
  });

  it('fires with removed id when a cell is removed', async () => {
    const graph = createGraph();
    const allChanges: IncrementalCellsChange[] = [];

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
    const last = allChanges.at(-1)!;
    expect(last.removed.has('el-1')).toBe(true);

    view.destroy();
  });

  it('fires with changed element on position update', async () => {
    const graph = createGraph();
    const allChanges: IncrementalCellsChange[] = [];

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
    const last = allChanges.at(-1)!;
    expect(last.changed.has('el-1')).toBe(true);
    const changed = last.changed.get('el-1') as ElementRecord | undefined;
    expect(changed?.position?.x).toBe(200);
    expect(changed?.position?.y).toBe(100);

    view.destroy();
  });

  it('does not throw when no onIncrementalChange is provided', async () => {
    const graph = createGraph();
    const view = graphView({ graph });

    addElement(graph, 'el-1');
    await flush();

    expect(view.cells.get('el-1')).toBeDefined();
    view.destroy();
  });

  it('commits container state before firing onIncrementalChange', async () => {
    const graph = createGraph();
    let containerValueDuringCallback: unknown;

    const view = graphView({
      graph,
      onIncrementalChange: () => {
        containerValueDuringCallback = view.cells.get('el-1');
      },
    });

    addElement(graph, 'el-1');
    await flush();

    expect(containerValueDuringCallback).toBeDefined();
    const captured = containerValueDuringCallback as ElementRecord;
    expect(captured.position?.x).toBe(10);
    view.destroy();
  });

  it('updates the cells container on position change', async () => {
    const graph = createGraph();
    const view = graphView({ graph });

    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    (graph.getCell('el-1') as dia.Element).position(200, 100);
    await flush();

    const record = view.cells.get('el-1') as ElementRecord | undefined;
    expect(record?.position?.x).toBe(200);
    expect(record?.position?.y).toBe(100);
    view.destroy();
  });

  it('updates the cells container on size change', async () => {
    const graph = createGraph();
    const view = graphView({ graph });

    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    (graph.getCell('el-1') as dia.Element).resize(200, 100);
    await flush();

    const record = view.cells.get('el-1') as ElementRecord | undefined;
    expect(record?.size?.width).toBe(200);
    expect(record?.size?.height).toBe(100);
    view.destroy();
  });

  it('updates the cells container on attribute change (new reference)', async () => {
    const graph = createGraph();
    const view = graphView({ graph });

    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    const afterAdd = view.cells.get('el-1');

    (graph.getCell('el-1') as dia.Element).set('data', { label: 'changed' });
    await flush();

    expect(view.cells.get('el-1')).not.toBe(afterAdd);
    view.destroy();
  });

  it('emits added entries for both elements and links in the unified summary', async () => {
    const graph = createGraph();
    const allChanges: IncrementalCellsChange[] = [];
    const view = graphView({
      graph,
      onIncrementalChange: (c) => allChanges.push(cloneChanges(c)),
    });

    addElement(graph, 'a');
    addElement(graph, 'b', 200, 0);
    addLink(graph, 'l1', 'a', 'b');
    await flush();

    const last = allChanges.at(-1)!;
    expect(last.added.has('a')).toBe(true);
    expect(last.added.has('b')).toBe(true);
    expect(last.added.has('l1')).toBe(true);
    view.destroy();
  });

  it('element removal also removes connected links in the same incremental summary', async () => {
    const graph = createGraph();
    const allChanges: IncrementalCellsChange[] = [];
    const view = graphView({
      graph,
      onIncrementalChange: (c) => allChanges.push(cloneChanges(c)),
    });

    addElement(graph, 'a');
    addElement(graph, 'b', 200, 0);
    addLink(graph, 'l1', 'a', 'b');
    await flush();
    allChanges.length = 0;

    (graph.getCell('a') as dia.Element).remove();
    await flush();

    const last = allChanges.at(-1)!;
    expect(last.removed.has('a')).toBe(true);
    expect(last.removed.has('l1')).toBe(true);
    view.destroy();
  });
});

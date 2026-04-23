import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { graphView } from '../graph-view';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import { isElementType, isLinkType } from '../../utils/cell-type';
import type { CellRecord, Cells, ElementRecord, LinkRecord } from '../../types/cell.types';

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function setup() {
  const graph = createGraph();
  const view = graphView({ graph });
  return { graph, view };
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

/** Returns the element record under `id`, narrowed via the graph's type registry. */
function getElement(
  graph: dia.Graph,
  view: ReturnType<typeof graphView>,
  id: string
): ElementRecord | undefined {
  const cell = view.cells.get(id);
  if (!cell || !isElementType(cell.type, graph)) return undefined;
  return cell as ElementRecord;
}

/** Returns the link record under `id`, narrowed via the graph's type registry. */
function getLink(
  graph: dia.Graph,
  view: ReturnType<typeof graphView>,
  id: string
): LinkRecord | undefined {
  const cell = view.cells.get(id);
  if (!cell || !isLinkType(cell.type, graph)) return undefined;
  return cell as LinkRecord;
}

/** Number of cells classified as elements via the graph's type registry. */
function countElements(graph: dia.Graph, view: ReturnType<typeof graphView>): number {
  let count = 0;
  for (const cell of view.cells.getAll()) if (isElementType(cell.type, graph)) count++;
  return count;
}

/** Number of cells classified as links via the graph's type registry. */
function countLinks(graph: dia.Graph, view: ReturnType<typeof graphView>): number {
  let count = 0;
  for (const cell of view.cells.getAll()) if (isLinkType(cell.type, graph)) count++;
  return count;
}

/** Flush pending microtasks so commitChanges callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('graphView — single cells container', () => {
  it('exposes only the unified `cells` container', () => {
    const { view } = setup();
    expect(view.cells).toBeDefined();
    expect((view as unknown as Record<string, unknown>).elements).toBeUndefined();
    expect((view as unknown as Record<string, unknown>).links).toBeUndefined();
    view.destroy();
  });
});

describe('graphView — elements data reflects graph state', () => {
  it('has correct data after add', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    expect(getElement(graph, view,'el-1')).toEqual(
      expect.objectContaining({ position: { x: 10, y: 20 }, size: { width: 100, height: 50 } })
    );
    view.destroy();
  });

  it('has correct position after position change', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20);
    await flush();

    (graph.getCell('el-1') as dia.Element).position(50, 60);
    await flush();

    expect(getElement(graph, view,'el-1')).toEqual(
      expect.objectContaining({ position: { x: 50, y: 60 } })
    );
    view.destroy();
  });

  it('has correct size after resize', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    (graph.getCell('el-1') as dia.Element).resize(200, 150);
    await flush();

    expect(getElement(graph, view,'el-1')).toEqual(
      expect.objectContaining({ size: { width: 200, height: 150 } })
    );
    view.destroy();
  });

  it('returns undefined after remove', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    await flush();

    (graph.getCell('el-1') as dia.Element).remove();
    await flush();

    expect(view.cells.get('el-1')).toBeUndefined();
    view.destroy();
  });

  it('returns new reference after data change (immutable items)', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20);
    await flush();

    const before = getElement(graph, view,'el-1');
    (graph.getCell('el-1') as dia.Element).set('data', { label: 'changed' });
    await flush();
    const after = getElement(graph, view,'el-1');

    expect(after).not.toBe(before);
    view.destroy();
  });

  it('has correct angle after rotate', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    (graph.getCell('el-1') as dia.Element).rotate(45);
    await flush();

    expect(getElement(graph, view,'el-1')).toEqual(expect.objectContaining({ angle: 45 }));
    view.destroy();
  });

  it('preserves content when the same position is set again', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20);
    await flush();

    const before = getElement(graph, view,'el-1');
    (graph.getCell('el-1') as dia.Element).position(10, 20);
    await flush();
    const after = getElement(graph, view,'el-1');

    expect(after).toEqual(before);
    view.destroy();
  });

  it('tracks element count through add / remove', async () => {
    const { graph, view } = setup();
    expect(countElements(graph, view)).toBe(0);

    addElement(graph, 'el-1');
    addElement(graph, 'el-2');
    addElement(graph, 'el-3');
    await flush();
    expect(countElements(graph, view)).toBe(3);

    (graph.getCell('el-2') as dia.Element).remove();
    await flush();
    expect(countElements(graph, view)).toBe(2);

    view.destroy();
  });

  it('returns a new reference after a position change', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    const before = getElement(graph, view,'el-1');
    (graph.getCell('el-1') as dia.Element).position(50, 60);
    await flush();
    const after = getElement(graph, view,'el-1');

    expect(after).not.toBe(before);
    view.destroy();
  });
});

describe('graphView — links data reflects graph state', () => {
  it('has data after add', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    addElement(graph, 'el-2');
    addLink(graph, 'link-1', 'el-1', 'el-2');
    await flush();

    expect(getLink(graph, view,'link-1')).toBeDefined();
    view.destroy();
  });

  it('returns undefined after remove', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    addElement(graph, 'el-2');
    addLink(graph, 'link-1', 'el-1', 'el-2');
    await flush();

    (graph.getCell('link-1') as dia.Link).remove();
    await flush();

    expect(view.cells.get('link-1')).toBeUndefined();
    view.destroy();
  });

  it('tracks link count', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    addElement(graph, 'el-2');
    await flush();
    expect(countLinks(graph, view)).toBe(0);

    addLink(graph, 'link-1', 'el-1', 'el-2');
    await flush();
    expect(countLinks(graph, view)).toBe(1);

    (graph.getCell('link-1') as dia.Link).remove();
    await flush();
    expect(countLinks(graph, view)).toBe(0);

    view.destroy();
  });
});

describe('graphView — per-id subscriptions', () => {
  it('notifies the subscriber for the moved cell only', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    addElement(graph, 'el-2');
    await flush();

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    view.cells.subscribe('el-1', listener1);
    view.cells.subscribe('el-2', listener2);

    (graph.getCell('el-2') as dia.Element).position(50, 60);
    await flush();

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
    view.destroy();
  });

  it('size listener fires on add / remove but not on data-only change', async () => {
    const { graph, view } = setup();
    const sizeListener = jest.fn();
    view.cells.subscribeToSize(sizeListener);

    addElement(graph, 'el-1');
    await flush();
    expect(sizeListener).toHaveBeenCalledTimes(1);

    (graph.getCell('el-1') as dia.Element).position(50, 60);
    await flush();
    expect(sizeListener).toHaveBeenCalledTimes(1);

    (graph.getCell('el-1') as dia.Element).remove();
    await flush();
    expect(sizeListener).toHaveBeenCalledTimes(2);

    view.destroy();
  });
});

describe('graphView — multiple cells isolation', () => {
  it('changing one element does not replace another cell reference', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20, 100, 50);
    addElement(graph, 'el-2', 30, 40, 200, 100);
    await flush();

    const element2Before = view.cells.get('el-2');
    (graph.getCell('el-1') as dia.Element).position(99, 99);
    await flush();

    expect(view.cells.get('el-2')).toBe(element2Before);
    view.destroy();
  });

  it('removing one cell does not replace another cell reference', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    addElement(graph, 'el-2', 30, 40, 200, 100);
    await flush();

    const element2Before = view.cells.get('el-2');
    (graph.getCell('el-1') as dia.Element).remove();
    await flush();

    expect(view.cells.get('el-2')).toBe(element2Before);
    expect(view.cells.get('el-1')).toBeUndefined();
    view.destroy();
  });
});

describe('graphView — reset', () => {
  it('repopulates with new cells', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    addElement(graph, 'el-2');
    await flush();

    graph.resetCells([
      {
        id: 'el-3',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 5, y: 5 },
        size: { width: 50, height: 50 },
      },
    ]);
    await flush();

    expect(getElement(graph, view,'el-3')).toEqual(
      expect.objectContaining({ position: { x: 5, y: 5 }, size: { width: 50, height: 50 } })
    );
    view.destroy();
  });
});

describe('graphView — destroy', () => {
  it('stops tracking graph changes', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    await flush();
    expect(view.cells.get('el-1')).toBeDefined();

    view.destroy();

    addElement(graph, 'el-2');
    await flush();
    expect(view.cells.get('el-2')).toBeUndefined();
  });

  it('does not notify subscribers after destroy', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    await flush();

    const listener = jest.fn();
    view.cells.subscribe('el-1', listener);

    view.destroy();

    (graph.getCell('el-1') as dia.Element).position(50, 60);
    await flush();

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('graphView — link propagation', () => {
  it('link data is populated when link is added', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20);
    addElement(graph, 'el-2', 300, 400);
    addLink(graph, 'link-1', 'el-1', 'el-2');
    await flush();

    const link = getLink(graph, view,'link-1');
    expect(link).toBeDefined();
    expect(link?.source).toEqual({ id: 'el-1' });
    expect(link?.target).toEqual({ id: 'el-2' });
    view.destroy();
  });

  it('preserves the link record reference when a connected element moves', async () => {
    // When an element moves, the graph-view pipeline re-syncs connected
    // links, but their structural content (source/target/data/style/…) is
    // unchanged — the element move only affects the link's rendered
    // geometry, which `LinkView` computes at paint time, not stored on the
    // record. `mergeCellRecord`'s fast path detects the no-op change and
    // returns the previous reference, so subscribers do not re-render on
    // connected-element moves and React bails out via `Object.is` in
    // `useSyncExternalStore`.
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20);
    addElement(graph, 'el-2', 300, 400);
    addLink(graph, 'link-1', 'el-1', 'el-2');
    await flush();

    const linkBefore = view.cells.get('link-1');
    (graph.getCell('el-1') as dia.Element).position(50, 60);
    await flush();
    const linkAfter = view.cells.get('link-1');
    expect(linkAfter).toBe(linkBefore);
    view.destroy();
  });
});

describe('graphView — controlled-mode updateGraph round-trip', () => {
  it('all cells persist after position change and updateGraph round-trip', async () => {
    const graph = createGraph();
    const view = graphView({ graph });

    const initialCells: Cells = [
      {
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
        data: { label: 'A' },
        position: { x: 50, y: 50 },
      } as CellRecord,
      {
        id: 'b',
        type: ELEMENT_MODEL_TYPE,
        data: { label: 'B' },
        position: { x: 200, y: 200 },
      } as CellRecord,
      {
        id: 'a-b',
        type: LINK_MODEL_TYPE,
        source: { id: 'a' },
        target: { id: 'b' },
      } as CellRecord,
    ];
    view.updateGraph({ cells: initialCells, flag: 'updateFromReact' });
    await flush();

    expect(countElements(graph, view)).toBe(2);
    expect(countLinks(graph, view)).toBe(1);

    (graph.getCell('a') as dia.Element).position(100, 100);
    await flush();

    // Read current container state (what notifyCellsChange would expose)
    const nextCells = view.cells.getAll() as Cells;
    view.updateGraph({ cells: nextCells, flag: 'updateFromReact' });
    await flush();

    expect(countElements(graph, view)).toBe(2);
    expect(view.cells.get('a')).toBeDefined();
    expect(view.cells.get('b')).toBeDefined();
    expect(getElement(graph, view,'a')?.position).toEqual({ x: 100, y: 100 });
    expect(countLinks(graph, view)).toBe(1);
    view.destroy();
  });
});

describe('graphView — selective reference stability', () => {
  it('preserves data reference when only position changes', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    const before = getElement(graph, view,'el-1')!;
    const dataBefore = before.data;

    (graph.getCell('el-1') as dia.Element).position(50, 60);
    await flush();

    const after = getElement(graph, view,'el-1')!;
    expect(after.position).toEqual({ x: 50, y: 60 });
    expect(after.data).toBe(dataBefore);
    view.destroy();
  });

  it('preserves position reference when only data changes', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    const before = getElement(graph, view,'el-1')!;
    const positionBefore = before.position;

    (graph.getCell('el-1') as dia.Element).set('data', { label: 'changed' });
    await flush();

    const after = getElement(graph, view,'el-1')!;
    expect(after.data).toEqual({ label: 'changed' });
    expect(after.position).toBe(positionBefore);
    view.destroy();
  });

  it('preserves size reference when only position changes', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1', 10, 20, 100, 50);
    await flush();

    const before = getElement(graph, view,'el-1')!;
    const sizeBefore = before.size;

    (graph.getCell('el-1') as dia.Element).position(50, 60);
    await flush();

    const after = getElement(graph, view,'el-1')!;
    expect(after.size).toBe(sizeBefore);
    view.destroy();
  });

  it('element has correct data and size after add', async () => {
    const { graph, view } = setup();
    graph.addCell({
      id: 'el-1',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 10, y: 20 },
      size: { width: 200, height: 100 },
      data: { label: 'Hello' },
    });
    await flush();

    const element = getElement(graph, view,'el-1')!;
    expect(element.position).toEqual({ x: 10, y: 20 });
    expect(element.size).toEqual({ width: 200, height: 100 });
    expect(element.data).toEqual({ label: 'Hello' });
    view.destroy();
  });

  it('element preserves correct values after internal attribute change', async () => {
    const { graph, view } = setup();
    graph.addCell({
      id: 'el-1',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 10, y: 20 },
      size: { width: 200, height: 100 },
      data: { label: 'Hello' },
    });
    await flush();

    (graph.getCell('el-1') as dia.Element).set('attrs', { body: { fill: 'red' } });
    await flush();

    const element = getElement(graph, view,'el-1')!;
    expect(element.position).toEqual({ x: 10, y: 20 });
    expect(element.size).toEqual({ width: 200, height: 100 });
    expect(element.data).toEqual({ label: 'Hello' });
    view.destroy();
  });
});

describe('graphView — LAYOUT_UPDATE_EVENT path', () => {
  it('element retains correct size after layout update with stale model.changed', async () => {
    const { graph, view } = setup();
    graph.addCell({
      id: 'el-1',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 10, y: 20 },
      size: { width: 200, height: 100 },
      data: { label: 'Hello' },
    });
    await flush();

    const before = getElement(graph, view,'el-1')!;
    expect(before.size).toEqual({ width: 200, height: 100 });

    const cell = graph.getCell('el-1') as dia.Element;
    cell.set('attrs', { body: { fill: 'blue' } });

    const layoutChanges = new Map([['el-1', { type: 'add' as const, data: cell }]]);
    graph.trigger('layout:update', { changes: layoutChanges });
    await flush();
    await flush();

    const after = getElement(graph, view,'el-1')!;
    expect(after.size).toEqual({ width: 200, height: 100 });
    expect(after.position).toEqual({ x: 10, y: 20 });
    expect(after.data).toEqual({ label: 'Hello' });
    view.destroy();
  });

  it('element retains size after batch resize (multiple set calls)', async () => {
    const { graph, view } = setup();
    graph.addCell({
      id: 'el-1',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
      data: { label: 'Resize me' },
    });
    await flush();

    expect(getElement(graph, view,'el-1')!.size).toEqual({ width: 100, height: 50 });

    const cell = graph.getCell('el-1') as dia.Element;
    graph.startBatch('resize');
    cell.set('size', { width: 300, height: 200 });
    cell.set('position', { x: 15, y: 25 });
    graph.stopBatch('resize');
    await flush();

    const after = getElement(graph, view,'el-1')!;
    expect(after.size).toEqual({ width: 300, height: 200 });
    expect(after.position).toEqual({ x: 15, y: 25 });
    expect(after.data).toEqual({ label: 'Resize me' });
    view.destroy();
  });

  it('element retains position when size is set last in a batch', async () => {
    const { graph, view } = setup();
    graph.addCell({
      id: 'el-1',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
      data: { label: 'Test' },
    });
    await flush();

    const cell = graph.getCell('el-1') as dia.Element;
    graph.startBatch('resize');
    cell.set('position', { x: 50, y: 60 });
    cell.set('size', { width: 300, height: 200 });
    graph.stopBatch('resize');
    await flush();

    const element = getElement(graph, view,'el-1')!;
    expect(element.position).toEqual({ x: 50, y: 60 });
    expect(element.size).toEqual({ width: 300, height: 200 });
    view.destroy();
  });

  it('fresh layout update has correct values after updateGraph seeding', async () => {
    const graph = createGraph();
    const view = graphView({ graph });

    view.updateGraph({
      cells: [
        {
          id: 'el-1',
          type: ELEMENT_MODEL_TYPE,
          data: { label: 'Test' },
          position: { x: 50, y: 60 },
          size: { width: 150, height: 80 },
        } as CellRecord,
      ],
      flag: 'updateFromReact',
    });
    await flush();

    expect(getElement(graph, view,'el-1')!.size).toEqual({ width: 150, height: 80 });

    const cell = graph.getCell('el-1') as dia.Element;
    const layoutChanges = new Map([['el-1', { type: 'add' as const, data: cell }]]);
    graph.trigger('layout:update', { changes: layoutChanges });
    await flush();
    await flush();

    const after = getElement(graph, view,'el-1')!;
    expect(after.size).toEqual({ width: 150, height: 80 });
    expect(after.position).toEqual({ x: 50, y: 60 });
    expect(after.data).toEqual({ label: 'Test' });
    view.destroy();
  });
});

describe('graphView — embedding', () => {
  it('reflects parent after embed', async () => {
    const { graph, view } = setup();
    addElement(graph, 'parent-1', 0, 0, 400, 300);
    addElement(graph, 'child-1', 50, 50, 100, 50);
    await flush();

    const parent = graph.getCell('parent-1') as dia.Element;
    const child = graph.getCell('child-1') as dia.Element;
    parent.embed(child);
    await flush();

    expect(getElement(graph, view,'child-1')).toEqual(
      expect.objectContaining({ parent: 'parent-1' })
    );
    view.destroy();
  });

  it('removes parent attribute after unembed', async () => {
    const { graph, view } = setup();
    addElement(graph, 'parent-1', 0, 0, 400, 300);
    addElement(graph, 'child-1', 50, 50, 100, 50);
    await flush();

    const parent = graph.getCell('parent-1') as dia.Element;
    const child = graph.getCell('child-1') as dia.Element;
    parent.embed(child);
    await flush();

    expect(getElement(graph, view,'child-1')?.parent).toBe('parent-1');

    parent.unembed(child);
    await flush();

    expect(getElement(graph, view,'child-1')?.parent).toBeUndefined();
    view.destroy();
  });

  it('reflects embeds array on parent after embed / unembed', async () => {
    const { graph, view } = setup();
    addElement(graph, 'parent-1', 0, 0, 400, 300);
    addElement(graph, 'child-1', 50, 50, 100, 50);
    await flush();

    const parent = graph.getCell('parent-1') as dia.Element;
    const child = graph.getCell('child-1') as dia.Element;
    parent.embed(child);
    await flush();

    expect(getElement(graph, view,'parent-1')?.embeds).toEqual(['child-1']);

    parent.unembed(child);
    await flush();

    const embedsAfter = getElement(graph, view,'parent-1')?.embeds as string[] | undefined;
    expect(embedsAfter === undefined || embedsAfter.length === 0).toBe(true);
    view.destroy();
  });
});

describe('graphView — isUpdateFromReact filtering', () => {
  it('ignores changes with the isUpdateFromReact flag', async () => {
    const { graph, view } = setup();
    addElement(graph, 'el-1');
    await flush();

    const before = view.cells.get('el-1');

    (graph.getCell('el-1') as dia.Element).position(50, 60, { isUpdateFromReact: true });
    await flush();

    expect(view.cells.get('el-1')).toBe(before);
    view.destroy();
  });
});

describe('graphView — syncFromGraph and partial updateGraph', () => {
  it('syncFromGraph seeds the cells container from current graph state', () => {
    const graph = createGraph();
    addElement(graph, 'a');
    addElement(graph, 'b', 50, 0);
    const view = graphView({ graph });
    view.syncFromGraph();
    expect(view.cells.has('a')).toBe(true);
    expect(view.cells.has('b')).toBe(true);
    expect(view.cells.getSize()).toBe(2);
    view.destroy();
  });

  it('updateGraph without cells is a no-op and preserves existing state', () => {
    const graph = createGraph();
    graph.addCells([
      {
        id: 'e1',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      },
    ]);
    const view = graphView({ graph });
    view.syncFromGraph();
    view.updateGraph({ flag: 'updateFromReact' });

    expect(view.cells.get('e1')).toBeDefined();
    view.destroy();
  });

  it('updateGraph replaces the graph cells with the provided snapshot', async () => {
    const { graph, view } = setup();
    addElement(graph, 'a');
    await flush();
    const nextCells: Cells = [
      {
        id: 'b',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      } as CellRecord,
    ];
    view.updateGraph({ cells: nextCells, flag: 'updateFromReact' });
    expect(view.cells.has('b')).toBe(true);
    expect(view.cells.has('a')).toBe(false);
    view.destroy();
  });
});

describe('graphView — custom cell types', () => {
  it('passes through custom cell types without running them through element/link mappers', async () => {
    class CustomCell extends dia.Cell {}
    const namespace = { ...DEFAULT_CELL_NAMESPACE, custom: { Foo: CustomCell } };
    const graph = new dia.Graph({}, { cellNamespace: namespace });
    const view = graphView({ graph });
    graph.addCell({ id: 'custom-1', type: 'custom.Foo' } as unknown as dia.Cell.JSON);
    await flush();
    const record = view.cells.get('custom-1');
    expect(record).toBeDefined();
    expect(record?.type).toBe('custom.Foo');
    view.destroy();
  });
});

import { dia, mvc } from '@joint/core';
import { createCollectionView } from '../collection-view';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function makeElement(graph: dia.Graph, id: string, x = 0, y = 0): dia.Cell {
  graph.addCell({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x, y },
    size: { width: 10, height: 10 },
  });
  return graph.getCell(id)!;
}

describe('createCollectionView', () => {
  it('seeds the cells container from the collection', async () => {
    const graph = createGraph();
    const a = makeElement(graph, 'a');
    const b = makeElement(graph, 'b');
    const collection = new mvc.Collection<dia.Cell>([a, b]);

    const view = createCollectionView(collection);
    await flush();

    expect(view.cells.getSize()).toBe(2);
    expect(view.cells.get('a')?.id).toBe('a');
    expect(view.cells.get('b')?.id).toBe('b');

    view.destroy();
  });

  it('reflects add events', async () => {
    const graph = createGraph();
    const a = makeElement(graph, 'a');
    const collection = new mvc.Collection<dia.Cell>([a]);
    const view = createCollectionView(collection);
    await flush();

    const b = makeElement(graph, 'b');
    collection.add(b);
    await flush();

    expect(view.cells.get('b')?.id).toBe('b');
    view.destroy();
  });

  it('reflects remove events', async () => {
    const graph = createGraph();
    const a = makeElement(graph, 'a');
    const b = makeElement(graph, 'b');
    const collection = new mvc.Collection<dia.Cell>([a, b]);
    const view = createCollectionView(collection);
    await flush();

    collection.remove(a);
    await flush();

    expect(view.cells.has('a')).toBe(false);
    expect(view.cells.has('b')).toBe(true);
    view.destroy();
  });

  it('reflects reset events', async () => {
    const graph = createGraph();
    const a = makeElement(graph, 'a');
    const collection = new mvc.Collection<dia.Cell>([a]);
    const view = createCollectionView(collection);
    await flush();

    const b = makeElement(graph, 'b');
    const c = makeElement(graph, 'c');
    collection.reset([b, c]);
    await flush();

    expect(view.cells.has('a')).toBe(false);
    expect(view.cells.has('b')).toBe(true);
    expect(view.cells.has('c')).toBe(true);
    view.destroy();
  });

  it('updates a record on attribute change', async () => {
    const graph = createGraph();
    const a = makeElement(graph, 'a', 0, 0) as dia.Element;
    const collection = new mvc.Collection<dia.Cell>([a]);
    const view = createCollectionView(collection);
    await flush();

    const before = view.cells.get('a');
    a.position(50, 60);
    await flush();
    const after = view.cells.get('a');

    expect(after).not.toBe(before);
    expect((after as { position: { x: number; y: number } }).position).toEqual({ x: 50, y: 60 });
    view.destroy();
  });

  it('skips notify when nothing observable changed (merge fast-path)', async () => {
    const graph = createGraph();
    const a = makeElement(graph, 'a') as dia.Element;
    const collection = new mvc.Collection<dia.Cell>([a]);
    const view = createCollectionView(collection);
    await flush();

    const listener = jest.fn();
    const unsubscribe = view.cells.subscribeToAll(listener);

    a.position(0, 0);
    await flush();
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
    view.destroy();
  });

  it('stops listening after destroy', async () => {
    const graph = createGraph();
    const a = makeElement(graph, 'a');
    const collection = new mvc.Collection<dia.Cell>([a]);
    const view = createCollectionView(collection);
    await flush();

    view.destroy();
    const b = makeElement(graph, 'b');
    collection.add(b);
    await flush();

    expect(view.cells.has('b')).toBe(false);
  });

  it('handles link cells', async () => {
    const graph = createGraph();
    const a = makeElement(graph, 'a');
    const b = makeElement(graph, 'b');
    graph.addCell({
      id: 'l',
      type: LINK_MODEL_TYPE,
      source: { id: 'a' },
      target: { id: 'b' },
    });
    const link = graph.getCell('l')!;
    const collection = new mvc.Collection<dia.Cell>([a, b, link]);

    const view = createCollectionView(collection);
    await flush();

    const linkRecord = view.cells.get('l');
    expect(linkRecord?.type).toBe(LINK_MODEL_TYPE);
    view.destroy();
  });
});

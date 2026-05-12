import { dia, mvc } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';

function setup() {
  const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  graph.addCell({
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  });
  graph.addCell({
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  });
  const store = new GraphStore({ graph });
  const collection = new mvc.Collection<dia.Cell>([graph.getCell('a')!, graph.getCell('b')!]);
  return { store, graph, collection };
}

describe('GraphStore collection-view registry', () => {
  it('creates one view per collection, shared across acquires', () => {
    const { store, collection } = setup();
    const v1 = store.acquireCollectionView(collection);
    const v2 = store.acquireCollectionView(collection);
    expect(v1).toBe(v2);
    store.releaseCollectionView(collection);
    store.releaseCollectionView(collection);
    store.destroy(true);
  });

  it('destroys the view when the last subscriber releases', () => {
    const { store, collection } = setup();
    const view = store.acquireCollectionView(collection);
    const destroySpy = jest.spyOn(view, 'destroy');
    store.releaseCollectionView(collection);
    expect(destroySpy).toHaveBeenCalledTimes(1);
    store.destroy(true);
  });

  it('rebuilds the view after eviction', () => {
    const { store, collection } = setup();
    const v1 = store.acquireCollectionView(collection);
    store.releaseCollectionView(collection);
    const v2 = store.acquireCollectionView(collection);
    expect(v2).not.toBe(v1);
    store.releaseCollectionView(collection);
    store.destroy(true);
  });

  it('store.destroy tears down all live views', () => {
    const { store, collection } = setup();
    const view = store.acquireCollectionView(collection);
    const destroySpy = jest.spyOn(view, 'destroy');
    store.destroy(true);
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });
});

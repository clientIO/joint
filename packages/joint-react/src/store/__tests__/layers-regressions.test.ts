import { dia } from '@joint/core';
import { GraphStore } from '../graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { ElementJSONInit, ElementRecord, LinkJSONInit } from '../../types/cell.types';

const element = (id: string, layer = 'cells') => ({
  id,
  type: ELEMENT_MODEL_TYPE,
  layer,
  position: { x: 10, y: 20 },
  size: { width: 100, height: 50 },
} satisfies ElementRecord);
const graphIds = (store: Pick<GraphStore, 'graph'>) =>
  store.graph.getCells().map((cell) => cell.id).toSorted((a, b) => String(a).localeCompare(String(b)));
const projectedIds = <Element extends ElementJSONInit, Link extends LinkJSONInit>(
  store: GraphStore<Element, Link>
) =>
  store.graphProjection.cells
    .getSnapshot()
    .map((cell) => cell.id)
    .toSorted((a, b) => String(a).localeCompare(String(b)));

it('projects initial cells from named layers as well as the default layer', () => {
  const store = new GraphStore({
    initialLayers: [{ id: 'notes' }],
    initialCells: [element('plain'), element('note', 'notes')],
  });
  try {
    expect(projectedIds(store)).toEqual(['note', 'plain']);
    expect(projectedIds(store)).toEqual(graphIds(store));
    expect(store.graphProjection.cells.get('note')).toMatchObject({ layer: 'notes' });
  } finally {
    store.destroy(false);
  }
});

it('reconciles the projection against every layer after resetCells', () => {
  const store = new GraphStore({
    initialLayers: [{ id: 'notes' }],
    initialCells: [element('old')],
  });
  try {
    store.graph.resetCells([element('new-plain'), element('new-note', 'notes')]);

    expect(projectedIds(store)).toEqual(['new-note', 'new-plain']);
    expect(projectedIds(store)).toEqual(graphIds(store));
    expect(store.graphProjection.cells.has('old')).toBe(false);
  } finally {
    store.destroy(false);
  }
});

it('projects all replacement layers and cells after fromJSON', () => {
  const store = new GraphStore({ initialCells: [element('old')] });
  try {
    store.graph.fromJSON({
      layers: [{ id: 'cells' }, { id: 'notes' }],
      defaultLayer: 'cells',
      cells: [element('new-plain'), element('new-note', 'notes')],
    });

    expect(projectedIds(store)).toEqual(['new-note', 'new-plain']);
    expect(projectedIds(store)).toEqual(graphIds(store));
    expect(store.graphProjection.layers.getLayer('notes')).toBeDefined();
    expect(store.graphProjection.cells.has('old')).toBe(false);
  } finally {
    store.destroy(false);
  }
});

it('rejects registered constructors that are not GraphLayer subclasses before any write or batch', () => {
  class NotALayer {
    readonly label = 'not a layer';
  }
  const store = new GraphStore({ layerNamespace: { NotALayer } });
  const startBatch = jest.spyOn(store.graph, 'startBatch');
  try {
    expect(() =>
      store.applyLayers([{ id: 'good' }, { id: 'bad', type: 'NotALayer' }])
    ).toThrow();

    expect(startBatch).not.toHaveBeenCalled();
    expect(store.graph.hasLayer('good')).toBe(false);
    expect(store.graph.hasLayer('bad')).toBe(false);
    expect(store.graph.hasActiveBatch()).toBe(false);
  } finally {
    store.destroy(false);
  }
});

it('closes the React-origin batch when a registered GraphLayer constructor throws', async () => {
  class ThrowingLayer extends dia.GraphLayer {
    constructor(...args: ConstructorParameters<typeof dia.GraphLayer>) {
      super(...args);
      throw new Error('layer construction failed');
    }
  }
  const store = new GraphStore({ layerNamespace: { ThrowingLayer } });
  const stopBatch = jest.spyOn(store.graph, 'stopBatch');
  try {
    expect(() => store.applyLayers([{ id: 'bad', type: 'ThrowingLayer' }])).toThrow(
      'layer construction failed'
    );

    expect(store.graph.hasActiveBatch('updateFromReact')).toBe(false);
    expect(stopBatch).toHaveBeenCalledWith(
      'updateFromReact',
      expect.objectContaining({ isUpdateFromReact: true })
    );

    store.applyLayers([{ id: 'after' }]);
    store.graph.addCell(element('recovered', 'after'));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(store.graphProjection.layers.getLayer('after')).toBeDefined();
    expect(store.graphProjection.cells.has('recovered')).toBe(true);
    expect(store.graph.hasActiveBatch()).toBe(false);
  } finally {
    store.destroy(false);
  }
});

it('derives isDefault from the graph even when an imperative layer stores that attribute', () => {
  const store = new GraphStore({});
  try {
    store.graph.addLayer({ id: 'notes', isDefault: true });

    expect(store.graph.getDefaultLayer().id).toBe('cells');
    expect(store.graphProjection.layers.getLayer('cells')?.isDefault).toBe(true);
    expect(store.graphProjection.layers.getLayer('notes')?.isDefault).toBeUndefined();
  } finally {
    store.destroy(false);
  }
});

it('accepts registered ES subclasses and aliases of the base GraphLayer constructor', () => {
  class ESLayer extends dia.GraphLayer {}
  const BaseLayer = dia.GraphLayer;
  const store = new GraphStore({ layerNamespace: { custom: { ESLayer, BaseLayer } } });
  try {
    store.applyLayers([
      { id: 'es', type: 'custom.ESLayer' },
      { id: 'base', type: 'custom.BaseLayer' },
    ]);

    expect(store.graph.getLayer('es')).toBeInstanceOf(ESLayer);
    expect(store.graph.getLayer('base')).toBeInstanceOf(dia.GraphLayer);
    expect(store.graphProjection.layers.getLayer('es')?.type).toBe('custom.ESLayer');
    expect(store.graphProjection.layers.getLayer('base')?.type).toBe('custom.BaseLayer');
    expect(store.graph.hasActiveBatch()).toBe(false);
  } finally {
    store.destroy(false);
  }
});

it.each([42, {}, null, false])(
  'rejects a present non-string layer type %p before any write or batch',
  (type) => {
    const store = new GraphStore({});
    const startBatch = jest.spyOn(store.graph, 'startBatch');
    const before = store.graph.toJSON();
    try {
      expect(() => store.applyLayers([{ id: 'good' }, { id: 'bad', type }])).toThrow();

      expect(startBatch).not.toHaveBeenCalled();
      expect(store.graph.toJSON()).toEqual(before);
      expect(store.graph.hasLayer('good')).toBe(false);
      expect(store.graph.hasLayer('bad')).toBe(false);
      expect(store.graph.hasActiveBatch()).toBe(false);
    } finally {
      store.destroy(false);
    }
  }
);

it('accepts omitted and explicitly undefined layer types as the default constructor', () => {
  const store = new GraphStore({});
  try {
    store.applyLayers([{ id: 'omitted' }, { id: 'undefined', type: undefined }]);

    const defaultType: unknown = dia.GraphLayer.prototype.defaults().type;
    expect(store.graph.getLayer('omitted').get('type')).toBe(defaultType);
    expect(store.graph.getLayer('undefined').get('type')).toBe(defaultType);
    expect(store.graphProjection.layers.getLayer('omitted')).toEqual({ id: 'omitted' });
    expect(store.graphProjection.layers.getLayer('undefined')).toEqual({ id: 'undefined' });
    expect(store.graph.hasActiveBatch()).toBe(false);
  } finally {
    store.destroy(false);
  }
});

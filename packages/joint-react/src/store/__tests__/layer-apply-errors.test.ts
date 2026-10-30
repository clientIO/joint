import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../graph-store';
import type { LayerRecord } from '../../types/layer.types';
import type { ElementRecord } from '../../types/cell.types';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';

const element = (layer: string, x = 0) => ({
  id: 'node',
  type: ELEMENT_MODEL_TYPE,
  layer,
  position: { x, y: 0 },
  size: { width: 10, height: 10 },
} satisfies ElementRecord);
const DEFAULT_ATTRIBUTES: readonly LayerRecord[] = [
  { id: 'cells', visible: false, label: 'Main diagram' },
];

it('publishes successful partial layer writes when a later valid constructor throws', () => {
  class ThrowingLayer extends dia.GraphLayer {
    constructor(...args: ConstructorParameters<typeof dia.GraphLayer>) {
      super(...args);
      throw new Error('later constructor failed');
    }
  }
  const store = new GraphStore({ layerNamespace: { ThrowingLayer } });
  const onLayers = jest.fn();
  const unsubscribe = store.graphProjection.layers.subscribe(onLayers);
  try {
    expect(() => store.applyLayers([
      { id: 'good', label: 'created before failure' },
      { id: 'bad', type: 'ThrowingLayer' },
    ])).toThrow('later constructor failed');

    expect(store.graph.hasLayer('good')).toBe(true);
    expect(store.graphProjection.layers.getLayer('good')).toMatchObject({
      id: 'good', label: 'created before failure',
    });
    expect(onLayers).toHaveBeenCalledTimes(1);
    expect(store.graph.hasActiveBatch()).toBe(false);
  } finally {
    unsubscribe();
    store.destroy(false);
  }
});

it.each(['initial', 'update'] as const)(
  'round-trips explicit default-layer attributes applied by %s through graph JSON',
  (mode) => {
    const store = new GraphStore(mode === 'initial' ? { initialLayers: DEFAULT_ATTRIBUTES } : {});
    const restored = new GraphStore({});
    try {
      if (mode === 'update') store.applyLayers(DEFAULT_ATTRIBUTES);
      const moveLayer = jest.spyOn(store.graph, 'moveLayer');
      store.applyLayers(DEFAULT_ATTRIBUTES);
      expect(moveLayer).not.toHaveBeenCalled();
      const json = store.graph.toJSON();
      expect(json.layers).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'cells', visible: false, label: 'Main diagram' }),
      ]));

      restored.graph.fromJSON(json);

      expect(restored.graph.getDefaultLayer().get('visible')).toBe(false);
      expect(restored.graph.getDefaultLayer().get('label')).toBe('Main diagram');
    } finally {
      restored.destroy(false);
      store.destroy(false);
    }
  }
);

const BARE_DECLARATIONS: ReadonlyArray<{ readonly layers: readonly LayerRecord[] }> = [
  { layers: [] },
  { layers: [{ id: 'cells' }] },
];
it.each(BARE_DECLARATIONS)(
  'leaves a bare default declaration in legacy serialization mode (%#)',
  ({ layers }) => {
    const store = new GraphStore({});
    const moveLayer = jest.spyOn(store.graph, 'moveLayer');
    const before = store.graph.toJSON();
    try {
      store.applyLayers(layers);

      expect(store.graph.toJSON()).toEqual(before);
      expect(moveLayer).not.toHaveBeenCalled();
    } finally {
      store.destroy(false);
    }
  }
);

it('does no full layer read or reorder during a cell-only update with a retained nonempty layer', () => {
  const store = new GraphStore({ initialLayers: [{ id: 'notes' }], initialCells: [element('notes')] });
  const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  try {
    store.applyLayers([]);
    const getLayers = jest.spyOn(store.graph, 'getLayers');
    const moveLayer = jest.spyOn(store.graph, 'moveLayer');

    store.applyControlled([element('notes', 50)]);

    expect(store.graph.hasLayer('notes')).toBe(true);
    expect(store.graph.getCell('node').get('position')).toEqual({ x: 50, y: 0 });
    expect(getLayers).not.toHaveBeenCalled();
    expect(moveLayer).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
    store.destroy(false);
  }
});

it('does not prune an external graph from a queued callback after its store is destroyed', async () => {
  const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  const store = new GraphStore({
    graph,
    initialLayers: [{ id: 'notes' }],
    initialCells: [element('notes')],
  });
  const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  try {
    store.applyLayers([]);
    graph.getCell('node').layer('cells');
    store.destroy(true);
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(graph.hasLayer('notes')).toBe(true);
    expect(graph.getCell('node').layer()).toBe('cells');
  } finally {
    warn.mockRestore();
    graph.clear();
  }
});

it('retains a pending id re-added with cells, then prunes its replacement once empty', async () => {
  const store = new GraphStore({ initialLayers: [{ id: 'notes' }], initialCells: [element('notes')] });
  const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  try {
    store.applyLayers([]);
    store.graph.getCell('node').layer('cells');
    store.graph.removeLayer('notes');
    store.graph.addLayer({ id: 'notes' });
    store.graph.addCell({ ...element('notes'), id: 'replacement' });
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(store.graph.hasLayer('notes')).toBe(true);

    store.graph.getCell('replacement').layer('cells');
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(store.graph.hasLayer('notes')).toBe(false);
    expect(store.graphProjection.layers.getLayer('notes')).toBeUndefined();
  } finally {
    warn.mockRestore();
    store.destroy(false);
  }
});

it('never prunes a pending layer that became the graph default before the retry', async () => {
  const store = new GraphStore({ initialLayers: [{ id: 'notes' }], initialCells: [element('notes')] });
  const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  try {
    store.applyLayers([]);
    store.graph.setDefaultLayer('notes');
    store.graph.removeCells([store.graph.getCell('node')]);
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(store.graph.getDefaultLayer().id).toBe('notes');
    expect(store.graph.hasLayer('notes')).toBe(true);
  } finally {
    warn.mockRestore();
    store.destroy(false);
  }
});

it('waits for an open native batch, then prunes in one tagged bridge batch', async () => {
  const store = new GraphStore({ initialLayers: [{ id: 'notes' }], initialCells: [element('notes')] });
  const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  try {
    store.applyLayers([]);
    const startBatch = jest.spyOn(store.graph, 'startBatch');
    const stopBatch = jest.spyOn(store.graph, 'stopBatch');
    const removeLayer = jest.spyOn(store.graph, 'removeLayer');
    store.graph.startBatch('native edit');
    store.graph.getCell('node').layer('cells');
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(store.graph.hasLayer('notes')).toBe(true);
    expect(removeLayer).not.toHaveBeenCalled();

    store.graph.stopBatch('native edit');
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(store.graph.hasLayer('notes')).toBe(false);
    expect(store.graphProjection.layers.getLayer('notes')).toBeUndefined();
    expect(startBatch).toHaveBeenCalledWith('updateFromReact', { isUpdateFromReact: true });
    expect(stopBatch).toHaveBeenCalledWith('updateFromReact', { isUpdateFromReact: true });
    expect(removeLayer).toHaveBeenCalledWith('notes', { isUpdateFromReact: true });
    expect(store.graph.hasActiveBatch()).toBe(false);
  } finally {
    warn.mockRestore();
    store.destroy(false);
  }
});

describe.each(['pending', 'immediate'] as const)('%s layer pruning', (phase) => {
  it.each(['change default', 'replace declaration', 'destroy owner'] as const)(
    'rechecks removals when a removal listener synchronously performs %s',
    (reaction) => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const initialCells = [
        { ...element('A'), id: 'first' },
        { ...element('B'), id: 'second' },
      ];
      const store = new GraphStore({
        graph,
        initialLayers: [{ id: 'A' }, { id: 'B' }],
        initialCells: phase === 'pending' ? initialCells : [],
      });
      const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
      let destroyed = false;
      const onRemove = (layer: dia.GraphLayer) => {
        if (layer.id !== 'A') return;
        if (reaction === 'change default') graph.setDefaultLayer('B');
        else if (reaction === 'replace declaration') store.applyLayers([{ id: 'B' }]);
        else {
          store.destroy(true);
          destroyed = true;
        }
      };
      try {
        if (phase === 'pending') store.applyLayers([]);
        graph.on('layer:remove', onRemove);

        expect(() => {
          if (phase === 'pending') {
            store.applyControlled(initialCells.map((cell) => ({ ...cell, layer: 'cells' })));
          } else {
            store.applyLayers([]);
          }
        }).not.toThrow();

        expect(graph.hasLayer('A')).toBe(false);
        expect(graph.hasLayer('B')).toBe(true);
        expect(graph.hasActiveBatch()).toBe(false);
        if (reaction === 'change default') expect(graph.getDefaultLayer().id).toBe('B');
        if (!destroyed) expect(store.graphProjection.layers.getLayer('B')).toBeDefined();
      } finally {
        graph.off('layer:remove', onRemove);
        if (!destroyed) store.destroy(true);
        graph.clear();
        warn.mockRestore();
      }
    }
  );
});

it('preserves an existing pending removal when a new declaration fails prevalidation', () => {
  const store = new GraphStore({ initialLayers: [{ id: 'notes' }], initialCells: [element('notes')] });
  const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  try {
    store.applyLayers([]);
    expect(() => store.applyLayers([{ id: '' }])).toThrow();

    store.applyControlled([element('cells')]);

    expect(store.graph.hasLayer('notes')).toBe(false);
    expect(store.graphProjection.layers.getLayer('notes')).toBeUndefined();
  } finally {
    warn.mockRestore();
    store.destroy(false);
  }
});

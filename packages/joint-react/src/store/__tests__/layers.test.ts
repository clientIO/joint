import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { readLayerRecords, reconcileLayers, removeEmptyLayers } from '../layers';
import type { LayerRecord } from '../../types/layer.types';

const EMPTY_LAYERS: readonly LayerRecord[] = [];

function createGraph() {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

const layerIds = (graph: dia.Graph) => graph.getLayers().map((layer) => layer.id);

/** A graph with one named custom layer, the fixture most projection tests start from. */
function createGraphWithLayer1() {
  const graph = createGraph();
  graph.addLayer({ id: 'layer1', name: 'Layer 1' });
  return graph;
}

describe('readLayerRecords', () => {
  it('projects the default layer of a fresh graph', () => {
    expect(readLayerRecords(createGraph(), EMPTY_LAYERS)).toEqual([
      { id: 'cells', isDefault: true },
    ]);
  });

  it('projects layers in paint order with their custom attributes', () => {
    const graph = createGraphWithLayer1();
    graph.addLayer({ id: 'layer2', description: 'This is layer 2' });
    expect(readLayerRecords(graph, EMPTY_LAYERS)).toEqual([
      { id: 'cells', isDefault: true },
      { id: 'layer1', name: 'Layer 1' },
      { id: 'layer2', description: 'This is layer 2' },
    ]);
  });

  it('keeps the previous array and record references when nothing changed', () => {
    const graph = createGraphWithLayer1();
    const first = readLayerRecords(graph, EMPTY_LAYERS);
    const second = readLayerRecords(graph, first);
    expect(second).toBe(first);
  });

  it('keeps untouched record references when one layer changes', () => {
    const graph = createGraphWithLayer1();
    const first = readLayerRecords(graph, EMPTY_LAYERS);
    graph.getLayer('layer1').set('name', 'Renamed');
    const second = readLayerRecords(graph, first);
    expect(second).not.toBe(first);
    expect(second[0]).toBe(first[0]);
    expect(second[1]).toEqual({ id: 'layer1', name: 'Renamed' });
  });
});

describe('reconcileLayers', () => {
  it('adds declared layers in array order, keeping the default layer at the bottom when omitted', () => {
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'layer1' }, { id: 'layer2' }]);
    expect(layerIds(graph)).toEqual(['cells', 'layer1', 'layer2']);
  });

  it('positions the default layer where the array names it', () => {
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'background' }, { id: 'cells' }, { id: 'foreground' }]);
    expect(layerIds(graph)).toEqual(['background', 'cells', 'foreground']);
  });

  it('reorders existing layers with moveLayer, never remove + add', () => {
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'layer1' }, { id: 'layer2' }]);
    const layer1 = graph.getLayer('layer1');
    const removeLayer = jest.spyOn(graph, 'removeLayer');
    const addLayer = jest.spyOn(graph, 'addLayer');

    reconcileLayers(graph, [{ id: 'layer2' }, { id: 'cells' }, { id: 'layer1' }]);

    expect(layerIds(graph)).toEqual(['layer2', 'cells', 'layer1']);
    expect(graph.getLayer('layer1')).toBe(layer1);
    expect(removeLayer).not.toHaveBeenCalled();
    expect(addLayer).not.toHaveBeenCalled();
  });

  it('is a no-op for an equal-content array', () => {
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'layer1', name: 'A' }]);
    const moveLayer = jest.spyOn(graph, 'moveLayer');
    const addLayer = jest.spyOn(graph, 'addLayer');
    const onLayerEvent = jest.fn();
    graph.on('layer:change layers:sort layer:add layer:remove', onLayerEvent);

    reconcileLayers(graph, [{ id: 'layer1', name: 'A' }]);

    expect(moveLayer).not.toHaveBeenCalled();
    expect(addLayer).not.toHaveBeenCalled();
    // `mvc.Model.set` diffs internally: equal values raise no change event.
    expect(onLayerEvent).not.toHaveBeenCalled();
  });

  it('updates changed attributes and unsets dropped ones', () => {
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'layer1', name: 'Layer 1', visible: true }]);
    reconcileLayers(graph, [{ id: 'layer1', name: 'Renamed' }]);
    const layer = graph.getLayer('layer1');
    expect(layer.get('name')).toBe('Renamed');
    expect(layer.has('visible')).toBe(false);
    expect(graph.toJSON().layers).toEqual([
      { type: 'GraphLayer', id: 'cells' },
      { type: 'GraphLayer', id: 'layer1', name: 'Renamed' },
    ]);
  });

  it('forwards the caller options into every layer event', () => {
    const graph = createGraph();
    const seen: unknown[] = [];
    graph.on('layer:add layers:sort layer:change', (...args: unknown[]) => seen.push(args.at(-1)));
    reconcileLayers(graph, [{ id: 'layer1' }], { isUpdateFromReact: true });
    reconcileLayers(graph, [{ id: 'layer1', name: 'x' }], { isUpdateFromReact: true });
    reconcileLayers(graph, [{ id: 'layer1' }, { id: 'cells' }], { isUpdateFromReact: true });
    expect(seen.length).toBeGreaterThanOrEqual(3);
    for (const options of seen) expect(options).toMatchObject({ isUpdateFromReact: true });
  });

  it('never unsets an attribute a custom layer class provides as a default', () => {
    class TintLayer extends dia.GraphLayer {
      defaults() {
        return { ...super.defaults(), type: 'TintLayer', opacity: 1 };
      }
    }
    const graph = new dia.Graph(
      {},
      { cellNamespace: DEFAULT_CELL_NAMESPACE, layerNamespace: { TintLayer } }
    );
    reconcileLayers(graph, [{ id: 'tint', type: 'TintLayer', tint: 'red' }]);
    // A record that omits `opacity` must not strip the class default.
    reconcileLayers(graph, [{ id: 'tint', type: 'TintLayer' }]);
    const layer = graph.getLayer('tint');
    expect(layer.get('opacity')).toBe(1);
    expect(layer.has('tint')).toBe(false);
    expect(readLayerRecords(graph, EMPTY_LAYERS)[1]).toEqual({
      id: 'tint',
      type: 'TintLayer',
      opacity: 1,
    });
  });

  it('never exits legacy mode until a layer is actually declared', () => {
    const graph = createGraph();
    reconcileLayers(graph, EMPTY_LAYERS);
    expect(graph.toJSON().layers).toBeUndefined();
    reconcileLayers(graph, [{ id: 'layer1' }]);
    expect(graph.toJSON().layers).toBeDefined();
  });
});

describe('removeEmptyLayers', () => {
  it('removes layers absent from the array once they are empty', () => {
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'layer1' }, { id: 'layer2' }]);
    removeEmptyLayers(graph, [{ id: 'layer2' }]);
    expect(layerIds(graph)).toEqual(['cells', 'layer2']);
  });

  it('never removes the default layer even when the array omits it', () => {
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'layer1' }]);
    removeEmptyLayers(graph, EMPTY_LAYERS);
    expect(layerIds(graph)).toEqual(['cells']);
  });

  it('keeps a layer that still has cells and warns with their ids', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'layer1' }]);
    graph.addCells([
      { id: 'rect1', type: 'element', layer: 'layer1' },
      { id: 'rect2', type: 'element', layer: 'layer1' },
    ]);

    removeEmptyLayers(graph, EMPTY_LAYERS);

    expect(layerIds(graph)).toEqual(['cells', 'layer1']);
    expect(graph.getCell('rect1')).toBeDefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('layer1');
    expect(warn.mock.calls[0][0]).toContain('rect1');
    expect(warn.mock.calls[0][0]).toContain('rect2');
    warn.mockRestore();
  });

  it('removes the layer on a later pass once its cells are gone', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const graph = createGraph();
    reconcileLayers(graph, [{ id: 'layer1' }]);
    graph.addCell({ id: 'rect1', type: 'element', layer: 'layer1' });
    removeEmptyLayers(graph, EMPTY_LAYERS);
    graph.removeCells(graph.getLayer('layer1').getCells());

    removeEmptyLayers(graph, EMPTY_LAYERS);

    expect(layerIds(graph)).toEqual(['cells']);
    warn.mockRestore();
  });
});

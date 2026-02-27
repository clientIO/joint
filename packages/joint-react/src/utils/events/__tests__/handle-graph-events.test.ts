import { dia, shapes } from '@joint/core';
import { handleGraphEvents } from '../handle-graph-events';

describe('handleGraphEvents', () => {
  it('handles all normalized graph events and emits normalized payload names', () => {
    const graph = new dia.Graph();
    const { layerCollection } = graph;
    const defaultLayer = graph.getDefaultLayer();
    const { cellCollection } = defaultLayer;
    const element = new shapes.standard.Rectangle({ id: 'el-1' });

    const handlers = {
      add: jest.fn(),
      remove: jest.fn(),
      change: jest.fn(),
      reset: jest.fn(),
      sort: jest.fn(),
      move: jest.fn(),
      batchStart: jest.fn(),
      batchStop: jest.fn(),
      changePosition: jest.fn(),
      layerAdd: jest.fn(),
      layersAdd: jest.fn(),
    };

    const dispose = handleGraphEvents(graph, handlers);

    graph.trigger('add', element, cellCollection, { source: 'test-add' });
    graph.trigger('remove', element, cellCollection, { source: 'test-remove' });
    graph.trigger('change', element, { source: 'test-change' });
    graph.trigger('reset', cellCollection, { source: 'test-reset' });
    graph.trigger('sort', cellCollection, { source: 'test-sort' });
    graph.trigger('move', element, { source: 'test-move' });
    graph.trigger('batch:start', { source: 'test-batch-start' });
    graph.trigger('batch:stop', { source: 'test-batch-stop' });
    graph.trigger('change:position', new shapes.standard.Rectangle({ id: 'el-1' }), {
      source: 'test-change-position',
    });
    graph.trigger('layer:add', defaultLayer, layerCollection, { source: 'test-layer-add' });
    graph.trigger('layers:add', layerCollection, { source: 'test-layers-add' });

    const expected = [
      { key: 'add', joint: 'add' },
      { key: 'remove', joint: 'remove' },
      { key: 'change', joint: 'change' },
      { key: 'reset', joint: 'reset' },
      { key: 'sort', joint: 'sort' },
      { key: 'move', joint: 'move' },
      { key: 'batchStart', joint: 'batch:start' },
      { key: 'batchStop', joint: 'batch:stop' },
      { key: 'changePosition', joint: 'change:position' },
      { key: 'layerAdd', joint: 'layer:add' },
      { key: 'layersAdd', joint: 'layers:add' },
    ] as const;

    for (const { key, joint } of expected) {
      const handler = handlers[key];
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toMatchObject({
        eventName: key,
        jointEventName: joint,
        graph,
      });
    }

    dispose();

    graph.trigger('batch:start', { source: 'after-dispose' });
    expect(handlers.batchStart).toHaveBeenCalledTimes(1);
  });
});

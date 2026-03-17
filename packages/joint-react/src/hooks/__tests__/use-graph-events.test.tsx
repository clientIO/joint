import { mvc, type dia } from '@joint/core';
import { renderHook, waitFor, act } from '@testing-library/react';
import { graphProviderWrapper, getTestGraph } from '../../utils/test-wrappers';
import type {
  GraphEventHandlers,
  GraphEventMap,
  GraphBaseEventName,
} from '../../types/event.types';
import { useGraphEvents } from '../use-graph-events';
import { useGraph } from '../use-graph';

const GRAPH_EVENT_ARGS: { readonly [EventName in GraphBaseEventName]: Parameters<GraphEventMap[EventName]> } = {
  add: [{} as dia.Cell, {} as never, { source: 'add' }],
  remove: [{} as dia.Cell, {} as never, { source: 'remove' }],
  change: [{} as dia.Cell, { source: 'change' }],
  reset: [{} as never, { source: 'reset' }],
  sort: [{} as never, { source: 'sort' }],
  move: [{} as dia.Cell, { source: 'move' }],
  'batch:start': [{ source: 'batch:start' }],
  'batch:stop': [{ source: 'batch:stop' }],
};

describe('use-graph-events', () => {
  it('binds all known graph events, pattern events, and custom events with raw JointJS args', async () => {
    const graph = getTestGraph();
    const listenerHandlers = new Map<
      string,
      Array<(...args: Parameters<mvc.EventHandler>) => void>
    >();
    const listenToSpy = jest
      .spyOn(mvc.Listener.prototype, 'listenTo')
      .mockImplementation((...args: unknown[]) => {
        const [, eventNameOrHash, callback] = args;
        if (typeof eventNameOrHash === 'string' && typeof callback === 'function') {
          const callbacks = listenerHandlers.get(eventNameOrHash) ?? [];
          callbacks.push(callback as (...args: Parameters<mvc.EventHandler>) => void);
          listenerHandlers.set(eventNameOrHash, callbacks);
        }
      });

    const handlers: GraphEventHandlers = {};

    for (const eventName of Object.keys(GRAPH_EVENT_ARGS)) {
      handlers[eventName] = jest.fn();
    }

    const onChangePosition = jest.fn();
    const onLayerAdd = jest.fn();
    const onLayersAdd = jest.fn();
    const onCustomEvent = jest.fn();

    handlers['change:position'] = onChangePosition;
    handlers['layer:add'] = onLayerAdd;
    handlers['layers:add'] = onLayersAdd;
    handlers['graph:test:custom'] = onCustomEvent;

    try {
      renderHook(() => {
        useGraphEvents(graph, handlers);
      });

      await waitFor(() => {
        expect(listenToSpy).toHaveBeenCalled();
      });

      for (const [eventName, args] of Object.entries(GRAPH_EVENT_ARGS) as Array<
        [GraphBaseEventName, Parameters<GraphEventMap[GraphBaseEventName]>]
      >) {
        const callbacks = listenerHandlers.get(eventName) ?? [];
        expect(callbacks.length).toBeGreaterThan(0);

        act(() => {
          for (const callback of callbacks) {
            callback(...(args as Parameters<mvc.EventHandler>));
          }
        });
        expect(handlers[eventName]).toHaveBeenCalled();
        expect(handlers[eventName]).toHaveBeenLastCalledWith(...args);
      }

      const { layerCollection } = graph;
      const layer = graph.getDefaultLayer();
      const cell = {} as dia.Cell;
      const changePositionCallbacks = listenerHandlers.get('change:position') ?? [];
      const layerAddCallbacks = listenerHandlers.get('layer:add') ?? [];
      const layersAddCallbacks = listenerHandlers.get('layers:add') ?? [];
      const customCallbacks = listenerHandlers.get('graph:test:custom') ?? [];

      act(() => {
        for (const callback of changePositionCallbacks) {
          callback(cell, { source: 'change:position' });
        }
        for (const callback of layerAddCallbacks) {
          callback(layer, layerCollection, { source: 'layer:add' });
        }
        for (const callback of layersAddCallbacks) {
          callback(layerCollection, { source: 'layers:add' });
        }
        for (const callback of customCallbacks) {
          callback(1, 2, 3);
        }
      });

      expect(onChangePosition).toHaveBeenCalled();
      expect(onChangePosition).toHaveBeenLastCalledWith(cell, { source: 'change:position' });
      expect(onLayerAdd).toHaveBeenCalled();
      expect(onLayerAdd).toHaveBeenLastCalledWith(layer, layerCollection, {
        source: 'layer:add',
      });
      expect(onLayersAdd).toHaveBeenCalled();
      expect(onLayersAdd).toHaveBeenLastCalledWith(layerCollection, { source: 'layers:add' });
      expect(onCustomEvent).toHaveBeenCalled();
      expect(onCustomEvent).toHaveBeenLastCalledWith(1, 2, 3);
      expect(listenToSpy).toHaveBeenCalled();
    } finally {
      listenToSpy.mockRestore();
    }
  });

  it('supports graph instance target overload', () => {
    const graph = getTestGraph();
    const onAdd = jest.fn();
    const listenerHandlers = new Map<
      string,
      Array<(...args: Parameters<mvc.EventHandler>) => void>
    >();
    const listenToSpy = jest
      .spyOn(mvc.Listener.prototype, 'listenTo')
      .mockImplementation((...args: unknown[]) => {
        const [, eventNameOrHash, callback] = args;
        if (typeof eventNameOrHash === 'string' && typeof callback === 'function') {
          const callbacks = listenerHandlers.get(eventNameOrHash) ?? [];
          callbacks.push(callback as (...args: Parameters<mvc.EventHandler>) => void);
          listenerHandlers.set(eventNameOrHash, callbacks);
        }
      });
    const cell = {} as dia.Cell;
    const collection = {} as never;
    const options = { source: 'instance' };

    try {
      renderHook(() => {
        useGraphEvents(graph, { add: onAdd });
      });

      const callbacks = listenerHandlers.get('add') ?? [];
      expect(callbacks.length).toBeGreaterThan(0);

      act(() => {
        for (const callback of callbacks) {
          callback(cell, collection, options);
        }
      });

      expect(onAdd).toHaveBeenCalled();
      expect(onAdd).toHaveBeenLastCalledWith(cell, collection, options);
    } finally {
      listenToSpy.mockRestore();
    }
  });

  it('cleans up listeners on unmount', async () => {
    const wrapper = graphProviderWrapper({
      elements: {},
      links: {},
    });

    const onBatchStart = jest.fn();

    const { result, unmount } = renderHook(
      () => {
        const { graph } = useGraph();
        useGraphEvents({ 'batch:start': onBatchStart });
        return graph;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current.trigger('batch:start', { source: 'before-unmount' });
    });

    expect(onBatchStart).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      result.current.trigger('batch:start', { source: 'after-unmount' });
    });

    expect(onBatchStart).toHaveBeenCalledTimes(1);
  });

  it('throws when context target is used outside GraphProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useGraphEvents({ add: jest.fn() }));
    }).toThrow('useGraphEvents without a graph target must be used within a GraphProvider.');

    consoleError.mockRestore();
  });
});

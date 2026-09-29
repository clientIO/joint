import { mvc, type dia } from '@joint/core';
import { renderHook, waitFor, act } from '@testing-library/react';
import { graphProviderWrapper, getTestGraph } from '../../utils/test-wrappers';
import { useOnGraphEvents } from '../use-on-graph-events';
import { useGraph } from '../use-graph';

const GRAPH_EVENT_ARGS: Partial<{ readonly [EventName in keyof dia.Graph.EventMap]: Parameters<dia.Graph.EventMap[EventName]> }> = {
  add: [{} as dia.Cell, {} as never, { source: 'add' }],
  remove: [{} as dia.Cell, {} as never, { source: 'remove' }],
  reset: [{} as never, { source: 'reset' }],
  sort: [{} as never, { source: 'sort' }],
  update: [{} as never, { source: 'update' }],
  change: [{} as dia.Cell, { source: 'change' }],
  move: [{} as dia.Cell, { source: 'move' }],
  changeId: [{} as dia.Cell, 'prev-id', { source: 'changeId' }],
  'layer:add': [{} as dia.GraphLayer, {} as dia.GraphLayerCollection, { source: 'layer:add' }],
  'layer:remove': [{} as dia.GraphLayer, {} as dia.GraphLayerCollection, { source: 'layer:remove' }],
  'layer:change': [{} as dia.GraphLayer, { source: 'layer:change' }],
  'layer:default': [{} as dia.GraphLayer, { source: 'layer:default' }],
  'layers:sort': [{} as dia.GraphLayerCollection, { source: 'layers:sort' }],
  'batch:start': [{ source: 'batch:start' }],
  'batch:stop': [{ source: 'batch:stop' }],
};

describe('use-on-graph-events', () => {
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

    const handlers: Partial<dia.Graph.EventMap> = {};

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
        useOnGraphEvents(graph, handlers);
      });

      await waitFor(() => {
        expect(listenToSpy).toHaveBeenCalled();
      });

      for (const [eventName, args] of Object.entries(GRAPH_EVENT_ARGS) as Array<
        [string, Parameters<dia.Graph.EventMap[keyof dia.Graph.EventMap]>]
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
        useOnGraphEvents(graph, { add: onAdd });
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
      initialCells: [],
    });

    const onBatchStart = jest.fn();

    const { result, unmount } = renderHook(
      () => {
        const { graph } = useGraph();
        useOnGraphEvents({ 'batch:start': onBatchStart });
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

    const callsBeforeUnmount = onBatchStart.mock.calls.length;
    expect(callsBeforeUnmount).toBeGreaterThanOrEqual(1);

    unmount();

    act(() => {
      result.current.trigger('batch:start', { source: 'after-unmount' });
    });

    // After unmount, no new calls should be received
    expect(onBatchStart).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it('throws when context target is used outside GraphProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useOnGraphEvents({ add: jest.fn() }));
    }).toThrow('useOnGraphEvents without a graph target must be used within a GraphProvider.');

    consoleError.mockRestore();
  });

  it('calls the latest handler without re-subscribing when identity changes', () => {
    const graph = getTestGraph();
    const listenToSpy = jest.spyOn(mvc.Listener.prototype, 'listenTo');
    const addCalls = () =>
      listenToSpy.mock.calls.filter((call) => (call[1] as unknown) === 'graph:probe');
    try {
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();
      const { rerender } = renderHook(
        ({ handler }: { handler: (...args: Parameters<mvc.EventHandler>) => void }) => {
          // Fresh inline map every render — must NOT re-subscribe.
          useOnGraphEvents(graph, { 'graph:probe': handler });
        },
        { initialProps: { handler: firstHandler } }
      );
      const subscriptionsAfterMount = addCalls().length;
      expect(subscriptionsAfterMount).toBeGreaterThan(0);

      rerender({ handler: secondHandler });
      expect(addCalls().length).toBe(subscriptionsAfterMount);

      act(() => {
        graph.trigger('graph:probe', 'cell');
      });
      expect(firstHandler).not.toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalledWith('cell');
    } finally {
      listenToSpy.mockRestore();
    }
  });

  it('skips an entry toggled to undefined and resumes when it returns', () => {
    const graph = getTestGraph();
    const onProbe = jest.fn();
    const { rerender } = renderHook(
      ({ isEnabled }: { isEnabled: boolean }) => {
        useOnGraphEvents(graph, {
          'graph:probe': isEnabled ? onProbe : undefined,
        });
      },
      { initialProps: { isEnabled: true } }
    );

    act(() => {
      graph.trigger('graph:probe', 'first');
    });
    expect(onProbe).toHaveBeenCalledTimes(1);

    rerender({ isEnabled: false });
    act(() => {
      graph.trigger('graph:probe', 'while-disabled');
    });
    // Disabled — the live dispatch skips the undefined handler.
    expect(onProbe).toHaveBeenCalledTimes(1);

    rerender({ isEnabled: true });
    act(() => {
      graph.trigger('graph:probe', 'second');
    });
    expect(onProbe).toHaveBeenCalledTimes(2);
    expect(onProbe).toHaveBeenLastCalledWith('second');
  });
});

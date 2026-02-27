import { shapes } from '@joint/core';
import { renderHook, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useEventListener } from '../use-event-listener';
import { useGraph } from '../use-graph';
import { usePaper, usePaperById } from '../use-paper';

const EMPTY_ELEMENTS = {};
const EMPTY_LINKS = {};

function renderTestElement() {
  return <rect width={10} height={10} />;
}

describe('use-event-listener', () => {
  it('listens to graph events with normalized payload', async () => {
    const onAdd = jest.fn();
    const wrapper = graphProviderWrapper({
      elements: {},
      links: {},
    });

    const { result } = renderHook(
      () => {
        const graph = useGraph();
        useEventListener(graph, {
          add: onAdd,
        });
        return graph;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    result.current.addCell(
      new shapes.standard.Rectangle({
        id: 'cell-1',
        position: { x: 10, y: 20 },
        size: { width: 10, height: 20 },
      })
    );

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledTimes(1);
      expect(onAdd.mock.calls[0][0]).toMatchObject({
        eventName: 'add',
        graph: result.current,
      });
    });
  });

  it('covers all curated graph events and pattern events with normalized keys', async () => {
    const wrapper = graphProviderWrapper({
      elements: {},
      links: {},
    });

    const handlerMap = {
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

    const { result } = renderHook(
      () => {
        const graph = useGraph();
        useEventListener(graph, handlerMap);
        return graph;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const graph = result.current;
    const { layerCollection } = graph;
    const defaultLayer = graph.getDefaultLayer();
    const { cellCollection } = defaultLayer;
    const element = new shapes.standard.Rectangle({
      id: 'coverage-cell',
      position: { x: 20, y: 10 },
      size: { width: 20, height: 10 },
    });

    graph.trigger('add', element, cellCollection, { source: 'test-add' });
    graph.trigger('remove', element, cellCollection, { source: 'test-remove' });
    graph.trigger('change', element, { source: 'test-change' });
    graph.trigger('reset', cellCollection, { source: 'test-reset' });
    graph.trigger('sort', cellCollection, { source: 'test-sort' });
    graph.trigger('move', element, { source: 'test-move' });
    graph.trigger('batch:start', { source: 'test-batch-start' });
    graph.trigger('batch:stop', { source: 'test-batch-stop' });
    graph.trigger('change:position', element, { source: 'test-change-pattern' });
    graph.trigger('layer:add', defaultLayer, layerCollection, { source: 'test-layer-pattern' });
    graph.trigger('layers:add', layerCollection, { source: 'test-layers-pattern' });

    await waitFor(() => {
      for (const [eventName, handler] of Object.entries(handlerMap)) {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0]).toMatchObject({ eventName, graph });
      }
    });
  });

  it('supports normalized graph event keys and payload event names', async () => {
    const wrapper = graphProviderWrapper({
      elements: {},
      links: {},
    });

    const handlerMap = {
      batchStart: jest.fn(),
      batchStop: jest.fn(),
      changePosition: jest.fn(),
      layerAdd: jest.fn(),
      layersAdd: jest.fn(),
    };

    const { result } = renderHook(
      () => {
        const graph = useGraph();
        useEventListener(graph, handlerMap);
        return graph;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const graph = result.current;
    const { layerCollection } = graph;
    const defaultLayer = graph.getDefaultLayer();

    graph.trigger('batch:start', { source: 'test-batch-start' });
    graph.trigger('batch:stop', { source: 'test-batch-stop' });
    graph.trigger('change:position', new shapes.standard.Rectangle({ id: 'change-position-cell' }), {
      source: 'test-change-pattern',
    });
    graph.trigger('layer:add', defaultLayer, layerCollection, { source: 'test-layer-pattern' });
    graph.trigger('layers:add', layerCollection, { source: 'test-layers-pattern' });

    await waitFor(() => {
      expect(handlerMap.batchStart).toHaveBeenCalledTimes(1);
      expect(handlerMap.batchStart.mock.calls[0][0]).toMatchObject({
        eventName: 'batchStart',
        graph,
      });
      expect(handlerMap.batchStop).toHaveBeenCalledTimes(1);
      expect(handlerMap.batchStop.mock.calls[0][0]).toMatchObject({
        eventName: 'batchStop',
        graph,
      });
      expect(handlerMap.changePosition).toHaveBeenCalledTimes(1);
      expect(handlerMap.changePosition.mock.calls[0][0]).toMatchObject({
        eventName: 'changePosition',
        graph,
      });
      expect(handlerMap.layerAdd).toHaveBeenCalledTimes(1);
      expect(handlerMap.layerAdd.mock.calls[0][0]).toMatchObject({
        eventName: 'layerAdd',
        graph,
      });
      expect(handlerMap.layersAdd).toHaveBeenCalledTimes(1);
      expect(handlerMap.layersAdd.mock.calls[0][0]).toMatchObject({
        eventName: 'layersAdd',
        graph,
      });
    });
  });

  it('listens to paper events from paper instance', async () => {
    const onTranslate = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
        <Paper id="paper-instance" width={100} height={100} renderElement={renderTestElement}>
          {children}
        </Paper>
      </GraphProvider>
    );

    const { result } = renderHook(
      () => {
        const paper = usePaper();
        useEventListener(paper, {
          onTranslate,
        });
        return paper;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    result.current.trigger('translate', 20, 30, { source: 'test' });

    await waitFor(() => {
      expect(onTranslate).toHaveBeenCalledTimes(1);
      expect(onTranslate.mock.calls[0][0]).toMatchObject({
        eventName: 'translate',
        paper: result.current,
        tx: 20,
        ty: 30,
      });
    });
  });

  it('listens to normalized paper event names', async () => {
    const onElementContextMenu = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
        <Paper id="paper-normalized" width={100} height={100} renderElement={renderTestElement}>
          {children}
        </Paper>
      </GraphProvider>
    );

    const { result } = renderHook(
      () => {
        const paper = usePaperById('paper-normalized');
        if (paper) {
          useEventListener(paper, {
            onElementContextMenu,
          });
        }
        return paper;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const elementView = {} as never;
    const event = { type: 'contextmenu' } as never;
    result.current?.trigger('element:contextmenu', elementView, event, 30, 50);

    await waitFor(() => {
      expect(onElementContextMenu).toHaveBeenCalledTimes(1);
      expect(onElementContextMenu.mock.calls[0][0]).toMatchObject({
        eventName: 'elementContextMenu',
        x: 30,
        y: 50,
      });
    });
  });

  it('listens to paper events by paper id', async () => {
    const onCustomEvent = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
        <Paper id="paper-by-id" width={100} height={100} renderElement={renderTestElement}>
          {children}
        </Paper>
      </GraphProvider>
    );

    const { result } = renderHook(
      () => {
        const paper = usePaperById('paper-by-id');
        useEventListener(
          'paper',
          'paper-by-id',
          {
            customEvents: {
              'paper:test:custom': onCustomEvent,
            },
          },
          []
        );
        return paper;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    result.current?.trigger('paper:test:custom', 1, 2, 3);

    await waitFor(() => {
      expect(onCustomEvent).toHaveBeenCalledTimes(1);
      expect(onCustomEvent.mock.calls[0][0]).toMatchObject({
        eventName: 'paper:test:custom',
      });
    });
  });
});

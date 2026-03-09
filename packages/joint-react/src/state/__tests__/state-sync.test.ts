/* eslint-disable sonarjs/no-nested-functions */
import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, type GraphStoreSnapshot } from '../../store/graph-store';
import { stateSync } from '../state-sync';
import { updateGraph } from '../update-graph';
import { createState } from '../../utils/create-state';
import type { FlatElementData } from '../../types/element-types';
import type { FlatLinkData } from '../../types/link-types';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
} from '../data-mapping';

describe('stateSync', () => {
  it('should sync elements from state to graph on initialization', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const initialElements: Record<string, FlatElementData> = {
      '1': { width: 100, height: 100, type: 'ReactElement' },
      '2': { width: 100, height: 100, type: 'ReactElement' },
    };

    const state = createState<GraphStoreSnapshot<FlatElementData, FlatLinkData>>({
      newState: () => ({ elements: initialElements, links: {} }),
      name: 'state-sync/elements-init',
    });

    stateSync({ graph, store: state });

    expect(graph.getElements()).toHaveLength(2);
    expect(graph.getCell('1')).toBeDefined();
    expect(graph.getCell('2')).toBeDefined();
  });

  it('should sync links from state to graph on initialization', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const initialElements: Record<string, FlatElementData> = {
      '1': { width: 100, height: 100, type: 'ReactElement' },
      '2': { width: 100, height: 100, type: 'ReactElement' },
    };

    const initialLinks: Record<string, FlatLinkData> = {
      link1: { source: '1', target: '2' },
    };

    const state = createState<GraphStoreSnapshot<FlatElementData, FlatLinkData>>({
      newState: () => ({ elements: initialElements, links: initialLinks }),
      name: 'state-sync/links-init',
    });

    stateSync({ graph, store: state });

    expect(graph.getElements()).toHaveLength(2);
    expect(graph.getLinks()).toHaveLength(1);
    expect(graph.getCell('link1')).toBeDefined();
  });

  it('should sync graph element additions to store', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const state = createState<GraphStoreSnapshot<FlatElementData, FlatLinkData>>({
      newState: () => ({ elements: {}, links: {} }),
      name: 'state-sync/graph-add',
    });

    stateSync({ graph, store: state });

    const element = new dia.Element({
      id: 'new-element',
      type: 'ReactElement',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 100 },
    });
    graph.addCell(element);

    expect(state.getSnapshot().elements['new-element']).toBeDefined();
    expect(state.getSnapshot().elements['new-element'].x).toBe(10);
    expect(state.getSnapshot().elements['new-element'].y).toBe(20);
  });

  it('should sync graph element removals to store', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const state = createState<GraphStoreSnapshot<FlatElementData, FlatLinkData>>({
      newState: () => ({
        elements: {
          '1': { width: 100, height: 100, type: 'ReactElement' },
        },
        links: {},
      }),
      name: 'state-sync/graph-remove',
    });

    stateSync({ graph, store: state });

    const element = graph.getCell('1');
    if (!element) {
      throw new Error('Expected element to exist in graph');
    }

    graph.removeCells([element]);

    expect(state.getSnapshot().elements['1']).toBeUndefined();
  });

  it('should handle graph reset by replacing store snapshot', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const state = createState<GraphStoreSnapshot<FlatElementData, FlatLinkData>>({
      newState: () => ({
        elements: {
          '1': { width: 100, height: 100, type: 'ReactElement' },
          '2': { width: 100, height: 100, type: 'ReactElement' },
        },
        links: {},
      }),
      name: 'state-sync/reset',
    });

    stateSync({ graph, store: state });

    graph.resetCells([
      {
        id: '3',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      },
    ]);

    const snapshot = state.getSnapshot();
    expect(snapshot.elements['3']).toBeDefined();
    expect(snapshot.elements['1']).toBeUndefined();
    expect(snapshot.elements['2']).toBeUndefined();
  });

  it('should sync existing graph cells to empty store on initialization', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    graph.syncCells(
      [
        defaultMapDataToElementAttributes({
          id: '1',
          data: { width: 100, height: 100, type: 'ReactElement' },
        }),
      ],
      { remove: true }
    );

    const state = createState<GraphStoreSnapshot<FlatElementData, FlatLinkData>>({
      newState: () => ({ elements: {}, links: {} }),
      name: 'state-sync/sync-existing',
    });

    stateSync({ graph, store: state });

    expect(Object.keys(state.getSnapshot().elements)).toHaveLength(1);
    expect(state.getSnapshot().elements['1']).toBeDefined();
  });

  it('should ignore graph change events flagged as isUpdateFromReact', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const state = createState<GraphStoreSnapshot<FlatElementData, FlatLinkData>>({
      newState: () => ({ elements: {}, links: {} }),
      name: 'state-sync/is-update-from-react',
    });

    const setStateSpy = jest.spyOn(state, 'setState');

    stateSync({ graph, store: state });

    state.setState((previous) => ({
      ...previous,
      elements: {
        ...previous.elements,
        '1': { width: 100, height: 100, type: 'ReactElement' },
      },
    }));

    expect(graph.getCell('1')).toBeDefined();
    expect(setStateSpy).toHaveBeenCalledTimes(1);
  });

  it('should cleanup all listeners on cleanup()', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const state = createState<GraphStoreSnapshot<FlatElementData, FlatLinkData>>({
      newState: () => ({ elements: {}, links: {} }),
      name: 'state-sync/cleanup',
    });

    const unsubscribeSpy = jest.fn();
    state.subscribe = jest.fn(() => unsubscribeSpy);

    const sync = stateSync({ graph, store: state });

    expect(state.subscribe).toHaveBeenCalledTimes(1);

    sync.cleanup();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('updateGraph', () => {
  it('should update graph when elements differ', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const elements: Record<string, FlatElementData> = {
      '1': { width: 100, height: 100, type: 'ReactElement' },
    };

    const result = updateGraph({
      graph,
      elements,
      links: {},
      graphToElementSelector: (options) => defaultMapElementAttributesToData(options),
      graphToLinkSelector: (options) => defaultMapLinkAttributesToData(options),
      mapDataToElementAttributes: (options) => defaultMapDataToElementAttributes(options),
      mapDataToLinkAttributes: (options) => defaultMapDataToLinkAttributes(options),
    });

    expect(result).toBe(true);
    expect(graph.getElements()).toHaveLength(1);
    expect(graph.getCell('1')).toBeDefined();
  });

  it('should return false when graph is already in sync', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const elements: Record<string, FlatElementData> = {
      '1': { width: 100, height: 100, x: 0, y: 0, type: 'ReactElement' },
    };

    updateGraph({
      graph,
      elements,
      links: {},
      graphToElementSelector: (options) => defaultMapElementAttributesToData(options),
      graphToLinkSelector: (options) => defaultMapLinkAttributesToData(options),
      mapDataToElementAttributes: (options) => defaultMapDataToElementAttributes(options),
      mapDataToLinkAttributes: (options) => defaultMapDataToLinkAttributes(options),
    });

    const [graphElement] = graph.getElements();
    const id = graphElement.id as string;
    const graphElementData = defaultMapElementAttributesToData({
      attributes: graphElement.attributes,
      defaultAttributes: graphElement.defaults() as dia.Element.Attributes,
    });

    const result = updateGraph({
      graph,
      elements: { [id]: graphElementData },
      links: {},
      graphToElementSelector: (options) => defaultMapElementAttributesToData(options),
      graphToLinkSelector: (options) => defaultMapLinkAttributesToData(options),
      mapDataToElementAttributes: (options) => defaultMapDataToElementAttributes(options),
      mapDataToLinkAttributes: (options) => defaultMapDataToLinkAttributes(options),
    });

    expect(result).toBe(false);
  });

  it('should sync graph changes even when graph has active batch', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const elements: Record<string, FlatElementData> = {
      '1': { width: 100, height: 100, type: 'ReactElement' },
    };

    graph.startBatch('test');

    const result = updateGraph({
      graph,
      elements,
      links: {},
      graphToElementSelector: (options) => defaultMapElementAttributesToData(options),
      graphToLinkSelector: (options) => defaultMapLinkAttributesToData(options),
      mapDataToElementAttributes: (options) => defaultMapDataToElementAttributes(options),
      mapDataToLinkAttributes: (options) => defaultMapDataToLinkAttributes(options),
    });

    expect(result).toBe(true);
    expect(graph.getElements()).toHaveLength(1);
    expect(graph.getCell('1')).toBeDefined();

    graph.stopBatch('test');
  });

  it('should pass isUpdateFromReact flag to graph.syncCells', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const elements: Record<string, FlatElementData> = {
      '1': { width: 100, height: 100, type: 'ReactElement' },
    };

    const syncCellsSpy = jest.spyOn(graph, 'syncCells');

    updateGraph({
      graph,
      elements,
      links: {},
      graphToElementSelector: (options) => defaultMapElementAttributesToData(options),
      graphToLinkSelector: (options) => defaultMapLinkAttributesToData(options),
      mapDataToElementAttributes: (options) => defaultMapDataToElementAttributes(options),
      mapDataToLinkAttributes: (options) => defaultMapDataToLinkAttributes(options),
      isUpdateFromReact: true,
    });

    expect(syncCellsSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ isUpdateFromReact: true })
    );
  });
});

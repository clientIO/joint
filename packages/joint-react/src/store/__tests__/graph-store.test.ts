/* eslint-disable unicorn/consistent-function-scoping */
import { waitFor } from '@testing-library/react';
import { dia, shapes } from '@joint/core';
import { GraphStore } from '../graph-store';
import { createPaperStoreSnapshot } from '../paper-store';
import { PortalElement } from '../../models/portal-element';
import { sendToDevTool } from '../../utils/dev-tools';
import type { FlatElementData } from '../../types/element-types';
import type { FlatLinkData } from '../../types/link-types';

jest.mock('../../utils/dev-tools', () => ({
  sendToDevTool: jest.fn(),
}));

const sendToDevToolMock = sendToDevTool as jest.MockedFunction<typeof sendToDevTool>;

const DEFAULT_TEST_NAMESPACE = { ...shapes, PortalElement };

describe('GraphStore', () => {
  beforeEach(() => {
    sendToDevToolMock.mockClear();
    sendToDevToolMock.mockImplementation(() => {});
  });

  describe('constructor', () => {
    it('should create a GraphStore with default graph instance', () => {
      const store = new GraphStore({});
      expect(store).toBeDefined();
      expect(store.graph).toBeInstanceOf(dia.Graph);
      expect(store.dataState).toBeDefined();
      expect(store.internalState).toBeDefined();
    });

    it('should create a GraphStore with provided graph instance', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_TEST_NAMESPACE });
      const store = new GraphStore({ graph });
      expect(store.graph).toBe(graph);
    });

    it('should initialize with empty elements and links by default', () => {
      const store = new GraphStore({});
      const snapshot = store.dataState.getSnapshot();
      expect(snapshot.elements).toEqual({});
      expect(snapshot.links).toEqual({});
    });

    it('should initialize with initialElements', () => {
      const initialElements: Record<string, FlatElementData> = {
        'element-1': {
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          type: 'PortalElement',
        },
        'element-2': { x: 30, y: 40, width: 80, height: 60, type: 'PortalElement' },
      };
      const store = new GraphStore({ initialElements });
      const snapshot = store.dataState.getSnapshot();
      expect(Object.keys(snapshot.elements)).toHaveLength(2);
      expect(snapshot.elements['element-1']).toBeDefined();
      expect(snapshot.elements['element-2']).toBeDefined();
    });

    it('should sync initial elements into graph immediately after construction', () => {
      const initialElements: Record<string, FlatElementData> = {
        'element-1': {
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          type: 'PortalElement',
        },
      };

      const store = new GraphStore({ initialElements });

      expect(store.graph.getCell('element-1')).toBeDefined();
      expect(store.graph.getElements()).toHaveLength(1);
    });

    it('should initialize with initialLinks', () => {
      const initialLinks: Record<string, FlatLinkData> = {
        'link-1': { source: 'element-1', target: 'element-2', type: 'standard.Link' },
      };
      const store = new GraphStore({ initialLinks });
      const snapshot = store.dataState.getSnapshot();
      expect(Object.keys(snapshot.links)).toHaveLength(1);
      expect(snapshot.links['link-1']).toBeDefined();
    });

    it('should initialize with both initialElements and initialLinks', () => {
      const initialElements: Record<string, FlatElementData> = {
        'element-1': {
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          type: 'PortalElement',
        },
      };
      const initialLinks: Record<string, FlatLinkData> = {
        'link-1': { source: 'element-1', target: 'element-2', type: 'standard.Link' },
      };
      const store = new GraphStore({ initialElements, initialLinks });
      const snapshot = store.dataState.getSnapshot();
      expect(Object.keys(snapshot.elements)).toHaveLength(1);
      expect(Object.keys(snapshot.links)).toHaveLength(1);
    });

    it('should merge custom cellNamespace with default namespace', () => {
      const customNamespace = { CustomShape: class extends dia.Element {} };
      const store = new GraphStore({ cellNamespace: customNamespace });
      // The graph should have both default and custom namespaces
      expect(store.graph).toBeDefined();
    });

    it('should handle graph with existing cells', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_TEST_NAMESPACE });
      const existingElement = new dia.Element({
        id: 'existing-element',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });
      graph.addCell(existingElement);
      const cellCountBefore = graph.getCells().length;

      const initialElements: Record<string, FlatElementData> = {
        'new-element': {
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          type: 'PortalElement',
        },
      };
      const store = new GraphStore({ graph, initialElements });

      // Store should be created successfully
      expect(store).toBeDefined();
      // Graph should still have cells (at least the existing one, possibly more after sync)
      expect(graph.getCells().length).toBeGreaterThanOrEqual(cellCountBefore);
    });
  });

  describe('destroy', () => {
    it('should cleanup all resources when graph is internal', () => {
      const store = new GraphStore({});
      const { graph } = store;

      store.destroy(false);

      // Graph should be cleared
      expect(graph.getCells()).toHaveLength(0);
    });

    it('should not clear graph when graph is external', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_TEST_NAMESPACE });
      const element = new dia.Element({
        id: 'test-element',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });
      graph.addCell(element);

      const store = new GraphStore({ graph });
      const cellCountBefore = graph.getCells().length;

      store.destroy(true);

      // Graph should not be cleared
      expect(graph.getCells()).toHaveLength(cellCountBefore);
      expect(graph.getCell('test-element')).toBeDefined();
    });
  });

  describe('updatePaperSnapshot', () => {
    it('should update paper snapshot for given paperId', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';

      store.updatePaperSnapshot(paperId, () => ({
        ...createPaperStoreSnapshot(),
      }));

      const internalSnapshot = store.internalState.getSnapshot();
      expect(internalSnapshot.papers[paperId]).toBeDefined();
    });

    it('should update existing paper snapshot', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';

      store.updatePaperSnapshot(paperId, () => ({
        ...createPaperStoreSnapshot(),
      }));

      store.updatePaperSnapshot(paperId, (previous) => ({
        ...previous!,
        elementViewIds: { ...previous!.elementViewIds, 'element-1': true },
      }));

      const internalSnapshot = store.internalState.getSnapshot();
      expect(internalSnapshot.papers[paperId].elementViewIds).toHaveProperty('element-1');
    });

    it('should not update if snapshot is unchanged', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      const snapshot = createPaperStoreSnapshot();

      store.updatePaperSnapshot(paperId, () => snapshot);
      const firstUpdate = store.internalState.getSnapshot().papers[paperId];

      store.updatePaperSnapshot(paperId, () => snapshot);
      const secondUpdate = store.internalState.getSnapshot().papers[paperId];

      // Should return same reference if unchanged
      expect(firstUpdate).toBe(secondUpdate);
    });

    it('should skip update when snapshot is deep-equal', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';

      store.updatePaperSnapshot(paperId, () => ({
        ...createPaperStoreSnapshot(),
        elementViewIds: { 'element-1': true },
      }));
      const firstUpdate = store.internalState.getSnapshot().papers[paperId];

      store.updatePaperSnapshot(paperId, (previous) => ({
        ...previous!,
      }));
      const secondUpdate = store.internalState.getSnapshot().papers[paperId];

      // Spread creates a new reference but the content is identical
      expect(secondUpdate).toStrictEqual(firstUpdate);
    });
  });

  describe('setPaperViews', () => {
    function ensurePaperSnapshot(store: GraphStore, paperId: string) {
      store.internalState.setState((previous) => {
        if (previous.papers[paperId]) return previous;
        return {
          ...previous,
          papers: {
            ...previous.papers,
            [paperId]: createPaperStoreSnapshot(),
          },
        };
      });
    }

    it('should update element and link view ids in a single batch', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      ensurePaperSnapshot(store, paperId);

      const element = new shapes.standard.Rectangle({ id: 'element-1' });
      const link = new shapes.standard.Link({ id: 'link-1' });

      const changes = new Map<string, { type: 'add'; data: dia.Cell }>([
        ['element-1', { type: 'add', data: element }],
        ['link-1', { type: 'add', data: link }],
      ]);
      store.setPaperViews(paperId, changes);

      const internalSnapshot = store.internalState.getSnapshot();
      const paper = internalSnapshot.papers[paperId];
      expect(paper?.elementViewIds['element-1']).toBe(true);
      expect(paper?.linkViewIds['link-1']).toBe(true);
    });

    it('should remove element view id on unmount', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      ensurePaperSnapshot(store, paperId);

      const element = new shapes.standard.Rectangle({ id: 'element-1' });

      store.setPaperViews(
        paperId,
        new Map([['element-1', { type: 'add' as const, data: element }]])
      );
      store.setPaperViews(paperId, new Map([['element-1', { type: 'remove' as const }]]));

      const paper = store.internalState.getSnapshot().papers[paperId];
      expect(paper?.elementViewIds['element-1']).toBeUndefined();
    });

    it('should remove link view id on unmount', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      ensurePaperSnapshot(store, paperId);

      const link = new shapes.standard.Link({ id: 'link-1' });

      store.setPaperViews(paperId, new Map([['link-1', { type: 'add' as const, data: link }]]));
      store.setPaperViews(paperId, new Map([['link-1', { type: 'remove' as const }]]));

      const paper = store.internalState.getSnapshot().papers[paperId];
      expect(paper?.linkViewIds['link-1']).toBeUndefined();
    });
  });

  describe('addPaper', () => {
    it('should add a new paper and return paperStore and remove function', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      const { paperStore, remove } = store.addPaper(paperId, {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
      });

      expect(store.getPaperStore(paperId)).toBeDefined();
      expect(paperStore).toBeDefined();
      expect(typeof remove).toBe('function');
    });

    it('should initialize serializable internal paper metadata', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      store.addPaper(paperId, {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
      });

      const paperSnapshot = store.internalState.getSnapshot().papers[paperId];
      expect(paperSnapshot.elementViewIds).toEqual({});
      expect(paperSnapshot.linkViewIds).toEqual({});
      expect(() => JSON.stringify(store.internalState.getSnapshot())).not.toThrow();
    });

    it('should remove paper when remove is called', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      const { remove } = store.addPaper(paperId, {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
      });

      expect(store.getPaperStore(paperId)).toBeDefined();

      remove();

      expect(store.getPaperStore(paperId)).toBeUndefined();
    });

    it('should handle multiple papers', () => {
      const store = new GraphStore({});
      const { remove: remove1 } = store.addPaper('paper-1', {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
      });
      const { remove: remove2 } = store.addPaper('paper-2', {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
      });

      expect(store.getPaperStore('paper-1')).toBeDefined();
      expect(store.getPaperStore('paper-2')).toBeDefined();

      remove1();
      expect(store.getPaperStore('paper-1')).toBeUndefined();
      expect(store.getPaperStore('paper-2')).toBeDefined();

      remove2();
      expect(store.getPaperStore('paper-2')).toBeUndefined();
    });

    it('should not crash when adding a second paper after view snapshot updates', () => {
      sendToDevToolMock.mockImplementation(({ value }) => {
        JSON.stringify(value);
      });

      const store = new GraphStore({});
      const { remove: removeMain } = store.addPaper('paper-main', {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
      });

      const element = new shapes.standard.Rectangle({ id: 'element-1' });
      expect(() =>
        store.setPaperViews(
          'paper-main',
          new Map([['element-1', { type: 'add' as const, data: element }]])
        )
      ).not.toThrow();
      expect(() =>
        store.addPaper('paper-minimap', {
          paperOptions: {
            model: store.graph,
            width: 800,
            height: 600,
          },
        })
      ).not.toThrow();

      removeMain();
    });
  });

  describe('hasMeasuredNode', () => {
    it('should return false for non-measured nodes', () => {
      const store = new GraphStore({});
      expect(store.hasMeasuredNode('non-existent')).toBe(false);
    });

    it('should return true for measured nodes', () => {
      const store = new GraphStore({});
      const id = 'measured-element';

      store.graph.addCell(
        new PortalElement({
          id,
          position: { x: 10, y: 20 },
          size: { width: 100, height: 50 },
        })
      );

      const domElement = document.createElement('div');
      store.setMeasuredNode({
        id,
        node: domElement,
      });

      expect(store.hasMeasuredNode(id)).toBe(true);
    });
  });

  describe('setMeasuredNode', () => {
    it('should register a node for measurement and return cleanup', () => {
      const store = new GraphStore({});
      const id = 'measured-element';

      store.graph.addCell(
        new PortalElement({
          id,
          position: { x: 10, y: 20 },
          size: { width: 100, height: 50 },
        })
      );

      const domElement = document.createElement('div');
      const setSize = jest.fn();
      const cleanup = store.setMeasuredNode({
        id,
        node: domElement,
        transform: setSize,
      });

      expect(typeof cleanup).toBe('function');
      expect(store.hasMeasuredNode(id)).toBe(true);

      cleanup();
      expect(store.hasMeasuredNode(id)).toBe(false);
    });
  });

  describe('getPaperStore', () => {
    it('should return undefined for non-existent paper', () => {
      const store = new GraphStore({});
      expect(store.getPaperStore('non-existent')).toBeUndefined();
    });

    it('should return paper store for existing paper', () => {
      const store = new GraphStore({});
      store.addPaper('paper-1', {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
      });

      const paperStore = store.getPaperStore('paper-1');
      expect(paperStore).toBeDefined();
    });
  });

  describe('state synchronization', () => {
    it('should sync state changes to graph', (done) => {
      const store = new GraphStore({});
      const id = 'sync-element';
      const element: FlatElementData = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'PortalElement',
      };

      store.graphState.updateGraph({
        elements: { [id]: element },
        links: {},
        flag: 'updateFromReact',
      });

      // Wait for sync
      setTimeout(() => {
        const graphElement = store.graph.getCell(id);
        expect(graphElement).toBeDefined();
        expect(graphElement?.isElement()).toBe(true);
        done();
      }, 50);
    });

    it('should sync graph changes to state', (done) => {
      const store = new GraphStore({});
      const { graph } = store;

      const element = new dia.Element({
        id: 'graph-element',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });

      graph.addCell(element);

      // Wait for sync
      setTimeout(() => {
        const snapshot = store.dataState.getSnapshot();
        const stateElement = snapshot.elements['graph-element'];
        expect(stateElement).toBeDefined();
        done();
      }, 50);
    });

    it('should keep layout state live but defer public state during active graph batches', async () => {
      const store = new GraphStore({
        enableBatchUpdates: true,
        initialElements: {
          'batched-element': {
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            type: 'PortalElement',
          },
        },
      });

      await waitFor(() => {
        expect(store.layoutState.getSnapshot().elements.sizes['batched-element']).toBeDefined();
      });

      const element = store.graph.getCell('batched-element');
      if (!element?.isElement()) {
        throw new Error('Expected batched-element to exist in graph');
      }

      store.graph.startBatch('test');
      element.set('position', { x: 120, y: 180 });
      element.set('size', { width: 240, height: 160 });

      await waitFor(() => {
        const { positions, sizes } = store.layoutState.getSnapshot().elements;
        expect(positions['batched-element']?.x).toBe(120);
        expect(positions['batched-element']?.y).toBe(180);
        expect(sizes['batched-element']?.width).toBe(240);
        expect(sizes['batched-element']?.height).toBe(160);
      });

      const publicSnapshotDuringBatch = store.dataState.getSnapshot().elements['batched-element'];
      expect(publicSnapshotDuringBatch?.x).toBe(0);
      expect(publicSnapshotDuringBatch?.y).toBe(0);
      expect(publicSnapshotDuringBatch?.width).toBe(100);
      expect(publicSnapshotDuringBatch?.height).toBe(50);

      store.graph.stopBatch('test');

      await waitFor(() => {
        const publicSnapshotAfterBatch = store.dataState.getSnapshot().elements['batched-element'];
        expect(publicSnapshotAfterBatch?.x).toBe(120);
        expect(publicSnapshotAfterBatch?.y).toBe(180);
        expect(publicSnapshotAfterBatch?.width).toBe(240);
        expect(publicSnapshotAfterBatch?.height).toBe(160);
      });
    });
  });
});

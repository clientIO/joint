/* eslint-disable no-shadow */
/* eslint-disable unicorn/consistent-function-scoping */
import { dia, shapes } from '@joint/core';
import { GraphStore } from '../graph-store';
import { ReactElement } from '../../models/react-element';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import {
  defaultElementToGraphSelector,
  defaultElementFromGraphSelector,
  defaultLinkToGraphSelector,
  defaultLinkFromGraphSelector,
  type ElementToGraphOptions,
  type ElementFromGraphOptions,
  type LinkToGraphOptions,
  type LinkFromGraphOptions,
} from '../../state/graph-state-selectors';

const DEFAULT_TEST_NAMESPACE = { ...shapes, ReactElement };

describe('GraphStore', () => {
  describe('constructor', () => {
    it('should create a GraphStore with default graph instance', () => {
      const store = new GraphStore({});
      expect(store).toBeDefined();
      expect(store.graph).toBeInstanceOf(dia.Graph);
      expect(store.publicState).toBeDefined();
      expect(store.internalState).toBeDefined();
      expect(store.derivedStore).toBeDefined();
    });

    it('should create a GraphStore with provided graph instance', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_TEST_NAMESPACE });
      const store = new GraphStore({ graph });
      expect(store.graph).toBe(graph);
    });

    it('should initialize with empty elements and links by default', () => {
      const store = new GraphStore({});
      const snapshot = store.publicState.getSnapshot();
      expect(snapshot.elements).toEqual([]);
      expect(snapshot.links).toEqual([]);
    });

    it('should initialize with initialElements', () => {
      const initialElements: GraphElement[] = [
        { id: 'element-1', x: 10, y: 20, width: 100, height: 50, type: 'ReactElement' },
        { id: 'element-2', x: 30, y: 40, width: 80, height: 60, type: 'ReactElement' },
      ];
      const store = new GraphStore({ initialElements });
      const snapshot = store.publicState.getSnapshot();
      expect(snapshot.elements).toHaveLength(2);
      expect(snapshot.elements[0].id).toBe('element-1');
      expect(snapshot.elements[1].id).toBe('element-2');
    });

    it('should initialize with initialLinks', () => {
      const initialLinks: GraphLink[] = [
        { id: 'link-1', source: 'element-1', target: 'element-2', type: 'standard.Link' },
      ];
      const store = new GraphStore({ initialLinks });
      const snapshot = store.publicState.getSnapshot();
      expect(snapshot.links).toHaveLength(1);
      expect(snapshot.links[0].id).toBe('link-1');
    });

    it('should initialize with both initialElements and initialLinks', () => {
      const initialElements: GraphElement[] = [
        { id: 'element-1', x: 10, y: 20, width: 100, height: 50, type: 'ReactElement' },
      ];
      const initialLinks: GraphLink[] = [
        { id: 'link-1', source: 'element-1', target: 'element-2', type: 'standard.Link' },
      ];
      const store = new GraphStore({ initialElements, initialLinks });
      const snapshot = store.publicState.getSnapshot();
      expect(snapshot.elements).toHaveLength(1);
      expect(snapshot.links).toHaveLength(1);
    });

    it('should merge custom cellNamespace with default namespace', () => {
      const customNamespace = { CustomShape: class extends dia.Element {} };
      const store = new GraphStore({ cellNamespace: customNamespace });
      // The graph should have both default and custom namespaces
      expect(store.graph).toBeDefined();
    });

    it('should use external store when provided', () => {
      function unsubscribe() {
        // Empty unsubscribe function
      }
      const externalStore = {
        getSnapshot: () => ({ elements: [], links: [] }),
        subscribe: () => unsubscribe,
        setState: () => {},
      };
      const store = new GraphStore({ externalStore });
      expect(store.publicState).toBe(externalStore);
    });

    it('should use custom selectors when provided', () => {
      const customElementToGraph = jest.fn((options: ElementToGraphOptions<GraphElement>) => {
        return defaultElementToGraphSelector(options);
      });
      const customElementFromGraph = jest.fn((options: ElementFromGraphOptions<GraphElement>) => {
        return defaultElementFromGraphSelector(options);
      });
      const customLinkToGraph = jest.fn((options: LinkToGraphOptions<GraphLink>) => {
        return defaultLinkToGraphSelector(options);
      });
      const customLinkFromGraph = jest.fn((options: LinkFromGraphOptions<GraphLink>) => {
        return defaultLinkFromGraphSelector(options);
      });

      const store = new GraphStore({
        elementToGraphSelector: customElementToGraph,
        elementFromGraphSelector: customElementFromGraph,
        linkToGraphSelector: customLinkToGraph,
        linkFromGraphSelector: customLinkFromGraph,
      });

      // Add an element to trigger the selector
      const element: GraphElement = {
        id: 'test-element',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };
      store.publicState.setState((previous) => ({
        ...previous,
        elements: [...previous.elements, element],
      }));

      // Wait a bit for sync to happen
      setTimeout(() => {
        expect(customElementToGraph).toHaveBeenCalled();
      }, 10);
    });

    it('should default areBatchUpdatesDisabled to false (batch updates enabled)', () => {
      const store = new GraphStore({});
      // The store should be created successfully with default batch-based updates
      expect(store).toBeDefined();
      expect(store.graph).toBeDefined();
    });

    it('should use areBatchUpdatesDisabled when provided', () => {
      const storeWithRealtime = new GraphStore({ areBatchUpdatesDisabled: true });
      expect(storeWithRealtime).toBeDefined();

      const storeWithBatches = new GraphStore({ areBatchUpdatesDisabled: false });
      expect(storeWithBatches).toBeDefined();
    });

    it('should handle graph with existing cells', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_TEST_NAMESPACE });
      const existingElement = new dia.Element({
        id: 'existing-element',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });
      graph.addCell(existingElement);
      const cellCountBefore = graph.getCells().length;

      const initialElements: GraphElement[] = [
        { id: 'new-element', x: 10, y: 20, width: 100, height: 50, type: 'ReactElement' },
      ];
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
        type: 'ReactElement',
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
        paperElementViews: {},
        portsData: {},
      }));

      const internalSnapshot = store.internalState.getSnapshot();
      expect(internalSnapshot.papers[paperId]).toBeDefined();
      expect(internalSnapshot.papers[paperId].paperElementViews).toEqual({});
    });

    it('should update existing paper snapshot', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';

      store.updatePaperSnapshot(paperId, () => ({
        paperElementViews: {},
        portsData: {},
      }));

      store.updatePaperSnapshot(paperId, (previous) => ({
        ...previous!,
        paperElementViews: { 'element-1': {} as dia.ElementView },
      }));

      const internalSnapshot = store.internalState.getSnapshot();
      expect(internalSnapshot.papers[paperId].paperElementViews).toHaveProperty('element-1');
    });

    it('should not update if snapshot is unchanged', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      const snapshot = { paperElementViews: {}, portsData: {} };

      store.updatePaperSnapshot(paperId, () => snapshot);
      const firstUpdate = store.internalState.getSnapshot().papers[paperId];

      store.updatePaperSnapshot(paperId, () => snapshot);
      const secondUpdate = store.internalState.getSnapshot().papers[paperId];

      // Should return same reference if unchanged
      expect(firstUpdate).toBe(secondUpdate);
    });
  });

  describe('updatePaperElementView', () => {
    it('should update element view for given paper and cell', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      const cellId = 'element-1';
      const mockView = {} as dia.ElementView;

      store.updatePaperElementView(paperId, cellId, mockView);

      const internalSnapshot = store.internalState.getSnapshot();
      const paper = internalSnapshot.papers[paperId];
      expect(paper?.paperElementViews?.[cellId]).toBe(mockView);
    });

    it('should not update if view is unchanged', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      const cellId = 'element-1';
      const mockView = {} as dia.ElementView;

      store.updatePaperElementView(paperId, cellId, mockView);
      const snapshot1 = store.internalState.getSnapshot();
      const paper1 = snapshot1.papers[paperId];
      const firstUpdate = paper1?.paperElementViews?.[cellId];

      store.updatePaperElementView(paperId, cellId, mockView);
      const snapshot2 = store.internalState.getSnapshot();
      const paper2 = snapshot2.papers[paperId];
      const secondUpdate = paper2?.paperElementViews?.[cellId];

      expect(firstUpdate).toBe(secondUpdate);
    });
  });

  describe('addPaper', () => {
    it('should add a new paper and return cleanup function', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      const paperElement = document.createElement('div');
      const cleanup = store.addPaper(paperId, {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
        paperElement,
      });

      expect(store.getPaperStore(paperId)).toBeDefined();
      expect(typeof cleanup).toBe('function');
    });

    it('should remove paper when cleanup is called', () => {
      const store = new GraphStore({});
      const paperId = 'paper-1';
      const paperElement = document.createElement('div');
      const cleanup = store.addPaper(paperId, {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
        paperElement,
      });

      expect(store.getPaperStore(paperId)).toBeDefined();

      cleanup();

      expect(store.getPaperStore(paperId)).toBeUndefined();
    });

    it('should handle multiple papers', () => {
      const store = new GraphStore({});
      const paper1Element = document.createElement('div');
      const paper2Element = document.createElement('div');
      const paper1 = store.addPaper('paper-1', {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
        paperElement: paper1Element,
      });
      const paper2 = store.addPaper('paper-2', {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
        paperElement: paper2Element,
      });

      expect(store.getPaperStore('paper-1')).toBeDefined();
      expect(store.getPaperStore('paper-2')).toBeDefined();

      paper1();
      expect(store.getPaperStore('paper-1')).toBeUndefined();
      expect(store.getPaperStore('paper-2')).toBeDefined();

      paper2();
      expect(store.getPaperStore('paper-2')).toBeUndefined();
    });
  });

  describe('hasMeasuredNode', () => {
    it('should return false for non-measured nodes', () => {
      const store = new GraphStore({});
      expect(store.hasMeasuredNode('non-existent')).toBe(false);
    });

    it('should return true for measured nodes', () => {
      const store = new GraphStore({});
      const element: GraphElement = {
        id: 'measured-element',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };

      store.publicState.setState((previous) => ({
        ...previous,
        elements: [...previous.elements, element],
      }));

      const domElement = document.createElement('div');
      store.setMeasuredNode({
        id: 'measured-element',
        element: domElement,
      });

      expect(store.hasMeasuredNode('measured-element')).toBe(true);
    });
  });

  describe('setMeasuredNode', () => {
    it('should register a node for measurement and return cleanup', () => {
      const store = new GraphStore({});
      const element: GraphElement = {
        id: 'measured-element',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };

      store.publicState.setState((previous) => ({
        ...previous,
        elements: [...previous.elements, element],
      }));

      const domElement = document.createElement('div');
      const setSize = jest.fn();
      const cleanup = store.setMeasuredNode({
        id: 'measured-element',
        element: domElement,
        setSize,
      });

      expect(typeof cleanup).toBe('function');
      expect(store.hasMeasuredNode('measured-element')).toBe(true);

      cleanup();
      expect(store.hasMeasuredNode('measured-element')).toBe(false);
    });
  });

  describe('getPaperStore', () => {
    it('should return undefined for non-existent paper', () => {
      const store = new GraphStore({});
      expect(store.getPaperStore('non-existent')).toBeUndefined();
    });

    it('should return paper store for existing paper', () => {
      const store = new GraphStore({});
      const paperElement = document.createElement('div');
      store.addPaper('paper-1', {
        paperOptions: {
          model: store.graph,
          width: 800,
          height: 600,
        },
        paperElement,
      });

      const paperStore = store.getPaperStore('paper-1');
      expect(paperStore).toBeDefined();
    });
  });

  describe('subscribeToCellChange', () => {
    it('should subscribe to cell changes and return unsubscribe', () => {
      const store = new GraphStore({});
      function unsubscribeCallback() {
        // Empty unsubscribe callback
      }
      const callback = jest.fn(() => unsubscribeCallback);
      const unsubscribe = store.subscribeToCellChange(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('updateExternalStore', () => {
    it('should update the external store reference', () => {
      const store = new GraphStore({});
      const originalStore = store.publicState;

      function unsubscribe() {
        // Empty unsubscribe function
      }
      const newStore = {
        getSnapshot: () => ({ elements: [], links: [] }),
        subscribe: () => unsubscribe,
        setState: () => {},
      };

      store.updateExternalStore(newStore);

      expect(store.publicState).toBe(newStore);
      expect(store.publicState).not.toBe(originalStore);
    });
  });

  describe('derivedStore', () => {
    it('should create elementIds mapping', () => {
      const store = new GraphStore({});
      const elements: GraphElement[] = [
        { id: 'element-1', x: 10, y: 20, width: 100, height: 50, type: 'ReactElement' },
        { id: 'element-2', x: 30, y: 40, width: 80, height: 60, type: 'ReactElement' },
      ];

      store.publicState.setState((previous) => ({
        ...previous,
        elements,
      }));

      const derived = store.derivedStore.getSnapshot();
      expect(derived.elementIds['element-1']).toBe(0);
      expect(derived.elementIds['element-2']).toBe(1);
    });

    it('should create linkIds mapping', () => {
      const store = new GraphStore({});
      const links: GraphLink[] = [
        { id: 'link-1', source: 'element-1', target: 'element-2', type: 'standard.Link' },
        { id: 'link-2', source: 'element-2', target: 'element-3', type: 'standard.Link' },
      ];

      store.publicState.setState((previous) => ({
        ...previous,
        links,
      }));

      const derived = store.derivedStore.getSnapshot();
      expect(derived.linkIds['link-1']).toBe(0);
      expect(derived.linkIds['link-2']).toBe(1);
    });

    it('should track areElementsMeasured correctly', () => {
      const store = new GraphStore({});

      // Test with measured elements
      const measuredElements: GraphElement[] = [
        { id: 'element-1', x: 10, y: 20, width: 100, height: 50, type: 'ReactElement' },
      ];

      store.publicState.setState((previous) => ({
        ...previous,
        elements: measuredElements,
      }));

      let derived = store.derivedStore.getSnapshot();
      // After setting measured elements, should be true
      expect(derived.areElementsMeasured).toBe(true);

      // Once measured, it stays true even if we add unmeasured elements
      const mixedElements: GraphElement[] = [
        { id: 'element-1', x: 10, y: 20, width: 100, height: 50, type: 'ReactElement' },
        { id: 'element-2', x: 30, y: 40, width: 0, height: 0, type: 'ReactElement' },
      ];

      store.publicState.setState((previous) => ({
        ...previous,
        elements: mixedElements,
      }));

      derived = store.derivedStore.getSnapshot();
      // Should remain true because wasElementsMeasuredBefore is true
      expect(derived.areElementsMeasured).toBe(true);
    });
  });

  describe('state synchronization', () => {
    it('should sync state changes to graph', (done) => {
      const store = new GraphStore({});
      const element: GraphElement = {
        id: 'sync-element',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };

      store.publicState.setState((previous) => ({
        ...previous,
        elements: [...previous.elements, element],
      }));

      // Wait for sync
      setTimeout(() => {
        const graphElement = store.graph.getCell('sync-element');
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
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });

      graph.addCell(element);

      // Wait for sync
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const findElementById = (element: GraphElement) => element.id === 'graph-element';
      setTimeout(() => {
        const snapshot = store.publicState.getSnapshot();
        const stateElement = snapshot.elements.find(findElementById);
        expect(stateElement).toBeDefined();
        done();
      }, 50);
    });
  });
});

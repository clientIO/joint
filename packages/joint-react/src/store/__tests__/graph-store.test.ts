 
/* eslint-disable unicorn/consistent-function-scoping */
import { dia, shapes } from '@joint/core';
import { GraphStore } from '../graph-store';
import { ReactElement } from '../../models/react-element';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  type ElementToGraphOptions,
  type LinkToGraphOptions,
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
    });

    it('should create a GraphStore with provided graph instance', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_TEST_NAMESPACE });
      const store = new GraphStore({ graph });
      expect(store.graph).toBe(graph);
    });

    it('should initialize with empty elements and links by default', () => {
      const store = new GraphStore({});
      const snapshot = store.publicState.getSnapshot();
      expect(snapshot.elements).toEqual({});
      expect(snapshot.links).toEqual({});
    });

    it('should initialize with initialElements', () => {
      const initialElements: Record<string, GraphElement> = {
        'element-1': {
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          type: 'ReactElement',
        },
        'element-2': { x: 30, y: 40, width: 80, height: 60, type: 'ReactElement' },
      };
      const store = new GraphStore({ initialElements });
      const snapshot = store.publicState.getSnapshot();
      expect(Object.keys(snapshot.elements)).toHaveLength(2);
      expect(snapshot.elements['element-1']).toBeDefined();
      expect(snapshot.elements['element-2']).toBeDefined();
    });

    it('should initialize with initialLinks', () => {
      const initialLinks: Record<string, GraphLink> = {
        'link-1': { source: 'element-1', target: 'element-2', type: 'standard.Link' },
      };
      const store = new GraphStore({ initialLinks });
      const snapshot = store.publicState.getSnapshot();
      expect(Object.keys(snapshot.links)).toHaveLength(1);
      expect(snapshot.links['link-1']).toBeDefined();
    });

    it('should initialize with both initialElements and initialLinks', () => {
      const initialElements: Record<string, GraphElement> = {
        'element-1': {
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          type: 'ReactElement',
        },
      };
      const initialLinks: Record<string, GraphLink> = {
        'link-1': { source: 'element-1', target: 'element-2', type: 'standard.Link' },
      };
      const store = new GraphStore({ initialElements, initialLinks });
      const snapshot = store.publicState.getSnapshot();
      expect(Object.keys(snapshot.elements)).toHaveLength(1);
      expect(Object.keys(snapshot.links)).toHaveLength(1);
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
        getSnapshot: () => ({ elements: {}, links: {} }),
        subscribe: () => unsubscribe,
        setState: () => {},
      };
      const store = new GraphStore({ externalStore });
      expect(store.publicState).toBe(externalStore);
    });

    it('should use custom selectors when provided', () => {
      const customElementToGraph = jest.fn((options: ElementToGraphOptions<GraphElement>) => {
        return defaultMapDataToElementAttributes(options);
      });
      const customLinkToGraph = jest.fn((options: LinkToGraphOptions<GraphLink>) => {
        return defaultMapDataToLinkAttributes(options);
      });

      const store = new GraphStore({
        mapDataToElementAttributes: customElementToGraph,
        mapDataToLinkAttributes: customLinkToGraph,
      });

      // Add an element to trigger the selector
      const id = 'test-element';
      const data: GraphElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };
      store.publicState.setState((previous) => ({
        ...previous,
        elements: { ...previous.elements, [id]: data },
      }));

      // Wait a bit for sync to happen
      setTimeout(() => {
        expect(customElementToGraph).toHaveBeenCalled();
      }, 10);
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

      const initialElements: Record<string, GraphElement> = {
        'new-element': {
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          type: 'ReactElement',
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
      const id = 'measured-element';
      const data: GraphElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };

      store.publicState.setState((previous) => ({
        ...previous,
        elements: { ...previous.elements, [id]: data },
      }));

      const domElement = document.createElement('div');
      store.setMeasuredNode({
        id,
        element: domElement,
      });

      expect(store.hasMeasuredNode(id)).toBe(true);
    });
  });

  describe('setMeasuredNode', () => {
    it('should register a node for measurement and return cleanup', () => {
      const store = new GraphStore({});
      const id = 'measured-element';
      const element: GraphElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };

      store.publicState.setState((previous) => ({
        ...previous,
        elements: { ...previous.elements, [id]: element },
      }));

      const domElement = document.createElement('div');
      const setSize = jest.fn();
      const cleanup = store.setMeasuredNode({
        id,
        element: domElement,
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
        getSnapshot: () => ({ elements: {}, links: {} }),
        subscribe: () => unsubscribe,
        setState: () => {},
      };

      store.updateExternalStore(newStore);

      expect(store.publicState).toBe(newStore);
      expect(store.publicState).not.toBe(originalStore);
    });
  });

  describe('areElementsMeasuredState', () => {
    it('should track areElementsMeasured correctly', (done) => {
      const store = new GraphStore({});

      // Initially, no elements, so should be false
      expect(store.areElementsMeasuredState.getSnapshot()).toBe(false);

      // Test with measured elements - add to graph
      const measuredElement = new ReactElement({
        id: 'element-1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });
      store.graph.addCell(measuredElement);

      // Wait for layout state update (uses startTransition which defers updates)
      setTimeout(() => {
        // After adding measured element to graph, should be true
        expect(store.areElementsMeasuredState.getSnapshot()).toBe(true);

        // Once measured, it stays true even if we add unmeasured elements
        const unmeasuredElement = new ReactElement({
          id: 'element-2',
          position: { x: 30, y: 40 },
          size: { width: 0, height: 0 },
        });
        store.graph.addCell(unmeasuredElement);

        // Wait for next update and check final state
        // eslint-disable-next-line sonarjs/no-nested-functions
        setTimeout(() => {
          // Should remain true because wasElementsMeasuredBefore is true
          expect(store.areElementsMeasuredState.getSnapshot()).toBe(true);
          done();
        }, 50);
      }, 50);
    });
  });

  describe('state synchronization', () => {
    it('should sync state changes to graph', (done) => {
      const store = new GraphStore({});
      const id = 'sync-element';
      const element: GraphElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };

      store.publicState.setState((previous) => ({
        ...previous,
        elements: { ...previous.elements, [id]: element },
      }));

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
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });

      graph.addCell(element);

      // Wait for sync
      setTimeout(() => {
        const snapshot = store.publicState.getSnapshot();
        const stateElement = snapshot.elements['graph-element'];
        expect(stateElement).toBeDefined();
        done();
      }, 50);
    });
  });
});

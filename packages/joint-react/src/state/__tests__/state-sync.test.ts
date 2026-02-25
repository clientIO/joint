/* eslint-disable sonarjs/no-nested-functions */
import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, type GraphStoreSnapshot } from '../../store/graph-store';
import { stateSync } from '../state-sync';
import { updateGraph } from '../update-graph';
import { createState } from '../../utils/create-state';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
} from '../data-mapper';
import type {
  ElementToGraphOptions,
  GraphToElementOptions,
  LinkToGraphOptions,
} from '../graph-state-selectors';
import { Scheduler } from '../../utils/scheduler';
import type { GraphSchedulerData } from '../../types/scheduler.types';

// Helper to create ElementToGraphOptions
function createElementToGraphOptions<E extends GraphElement>(
  id: string,
  element: E,
  graph: dia.Graph
): ElementToGraphOptions<E> {
  return {
    id,
    data: element,
    graph,
    toAttributes: (newData) => defaultMapDataToElementAttributes({ id, data: newData }),
  };
}

// Helper to create LinkToGraphOptions
function _createLinkToGraphOptions<L extends GraphLink>(
  id: string,
  data: L,
  graph: dia.Graph
): LinkToGraphOptions<L> {
  return {
    id,
    data,
    graph,
    toAttributes: (newData) => defaultMapDataToLinkAttributes({ id, data: newData }),
  };
}

// Helper to create a mock scheduler that tracks scheduled data
function createMockScheduler() {
  const scheduledData: GraphSchedulerData[] = [];
  let flushCallback: ((data: GraphSchedulerData) => void) | null = null;

  const scheduler = new Scheduler<GraphSchedulerData>({
    onFlush: (data) => {
      scheduledData.push(data);
      if (flushCallback) {
        flushCallback(data);
      }
    },
  });

  return {
    scheduler,
    scheduledData,
    setFlushCallback: (cb: (data: GraphSchedulerData) => void) => {
      flushCallback = cb;
    },
    // Force flush for testing
    getScheduledCount: () => scheduledData.length,
  };
}

// Helper to flush scheduler synchronously for tests
async function flushScheduler(): Promise<void> {
  // Use setTimeout to allow React scheduler to flush
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('stateSync', () => {
  describe('basic synchronization', () => {
    it('should sync elements from state to graph on initialization', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
        '2': { width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler } = createMockScheduler();

      stateSync({ graph, store: state, scheduler });

      // Graph should have the elements from state
      expect(graph.getElements()).toHaveLength(2);
      expect(graph.getCell('1')).toBeDefined();
      expect(graph.getCell('2')).toBeDefined();
    });

    it('should sync links from state to graph on initialization', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
        '2': { width: 100, height: 100, type: 'ReactElement' },
      };

      const initialLinks: Record<string, GraphLink> = {
        link1: { source: '1', target: '2' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: initialLinks }),
        name: 'elements',
      });

      const { scheduler } = createMockScheduler();

      stateSync({ graph, store: state, scheduler });

      expect(graph.getElements()).toHaveLength(2);
      expect(graph.getLinks()).toHaveLength(1);
      expect(graph.getCell('link1')).toBeDefined();
    });
  });

  describe('graph to state synchronization', () => {
    it('should schedule element updates when graph element is added', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      // Track state updates via scheduler flush
      setFlushCallback((data) => {
        if (data.elementsToUpdate) {
          const newElements: Record<string, GraphElement> = { ...state.getSnapshot().elements };
          for (const [id, element] of data.elementsToUpdate) {
            newElements[id] = element;
          }
          state.setState(() => ({ ...state.getSnapshot(), elements: newElements }));
        }
      });

      stateSync({ graph, store: state, scheduler });

      // Add element to graph
      const element = new dia.Element({
        id: 'new-element',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(element);

      // Wait for scheduler to flush
      await flushScheduler();

      // State should have the new element
      expect(state.getSnapshot().elements['new-element']).toBeDefined();
    });

    it('should schedule element deletion when graph element is removed', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        const currentSnapshot = state.getSnapshot();
        const newElements = { ...currentSnapshot.elements };

        if (data.elementsToDelete) {
          for (const [id] of data.elementsToDelete) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete newElements[id];
          }
        }

        state.setState(() => ({ ...currentSnapshot, elements: newElements }));
      });

      stateSync({ graph, store: state, scheduler });

      // Verify element was synced to graph
      expect(graph.getCell('1')).toBeDefined();

      // Remove element from graph
      graph.removeCells([graph.getCell('1')!]);

      await flushScheduler();

      // State should not have the element
      expect(state.getSnapshot().elements['1']).toBeUndefined();
    });

    it('should schedule link updates when graph link is added', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
        '2': { width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        const currentSnapshot = state.getSnapshot();
        const newLinks = { ...currentSnapshot.links };

        if (data.linksToUpdate) {
          for (const [id, link] of data.linksToUpdate) {
            newLinks[id] = link;
          }
        }

        state.setState(() => ({ ...currentSnapshot, links: newLinks }));
      });

      stateSync({ graph, store: state, scheduler });

      // Add link to graph
      const link = new dia.Link({
        id: 'new-link',
        type: 'ReactLink',
        source: { id: '1' },
        target: { id: '2' },
      });
      graph.addCell(link);

      await flushScheduler();

      expect(state.getSnapshot().links['new-link']).toBeDefined();
    });
  });

  describe('state to graph synchronization', () => {
    it('should update graph when state elements change', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler } = createMockScheduler();

      stateSync({ graph, store: state, scheduler });

      // Verify initial state
      expect(graph.getElements()).toHaveLength(1);

      // Update state with new element
      state.setState((previous) => ({
        ...previous,
        elements: {
          ...previous.elements,
          '2': { width: 100, height: 100, type: 'ReactElement' },
        },
      }));

      // Graph should have the new element
      expect(graph.getElements()).toHaveLength(2);
      expect(graph.getCell('2')).toBeDefined();
    });

    it('should remove graph elements when state elements are removed', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
        '2': { width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler } = createMockScheduler();

      stateSync({ graph, store: state, scheduler });

      // Verify initial state
      expect(graph.getElements()).toHaveLength(2);

      // Remove element from state
      state.setState((previous) => {
        // eslint-disable-next-line sonarjs/no-unused-vars
        const { '1': _, ...rest } = previous.elements;
        return { ...previous, elements: rest };
      });

      // Graph should not have the element
      expect(graph.getElements()).toHaveLength(1);
      expect(graph.getCell('1')).toBeUndefined();
      expect(graph.getCell('2')).toBeDefined();
    });
  });

  describe('circular update prevention', () => {
    it('should not trigger state update when graph is updated from state (isUpdateFromReact flag)', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      const { scheduler, scheduledData } = createMockScheduler();

      stateSync({ graph, store: state, scheduler });

      const initialScheduledCount = scheduledData.length;

      // Update state - this should update graph but NOT schedule data back
      state.setState((previous) => ({
        ...previous,
        elements: {
          '1': { width: 100, height: 100, type: 'ReactElement' },
        },
      }));

      await flushScheduler();

      // Graph should have the element
      expect(graph.getCell('1')).toBeDefined();

      // No new data should have been scheduled (because isUpdateFromReact prevents it)
      expect(scheduledData.length).toBe(initialScheduledCount);
    });
  });

  describe('sync existing graph cells', () => {
    it('should sync existing graph cells to empty store on initialization', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      // Add elements to graph before creating stateSync
      const existingElements = [
        { id: '1', data: { width: 100, height: 100, type: 'ReactElement' } },
        { id: '2', data: { width: 100, height: 100, type: 'ReactElement' } },
      ];

      const elementItems = existingElements.map(({ id, data }) =>
        defaultMapDataToElementAttributes(createElementToGraphOptions(id, data, graph))
      );
      graph.syncCells(elementItems, { remove: true });

      // Create empty store
      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        const currentSnapshot = state.getSnapshot();
        const newElements = { ...currentSnapshot.elements };

        if (data.elementsToUpdate) {
          for (const [id, element] of data.elementsToUpdate) {
            newElements[id] = element;
          }
        }

        state.setState(() => ({ ...currentSnapshot, elements: newElements }));
      });

      // Graph has 2 elements, store is empty
      expect(graph.getElements()).toHaveLength(2);
      expect(Object.keys(state.getSnapshot().elements)).toHaveLength(0);

      stateSync({ graph, store: state, scheduler });

      await flushScheduler();

      // Store should now have the 2 elements from the graph
      expect(Object.keys(state.getSnapshot().elements)).toHaveLength(2);
    });

    it('should NOT sync existing graph cells when store already has elements', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      // Add elements to graph
      const graphElements = [
        { id: 'graph-element', data: { width: 100, height: 100, type: 'ReactElement' } },
      ];
      const elementItems = graphElements.map(({ id, data }) =>
        defaultMapDataToElementAttributes(createElementToGraphOptions(id, data, graph))
      );
      graph.syncCells(elementItems, { remove: true });

      // Create store with different elements
      const storeElements: Record<string, GraphElement> = {
        'store-element': { width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: storeElements, links: {} }),
        name: 'elements',
      });

      const { scheduler } = createMockScheduler();

      // Graph has 1 element, store has 1 different element
      expect(graph.getElements()).toHaveLength(1);
      expect(Object.keys(state.getSnapshot().elements)).toHaveLength(1);
      expect(state.getSnapshot().elements['store-element']).toBeDefined();

      stateSync({ graph, store: state, scheduler });

      // Store should keep its elements (state takes precedence)
      expect(state.getSnapshot().elements['store-element']).toBeDefined();

      // Graph should be synced to match store
      expect(graph.getCell('store-element')).toBeDefined();
      expect(graph.getCell('graph-element')).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should properly cleanup all listeners on cleanup()', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      const unsubscribeSpy = jest.fn();
      state.subscribe = jest.fn(() => unsubscribeSpy);

      const { scheduler } = createMockScheduler();

      const sync = stateSync({ graph, store: state, scheduler });

      // Verify subscription was set up
      expect(state.subscribe).toHaveBeenCalledTimes(1);

      // Cleanup
      sync.cleanup();

      // Verify unsubscribe was called
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset handling', () => {
    it('should handle graph reset correctly', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
        '2': { width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        const currentSnapshot = state.getSnapshot();
        const newElements = { ...currentSnapshot.elements };

        if (data.elementsToUpdate) {
          for (const [id, element] of data.elementsToUpdate) {
            newElements[id] = element;
          }
        }

        if (data.elementsToDelete) {
          for (const [id] of data.elementsToDelete) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete newElements[id];
          }
        }

        state.setState(() => ({ elements: newElements, links: currentSnapshot.links }));
      });

      stateSync({ graph, store: state, scheduler });

      // Verify initial state
      expect(graph.getElements()).toHaveLength(2);

      // Reset graph with new cells
      graph.resetCells([
        {
          id: '3',
          type: 'ReactElement',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
      ]);

      await flushScheduler();

      // State should have only the new element
      const snapshot = state.getSnapshot();
      expect(snapshot.elements['3']).toBeDefined();
      expect(snapshot.elements['1']).toBeUndefined();
      expect(snapshot.elements['2']).toBeUndefined();
    });
  });
});

describe('stateSync - comprehensive edge cases', () => {
  describe('batching behavior', () => {
    it('should batch multiple element updates into single scheduler call', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      let flushCount = 0;
      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback(() => {
        flushCount++;
      });

      stateSync({ graph, store: state, scheduler });

      // Add multiple elements rapidly - should be batched
      graph.addCells([
        { id: '1', type: 'ReactElement', size: { width: 100, height: 100 } },
        { id: '2', type: 'ReactElement', size: { width: 100, height: 100 } },
        { id: '3', type: 'ReactElement', size: { width: 100, height: 100 } },
      ]);

      await flushScheduler();

      // Should have batched into single flush (or minimal number of flushes)
      expect(flushCount).toBeLessThanOrEqual(2);
    });

    it('should handle rapid add/remove cycles', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        const currentSnapshot = state.getSnapshot();
        const newElements = { ...currentSnapshot.elements };

        if (data.elementsToUpdate) {
          for (const [id, element] of data.elementsToUpdate) {
            newElements[id] = element;
          }
        }

        if (data.elementsToDelete) {
          for (const [id] of data.elementsToDelete) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete newElements[id];
          }
        }

        state.setState(() => ({ ...currentSnapshot, elements: newElements }));
      });

      stateSync({ graph, store: state, scheduler });

      // Add then remove quickly
      const element = new dia.Element({
        id: 'temp',
        type: 'ReactElement',
        size: { width: 100, height: 100 },
      });
      graph.addCell(element);
      graph.removeCells([element]);

      await flushScheduler();

      // Element should be removed (delete wins over add)
      expect(state.getSnapshot().elements['temp']).toBeUndefined();
    });
  });

  describe('element and link updates', () => {
    it('should handle element position updates', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { x: 0, y: 0, width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        if (data.elementsToUpdate) {
          const newElements: Record<string, GraphElement> = { ...state.getSnapshot().elements };
          for (const [id, element] of data.elementsToUpdate) {
            newElements[id] = element;
          }
          state.setState((previous) => ({ ...previous, elements: newElements }));
        }
      });

      stateSync({ graph, store: state, scheduler });

      // Move element in graph
      const element = graph.getCell('1') as dia.Element;
      element.position(50, 50);

      await flushScheduler();

      const updatedElement = state.getSnapshot().elements['1'];
      expect(updatedElement.x).toBe(50);
      expect(updatedElement.y).toBe(50);
    });

    it('should handle element resize updates', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { x: 0, y: 0, width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        if (data.elementsToUpdate) {
          const newElements: Record<string, GraphElement> = { ...state.getSnapshot().elements };
          for (const [id, element] of data.elementsToUpdate) {
            newElements[id] = element;
          }
          state.setState((previous) => ({ ...previous, elements: newElements }));
        }
      });

      stateSync({ graph, store: state, scheduler });

      // Resize element in graph
      const element = graph.getCell('1') as dia.Element;
      element.resize(200, 200);

      await flushScheduler();

      const updatedElement = state.getSnapshot().elements['1'];
      expect(updatedElement.width).toBe(200);
      expect(updatedElement.height).toBe(200);
    });

    it('should handle link source/target updates', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
        '2': { width: 100, height: 100, type: 'ReactElement' },
        '3': { width: 100, height: 100, type: 'ReactElement' },
      };

      const initialLinks: Record<string, GraphLink> = {
        link1: { source: '1', target: '2' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: initialLinks }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        if (data.linksToUpdate) {
          const newLinks: Record<string, GraphLink> = { ...state.getSnapshot().links };
          for (const [id, link] of data.linksToUpdate) {
            newLinks[id] = link;
          }
          state.setState((previous) => ({ ...previous, links: newLinks }));
        }
      });

      stateSync({ graph, store: state, scheduler });

      // Update link target
      const link = graph.getCell('link1') as dia.Link;
      link.target({ id: '3' });

      await flushScheduler();

      const updatedLink = state.getSnapshot().links['link1'];
      // Link target from JointJS is an object with id property
      expect(updatedLink.target).toEqual({ id: '3' });
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty graph gracefully', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      const { scheduler } = createMockScheduler();

      // Should not throw
      const sync = stateSync({ graph, store: state, scheduler });

      expect(graph.getElements()).toHaveLength(0);
      expect(graph.getLinks()).toHaveLength(0);

      sync.cleanup();
    });

    it('should handle removing non-existent elements gracefully', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      const { scheduler } = createMockScheduler();

      stateSync({ graph, store: state, scheduler });

      // Try to remove non-existent cell - should not throw
      expect(() => {
        state.setState((previous) => {
          // eslint-disable-next-line sonarjs/no-unused-vars
          const { 'non-existent': _, ...rest } = previous.elements;
          return { ...previous, elements: rest };
        });
      }).not.toThrow();
    });

    it('should handle multiple cleanup calls gracefully', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: {}, links: {} }),
        name: 'elements',
      });

      const { scheduler } = createMockScheduler();

      const sync = stateSync({ graph, store: state, scheduler });

      // Should not throw on multiple cleanup calls
      expect(() => {
        sync.cleanup();
        sync.cleanup();
      }).not.toThrow();
    });
  });

  describe('concurrent updates', () => {
    it('should handle simultaneous graph and state updates', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const initialElements: Record<string, GraphElement> = {
        '1': { x: 0, y: 0, width: 100, height: 100, type: 'ReactElement' },
      };

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: initialElements, links: {} }),
        name: 'elements',
      });

      const { scheduler, setFlushCallback } = createMockScheduler();

      setFlushCallback((data) => {
        if (data.elementsToUpdate) {
          const newElements: Record<string, GraphElement> = { ...state.getSnapshot().elements };
          for (const [id, element] of data.elementsToUpdate) {
            newElements[id] = element;
          }
          state.setState((previous) => ({ ...previous, elements: newElements }));
        }
      });

      stateSync({ graph, store: state, scheduler });

      // Update from state (React side)
      state.setState((previous) => ({
        ...previous,
        elements: {
          ...previous.elements,
          '2': { x: 100, y: 100, width: 100, height: 100, type: 'ReactElement' },
        },
      }));

      // Update from graph (JointJS side) simultaneously
      const element = graph.getCell('1') as dia.Element;
      element.position(50, 50);

      await flushScheduler();

      // Both updates should be reflected
      expect(graph.getCell('2')).toBeDefined();
    });
  });
});

describe('updateGraph', () => {
  it('should update graph when elements differ', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const elements: Record<string, GraphElement> = {
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

    // Include x and y as they are returned by defaultMapElementAttributesToData
    const elements: Record<string, GraphElement> = {
      '1': { width: 100, height: 100, x: 0, y: 0, type: 'ReactElement' },
    };

    // First sync
    updateGraph({
      graph,
      elements,
      links: {},
      graphToElementSelector: (options) => defaultMapElementAttributesToData(options),
      graphToLinkSelector: (options) => defaultMapLinkAttributesToData(options),
      mapDataToElementAttributes: (options) => defaultMapDataToElementAttributes(options),
      mapDataToLinkAttributes: (options) => defaultMapDataToLinkAttributes(options),
    });

    // Get what the graph now thinks the element is
    const [graphElement] = graph.getElements();
    const id = graphElement.id as string;
    const graphElementData = defaultMapElementAttributesToData({
      cell: graphElement,
    });

    // Second sync with the actual graph state should return false
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

  it('should return false when graph has active batch', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const elements: Record<string, GraphElement> = {
      '1': { width: 100, height: 100, type: 'ReactElement' },
    };

    // Start a batch
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

    expect(result).toBe(false);
    expect(graph.getElements()).toHaveLength(0);

    // End batch
    graph.stopBatch('test');
  });

  it('should use isUpdateFromReact flag when syncing', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

    const elements: Record<string, GraphElement> = {
      '1': { width: 100, height: 100, type: 'ReactElement' },
    };

    // Spy on syncCells
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

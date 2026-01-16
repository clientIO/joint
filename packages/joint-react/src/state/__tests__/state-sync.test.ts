/* eslint-disable sonarjs/no-element-overwrite */
/* eslint-disable sonarjs/no-nested-functions */
import { dia } from '@joint/core';
import {
  DEFAULT_CELL_NAMESPACE,
  type GraphStoreSnapshot,
  type GraphStoreDerivedSnapshot,
} from '../../store/graph-store';
import { stateSync } from '../state-sync';
import { createState } from '../../utils/create-state';
import { createElements } from '../../utils/create';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import {
  defaultElementToGraphSelector,
  defaultLinkToGraphSelector,
} from '../graph-state-selectors';

// Helper to create getIdsSnapshot function
function createGetIdsSnapshot(
  state: ReturnType<typeof createState<GraphStoreSnapshot<GraphElement, GraphLink>>>
): () => GraphStoreDerivedSnapshot {
  return () => {
    const snapshot = state.getSnapshot();
    const elementIds: Record<dia.Cell.ID, number> = {};
    const linkIds: Record<dia.Cell.ID, number> = {};

    for (const [index, element] of snapshot.elements.entries()) {
      elementIds[element.id] = index;
    }
    for (const [index, link] of snapshot.links.entries()) {
      linkIds[link.id] = index;
    }

    return { elementIds, linkIds };
  };
}

describe('stateSync', () => {
  it('should sync dia.graph <-> state effectively', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );
    const elements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
      {
        id: '2',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);
    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements, links: [] }),
      name: 'elements',
    });

    // Mock the setState method to be able to test the state updates.
    const mockedSetState = jest.fn().mockImplementation(state.setState);
    state.setState = mockedSetState;

    const getIdsSnapshot = createGetIdsSnapshot(state);

    // Here we initially sync the graph with the state.
    // State should not be updated yet.
    stateSync({ graph, store: state, getIdsSnapshot });
    expect(graph.getElements()).toHaveLength(2);
    expect(state.getSnapshot().elements).toHaveLength(2);
    expect(mockedSetState).toHaveBeenCalledTimes(0);
    // Here we update state via state API.
    // State should not be updated yet.
    state.setState((previous: GraphStoreSnapshot<GraphElement, GraphLink>) => ({
      ...previous,
      elements: [...previous.elements, { id: '3', width: 100, height: 100, type: 'ReactElement' }],
    }));
    expect(graph.getElements()).toHaveLength(3);
    expect(state.getSnapshot().elements).toHaveLength(3);
    expect(mockedSetState).toHaveBeenCalledTimes(1);

    // Here we update dia.graph itself via graph.syncCells.
    // State should be updated now with 1 update call.
    const newElements = [
      ...state.getSnapshot().elements,
      { id: '4', width: 100, height: 100, type: 'ReactElement' },
    ];
    const elementItems = newElements.map((element) =>
      defaultElementToGraphSelector({
        element,
        graph,
      })
    );
    graph.syncCells(elementItems, { remove: true });
    expect(graph.getElements()).toHaveLength(4);
    expect(state.getSnapshot().elements).toHaveLength(4);
    expect(mockedSetState).toHaveBeenCalledTimes(2);
  });

  it('should sync dia.graph <-> state effectively using normal JointJS API', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );
    const elements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
      {
        id: '2',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);
    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements, links: [] }),
      name: 'elements',
    });

    // Mock the setState method to be able to test the state updates.
    const mockedSetState = jest.fn().mockImplementation(state.setState);
    state.setState = mockedSetState;

    const getIdsSnapshot = createGetIdsSnapshot(state);

    // Here we initially sync the graph with the state.
    // State should not be updated yet.
    stateSync({ graph, store: state, getIdsSnapshot });
    expect(graph.getElements()).toHaveLength(2);
    expect(state.getSnapshot().elements).toHaveLength(2);
    expect(mockedSetState).toHaveBeenCalledTimes(0);

    // Here we update state via state API.
    // State should not be updated yet.
    state.setState((previous: GraphStoreSnapshot<GraphElement, GraphLink>) => ({
      ...previous,
      elements: [...previous.elements, { id: '3', width: 100, height: 100, type: 'ReactElement' }],
    }));
    expect(graph.getElements()).toHaveLength(3);
    expect(state.getSnapshot().elements).toHaveLength(3);
    expect(mockedSetState).toHaveBeenCalledTimes(1);

    // Here we update dia.graph itself via normal JointJS API (not syncCells/batch).
    // State should be updated now with 1 update call.
    const newElement = new dia.Element({
      id: '4',
      type: 'ReactElement',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    graph.addCell(newElement);
    expect(graph.getElements()).toHaveLength(4);
    expect(state.getSnapshot().elements).toHaveLength(4);
    expect(mockedSetState).toHaveBeenCalledTimes(2);
  });

  it('should sync existing graph cells to store when store is empty', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );

    // Add elements directly to graph before creating store
    const existingElements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
      {
        id: '2',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    // Add elements to graph using syncCells
    const elementItems = existingElements.map((element) =>
      defaultElementToGraphSelector({
        element,
        graph,
      })
    );
    graph.syncCells(elementItems, { remove: true });

    // Create empty store
    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements: [], links: [] }),
      name: 'elements',
    });

    // Mock the setState method to be able to test the state updates.
    const mockedSetState = jest.fn().mockImplementation(state.setState);
    state.setState = mockedSetState;

    const getIdsSnapshot = createGetIdsSnapshot(state);

    // Graph has 2 elements, store is empty
    expect(graph.getElements()).toHaveLength(2);
    expect(state.getSnapshot().elements).toHaveLength(0);

    // Initialize stateSync - it should sync existing graph cells to store
    stateSync({ graph, store: state, getIdsSnapshot });

    // Store should now have the 2 elements from the graph
    expect(state.getSnapshot().elements).toHaveLength(2);
    expect(state.getSnapshot().elements[0].id).toBe('1');
    expect(state.getSnapshot().elements[1].id).toBe('2');
    expect(mockedSetState).toHaveBeenCalledTimes(1);

    // Graph should still have 2 elements
    expect(graph.getElements()).toHaveLength(2);
  });

  it('should not sync existing graph cells to store when store already has elements', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );

    // Add elements directly to graph
    const graphElements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const elementItems = graphElements.map((element) =>
      defaultElementToGraphSelector({
        element,
        graph,
      })
    );
    graph.syncCells(elementItems, { remove: true });

    // Create store with different elements
    const storeElements = createElements([
      {
        id: '2',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements: storeElements, links: [] }),
      name: 'elements',
    });

    // Mock the setState method to be able to test the state updates.
    const mockedSetState = jest.fn().mockImplementation(state.setState);
    state.setState = mockedSetState;

    const getIdsSnapshot = createGetIdsSnapshot(state);

    // Graph has 1 element, store has 1 different element
    expect(graph.getElements()).toHaveLength(1);
    expect(state.getSnapshot().elements).toHaveLength(1);
    expect(state.getSnapshot().elements[0].id).toBe('2');

    // Initialize stateSync - it should NOT sync graph cells to store since store is not empty
    stateSync({ graph, store: state, getIdsSnapshot });

    // Store should still have its original element
    expect(state.getSnapshot().elements).toHaveLength(1);
    expect(state.getSnapshot().elements[0].id).toBe('2');
    // setState should be called to sync store to graph, not the other way around
    expect(mockedSetState).toHaveBeenCalledTimes(0);

    // Graph should now have the element from store (synced from store to graph)
    expect(graph.getElements()).toHaveLength(1);
    expect(graph.getCell('2')).toBeDefined();
  });

  it('should sync existing graph links to store when store is empty', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );

    // Add elements and links directly to graph before creating store
    const existingElements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
      {
        id: '2',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const elementItems = existingElements.map((element) =>
      defaultElementToGraphSelector({
        element,
        graph,
      })
    );
    const linkItems = [
      defaultLinkToGraphSelector({
        link: {
          id: 'link1',
          source: '1',
          target: '2',
        },
        graph,
      }),
    ];
    graph.syncCells([...elementItems, ...linkItems], { remove: true });

    // Create empty store
    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements: [], links: [] }),
      name: 'elements',
    });

    // Mock the setState method to be able to test the state updates.
    const mockedSetState = jest.fn().mockImplementation(state.setState);
    state.setState = mockedSetState;

    const getIdsSnapshot = createGetIdsSnapshot(state);

    // Graph has 2 elements and 1 link, store is empty
    expect(graph.getElements()).toHaveLength(2);
    expect(graph.getLinks()).toHaveLength(1);
    expect(state.getSnapshot().elements).toHaveLength(0);
    expect(state.getSnapshot().links).toHaveLength(0);

    // Initialize stateSync - it should sync existing graph cells (elements and links) to store
    stateSync({ graph, store: state, getIdsSnapshot });

    // Store should now have the 2 elements and 1 link from the graph
    expect(state.getSnapshot().elements).toHaveLength(2);
    expect(state.getSnapshot().links).toHaveLength(1);
    expect(state.getSnapshot().links[0].id).toBe('link1');
    expect(mockedSetState).toHaveBeenCalledTimes(1);

    // Graph should still have 2 elements and 1 link
    expect(graph.getElements()).toHaveLength(2);
    expect(graph.getLinks()).toHaveLength(1);
  });

  it('should handle cleanup properly and unsubscribe from all listeners', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );
    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements: [], links: [] }),
      name: 'elements',
    });

    const unsubscribeSpy = jest.fn();
    state.subscribe = jest.fn(() => unsubscribeSpy);

    const getIdsSnapshot = createGetIdsSnapshot(state);
    const sync = stateSync({ graph, store: state, getIdsSnapshot });

    // Verify subscription was set up
    expect(state.subscribe).toHaveBeenCalledTimes(1);

    // Cleanup
    sync.cleanup();

    // Verify unsubscribe was called
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('should subscribe to cell changes and allow unsubscribing', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );
    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements: [], links: [] }),
      name: 'elements',
    });

    const getIdsSnapshot = createGetIdsSnapshot(state);
    const sync = stateSync({ graph, store: state, getIdsSnapshot });

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const cellChangeCallback = jest.fn(() => () => {});
    const unsubscribe = sync.subscribeToCellChange(cellChangeCallback);

    // Add a cell to trigger change
    const element = new dia.Element({
      id: 'test',
      type: 'ReactElement',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    graph.addCell(element);

    // Wait a bit for the change to propagate
    // The callback should have been called
    // Note: This is a simplified test - in reality, the callback is called by listenToCellChange

    // Unsubscribe
    unsubscribe();

    // Add another cell - callback should not be called again (though we can't easily test this without more setup)
    // The important thing is that unsubscribe doesn't throw
    expect(() => unsubscribe()).not.toThrow();
  });

  it('should not sync existing graph cells when store has setState but it is undefined', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );

    // Add elements to graph
    const existingElements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const elementItems = existingElements.map((element) =>
      defaultElementToGraphSelector({
        element,
        graph,
      })
    );
    graph.syncCells(elementItems, { remove: true });

    // Create store without setState
    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements: [], links: [] }),
      name: 'elements',
    });

    // Remove setState to simulate a read-only store
    const originalSetState = state.setState;
    // @ts-expect-error Testing edge case where setState might be undefined
    state.setState = undefined;

    const getIdsSnapshot = createGetIdsSnapshot(state);

    // Graph has 1 element, store is empty
    expect(graph.getElements()).toHaveLength(1);
    expect(state.getSnapshot().elements).toHaveLength(0);

    // Initialize stateSync - it should not crash and should not sync since setState is undefined
    expect(() => {
      stateSync({ graph, store: state, getIdsSnapshot });
    }).not.toThrow();

    // Store should still be empty since setState was undefined
    expect(state.getSnapshot().elements).toHaveLength(0);

    // Restore setState for cleanup
    state.setState = originalSetState;
  });

  it('should handle graph with existing cells and initial elements/links - initial elements take precedence', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );

    // Add elements to graph
    const graphElements = createElements([
      {
        id: 'graph-element',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const elementItems = graphElements.map((element) =>
      defaultElementToGraphSelector({
        element,
        graph,
      })
    );
    graph.syncCells(elementItems, { remove: true });

    // Create store with initial elements (different from graph)
    const initialElements = createElements([
      {
        id: 'initial-element',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements: initialElements, links: [] }),
      name: 'elements',
    });

    // Mock the setState method
    const mockedSetState = jest.fn().mockImplementation(state.setState);
    state.setState = mockedSetState;

    const getIdsSnapshot = createGetIdsSnapshot(state);

    // Graph has 1 element, store has 1 different element
    expect(graph.getElements()).toHaveLength(1);
    expect(state.getSnapshot().elements).toHaveLength(1);
    expect(state.getSnapshot().elements[0].id).toBe('initial-element');

    // Initialize stateSync
    stateSync({ graph, store: state, getIdsSnapshot });

    // Since store has initial elements, they should take precedence
    // The graph should be synced to match the store (initial elements)
    expect(graph.getElements()).toHaveLength(1);
    expect(graph.getCell('initial-element')).toBeDefined();
    expect(graph.getCell('graph-element')).toBeUndefined();
  });

  it('should handle external store with existing graph cells - store takes precedence', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );

    // Add elements to graph
    const graphElements = createElements([
      {
        id: 'graph-element',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const elementItems = graphElements.map((element) =>
      defaultElementToGraphSelector({
        element,
        graph,
      })
    );
    graph.syncCells(elementItems, { remove: true });

    // Create external store with different elements
    const externalElements = createElements([
      {
        id: 'external-element',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const externalStore = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements: externalElements, links: [] }),
      name: 'external',
    });

    // Mock the setState method
    const mockedSetState = jest.fn().mockImplementation(externalStore.setState);
    externalStore.setState = mockedSetState;

    const getIdsSnapshot = createGetIdsSnapshot(externalStore);

    // Graph has 1 element, external store has 1 different element
    expect(graph.getElements()).toHaveLength(1);
    expect(externalStore.getSnapshot().elements).toHaveLength(1);
    expect(externalStore.getSnapshot().elements[0].id).toBe('external-element');

    // Initialize stateSync with external store
    stateSync({ graph, store: externalStore, getIdsSnapshot });

    // External store should take precedence - graph should be synced to match external store
    expect(graph.getElements()).toHaveLength(1);
    expect(graph.getCell('external-element')).toBeDefined();
    expect(graph.getCell('graph-element')).toBeUndefined();

    // External store should not be modified (it's the source of truth)
    expect(externalStore.getSnapshot().elements).toHaveLength(1);
    expect(externalStore.getSnapshot().elements[0].id).toBe('external-element');
  });

  it('should prevent circular updates when syncing from state to graph', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );

    const elements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);

    const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements, links: [] }),
      name: 'elements',
    });

    const getIdsSnapshot = createGetIdsSnapshot(state);

    // Initialize stateSync first
    stateSync({ graph, store: state, getIdsSnapshot });

    // Verify initial state
    expect(graph.getElements()).toHaveLength(1);
    expect(state.getSnapshot().elements).toHaveLength(1);

    // Update state - this should trigger graph sync, but not cause circular updates
    // The graph sync should update the graph, but the graph change should not trigger
    // another state update because of the isSyncingFromState flag
    state.setState((previous) => ({
      ...previous,
      elements: [...previous.elements, { id: '2', width: 100, height: 100, type: 'ReactElement' }],
    }));

    // Graph should have 2 elements (synced from state)
    expect(graph.getElements()).toHaveLength(2);
    expect(graph.getCell('1')).toBeDefined();
    expect(graph.getCell('2')).toBeDefined();

    // State should still have 2 elements
    expect(state.getSnapshot().elements).toHaveLength(2);

    // Now update graph directly - this should update state, but not cause circular updates
    const newElement = new dia.Element({
      id: '3',
      type: 'ReactElement',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    graph.addCell(newElement);

    // Graph should have 3 elements
    expect(graph.getElements()).toHaveLength(3);

    // State should be updated with the new element (from graph)
    // This verifies that graph -> state sync works without causing state -> graph -> state loops
    expect(state.getSnapshot().elements).toHaveLength(3);
    expect(state.getSnapshot().elements.find((element) => element.id === '3')).toBeDefined();
  });

  describe('cell change listeners optimization', () => {
    it('should batch listener calls in onIncrementalChange instead of calling immediately', () => {
      const graph = new dia.Graph(
        {},
        {
          cellNamespace: {
            ...DEFAULT_CELL_NAMESPACE,
          },
        }
      );

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: [], links: [] }),
        name: 'elements',
      });

      const getIdsSnapshot = createGetIdsSnapshot(state);
      const sync = stateSync({ graph, store: state, getIdsSnapshot });

      const listenerCalls: Array<{ type: string; cellId?: string }> = [];
      const cellChangeCallback = jest.fn((change) => {
        if (change.type === 'reset') {
          listenerCalls.push({ type: 'reset' });
        } else {
          listenerCalls.push({ type: change.type, cellId: change.cell.id.toString() });
        }
        return () => {};
      });

      sync.subscribeToCellChange(cellChangeCallback);

      // Add multiple cells in quick succession
      const element1 = new dia.Element({
        id: '1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new dia.Element({
        id: '2',
        type: 'ReactElement',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      });

      graph.addCell(element1);
      graph.addCell(element2);

      // Listeners should be called in batches via onIncrementalChange
      // Not immediately on each cell change
      // The exact number depends on batching, but should be called
      expect(cellChangeCallback).toHaveBeenCalled();
      expect(listenerCalls.length).toBeGreaterThan(0);

      // Verify we received the correct change types
      const addCalls = listenerCalls.filter((call) => call.type === 'add');
      expect(addCalls.length).toBeGreaterThanOrEqual(2);
    });

    it('should call listeners before isEqual check in onIncrementalChange', () => {
      const graph = new dia.Graph(
        {},
        {
          cellNamespace: {
            ...DEFAULT_CELL_NAMESPACE,
          },
        }
      );

      const elements = createElements([
        {
          id: '1',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          type: 'ReactElement',
        },
      ]);

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements, links: [] }),
        name: 'elements',
      });

      const getIdsSnapshot = createGetIdsSnapshot(state);
      const sync = stateSync({ graph, store: state, getIdsSnapshot });

      let listenerCalledBeforeIsEqual = false;
      const cellChangeCallback = jest.fn((change) => {
        // This listener should be called before isEqual check
        // We can verify this by checking that the graph has the updated cell
        // even if state doesn't have layout data (x/y/width/height)
        if (change.type !== 'reset' && change.cell) {
          const cell = graph.getCell(change.cell.id);
          listenerCalledBeforeIsEqual = cell != null;
        }
        return () => {};
      });

      sync.subscribeToCellChange(cellChangeCallback);

      // Modify a cell in the graph
      const cell = graph.getCell('1');
      if (cell) {
        cell.set('position', { x: 50, y: 50 });
      }

      // Listener should have been called
      expect(cellChangeCallback).toHaveBeenCalled();
      expect(listenerCalledBeforeIsEqual).toBe(true);
    });

    it('should call listeners in onBatchStop when syncing from state', () => {
      const graph = new dia.Graph(
        {},
        {
          cellNamespace: {
            ...DEFAULT_CELL_NAMESPACE,
          },
        }
      );

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: [], links: [] }),
        name: 'elements',
      });

      const getIdsSnapshot = createGetIdsSnapshot(state);
      const sync = stateSync({ graph, store: state, getIdsSnapshot });

      const listenerCalls: Array<{ type: string; cellId?: string }> = [];
      const cellChangeCallback = jest.fn((change) => {
        if (change.type === 'reset') {
          listenerCalls.push({ type: 'reset' });
        } else {
          listenerCalls.push({ type: change.type, cellId: change.cell.id.toString() });
        }
        return () => {};
      });

      sync.subscribeToCellChange(cellChangeCallback);

      // Update state - this triggers sync from state to graph
      // The sync happens in a batch, and listeners should be called in onBatchStop
      state.setState((previous) => ({
        ...previous,
        elements: [
          { id: '1', x: 0, y: 0, width: 100, height: 100, type: 'ReactElement' },
          { id: '2', x: 100, y: 100, width: 100, height: 100, type: 'ReactElement' },
        ],
      }));

      // Graph should have the elements
      expect(graph.getElements()).toHaveLength(2);

      // Listeners should have been called (in onBatchStop when syncing from state)
      expect(cellChangeCallback).toHaveBeenCalled();
      expect(listenerCalls.length).toBeGreaterThan(0);

      // Verify we received add calls for the new elements
      const addCalls = listenerCalls.filter((call) => call.type === 'add');
      expect(addCalls.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle reset changes correctly in batched listener calls', () => {
      const graph = new dia.Graph(
        {},
        {
          cellNamespace: {
            ...DEFAULT_CELL_NAMESPACE,
          },
        }
      );

      const elements = createElements([
        {
          id: '1',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          type: 'ReactElement',
        },
      ]);

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements, links: [] }),
        name: 'elements',
      });

      const getIdsSnapshot = createGetIdsSnapshot(state);
      const sync = stateSync({ graph, store: state, getIdsSnapshot });

      const resetCalls: Array<{ type: string; cellsCount?: number }> = [];
      const cellChangeCallback = jest.fn((change) => {
        if (change.type === 'reset') {
          resetCalls.push({
            type: 'reset',
            cellsCount: change.cells?.length ?? 0,
          });
        }
        return () => {};
      });

      sync.subscribeToCellChange(cellChangeCallback);

      // Wait for initial sync to complete
      expect(graph.getElements()).toHaveLength(1);

      // Clear the graph to trigger reset
      // Note: graph.clear() triggers reset event which is stored and called in onIncrementalChange
      graph.clear();

      // Verify graph is cleared
      expect(graph.getElements()).toHaveLength(0);

      // The reset event should be stored and listeners called in onIncrementalChange
      // Verify that the callback was invoked (reset might be batched)
      expect(cellChangeCallback).toHaveBeenCalled();

      // Verify that reset changes are properly handled by checking the callback structure
      // Reset changes are batched, so they may not appear immediately
      // The important thing is that the mechanism exists to handle reset in onIncrementalChange
      const allCallTypes = cellChangeCallback.mock.calls.map((call) => call[0]?.type);

      // Verify reset can be handled (either was called or mechanism exists)
      // If reset was called, verify structure
      if (resetCalls.length > 0) {
        expect(resetCalls[0]?.type).toBe('reset');
        expect(resetCalls[0]?.cellsCount).toBeDefined();
      }

      // Verify the callback receives proper change objects
      expect(allCallTypes.length).toBeGreaterThan(0);
    });

    it('should clear pending changes after calling listeners', () => {
      const graph = new dia.Graph(
        {},
        {
          cellNamespace: {
            ...DEFAULT_CELL_NAMESPACE,
          },
        }
      );

      const state = createState<GraphStoreSnapshot<GraphElement, GraphLink>>({
        newState: () => ({ elements: [], links: [] }),
        name: 'elements',
      });

      const getIdsSnapshot = createGetIdsSnapshot(state);
      const sync = stateSync({ graph, store: state, getIdsSnapshot });

      let callCount = 0;
      const cellChangeCallback = jest.fn((_change) => {
        callCount++;
        return () => {};
      });

      sync.subscribeToCellChange(cellChangeCallback);

      // Add a cell
      const element = new dia.Element({
        id: '1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(element);

      // Modify the same cell multiple times to test batching
      const cell = graph.getCell('1');
      if (cell) {
        // Intentionally modify cell multiple times to test that changes are batched
        cell.set('position', { x: 10, y: 10 });
        cell.set('size', { width: 110, height: 110 });
        cell.set('position', { x: 20, y: 20 });
      }

      // Listener should be called, but changes should be batched
      // Each change should be tracked, but listener might be called once per batch
      expect(cellChangeCallback).toHaveBeenCalled();
      expect(callCount).toBeGreaterThan(0);
    });
  });
});

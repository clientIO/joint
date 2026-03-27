/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import {
  GraphProvider,
  useElementSize,
  type FlatElementData,
  type FlatLinkData,
  Paper,
  type IncrementalContainerChanges,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useState, useEffect, useCallback } from 'react';
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Provider, useSelector, useStore } from 'react-redux';
import undoable, { ActionCreators } from 'redux-undo';

/**
 * ============================================================================
 * REDUX INTEGRATION GUIDE
 * ============================================================================
 *
 * This example demonstrates how to integrate `@joint/react` with Redux for
 * state management. Using Redux provides:
 *
 * 1. **Centralized State Management**: All graph state lives in your Redux store.
 * 2. **Time-Travel Debugging**: Redux DevTools for inspecting and replaying state.
 * 3. **Predictable Updates**: All state changes go through Redux actions.
 * 4. **Undo/Redo**: Easy undo/redo using redux-undo library.
 *
 * ============================================================================
 * KEY CONCEPT: onIncrementalChange callback
 * ============================================================================
 *
 * We use the `onIncrementalChange` callback on GraphProvider to receive granular
 * change notifications (added/changed/removed elements and links) from the
 * graph. This is ideal for Redux because we can dispatch specific actions
 * based on incremental change type, rather than replacing the entire state.
 *
 * ============================================================================
 */

// ============================================================================
// STEP 1: Define the Graph State Shape
// ============================================================================

/**
 * The shape of our graph state in Redux.
 * Contains elements and links records.
 * History is managed automatically by redux-undo.
 */
/**
 * Custom element data with a label property.
 */
type ElementData = { label: string };

type CustomElement = FlatElementData<ElementData>;

interface GraphState {
  /** Record of all elements (nodes) in the graph keyed by ID */
  readonly elements: Record<string, CustomElement>;
  /** Record of all links (edges) in the graph keyed by ID */
  readonly links: Record<string, FlatLinkData>;
}

// ============================================================================
// STEP 2: Create Redux Slice with Actions
// ============================================================================

/**
 * Initial elements for the graph.
 */
const defaultElements: Record<string, CustomElement> = {
  '1': { data: { label: 'Hello' }, x: 100, y: 15, width: 100, height: 50 },
  '2': { data: { label: 'World' }, x: 100, y: 200, width: 100, height: 50 },
};

/**
 * Initial links for the graph.
 */
const defaultLinks: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

/**
 * Redux slice for managing graph state.
 * The `applyIncrementalChanges` action handles granular updates from `onIncrementalChange`.
 * Undo/redo functionality is handled automatically by redux-undo wrapper.
 */
const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    elements: defaultElements,
    links: defaultLinks,
  } satisfies GraphState as GraphState,
  reducers: {
    /**
     * Adds a new element to the graph.
     */
    addElement: (state, action: PayloadAction<{ id: string } & CustomElement>) => {
      const { id, ...element } = action.payload;
      state.elements[id] = element;
    },
    /**
     * Removes the last element from the graph.
     * Also removes all links connected to that element.
     */
    removeLastElement: (state) => {
      const elementIds = Object.keys(state.elements);
      if (elementIds.length === 0) {
        return;
      }
      const removedElementId = elementIds.at(-1);
      if (!removedElementId) {
        return;
      }
      delete state.elements[removedElementId];
      if (removedElementId) {
        for (const [id, link] of Object.entries(state.links)) {
          if (link.source === removedElementId || link.target === removedElementId) {
            delete state.links[id];
          }
        }
      }
    },
    /**
     * Applies granular incremental changes from the graph's onIncrementalChange callback.
     * This handles add/change/remove/reset for both elements and links.
     */
    applyIncrementalChanges: (
      state,
      action: PayloadAction<IncrementalContainerChanges<CustomElement, FlatLinkData>>
    ) => {
      const { elements, links } = action.payload;

      // Handle element incremental changes
      for (const [id, data] of elements.added) {
        state.elements[id] = data as CustomElement;
      }
      for (const [id, data] of elements.changed) {
        state.elements[id] = data as CustomElement;
      }
      for (const id of elements.removed) {
        delete state.elements[id];
      }

      // Handle link incremental changes
      for (const [id, data] of links.added) {
        state.links[id] = data as FlatLinkData;
      }
      for (const [id, data] of links.changed) {
        state.links[id] = data as FlatLinkData;
      }
      for (const id of links.removed) {
        delete state.links[id];
      }
    },
  },
});

// Export actions for use in components
export const { addElement, removeLastElement, applyIncrementalChanges } = graphSlice.actions;

// Export undo/redo actions from redux-undo
export const undo = () => ActionCreators.undo();
export const redo = () => ActionCreators.redo();

// ============================================================================
// STEP 3: Create Redux Store
// ============================================================================

/**
 * Creates a Redux store configured for the graph.
 * The graph reducer is wrapped with redux-undo for undo/redo support.
 */
const store = configureStore({
  reducer: {
    graph: undoable(graphSlice.reducer, {
      limit: 50,
    }),
  },
  devTools: true,
});

// Infer the store type for TypeScript
type ReduxStore = typeof store;
type GraphRootState = ReturnType<ReduxStore['getState']>;

/**
 * Type for the undoable state structure created by redux-undo.
 */
type UndoableGraphState = {
  past: readonly GraphState[];
  present: GraphState;
  future: readonly GraphState[];
};

// ============================================================================
// STEP 4: Selectors
// ============================================================================

const selectElements = (state: GraphRootState) =>
  (state.graph as UndoableGraphState).present.elements;

const selectLinks = (state: GraphRootState) => (state.graph as UndoableGraphState).present.links;

// ============================================================================
// STEP 5: Component Implementation
// ============================================================================

/**
 * Custom render function for graph elements.
 */
function RenderItem({ label }: Readonly<ElementData>) {
  const { width, height } = useElementSize();
  return (
    <foreignObject width={width} height={height}>
      <div className="node">{label}</div>
    </foreignObject>
  );
}

/**
 * Inner component that reads elements/links from Redux and passes them
 * to GraphProvider with onIncrementalChange callback.
 * This must be inside a Redux Provider to access the store.
 */
function GraphWithRedux() {
  const elements = useSelector(selectElements);
  const links = useSelector(selectLinks);
  const reduxStore = useStore<GraphRootState>();
  const { dispatch } = reduxStore;

  // onIncrementalChange receives granular change info (added/changed/removed/reset)
  // and dispatches a single Redux action with the full incremental change payload.
  const handleIncrementalChange = useCallback(
    (changes: IncrementalContainerChanges<CustomElement, FlatLinkData>) => {
      dispatch(applyIncrementalChanges(changes));
    },
    [dispatch]
  );

  return (
    <GraphProvider<ElementData>
      elements={elements}
      links={links}
      enableBatchUpdates
      onIncrementalChange={handleIncrementalChange}
    >
      <ReduxConnectedPaperApp />
    </GraphProvider>
  );
}

/**
 * Container component that wraps everything with Redux Provider.
 */
function Main() {
  return (
    <Provider store={store}>
      <GraphWithRedux />
    </Provider>
  );
}

/**
 * PaperApp component connected to Redux.
 * Uses Redux hooks to dispatch actions and read state.
 */
function ReduxConnectedPaperApp() {
  const reduxStore = useStore<GraphRootState>();
  const { dispatch } = reduxStore;

  const [canUndo, setCanUndo] = useState(
    () => (reduxStore.getState().graph as UndoableGraphState).past.length > 0
  );
  const [canRedo, setCanRedo] = useState(
    () => (reduxStore.getState().graph as UndoableGraphState).future.length > 0
  );

  useEffect(() => {
    const updateState = () => {
      const currentState = reduxStore.getState();
      const graphState = currentState.graph as UndoableGraphState;
      const newCanUndo = graphState.past.length > 0;
      const newCanRedo = graphState.future.length > 0;
      setCanUndo((previous) => {
        if (previous === newCanUndo) {
          return previous;
        }
        return newCanUndo;
      });
      setCanRedo((previous) => {
        if (previous === newCanRedo) {
          return previous;
        }
        return newCanRedo;
      });
    };

    const unsubscribe = reduxStore.subscribe(updateState);
    updateState();
    return unsubscribe;
  }, [reduxStore]);

  return (
    <div className="flex flex-col gap-4">
      <Paper className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            const newId = Math.random().toString(36).slice(7);
            const newElement: CustomElement = {
              data: { label: 'New Node' },
              x: Math.random() * 200,
              y: Math.random() * 200,
              width: 100,
              height: 50,
            };
            dispatch(addElement({ id: newId, ...newElement }));
          }}
        >
          Add Element
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-medium transition-colors"
          onClick={() => {
            dispatch(removeLastElement());
          }}
        >
          Remove Last
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-medium transition-colors"
          disabled={!canUndo}
          onClick={() => {
            dispatch(undo());
          }}
        >
          Undo
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-medium transition-colors"
          disabled={!canRedo}
          onClick={() => {
            dispatch(redo());
          }}
        >
          Redo
        </button>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * USAGE SUMMARY
 * ============================================================================
 *
 * To use Redux with `@joint/react`:
 *
 * 1. Create a Redux slice for your graph state (elements and links)
 * 2. Add an `applyIncrementalChanges` action to handle granular graph changes
 * 3. Wrap your app with Redux Provider
 * 4. Use `useSelector` to read elements/links from Redux
 * 5. Pass elements/links as props with `onIncrementalChange` callback
 * 6. Dispatch Redux actions to update the graph state
 *
 * Benefits:
 * - All graph state is in Redux, making it easy to integrate with other features
 * - Redux DevTools for debugging and time-travel
 * - Granular incremental changes via `onIncrementalChange` (added/changed/removed)
 * - Easy undo/redo using redux-undo library
 * - Easy to add middleware (persistence, etc.)
 *
 * ============================================================================
 */

export default function App() {
  return <Main />;
}

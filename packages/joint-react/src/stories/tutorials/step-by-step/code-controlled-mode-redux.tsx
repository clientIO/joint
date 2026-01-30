/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import {
  GraphProvider,
  type GraphProps,
  type GraphElement,
  type GraphLink,
  Paper,
  type ExternalGraphStore,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useMemo, useState, useEffect } from 'react';
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Provider, useStore } from 'react-redux';
import undoable, { ActionCreators } from 'redux-undo';
import type { GraphStoreSnapshot } from '../../../store/graph-store';
import type { Update } from '../../../utils/create-state';

/**
 * ============================================================================
 * REDUX INTEGRATION GUIDE
 * ============================================================================
 *
 * This example demonstrates how to integrate @joint/react with Redux for
 * state management. Using Redux (or any external state management library)
 * provides several advantages over React-controlled mode:
 *
 * 1. **Centralized State Management**: All graph state lives in your Redux store,
 *    making it easier to integrate with other parts of your application.
 *
 * 2. **Time-Travel Debugging**: Redux DevTools allows you to inspect and replay
 *    state changes, making debugging much easier.
 *
 * 3. **Predictable Updates**: All state changes go through Redux actions, making
 *    the data flow explicit and traceable.
 *
 * 4. **Better Performance**: Redux's selector system allows fine-grained subscriptions,
 *    reducing unnecessary re-renders.
 *
 * 5. **Integration with Other Features**: Easy to add middleware for persistence,
 *    undo/redo, or other cross-cutting concerns.
 *
 * ============================================================================
 * KEY CONCEPT: ExternalGraphStore Interface
 * ============================================================================
 *
 * Instead of using React state (useState) with onElementsChange/onLinksChange,
 * we use the ExternalGraphStore interface. This interface is compatible with
 * any state management library that implements:
 *
 * - getSnapshot(): Returns the current state snapshot
 * - subscribe(listener): Subscribes to state changes
 * - setState(updater): Updates the state (can accept a function or direct value)
 *
 * The reduxAdapter function below converts a Redux store to this interface,
 * allowing seamless integration with GraphProvider.
 *
 * ============================================================================
 */

// ============================================================================
// STEP 1: Define the Graph State Shape
// ============================================================================

/**
 * The shape of our graph state in Redux.
 * This matches GraphStoreSnapshot, which contains elements and links.
 * History is managed automatically by redux-undo, so we don't need to include it here.
 */
interface GraphState {
  /** Record of all elements (nodes) in the graph keyed by ID */
  readonly elements: Record<string, GraphElement>;
  /** Record of all links (edges) in the graph keyed by ID */
  readonly links: Record<string, GraphLink>;
}

// ============================================================================
// STEP 2: Create Redux Slice with Actions
// ============================================================================

/**
 * Custom element type with a label property.
 */
type CustomElement = GraphElement & { label: string };

/**
 * Initial elements for the graph.
 */
const defaultElements: Record<string, CustomElement> = {
  '1': { label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  '2': { label: 'World', x: 100, y: 200, width: 100, height: 50 },
};

/**
 * Initial links for the graph.
 */
const defaultLinks: Record<string, GraphLink> = {
  'e1-2': {
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
};

/**
 * Redux slice for managing graph state.
 * This slice defines actions for adding, removing, and updating elements and links.
 * Undo/redo functionality is handled automatically by redux-undo wrapper.
 */
const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    elements: defaultElements as Record<string, GraphElement>,
    links: defaultLinks as Record<string, GraphLink>,
  } satisfies GraphState,
  reducers: {
    /**
     * Adds a new element to the graph.
     * The element must include an 'id' property that will be used as the key.
     */
    addElement: (state, action: PayloadAction<{ id: string } & GraphElement>) => {
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
      // Remove the last element
      const removedElementId = elementIds.at(-1);
      if (!removedElementId) {
        return;
      }
      delete state.elements[removedElementId];
      // Remove all links connected to the removed element
      if (removedElementId) {
        for (const [id, link] of Object.entries(state.links)) {
          if (link.source === removedElementId || link.target === removedElementId) {
            delete state.links[id];
          }
        }
      }
    },
    /**
     * Updates both elements and links atomically.
     * Used by the reduxAdapter when GraphStore syncs changes.
     */
    setGraphState: (state, action: PayloadAction<GraphStoreSnapshot>) => {
      state.elements = action.payload.elements;
      state.links = action.payload.links;
    },
  },
});

// Export actions for use in components
export const { addElement, removeLastElement, setGraphState } = graphSlice.actions;

// Export undo/redo actions from redux-undo
// These will be used to undo/redo state changes
export const undo = () => ActionCreators.undo();
export const redo = () => ActionCreators.redo();

// ============================================================================
// STEP 3: Create Redux Store
// ============================================================================

/**
 * Creates a Redux store configured for the graph.
 * In a real application, you might combine this with other slices.
 * The store is created at module level and provided via Redux Provider.
 *
 * The graph reducer is wrapped with redux-undo's undoable() function,
 * which automatically handles undo/redo functionality.
 */
const store = configureStore({
  reducer: {
    // Wrap the graph reducer with undoable to enable undo/redo
    // redux-undo automatically tracks history and provides undo/redo actions
    graph: undoable(graphSlice.reducer, {
      // Limit history to prevent memory issues (optional)
      limit: 50,
    }),
  },
  // Enable Redux DevTools for debugging
  devTools: true,
});

// Infer the store type for TypeScript
type GraphStore = typeof store;
type GraphRootState = ReturnType<GraphStore['getState']>;

/**
 * Type for the undoable state structure created by redux-undo.
 * redux-undo wraps the state in a structure with past, present, and future arrays.
 */
type UndoableGraphState = {
  past: readonly GraphState[];
  present: GraphState;
  future: readonly GraphState[];
};

// ============================================================================
// STEP 4: Create Redux Adapter Hook
// ============================================================================

/**
 * Hook that creates an ExternalGraphStore adapter from the Redux store.
 *
 * This adapter is the bridge between Redux and @joint/react's GraphProvider.
 * It uses the Redux store from context (via useStore hook) and adapts it to
 * the ExternalStoreLike interface, which allows GraphStore to:
 * - Read the current state (getSnapshot)
 * - Subscribe to state changes (subscribe)
 * - Update the state (setState)
 *
 * The adapter automatically reads from the Redux store context, so no parameters
 * are needed. Just call this hook inside a component wrapped with Redux Provider.
 * @returns An ExternalGraphStore compatible with GraphProvider
 * @example
 * ```tsx
 * <Provider store={store}>
 *   <GraphProvider externalStore={useReduxAdapter()}>
 *     <Paper />
 *   </GraphProvider>
 * </Provider>
 * ```
 */
function useReduxAdapter(): ExternalGraphStore {
  const reduxStore = useStore<GraphRootState>();

  return useMemo(() => {
    return {
      /**
       * Returns the current snapshot of the graph state.
       * GraphStore calls this to read the current elements and links.
       */
      getSnapshot: (): GraphStoreSnapshot => {
        const state = reduxStore.getState();
        // redux-undo wraps the state in a { past, present, future } structure
        // We need to access the 'present' property to get the current state
        const graphState = (state.graph as UndoableGraphState).present;
        return {
          elements: graphState.elements,
          links: graphState.links,
        };
      },

      /**
       * Subscribes to Redux store changes.
       * When the Redux state changes, the listener is called, which notifies
       * GraphStore to re-read the state and sync with JointJS.
       * @param listener - Callback function to call when state changes
       * @returns Unsubscribe function to remove the listener
       */
      subscribe: (listener: () => void) => {
        let previousState = (reduxStore.getState().graph as UndoableGraphState).present;

        // Subscribe to Redux store changes
        const unsubscribe = reduxStore.subscribe(() => {
          const currentState = (reduxStore.getState().graph as UndoableGraphState).present;

          // Only notify if the graph state actually changed
          // This prevents unnecessary re-renders when other parts of Redux state change
          if (currentState !== previousState) {
            previousState = currentState;
            listener();
          }
        });

        return unsubscribe;
      },

      /**
       * Updates the Redux store state.
       * GraphStore calls this when JointJS graph changes (e.g., user drags a node).
       *
       * The updater can be:
       * - A direct value: { elements: [...], links: [...] }
       * - A function: (previous) => ({ elements: [...], links: [...] })
       * @param updater - The new state or a function to compute new state
       */
      setState: (updater: Update<GraphStoreSnapshot>) => {
        const currentState = (reduxStore.getState().graph as UndoableGraphState).present;
        const currentSnapshot: GraphStoreSnapshot = {
          elements: currentState.elements,
          links: currentState.links,
        };

        // Handle both function and direct value updaters
        const newSnapshot = typeof updater === 'function' ? updater(currentSnapshot) : updater;

        // Dispatch Redux action to update the state atomically
        // We use setGraphState to update both elements and links in a single action
        // redux-undo automatically saves this to history
        reduxStore.dispatch(setGraphState(newSnapshot));
      },
    };
  }, [reduxStore]);
}

// ============================================================================
// STEP 5: Component Implementation
// ============================================================================

/**
 * Custom render function for graph elements.
 * This defines how each element is rendered in the SVG.
 */
function RenderItem(props: CustomElement) {
  const { label, width, height } = props;
  return (
    <foreignObject width={width} height={height}>
      <div className="node">{label}</div>
    </foreignObject>
  );
}

/**
 * Inner component that uses the Redux adapter hook.
 * This must be inside a Redux Provider to access the store.
 */
function GraphWithRedux(props: Readonly<GraphProps>) {
  // Get the adapter from Redux store context
  // This hook automatically reads from the Redux Provider
  const externalStore = useReduxAdapter();

  return (
    <GraphProvider {...props} externalStore={externalStore}>
      <ReduxConnectedPaperApp />
    </GraphProvider>
  );
}

/**
 * Container component that wraps everything with Redux Provider.
 *
 * This component:
 * 1. Wraps the app with Redux Provider (using the store created at module level)
 * 2. The inner component uses useReduxAdapter to get the ExternalGraphStore
 * 3. Passes the external store to GraphProvider
 */
function Main(props: Readonly<GraphProps>) {
  return (
    <Provider store={store}>
      <GraphWithRedux {...props} />
    </Provider>
  );
}

/**
 * PaperApp component connected to Redux.
 * This component uses Redux hooks to dispatch actions and read state.
 * Undo/redo is handled entirely through Redux actions.
 */
function ReduxConnectedPaperApp() {
  const reduxStore = useStore<GraphRootState>();
  const { dispatch } = reduxStore;

  // Subscribe to Redux state changes to update undo/redo availability
  // In a real app, you'd use react-redux's useSelector:
  // const canUndo = useSelector((state) => (state.graph as UndoableGraphState).past.length > 0);
  // const canRedo = useSelector((state) => (state.graph as UndoableGraphState).future.length > 0);
  // redux-undo provides past and future arrays in the state
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
      // Update state only if values changed
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

    // Subscribe to store changes
    const unsubscribe = reduxStore.subscribe(updateState);

    // Update state on mount
    updateState();

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [reduxStore]);
  return (
    <div className="flex flex-col gap-4">
      <Paper width="100%" className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      {/* Dark-themed controls */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Dispatch Redux action to add a new element
            // redux-undo automatically saves the current state to history
            const newId = Math.random().toString(36).slice(7);
            const newElement: CustomElement = {
              label: 'New Node',
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
            // Dispatch Redux action to remove the last element
            // redux-undo automatically saves the current state to history
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
            // Dispatch Redux action to undo the last change
            // redux-undo automatically restores the previous state from history
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
            // Dispatch Redux action to redo the last undone change
            // redux-undo automatically restores the next state from future history
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
 * To use Redux with @joint/react:
 *
 * 1. Create a Redux slice for your graph state (elements and links)
 * 2. Create a Redux store with your slice (at module level or app root)
 * 3. Wrap your app with Redux Provider
 * 4. Use useReduxAdapter() hook to get ExternalGraphStore (no parameters needed!)
 * 5. Pass the externalStore to GraphProvider
 * 6. Dispatch Redux actions to update the graph state
 *
 * Benefits:
 * - All graph state is in Redux, making it easy to integrate with other features
 * - Redux DevTools for debugging and time-travel
 * - Predictable state updates through actions
 * - Simple adapter hook - just call useReduxAdapter() with no parameters
 * - Easy undo/redo using redux-undo library - just wrap your reducer!
 * - Easy to add middleware (persistence, etc.)
 *
 * ============================================================================
 */

export default function App(props: Readonly<GraphProps>) {
  return <Main {...props} />;
}

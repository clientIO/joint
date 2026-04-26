/* eslint-disable @eslint-react/hooks-extra/no-direct-set-state-in-use-effect */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import {
  GraphProvider,
  HTMLHost,
  Paper,
  useElement,
  type CellId,
  type CellRecord,
  type Cells,
  type ElementRecord,
  type IncrementalCellsChange,
  type LinkRecord,
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
 * KEY CONCEPT: onIncrementalCellsChange callback
 * ============================================================================
 *
 * We use the `onIncrementalCellsChange` callback on GraphProvider to receive
 * granular change notifications (added/changed/removed cells) from the graph.
 * This is ideal for Redux because we can dispatch one action that applies the
 * incremental change set, rather than replacing the entire state.
 *
 * ============================================================================
 */

// ============================================================================
// STEP 1: Define the Graph State Shape
// ============================================================================

/**
 * Custom element data with a label property.
 */
type ElementData = { label: string };

/**
 * Our Redux graph state stores a single unified cells array — elements and
 * links live side by side, distinguished by the `type` field.
 * History is managed automatically by redux-undo.
 */
interface GraphState {
  readonly cells: Cells<ElementData>;
}

// ============================================================================
// STEP 2: Create Redux Slice with Actions
// ============================================================================

const defaultCells: Cells<ElementData> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Hello' },
    position: { x: 100, y: 15 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'World' },
    position: { x: 100, y: 200 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
];

/**
 * Redux slice for managing graph state.
 * The `applyIncrementalCellsChange` action handles granular updates from
 * `onIncrementalCellsChange`. Undo/redo functionality is handled by the
 * redux-undo wrapper.
 */
const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    cells: defaultCells,
  } satisfies GraphState as GraphState,
  reducers: {
    /**
     * Adds a new element to the graph.
     */
    addElement: (state, action: PayloadAction<ElementRecord<ElementData>>) => {
      state.cells = [...state.cells, action.payload];
    },
    /**
     * Removes the last element from the graph, and any links that touched it.
     */
    removeLastElement: (state) => {
      let removedElementIndex = -1;
      for (let index = state.cells.length - 1; index >= 0; index--) {
        if (state.cells[index].type === 'element') {
          removedElementIndex = index;
          break;
        }
      }
      if (removedElementIndex === -1) return;

      const removedElementId = state.cells[removedElementIndex].id;
      state.cells = state.cells.filter((cell, index) => {
        if (index === removedElementIndex) return false;
        if (cell.type === 'link') {
          const link = cell as LinkRecord;
          if (link.source?.id === removedElementId || link.target?.id === removedElementId) {
            return false;
          }
        }
        return true;
      });
    },
    /**
     * Applies granular incremental changes from the graph's
     * `onIncrementalCellsChange` callback. Handles add/change/remove for
     * any cell type.
     */
    applyIncrementalCellsChange: (
      state,
      action: PayloadAction<IncrementalCellsChange<ElementData>>
    ) => {
      const { added, changed, removed } = action.payload;

      const byId = new Map<CellId, CellRecord<ElementData>>();
      for (const cell of state.cells) {
        byId.set(cell.id, cell as CellRecord<ElementData>);
      }

      for (const [id, cell] of added) {
        byId.set(id, cell as CellRecord<ElementData>);
      }
      for (const [id, cell] of changed) {
        byId.set(id, cell as CellRecord<ElementData>);
      }
      for (const id of removed) {
        byId.delete(id);
      }

      state.cells = [...byId.values()];
    },
  },
});

// Export actions for use in components
export const { addElement, removeLastElement, applyIncrementalCellsChange } = graphSlice.actions;

// Export undo/redo actions from redux-undo
export const undo = () => ActionCreators.undo();
export const redo = () => ActionCreators.redo();

// ============================================================================
// STEP 3: Create Redux Store
// ============================================================================

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

const selectCells = (state: GraphRootState) => (state.graph as UndoableGraphState).present.cells;

// ============================================================================
// STEP 5: Component Implementation
// ============================================================================

/**
 * Custom render function for graph elements.
 */
const NODE_STYLE = { width: 100, height: 50 };

function RenderItem() {
  const label = useElement<ElementData>().data?.label ?? '';
  return (
    <HTMLHost className="node" style={NODE_STYLE}>
      {label}
    </HTMLHost>
  );
}

/**
 * Inner component that reads cells from Redux and passes them to
 * GraphProvider with the `onIncrementalCellsChange` callback. Must be
 * inside a Redux Provider to access the store.
 */
function GraphWithRedux() {
  const cells = useSelector(selectCells);
  const reduxStore = useStore<GraphRootState>();
  const { dispatch } = reduxStore;

  // onIncrementalCellsChange receives granular change info and dispatches a
  // single Redux action with the full incremental payload.
  const handleIncrementalCellsChange = useCallback(
    (changes: IncrementalCellsChange<ElementData>) => {
      dispatch(applyIncrementalCellsChange(changes));
    },
    [dispatch]
  );

  return (
    <GraphProvider<ElementData>
      cells={cells}
      onIncrementalCellsChange={handleIncrementalCellsChange}
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
            const newElement: ElementRecord<ElementData> = {
              id: newId,
              type: 'element',
              data: { label: 'New Node' },
              position: { x: Math.random() * 200, y: Math.random() * 200 },
            };
            dispatch(addElement(newElement));
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
 * 1. Create a Redux slice holding a single unified `cells` array.
 * 2. Add an `applyIncrementalCellsChange` action to handle granular graph
 *    changes from the `onIncrementalCellsChange` callback.
 * 3. Wrap your app with Redux Provider.
 * 4. Use `useSelector` to read cells from Redux.
 * 5. Pass `cells` as a prop with `onIncrementalCellsChange` callback.
 * 6. Dispatch Redux actions to update the graph state.
 *
 * Benefits:
 * - All graph state is in Redux, easy to integrate with other features
 * - Redux DevTools for debugging and time-travel
 * - Granular incremental changes via `onIncrementalCellsChange`
 * - Easy undo/redo using redux-undo library
 * - Easy to add middleware (persistence, etc.)
 *
 * ============================================================================
 */

export default function App() {
  return <Main />;
}

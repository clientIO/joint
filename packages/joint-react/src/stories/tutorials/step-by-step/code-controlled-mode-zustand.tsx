/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

/**
 * ============================================================================
 * ZUSTAND INTEGRATION GUIDE
 * ============================================================================
 *
 * This example demonstrates how to integrate @joint/react with Zustand for
 * state management. Zustand is a lightweight, unopinionated state management
 * library that's perfect for React applications.
 *
 * KEY CONCEPTS:
 *
 * 1. **Zustand Store**: A simple store created with `create()` that manages
 *    state and provides actions to update it.
 *
 * 2. **ExternalGraphStore Interface**: We adapt the Zustand store to the
 *    ExternalGraphStore interface, which allows GraphProvider to work with it.
 *
 * 3. **Simple API**: Zustand has a very simple API - just create a store,
 *    define state and actions, and use hooks to access them.
 *
 * HOW IT WORKS:
 *
 * 1. Create a Zustand store with elements and links state
 * 2. Create actions to update the state (addElement, removeLastElement, etc.)
 * 3. Adapt the store to ExternalGraphStore using zustandAdapter
 * 4. Pass the externalStore to GraphProvider
 * 5. All state changes automatically sync to the graph
 *
 * ============================================================================
 */

import {
  createElements,
  createLinks,
  GraphProvider,
  type GraphProps,
  type GraphElement,
  type GraphLink,
  type InferElement,
  Paper,
  type ExternalGraphStore,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useMemo } from 'react';
import { create } from 'zustand';
import type { GraphStoreSnapshot } from '../../../store/graph-store';
import type { Update } from '../../../utils/create-state';

// ============================================================================
// STEP 1: Define Initial Graph Data
// ============================================================================

const defaultElements = createElements([
  { id: '1', label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'World', x: 100, y: 200, width: 100, height: 50 },
]);

const defaultLinks = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

type CustomElement = InferElement<typeof defaultElements>;

// ============================================================================
// STEP 2: Custom Element Renderer
// ============================================================================

function RenderItem(props: CustomElement) {
  const { label, width, height } = props;
  return (
    <foreignObject width={width} height={height}>
      <div className="node">{label}</div>
    </foreignObject>
  );
}

// ============================================================================
// STEP 3: Create Zustand Store
// ============================================================================

/**
 * Zustand store interface for graph state.
 */
interface GraphStore {
  /** Array of all elements (nodes) in the graph */
  elements: GraphElement[];
  /** Array of all links (edges) in the graph */
  links: GraphLink[];
  /** Action to add a new element */
  addElement: (element: GraphElement) => void;
  /** Action to remove the last element */
  removeLastElement: () => void;
  /** Action to update the graph state (used by adapter) */
  setGraphState: (snapshot: GraphStoreSnapshot) => void;
}

/**
 * Create a Zustand store for graph state.
 * Zustand stores are simple - just define state and actions in one place.
 */
const useGraphStore = create<GraphStore>((set) => ({
  elements: defaultElements as GraphElement[],
  links: defaultLinks as GraphLink[],

  addElement: (element) => {
    set((state) => ({
      elements: [...state.elements, element],
    }));
  },

  removeLastElement: () => {
    set((state) => {
      if (state.elements.length === 0) {
        return state;
      }
      const removedElementId = state.elements.at(-1)?.id;
      const newElements = state.elements.slice(0, -1);
      const newLinks = removedElementId
        ? state.links.filter(
            (link) => link.source !== removedElementId && link.target !== removedElementId
          )
        : state.links;

      return {
        elements: newElements,
        links: newLinks,
      };
    });
  },

  setGraphState: (snapshot) => {
    set({
      elements: snapshot.elements,
      links: snapshot.links,
    });
  },
}));

// ============================================================================
// STEP 4: Create Zustand Adapter Hook
// ============================================================================

/**
 * Hook that creates an ExternalGraphStore adapter from the Zustand store.
 *
 * This adapter is the bridge between Zustand and @joint/react's GraphProvider.
 * It uses the Zustand store and adapts it to the ExternalStoreLike interface,
 * which allows GraphStore to:
 * - Read the current state (getSnapshot)
 * - Subscribe to state changes (subscribe)
 * - Update the state (setState)
 *
 * The adapter automatically reads from the Zustand store, so no parameters
 * are needed. Just call this hook inside a component.
 * @returns An ExternalGraphStore compatible with GraphProvider
 * @example
 * ```tsx
 * <GraphProvider externalStore={useZustandAdapter()}>
 *   <Paper />
 * </GraphProvider>
 * ```
 */
function useZustandAdapter(): ExternalGraphStore {
  const store = useGraphStore;

  return useMemo(() => {
    return {
      /**
       * Returns the current snapshot of the graph state.
       * GraphStore calls this to read the current elements and links.
       */
      getSnapshot: (): GraphStoreSnapshot => {
        const state = store.getState();
        return {
          elements: state.elements,
          links: state.links,
        };
      },

      /**
       * Subscribes to Zustand store changes.
       * When the Zustand state changes, the listener is called, which notifies
       * GraphStore to re-read the state and sync with JointJS.
       * @param listener - Callback function to call when state changes
       * @returns Unsubscribe function to remove the listener
       */
      subscribe: (listener: () => void) => {
        // Zustand's subscribe method subscribes to all state changes
        return store.subscribe(listener);
      },

      /**
       * Updates the Zustand store state.
       * GraphStore calls this when JointJS graph changes (e.g., user drags a node).
       *
       * The updater can be:
       * - A direct value: { elements: [...], links: [...] }
       * - A function: (previous) => ({ elements: [...], links: [...] })
       * @param updater - The new state or a function to compute new state
       */
      setState: (updater: Update<GraphStoreSnapshot>) => {
        const currentState = store.getState();
        const currentSnapshot: GraphStoreSnapshot = {
          elements: currentState.elements,
          links: currentState.links,
        };

        // Handle both function and direct value updaters
        const newSnapshot = typeof updater === 'function' ? updater(currentSnapshot) : updater;

        // Update Zustand store
        store.getState().setGraphState(newSnapshot);
      },
    };
  }, [store]);
}

// ============================================================================
// STEP 5: Component Implementation
// ============================================================================

/**
 * PaperApp component that uses Zustand store actions.
 */
function PaperApp() {
  const addElement = useGraphStore((state) => state.addElement);
  const removeLastElement = useGraphStore((state) => state.removeLastElement);

  return (
    <div className="flex flex-col gap-4">
      <Paper width="100%" className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      {/* Dark-themed controls */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Use Zustand action to add a new element
            const newElement: CustomElement = {
              id: Math.random().toString(36).slice(7),
              label: 'New Node',
              x: Math.random() * 200,
              y: Math.random() * 200,
              width: 100,
              height: 50,
            } as CustomElement;
            addElement(newElement);
          }}
        >
          Add Element
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Use Zustand action to remove the last element
            removeLastElement();
          }}
        >
          Remove Last
        </button>
      </div>
    </div>
  );
}

/**
 * Main component that sets up Zustand and connects it to GraphProvider.
 */
function Main(props: Readonly<GraphProps>) {
  // Get the adapter from Zustand store
  // This hook automatically reads from the Zustand store
  const externalStore = useZustandAdapter();

  return (
    <GraphProvider {...props} externalStore={externalStore}>
      <PaperApp />
    </GraphProvider>
  );
}

/**
 * ============================================================================
 * USAGE SUMMARY
 * ============================================================================
 *
 * To use Zustand with @joint/react:
 *
 * 1. Create a Zustand store with create() containing elements and links
 * 2. Define actions to update the state (addElement, removeLastElement, etc.)
 * 3. Use useZustandAdapter() hook to get ExternalGraphStore (no parameters needed!)
 * 4. Pass the externalStore to GraphProvider
 * 5. Use Zustand hooks (useGraphStore) to access actions in components
 *
 * Benefits:
 * - Simple, lightweight API
 * - No boilerplate (no actions, reducers, or providers needed)
 * - TypeScript support out of the box
 * - Easy to use hooks for accessing state and actions
 * - All graph state changes automatically sync
 *
 * ============================================================================
 */

export default function App(props: Readonly<GraphProps>) {
  return <Main {...props} />;
}




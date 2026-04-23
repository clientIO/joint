/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

/**
 * ============================================================================
 * ZUSTAND INTEGRATION GUIDE
 * ============================================================================
 *
 * This example demonstrates how to integrate `@joint/react` with Zustand for
 * state management. Zustand is a lightweight, unopinionated state management
 * library that's perfect for React applications.
 *
 * KEY CONCEPTS:
 *
 * 1. **Zustand Store**: A simple store created with `create()` that manages
 *    state and provides actions to update it.
 *
 * 2. **React-Controlled Mode**: We read the unified `cells` array from the
 *    Zustand store and pass it as a prop to `GraphProvider` with an
 *    `onCellsChange` callback that writes back into the store.
 *
 * 3. **Single Unified Slot**: Elements and links live side by side in the
 *    same `cells: Cells` array, distinguished by the `type` field.
 *
 * HOW IT WORKS:
 *
 * 1. Create a Zustand store with a `cells` array and actions on it
 * 2. Read `cells` from the store via `useGraphStore`
 * 3. Pass it as `cells` to `GraphProvider` with `onCellsChange={setCells}`
 * 4. All state changes automatically sync between the graph and Zustand
 *
 * ============================================================================
 */

import {
  GraphProvider,
  HTMLHost,
  Paper,
  useElement,
  type Cells,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { create } from 'zustand';

// ============================================================================
// STEP 1: Define Initial Graph Data
// ============================================================================

/**
 * Custom element data with a label property.
 */
type ElementData = { label: string };

const defaultCells: Cells<ElementData> = [
  {
    id: '1',
    type: 'ElementModel',
    data: { label: 'Hello' },
    position: { x: 100, y: 15 },
  },
  {
    id: '2',
    type: 'ElementModel',
    data: { label: 'World' },
    position: { x: 100, y: 200 },
  },
  {
    id: 'e1-2',
    type: 'LinkModel',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
];

// ============================================================================
// STEP 2: Custom Element Renderer
// ============================================================================

const NODE_STYLE = { width: 100, height: 50 };

function RenderItem() {
  const label = useElement<ElementData>().data?.label ?? '';
  return (
    <HTMLHost className="node" style={NODE_STYLE}>
      {label}
    </HTMLHost>
  );
}

// ============================================================================
// STEP 3: Create Zustand Store
// ============================================================================

/**
 * Zustand store interface for graph state.
 */
interface GraphStore {
  /** Unified cells array — elements and links together. */
  cells: Cells<ElementData>;
  /** Setter that accepts a value or updater (mirrors React's setState). */
  setCells: (updater: React.SetStateAction<Cells<ElementData>>) => void;
  /** Action to add a new element. */
  addElement: (element: ElementRecord<ElementData>) => void;
  /** Action to remove the last element (and its connected links). */
  removeLastElement: () => void;
}

/**
 * Create a Zustand store for graph state.
 * Zustand stores are simple - just define state and actions in one place.
 */
const useGraphStore = create<GraphStore>((set) => ({
  cells: defaultCells,

  setCells: (updater) => {
    set((state) => ({
      cells: typeof updater === 'function' ? updater(state.cells) : updater,
    }));
  },

  addElement: (element) => {
    set((state) => ({ cells: [...state.cells, element] }));
  },

  removeLastElement: () => {
    set((state) => {
      // Find the last element cell (not a link)
      let removedElementIndex = -1;
      for (let index = state.cells.length - 1; index >= 0; index--) {
        if (state.cells[index].type === 'ElementModel') {
          removedElementIndex = index;
          break;
        }
      }
      if (removedElementIndex === -1) return state;

      const removedElementId = state.cells[removedElementIndex].id;
      const nextCells = state.cells.filter((cell, index) => {
        if (index === removedElementIndex) return false;
        if (cell.type === 'LinkModel') {
          const link = cell as LinkRecord;
          if (link.source?.id === removedElementId || link.target?.id === removedElementId) {
            return false;
          }
        }
        return true;
      });

      return { cells: nextCells };
    });
  },
}));

// ============================================================================
// STEP 4: Component Implementation
// ============================================================================

/**
 * PaperApp component that uses Zustand store actions.
 */
function PaperApp() {
  const addElement = useGraphStore((state) => state.addElement);
  const removeLastElement = useGraphStore((state) => state.removeLastElement);

  return (
    <div className="flex flex-col gap-4">
      <Paper className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      {/* Dark-themed controls */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Use Zustand action to add a new element
            const newId = Math.random().toString(36).slice(7);
            const newElement: ElementRecord<ElementData> = {
              id: newId,
              type: 'ElementModel',
              data: { label: 'New Node' },
              position: { x: Math.random() * 200, y: Math.random() * 200 },
            };
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
 * Main component that reads cells from Zustand and connects them to
 * GraphProvider using React-controlled mode.
 */
function Main() {
  const cells = useGraphStore((state) => state.cells);
  const setCells = useGraphStore((state) => state.setCells);

  return (
    <GraphProvider<ElementData> cells={cells} onCellsChange={setCells}>
      <PaperApp />
    </GraphProvider>
  );
}

/**
 * ============================================================================
 * USAGE SUMMARY
 * ============================================================================
 *
 * To use Zustand with `@joint/react`:
 *
 * 1. Create a Zustand store that owns a single `cells` array (elements +
 *    links together, distinguished by `type`).
 * 2. Define actions to update the state (addElement, removeLastElement, etc).
 * 3. Read cells from the store via `useGraphStore`.
 * 4. Pass them to `GraphProvider` as `cells={cells}` with `onCellsChange`.
 * 5. Use Zustand hooks to access actions in components.
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

export default function App() {
  return <Main />;
}

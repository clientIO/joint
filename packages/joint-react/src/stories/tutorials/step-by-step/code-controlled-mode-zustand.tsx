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
 * 2. **React-Controlled Mode**: We read elements/links from the Zustand store
 *    and pass them as props to GraphProvider with onElementsChange/onLinksChange
 *    callbacks to sync graph changes back to Zustand.
 *
 * 3. **Simple API**: Zustand has a very simple API - just create a store,
 *    define state and actions, and use hooks to access them.
 *
 * HOW IT WORKS:
 *
 * 1. Create a Zustand store with elements and links state
 * 2. Create actions to update the state (addElement, removeLastElement, etc.)
 * 3. Read elements/links from the store via useGraphStore hooks
 * 4. Pass them as props to GraphProvider with onElementsChange/onLinksChange
 * 5. All state changes automatically sync between the graph and Zustand
 *
 * ============================================================================
 */

import {
  GraphProvider,
  useElementSize,
  type FlatElementData,
  type FlatLinkData,
  Paper,
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

type CustomElement = FlatElementData<ElementData>;

const defaultElements: Record<string, CustomElement> = {
  '1': { data: { label: 'Hello' }, x: 100, y: 15, width: 100, height: 50 },
  '2': { data: { label: 'World' }, x: 100, y: 200, width: 100, height: 50 },
};

const defaultLinks: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

// ============================================================================
// STEP 2: Custom Element Renderer
// ============================================================================

function RenderItem({ label }: Readonly<ElementData>) {
  const { width, height } = useElementSize();
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
  /** Record of all elements (nodes) in the graph keyed by ID */
  elements: Record<string, CustomElement>;
  /** Record of all links (edges) in the graph keyed by ID */
  links: Record<string, FlatLinkData>;
  /** Action to set elements (used by onElementsChange callback) */
  setElements: (updater: React.SetStateAction<Record<string, CustomElement>>) => void;
  /** Action to set links (used by onLinksChange callback) */
  setLinks: (updater: React.SetStateAction<Record<string, FlatLinkData>>) => void;
  /** Action to add a new element */
  addElement: (id: string, data: CustomElement) => void;
  /** Action to remove the last element */
  removeLastElement: () => void;
}

/**
 * Create a Zustand store for graph state.
 * Zustand stores are simple - just define state and actions in one place.
 */
const useGraphStore = create<GraphStore>((set) => ({
  elements: defaultElements,
  links: defaultLinks,

  setElements: (updater: React.SetStateAction<Record<string, CustomElement>>) => {
    set((state) => ({
      elements: typeof updater === 'function' ? updater(state.elements) : updater,
    }));
  },

  setLinks: (updater: React.SetStateAction<Record<string, FlatLinkData>>) => {
    set((state) => ({
      links: typeof updater === 'function' ? updater(state.links) : updater,
    }));
  },

  addElement: (id: string, element: CustomElement) => {
    set((state) => ({
      elements: { ...state.elements, [id]: element },
    }));
  },

  removeLastElement: () => {
    set((state) => {
      const elementIds = Object.keys(state.elements);
      if (elementIds.length === 0) {
        return state;
      }
      const removedElementId = elementIds.at(-1);
      if (!removedElementId) {
        return state;
      }
      // eslint-disable-next-line sonarjs/no-unused-vars
      const { [removedElementId]: _removed, ...newElements } = state.elements;

      const newLinks: Record<string, FlatLinkData> = {};
      for (const [id, link] of Object.entries(state.links)) {
        if (link.source !== removedElementId && link.target !== removedElementId) {
          newLinks[id] = link;
        }
      }

      return {
        elements: newElements,
        links: newLinks,
      };
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
            const newElement: CustomElement = {
              data: { label: 'New Node' },
              x: Math.random() * 200,
              y: Math.random() * 200,
              width: 100,
              height: 50,
            };
            addElement(newId, newElement);
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
 * Main component that reads state from Zustand and connects it to GraphProvider
 * using React-controlled mode.
 */
function Main() {
  // Read elements and links from Zustand store
  const elements = useGraphStore((state) => state.elements);
  const links = useGraphStore((state) => state.links);

  // Get setter actions from Zustand store for onElementsChange/onLinksChange callbacks
  const setElements = useGraphStore((state) => state.setElements);
  const setLinks = useGraphStore((state) => state.setLinks);

  return (
    <GraphProvider
      elements={elements}
      links={links}
      onElementsChange={setElements}
      onLinksChange={setLinks}
    >
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
 * 1. Create a Zustand store with create() containing elements and links
 * 2. Define actions to update the state (addElement, removeLastElement, etc.)
 * 3. Read elements/links from the store via useGraphStore hooks
 * 4. Pass them as props to GraphProvider with onElementsChange/onLinksChange
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

export default function App() {
  return <Main />;
}

/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

/**
 * ============================================================================
 * JOTAI INTEGRATION GUIDE
 * ============================================================================
 *
 * This example demonstrates how to integrate @joint/react with Jotai for
 * state management. Jotai is an atomic state management library that uses
 * atoms as the building blocks for state.
 *
 * KEY CONCEPTS:
 *
 * 1. **Atoms**: Jotai uses atoms - small, independent pieces of state.
 *    Each atom can be read and written independently.
 *
 * 2. **React-Controlled Mode**: We read the unified `cells` array from a
 *    Jotai atom and pass it as a prop to `GraphProvider` with an
 *    `onCellsChange` callback that writes back into the atom.
 *
 * 3. **Single Unified Slot**: `GraphProvider` now takes a single `cells`
 *    prop (elements and links live in the same array, distinguished by the
 *    `type` field). This maps very naturally to Jotai's atomic model.
 *
 * HOW IT WORKS:
 *
 * 1. Create a Jotai atom for the cells array
 * 2. Read the atom value and pass it as `cells` to `GraphProvider`
 * 3. Pass a setter into `onCellsChange` so graph edits flow back to Jotai
 * 4. All state changes automatically sync to the graph
 *
 * ============================================================================
 */

import {
  GraphProvider,
  HTMLHost,
  Paper,
  type Cells,
  type ElementRecord,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useCallback } from 'react';
import { atom, createStore, useAtomValue, useSetAtom, Provider as JotaiProvider } from 'jotai';

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

// ============================================================================
// STEP 2: Custom Element Renderer
// ============================================================================

const NODE_STYLE = { width: 100, height: 50 };

function RenderItem({ label }: ElementData) {
  return (
    <HTMLHost className="node" style={NODE_STYLE}>
      {label}
    </HTMLHost>
  );
}

// ============================================================================
// STEP 3: Create Jotai Atoms and Store
// ============================================================================

/**
 * Create a Jotai store for managing atom state.
 * The store allows us to subscribe to atom changes and access atoms outside React.
 */
const jotaiStore = createStore();

/**
 * Single Jotai atom holding the unified cells array.
 */
const cellsAtom = atom<Cells<ElementData>>(defaultCells);

// ============================================================================
// STEP 4: Component Implementation
// ============================================================================

/**
 * PaperApp component that uses the Jotai atom for graph actions.
 */
function PaperApp() {
  const setCells = useSetAtom(cellsAtom);

  return (
    <div className="flex flex-col gap-4">
      <Paper className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      {/* Dark-themed controls */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Append a new element cell to the atom
            const newId = Math.random().toString(36).slice(7);
            const newElement: ElementRecord<ElementData> = {
              id: newId,
              type: 'element',
              data: { label: 'New Node' },
              position: { x: Math.random() * 200, y: Math.random() * 200 },
            };

            setCells((currentCells) => [...currentCells, newElement]);
          }}
        >
          Add Element
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            const currentCells = jotaiStore.get(cellsAtom);

            // Find the last element cell (not a link)
            let removedElementIndex = -1;
            for (let index = currentCells.length - 1; index >= 0; index--) {
              if (currentCells[index].type === 'element') {
                removedElementIndex = index;
                break;
              }
            }
            if (removedElementIndex === -1) return;

            const removedElementId = currentCells[removedElementIndex].id;
            const nextCells = currentCells.filter((cell, index) => {
              if (index === removedElementIndex) return false;
              // Also drop links touching the removed element
              if (cell.type === 'link') {
                const { source, target } = cell as {
                  source?: { id?: unknown };
                  target?: { id?: unknown };
                };
                if (source?.id === removedElementId || target?.id === removedElementId) {
                  return false;
                }
              }
              return true;
            });

            setCells(nextCells);
          }}
        >
          Remove Last
        </button>
      </div>
    </div>
  );
}

/**
 * Main component that sets up Jotai and connects it to GraphProvider.
 * Reads cells from a Jotai atom and passes them as a prop.
 */
function Main() {
  // Read cells from the Jotai atom
  const cells = useAtomValue(cellsAtom);
  const jotaiSetCells = useSetAtom(cellsAtom);

  // Bridge GraphProvider's cells setter into Jotai. The callback may be
  // a value or an updater function, so we mirror the React state API.
  const handleCellsChange = useCallback(
    (updater: React.SetStateAction<Cells<ElementData>>) => {
      const nextCells =
        typeof updater === 'function' ? updater(jotaiStore.get(cellsAtom)) : updater;
      jotaiSetCells(nextCells);
    },
    [jotaiSetCells]
  );

  return (
    <GraphProvider<ElementData> cells={cells} onCellsChange={handleCellsChange}>
      <PaperApp />
    </GraphProvider>
  );
}

/**
 * ============================================================================
 * USAGE SUMMARY
 * ============================================================================
 *
 * To use Jotai with @joint/react:
 *
 * 1. Create a single Jotai atom for the unified cells array
 * 2. Read the atom value with useAtomValue() and pass it as `cells` to
 *    GraphProvider
 * 3. Use `onCellsChange` to push every graph commit back into the atom
 * 4. Use useSetAtom() in components to update the atom for custom actions
 *
 * Benefits:
 * - Atomic state management - split state into small pieces
 * - No providers needed - atoms work globally
 * - TypeScript support out of the box
 * - Simple API - just atoms and hooks
 * - All graph state changes automatically sync
 *
 * ============================================================================
 */

export default function App() {
  return (
    <JotaiProvider store={jotaiStore}>
      <Main />
    </JotaiProvider>
  );
}

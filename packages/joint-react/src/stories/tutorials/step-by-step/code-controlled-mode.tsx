/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

/**
 * ============================================================================
 * REACT-CONTROLLED MODE TUTORIAL
 * ============================================================================
 *
 * This example demonstrates React-controlled mode, where React state is the
 * single source of truth for the graph. All changes to the unified `cells`
 * array flow through React state, giving you full control over the graph.
 *
 * KEY CONCEPTS:
 *
 * 1. **Controlled Mode**: When you provide `cells` and `onCellsChange` to
 *    `GraphProvider`, React state controls the graph — all changes must go
 *    through React state updates.
 *
 * 2. **Unified `cells` slot**: Elements and links live in one array,
 *    distinguished by the `type` field (`'element'` /
 *    `'link'`). There is no separate elements/links prop anymore.
 *
 * 3. **Bidirectional Sync**: GraphProvider automatically synchronizes changes
 *    in both directions:
 *    - React state → JointJS graph (when you update React state)
 *    - JointJS graph → React state (when the user interacts with the graph)
 *
 * 4. **State Flow**:
 *    - User interacts with graph → GraphProvider detects change →
 *    - Calls `onCellsChange` → Updates React state →
 *    - React re-renders → GraphProvider syncs new state to graph
 *
 * 5. **Benefits**:
 *    - Full control over graph state
 *    - Easy to implement undo/redo (save state history)
 *    - Easy to persist state (save to localStorage, server, etc.)
 *    - Easy to integrate with other React state management
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
import { useState, type Dispatch, type SetStateAction } from 'react';

// ============================================================================
// STEP 1: Define Initial Graph Data
// ============================================================================

/**
 * Custom element data with a label property.
 */
type ElementData = { label: string };

/**
 * Initial cells (nodes and links) for the graph.
 *
 * Every cell requires both `id` and `type`:
 * - Element cells use `type: 'element'` plus `position`/`size`.
 * - Link cells use `type: 'link'` plus `source`/`target`.
 */
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
// STEP 3: Custom Element Renderer
// ============================================================================

/**
 * Custom render function for graph elements.
 *
 * Reads the current element via `useElement()` and renders the label inside
 * an HTMLHost (foreignObject wrapper).
 */
function RenderItem() {
  const label = useElement<ElementData>().data?.label ?? '';
  return (
    <HTMLHost className="node" style={{ width: 100, height: 50 }}>
      {label}
    </HTMLHost>
  );
}

// ============================================================================
// STEP 4: Paper Component with Controls
// ============================================================================

/**
 * Props for the PaperApp component.
 * In controlled mode, all state changes must go through this setter.
 */
interface PaperAppProps {
  /** Setter for the unified cells array. */
  readonly onCellsChange: Dispatch<SetStateAction<Cells<ElementData>>>;
}

/**
 * PaperApp component that renders the graph and provides controls.
 *
 * IMPORTANT: In controlled mode, do NOT directly modify the graph through
 * JointJS APIs. Always update React state via `onCellsChange`, and
 * GraphProvider will sync the changes to the graph.
 */
function PaperApp({ onCellsChange }: Readonly<PaperAppProps>) {
  return (
    <div className="flex flex-col gap-4">
      {/*
        Paper renders the graph canvas.
        - height: canvas height
        - renderElement: custom renderer for elements (defined above)
        - Paper automatically reads cells from GraphProvider's context
      */}
      <Paper className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />

      {/*
        ======================================================================
        CONTROLS SECTION - How State Updates Flow
        ======================================================================

        These buttons mutate the unified cells array. Never mutate the
        JointJS graph directly. Instead, update React state — GraphProvider
        will sync it to the graph.

        STATE UPDATE FLOW:
        1. Click → handler fires
        2. Handler calls `onCellsChange` with new cells
        3. React state updates → Component re-renders
        4. GraphProvider receives new `cells` prop
        5. GraphProvider diffs and syncs to the JointJS graph
        6. Graph visually updates

        WHY FUNCTIONAL UPDATES?
        We use `(prev) => next` to guarantee we work with the latest state.
      */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        {/*
          ADD ELEMENT BUTTON
          Appends a new element cell to the unified cells array.
        */}
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Generate a unique ID for the new element
            const newId = Math.random().toString(36).slice(7);

            // Build the new element cell. It must include id AND type.
            const newElement: ElementRecord<ElementData> = {
              id: newId,
              type: 'element',
              data: { label: 'New Node' },
              position: { x: Math.random() * 200, y: Math.random() * 200 },
            };

            onCellsChange((cells) => [...cells, newElement]);
          }}
        >
          Add Element
        </button>

        {/*
          REMOVE LAST ELEMENT BUTTON
          Removes the last element cell in the array plus any links
          connected to it. Works on the unified cells array.
        */}
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            onCellsChange((cells) => {
              // Find the last element cell (ignore links)
              let removedIndex = -1;
              for (let index = cells.length - 1; index >= 0; index--) {
                if (cells[index].type === 'element') {
                  removedIndex = index;
                  break;
                }
              }
              if (removedIndex === -1) return cells;

              const removedId = cells[removedIndex].id;

              return cells.filter((cell, index) => {
                if (index === removedIndex) return false;
                if (cell.type === 'link') {
                  const link = cell as LinkRecord;
                  if (link.source?.id === removedId || link.target?.id === removedId) {
                    return false;
                  }
                }
                return true;
              });
            });
          }}
        >
          Remove Last
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 5: Main Component with Controlled State
// ============================================================================

/**
 * Main component that sets up React-controlled mode.
 *
 * 1. Creates React state for the unified cells array.
 * 2. Wraps the app in GraphProvider (controlled mode).
 * 3. Passes the setter to child components for custom actions.
 *
 * HOW CONTROLLED MODE WORKS:
 *
 * - `cells` is the single source of truth for every cell in the graph.
 * - `onCellsChange` is called by GraphProvider on every graph commit, so
 *   user interactions (drag, add, remove) flow back into React state.
 * - When state changes (from either direction), GraphProvider diffs and
 *   syncs to the JointJS graph.
 */
function Main() {
  const [cells, setCells] = useState<Cells<ElementData>>(defaultCells);

  return (
    <GraphProvider<ElementData> cells={cells} onCellsChange={setCells}>
      {/* Pass the setter to the child so it can mutate the graph via state */}
      <PaperApp onCellsChange={setCells} />
    </GraphProvider>
  );
}

/**
 * ============================================================================
 * USAGE SUMMARY
 * ============================================================================
 *
 * To use React-controlled mode:
 *
 * 1. Create React state for the unified cells array with `useState`.
 * 2. Wrap your app with `GraphProvider` and provide:
 *    - `cells={cells}`
 *    - `onCellsChange={setCells}`
 * 3. Update the graph by updating React state — never mutate the graph
 *    directly.
 * 4. `GraphProvider` automatically syncs changes in both directions.
 *
 * Benefits:
 * - Full control over graph state
 * - Easy to implement undo/redo (save state history)
 * - Easy to persist state (localStorage, server, etc.)
 * - Easy to integrate with other React state management
 *
 * When NOT to use:
 * - Simple graphs that don't need state control (prefer `initialCells`)
 * - Performance-critical scenarios (uncontrolled mode is faster)
 *
 * ============================================================================
 */

export default function App() {
  return <Main />;
}

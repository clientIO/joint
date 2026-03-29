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
 * 2. **React-Controlled Mode**: We read elements/links from Jotai atoms
 *    and pass them as props to GraphProvider with onElementsChange/onLinksChange
 *    callbacks that update the atoms.
 *
 * 3. **Atomic State**: Jotai's atomic approach means you can split state
 *    into small pieces and compose them together.
 *
 * HOW IT WORKS:
 *
 * 1. Create Jotai atoms for elements and links
 * 2. Read atom values and pass them as props to GraphProvider
 * 3. Use onElementsChange/onLinksChange to update atoms when graph changes
 * 4. All state changes automatically sync to the graph
 *
 * ============================================================================
 */

import { GraphProvider, useElementSize, type ElementRecord, type LinkRecord, Paper } from '@joint/react';
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

type CustomElement = ElementRecord<ElementData>;

const defaultElements: Record<string, CustomElement> = {
  '1': { data: { label: 'Hello' }, position: { x: 100, y: 15 }, size: { width: 100, height: 50 } },
  '2': { data: { label: 'World' }, position: { x: 100, y: 200 }, size: { width: 100, height: 50 } },
};

const defaultLinks: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
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
// STEP 3: Create Jotai Atoms and Store
// ============================================================================

/**
 * Create a Jotai store for managing atom state.
 * The store allows us to subscribe to atom changes and access atoms outside React.
 */
const jotaiStore = createStore();

/**
 * Jotai atom for graph elements.
 * Atoms are the building blocks of Jotai - they hold state.
 */
const elementsAtom = atom<Record<string, CustomElement>>(defaultElements);

/**
 * Jotai atom for graph links.
 */
const linksAtom = atom<Record<string, LinkRecord>>(defaultLinks);

// ============================================================================
// STEP 4: Component Implementation
// ============================================================================

/**
 * PaperApp component that uses Jotai atoms for graph actions.
 */
function PaperApp() {
  const setElements = useSetAtom(elementsAtom);
  const setLinks = useSetAtom(linksAtom);

  return (
    <div className="flex flex-col gap-4">
      <Paper className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      {/* Dark-themed controls */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Create a new element and add it to the elements atom
            const newId = Math.random().toString(36).slice(7);
            const newElement: CustomElement = {
              data: { label: 'New Node' },
              position: { x: Math.random() * 200, y: Math.random() * 200 },
              size: { width: 100, height: 50 },
            };

            setElements((currentElements) => ({
              ...currentElements,
              [newId]: newElement,
            }));
          }}
        >
          Add Element
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            const currentElements = jotaiStore.get(elementsAtom);
            const currentLinks = jotaiStore.get(linksAtom);

            const elementIds = Object.keys(currentElements);
            if (elementIds.length === 0) {
              return;
            }

            // Remove the last element
            const removedElementId = elementIds.at(-1);
            if (!removedElementId) {
              return;
            }

            // eslint-disable-next-line sonarjs/no-unused-vars
            const { [removedElementId]: _removed, ...newElements } = currentElements;

            // Remove links connected to the removed element
            const newLinks: Record<string, LinkRecord> = {};
            for (const [id, link] of Object.entries(currentLinks)) {
              if (link.source !== removedElementId && link.target !== removedElementId) {
                newLinks[id] = link;
              }
            }

            // Update both atoms
            setElements(newElements);
            setLinks(newLinks);
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
 * Reads elements/links from Jotai atoms and passes them as props.
 */
function Main() {
  // Read elements and links from Jotai atoms
  const elements = useAtomValue(elementsAtom);
  const links = useAtomValue(linksAtom);
  const jotaiSetElements = useSetAtom(elementsAtom);
  const jotaiSetLinks = useSetAtom(linksAtom);

  // Callbacks to sync graph changes back to Jotai atoms
  const handleElementsChange = useCallback(
    (updater: React.SetStateAction<Record<string, CustomElement>>) => {
      const newElements =
        typeof updater === 'function' ? updater(jotaiStore.get(elementsAtom)) : updater;
      jotaiSetElements(newElements);
    },
    [jotaiSetElements]
  );

  const handleLinksChange = useCallback(
    (updater: React.SetStateAction<Record<string, LinkRecord>>) => {
      const newLinks = typeof updater === 'function' ? updater(jotaiStore.get(linksAtom)) : updater;
      jotaiSetLinks(newLinks);
    },
    [jotaiSetLinks]
  );

  return (
    <GraphProvider
      elements={elements}
      links={links}
      onElementsChange={handleElementsChange as never}
      onLinksChange={handleLinksChange as never}
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
 * To use Jotai with @joint/react:
 *
 * 1. Create Jotai atoms for elements and links using atom()
 * 2. Read atom values with useAtomValue() and pass as props to GraphProvider
 * 3. Use onElementsChange/onLinksChange callbacks to update atoms
 * 4. Use useSetAtom() in components to update atoms directly for custom actions
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

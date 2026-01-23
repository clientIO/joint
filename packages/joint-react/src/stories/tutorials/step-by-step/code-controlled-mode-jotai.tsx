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
 * 2. **ExternalGraphStore Interface**: We adapt Jotai atoms to the
 *    ExternalGraphStore interface, which allows GraphProvider to work with it.
 *
 * 3. **Atomic State**: Jotai's atomic approach means you can split state
 *    into small pieces and compose them together.
 *
 * HOW IT WORKS:
 *
 * 1. Create Jotai atoms for elements and links
 * 2. Create derived atoms or use them directly
 * 3. Adapt the atoms to ExternalGraphStore using jotaiAdapter
 * 4. Pass the externalStore to GraphProvider
 * 5. All state changes automatically sync to the graph
 *
 * ============================================================================
 */

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
import { useMemo } from 'react';
import { atom, createStore } from 'jotai';
import type { GraphStoreSnapshot } from '../../../store/graph-store';
import type { Update } from '../../../utils/create-state';

// ============================================================================
// STEP 1: Define Initial Graph Data
// ============================================================================

/**
 * Custom element type with a label property.
 */
type CustomElement = GraphElement & { label: string };

const defaultElements: CustomElement[] = [
  { id: '1', label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'World', x: 100, y: 200, width: 100, height: 50 },
];

const defaultLinks: GraphLink[] = [
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
];

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
const elementsAtom = atom<GraphElement[]>(defaultElements as GraphElement[]);

/**
 * Jotai atom for graph links.
 */
const linksAtom = atom<GraphLink[]>(defaultLinks as GraphLink[]);

// ============================================================================
// STEP 4: Create Jotai Adapter Hook
// ============================================================================

/**
 * Hook that creates an ExternalGraphStore adapter from Jotai atoms.
 *
 * This adapter is the bridge between Jotai and @joint/react's GraphProvider.
 * It uses Jotai atoms and adapts them to the ExternalStoreLike interface,
 * which allows GraphStore to:
 * - Read the current state (getSnapshot)
 * - Subscribe to state changes (subscribe)
 * - Update the state (setState)
 *
 * The adapter automatically reads from the Jotai atoms, so no parameters
 * are needed. Just call this hook inside a component.
 * @returns An ExternalGraphStore compatible with GraphProvider
 * @example
 * ```tsx
 * <GraphProvider externalStore={useJotaiAdapter()}>
 *   <Paper />
 * </GraphProvider>
 * ```
 */
function useJotaiAdapter(): ExternalGraphStore {
  return useMemo(() => {
    // Track subscribers
    const subscribers = new Set<() => void>();

    const notifySubscribers = () => {
      for (const subscriber of subscribers) subscriber();
    };

    return {
      /**
       * Returns the current snapshot of the graph state.
       * GraphStore calls this to read the current elements and links.
       */
      getSnapshot: (): GraphStoreSnapshot => {
        return {
          elements: jotaiStore.get(elementsAtom),
          links: jotaiStore.get(linksAtom),
        };
      },

      /**
       * Subscribes to Jotai atom changes.
       * When the atoms change, the listener is called, which notifies
       * GraphStore to re-read the state and sync with JointJS.
       * @param listener - Callback function to call when state changes
       * @returns Unsubscribe function to remove the listener
       */
      subscribe: (listener: () => void) => {
        subscribers.add(listener);

        // Subscribe to both atoms using Jotai's store.sub method
        // The sub method signature is: sub(atom, callback) -> unsubscribe
        const unsubscribeElements = jotaiStore.sub(elementsAtom, () => {
          notifySubscribers();
        });

        const unsubscribeLinks = jotaiStore.sub(linksAtom, () => {
          notifySubscribers();
        });

        return () => {
          subscribers.delete(listener);
          unsubscribeElements();
          unsubscribeLinks();
        };
      },

      /**
       * Updates the Jotai atoms.
       * GraphStore calls this when JointJS graph changes (e.g., user drags a node).
       *
       * The updater can be:
       * - A direct value: { elements: [...], links: [...] }
       * - A function: (previous) => ({ elements: [...], links: [...] })
       * @param updater - The new state or a function to compute new state
       */
      setState: (updater: Update<GraphStoreSnapshot>) => {
        const currentSnapshot: GraphStoreSnapshot = {
          elements: jotaiStore.get(elementsAtom),
          links: jotaiStore.get(linksAtom),
        };

        const newSnapshot = typeof updater === 'function' ? updater(currentSnapshot) : updater;

        // Update atoms using the store
        jotaiStore.set(elementsAtom, newSnapshot.elements);
        jotaiStore.set(linksAtom, newSnapshot.links);
      },
    };
  }, []);
}

// ============================================================================
// STEP 5: Component Implementation
// ============================================================================

/**
 * PaperApp component that uses the external store.
 */
interface PaperAppProps {
  readonly store: ExternalGraphStore;
}

function PaperApp({ store }: Readonly<PaperAppProps>) {
  return (
    <div className="flex flex-col gap-4">
      <Paper width="100%" className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      {/* Dark-themed controls */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Get current state from the store
            const currentState = store.getSnapshot();

            // Create a new element
            const newElement: CustomElement = {
              id: Math.random().toString(36).slice(7),
              label: 'New Node',
              x: Math.random() * 200,
              y: Math.random() * 200,
              width: 100,
              height: 50,
            } as CustomElement;

            // Update the store with the new element
            // This will automatically sync to the graph and update Jotai atoms
            store.setState({
              elements: [...currentState.elements, newElement],
              links: currentState.links as GraphLink[],
            });
          }}
        >
          Add Element
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Get current state from the store
            const currentState = store.getSnapshot();

            if (currentState.elements.length === 0) {
              return;
            }

            // Remove the last element
            const newElements = currentState.elements.slice(0, -1);
            const removedElementId = currentState.elements.at(-1)?.id;

            // Remove links connected to the removed element
            const newLinks = removedElementId
              ? currentState.links.filter(
                  (link) => link.source !== removedElementId && link.target !== removedElementId
                )
              : currentState.links;

            // Update the store
            // This will automatically sync to the graph and update Jotai atoms
            store.setState({
              elements: newElements,
              links: newLinks as GraphLink[],
            });
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
 */
function Main(props: Readonly<GraphProps>) {
  // Get the adapter from Jotai atoms
  // This hook automatically reads from the Jotai store
  const externalStore = useJotaiAdapter();

  return (
    <GraphProvider {...props} externalStore={externalStore}>
      <PaperApp store={externalStore} />
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
 * 2. Use useAtom() hook to read and write atom values
 * 3. Create an ExternalGraphStore adapter that uses the atoms
 * 4. Pass the externalStore to GraphProvider
 * 5. Use useAtom() hooks in components to access and update state
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

export default function App(props: Readonly<GraphProps>) {
  return <Main {...props} />;
}

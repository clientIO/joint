/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

/**
 * ============================================================================
 * REACT-CONTROLLED MODE TUTORIAL
 * ============================================================================
 *
 * This example demonstrates React-controlled mode, where React state is the
 * single source of truth for the graph. All changes to elements and links
 * flow through React state, giving you full control over the graph state.
 *
 * KEY CONCEPTS:
 *
 * 1. **Controlled Mode**: When you provide `onElementsChange` and/or
 *    `onLinksChange` props to GraphProvider, you enable React-controlled mode.
 *    In this mode, React state controls the graph, and all changes must go
 *    through React state updates.
 *
 * 2. **Bidirectional Sync**: GraphProvider automatically synchronizes changes
 *    in both directions:
 *    - React state → JointJS graph (when you update React state)
 *    - JointJS graph → React state (when user interacts with the graph)
 *
 * 3. **State Flow**:
 *    - User interacts with graph → GraphProvider detects change →
 *    - Calls onElementsChange/onLinksChange → Updates React state →
 *    - React re-renders → GraphProvider syncs new state to graph
 *
 * 4. **Benefits**:
 *    - Full control over graph state
 *    - Easy to implement undo/redo (save state history)
 *    - Easy to persist state (save to localStorage, server, etc.)
 *    - Easy to integrate with other React state management
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
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useState, type Dispatch, type SetStateAction } from 'react';

// ============================================================================
// STEP 1: Define Initial Graph Data
// ============================================================================

/**
 * Initial elements (nodes) for the graph.
 * createElements is a helper function that creates properly formatted element
 * objects compatible with JointJS. Each element needs:
 * - id: unique identifier
 * - label: text to display (custom property)
 * - x, y: position on the canvas
 * - width, height: dimensions
 */
const defaultElements = createElements([
  { id: '1', label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'World', x: 100, y: 200, width: 100, height: 50 },
]);

/**
 * Initial links (edges) for the graph.
 * createLinks is a helper function that creates properly formatted link objects.
 * Each link needs:
 * - id: unique identifier
 * - source: id of the source element
 * - target: id of the target element
 * - attrs: visual attributes (colors, stroke width, etc.)
 */
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

// ============================================================================
// STEP 2: Type Inference for Custom Elements and Links
// ============================================================================

/**
 * InferElement extracts the TypeScript type from the elements array.
 * This gives us a CustomElement type that includes all properties from
 * the initial elements, including our custom 'label' property.
 *
 * Example: CustomElement = { id: string, label: string, x: number, ... }
 */
type CustomElement = InferElement<typeof defaultElements>;

/**
 * Extract the link type from the links array.
 * This gives us proper TypeScript typing for our links.
 */
type CustomLink = (typeof defaultLinks)[number];

// ============================================================================
// STEP 3: Custom Element Renderer
// ============================================================================

/**
 * Custom render function for graph elements.
 *
 * This function defines how each element is rendered in the SVG. It receives
 * the element's properties and returns JSX that will be rendered inside the
 * element's SVG container.
 *
 * In this example, we use SVG's <foreignObject> to embed HTML content,
 * allowing us to use regular HTML/CSS for styling instead of SVG attributes.
 * @param props - The element properties (includes id, label, x, y, width, height, etc.)
 * @returns JSX to render inside the element
 */
function RenderItem(props: CustomElement) {
  const { label, width, height } = props;
  return (
    <foreignObject width={width} height={height}>
      <div className="node">{label}</div>
    </foreignObject>
  );
}

// ============================================================================
// STEP 4: Paper Component with Controls
// ============================================================================

/**
 * Props for the PaperApp component.
 * These are the state setters passed down from the parent component.
 * In controlled mode, all state changes must go through these setters.
 */
interface PaperAppProps {
  /** Function to update the elements array */
  readonly onElementsChange: Dispatch<SetStateAction<CustomElement[]>>;
  /** Function to update the links array */
  readonly onLinksChange: Dispatch<SetStateAction<CustomLink[]>>;
}

/**
 * PaperApp component that renders the graph and provides controls.
 *
 * This component:
 * 1. Renders the Paper component (the visual graph canvas)
 * 2. Provides buttons to add/remove elements
 * 3. Updates state through the onElementsChange/onLinksChange callbacks
 *
 * IMPORTANT: In controlled mode, you should NOT directly modify the graph
 * through JointJS APIs. Instead, always update React state, and GraphProvider
 * will automatically sync the changes to the graph.
 */
function PaperApp({ onElementsChange, onLinksChange }: PaperAppProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 
        Paper component renders the graph canvas.
        - width/height: dimensions of the canvas
        - renderElement: custom renderer for elements (defined above)
        - The Paper automatically reads elements and links from GraphProvider context
      */}
      <Paper width="100%" className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />

      {/* 
        ========================================================================
        CONTROLS SECTION - Understanding How State Updates Work
        ========================================================================
        
        These buttons demonstrate how to update the graph in controlled mode.
        The key principle: NEVER directly modify the JointJS graph. Instead,
        always update React state, and GraphProvider will automatically sync
        the changes to the graph.
        
        STATE UPDATE FLOW:
        1. User clicks button → onClick handler executes
        2. Handler calls onElementsChange/onLinksChange with new state
        3. React state updates (setElements/setLinks)
        4. Component re-renders with new state
        5. GraphProvider receives new elements/links props
        6. GraphProvider detects change and syncs to JointJS graph
        7. Graph visually updates
        
        WHY FUNCTIONAL UPDATES?
        We use the functional form: (prev) => newValue
        This ensures we always work with the latest state, even if multiple
        updates are queued. It's the recommended pattern for state updates
        that depend on previous state.
      */}
      {/* Dark-themed controls */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        {/* 
          ======================================================================
          ADD ELEMENT BUTTON
          ======================================================================
          
          WHAT IT DOES:
          Creates a new element and adds it to the graph.
          
          HOW IT WORKS:
          1. Creates a new element object with:
             - Random ID (using Math.random for uniqueness)
             - Label "New Node"
             - Random position (x, y between 0-200)
             - Fixed dimensions (100x50)
          
          2. Updates state using functional update:
             onElementsChange((elements) => [...elements, newElement])
             
             This:
             - Takes the current elements array
             - Spreads it into a new array
             - Adds the new element at the end
             - Returns the new array
          
          3. React updates state → Component re-renders
          
          4. GraphProvider detects the new elements prop
          
          5. GraphProvider syncs the new element to JointJS graph
             - Creates a new JointJS element
             - Adds it to the graph
             - Graph visually updates
          
          WHY THIS WORKS:
          - We're updating React state, not the graph directly
          - GraphProvider handles all the JointJS synchronization
          - The graph automatically reflects the new state
        */}
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Step 1: Create a new element object
            // This is just a plain JavaScript object - not a JointJS element yet
            const newElement: CustomElement = {
              // Generate a unique ID using random string
              // Math.random().toString(36) creates a base-36 string
              // .slice(7) removes the "0." prefix
              id: Math.random().toString(36).slice(7),
              label: 'New Node',
              // Random position to spread elements across the canvas
              x: Math.random() * 200,
              y: Math.random() * 200,
              width: 100,
              height: 50,
            } as CustomElement;

            // Step 2: Update React state using functional update
            // This is the KEY to controlled mode - we update state, not the graph
            // The functional form (prev) => newValue ensures we use the latest state
            onElementsChange((elements) => {
              // Create a new array with all existing elements plus the new one
              // We use spread operator to create a new array (immutability)
              return [...elements, newElement];
            });

            // Step 3: That's it! GraphProvider will handle the rest:
            // - Detects the state change
            // - Syncs to JointJS graph
            // - Graph visually updates
          }}
        >
          Add Element
        </button>

        {/* 
          ======================================================================
          REMOVE LAST ELEMENT BUTTON
          ======================================================================
          
          WHAT IT DOES:
          Removes the last element from the graph. If no elements remain,
          also clears all links (since links need source/target elements).
          
          HOW IT WORKS:
          1. Updates elements state using functional update:
             onElementsChange((elements) => elements.slice(0, -1))
             
             This:
             - Takes the current elements array
             - Uses slice(0, -1) to get all elements except the last one
             - Returns the new array
          
          2. Checks if any elements remain:
             - If no elements: clears all links (links need elements to exist)
             - If elements remain: links stay (GraphProvider will handle
               removing orphaned links automatically)
          
          3. React updates state → Component re-renders
          
          4. GraphProvider detects the change:
             - Removes the element from JointJS graph
             - Automatically removes any links connected to that element
             - Graph visually updates
          
          WHY WE CLEAR LINKS:
          Links require source and target elements. If we remove all elements,
          any remaining links would be invalid. GraphProvider will handle
          removing links when their source/target elements are removed, but
          it's good practice to clear them explicitly when removing the last element.
        */}
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Step 1: Update elements state by removing the last element
            onElementsChange((elements) => {
              // Check if there are any elements to remove
              if (elements.length === 0) {
                // No elements to remove, return current state unchanged
                return elements;
              }

              // Create a new array without the last element
              // slice(0, -1) returns all elements except the last one
              const newElements = elements.slice(0, -1);

              // Step 2: If no elements remain, clear all links
              // Links require source and target elements to exist
              // If we remove all elements, links become invalid
              if (newElements.length === 0) {
                // Clear all links since there are no elements left
                onLinksChange([]);
              }

              // Return the new elements array
              return newElements;
            });

            // Step 3: GraphProvider handles the rest:
            // - Detects the removed element
            // - Removes it from JointJS graph
            // - Automatically removes any links connected to that element
            // - Graph visually updates
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
 * This component:
 * 1. Creates React state for elements and links (the single source of truth)
 * 2. Wraps the app with GraphProvider in controlled mode
 * 3. Passes state and setters to GraphProvider and child components
 *
 * HOW CONTROLLED MODE WORKS:
 *
 * 1. State Management:
 *    - elements and links are stored in React state (useState)
 *    - These arrays are the single source of truth for the graph
 *
 * 2. GraphProvider Setup:
 *    - elements={elements}: Provides current elements to GraphProvider
 *    - links={links}: Provides current links to GraphProvider
 *    - onElementsChange={setElements}: Tells GraphProvider to call setElements
 *      whenever the graph changes (e.g., user drags a node)
 *    - onLinksChange={setLinks}: Same for links
 *
 * 3. Bidirectional Sync:
 *    - When you update React state → GraphProvider syncs to JointJS graph
 *    - When user interacts with graph → GraphProvider calls onElementsChange/
 *      onLinksChange → Updates React state → Triggers re-render
 *
 * 4. State Flow Example (user drags a node):
 *    User drags node → JointJS detects change → GraphProvider calls
 *    onElementsChange with new positions → setElements updates React state →
 *    Component re-renders → GraphProvider receives new elements prop →
 *    GraphProvider syncs to graph (but graph already has the change, so no
 *    duplicate update occurs)
 */
function Main(props: Readonly<GraphProps>) {
  // Create React state for elements and links
  // These are the single source of truth for the graph
  const [elements, setElements] = useState<GraphElement[]>(defaultElements);
  const [links, setLinks] = useState<GraphLink[]>(defaultLinks);

  return (
    <GraphProvider
      {...props}
      // Provide current state to GraphProvider
      elements={elements}
      links={links}
      // Enable controlled mode by providing change handlers
      // When the graph changes (user interaction), GraphProvider will call these
      onElementsChange={setElements}
      onLinksChange={setLinks}
    >
      {/* 
        Pass state setters to child component so it can update the graph
        by updating React state. The type assertions are needed because
        GraphElement/GraphLink are more generic than CustomElement/CustomLink.
      */}
      <PaperApp
        onElementsChange={setElements as Dispatch<SetStateAction<CustomElement[]>>}
        onLinksChange={setLinks as Dispatch<SetStateAction<CustomLink[]>>}
      />
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
 * 1. Create React state for elements and links using useState
 * 2. Wrap your app with GraphProvider and provide:
 *    - elements={elements}
 *    - links={links}
 *    - onElementsChange={setElements}
 *    - onLinksChange={setLinks}
 * 3. Update the graph by updating React state (never directly modify the graph)
 * 4. GraphProvider automatically syncs changes in both directions
 *
 * Benefits:
 * - Full control over graph state
 * - Easy to implement undo/redo (save state history)
 * - Easy to persist state (localStorage, server, etc.)
 * - Easy to integrate with other React state management
 *
 * When to use:
 * - You need full control over graph state
 * - You want to implement undo/redo
 * - You need to persist graph state
 * - You're integrating with other React state management
 *
 * When NOT to use:
 * - Simple graphs that don't need state control
 * - Performance-critical scenarios (uncontrolled mode is faster)
 * - You don't need to track state changes
 *
 * ============================================================================
 */

export default function App(props: Readonly<GraphProps>) {
  return <Main {...props} />;
}

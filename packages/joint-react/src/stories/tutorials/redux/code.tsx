/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

// Import necessary modules and components from the library and other dependencies
import {
  createElements,
  createLinks,
  GraphProvider,
  Paper,
  useGraph,
  setElements as setElementsViaGraph,
  setLinks as setLinksViaGraph,
  type GraphProps,
  type InferElement,
} from '@joint/react';
import '../../examples/index.css'; // Import custom styles
import { BUTTON_CLASSNAME, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme'; // Storybook-specific styles
import { createSlice, configureStore } from '@reduxjs/toolkit'; // Redux Toolkit for state management
import { Provider, useSelector } from 'react-redux'; // React-Redux bindings
import { dia } from '@joint/plus';
import { useRef } from 'react';
const defaultElements = createElements([
  { id: '1', label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'World', x: 100, y: 200, width: 100, height: 50 },
]);
// Define a Redux slice for managing elements (nodes)
const elementsSlice = createSlice({
  name: 'elements',
  initialState: defaultElements,
  reducers: {
    // Add a new element to the state
    addElement: (state, action) => {
      state.push(action.payload);
    },
    resetToDefault: () => {
      return defaultElements;
    },
    removeLast: (state) => {
      state.pop();
    },
    // Replace all elements in the state
    setElements: (_, action) => {
      return action.payload;
    },

    addTwoRandomElements: (state) => {
      state.push(
        {
          id: Math.random().toString(36).slice(7),
          label: 'Random 1',
          x: Math.random() * 200,
          y: Math.random() * 200,
          width: 100,
          height: 50,
        },
        {
          id: Math.random().toString(36).slice(7),
          label: 'Random 2',
          x: Math.random() * 200,
          y: Math.random() * 200,
          width: 100,
          height: 50,
        }
      );
    },
  },
});

// Define a Redux slice for managing links (edges)
const linksSlice = createSlice({
  name: 'links',
  initialState: createLinks([
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      attrs: {
        line: {
          stroke: PRIMARY, // Use the primary color from the theme
        },
      },
    },
  ]),
  reducers: {
    // Add a new link to the state
    resetLinkToDefault: () => {
      return createLinks([
        {
          id: 'e1-2',
          source: '1',
          target: '2',
          attrs: {
            line: {
              stroke: PRIMARY, // Use the primary color from the theme
            },
          },
        },
      ]);
    },
    // Replace all links in the state
    setLinks: (state, action) => {
      return action.payload;
    },
    removeLinks: () => {
      return [];
    },
  },
});

// Extract actions from the elements slice
const { addElement, setElements, resetToDefault, removeLast, addTwoRandomElements } =
  elementsSlice.actions;
const { resetLinkToDefault, setLinks, removeLinks } = linksSlice.actions;

// Configure the Redux store with the elements and links reducers
const store = configureStore({
  reducer: {
    elements: elementsSlice.reducer,
    links: linksSlice.reducer,
  },
});

// Define the RootState type for use with selectors
type RootState = ReturnType<typeof store.getState>;

// Infer the type of a custom element from the elements state
type CustomElement = InferElement<RootState['elements']>;

// Component to render a custom node (element)
function RenderItem(props: CustomElement) {
  const { label, width, height } = props;
  return (
    <foreignObject width={width} height={height}>
      {/* <MeasuredNode> */}
      <div className="node">{label}</div>
      {/* </MeasuredNode> */}
    </foreignObject>
  );
}

// Component to render the Paper and provide a button to add elements via the graph
function PaperApp() {
  const graph = useGraph(); // Access the graph instance

  const commandManager = useRef(new dia.CommandManager({ graph }));
  return (
    <div className="flex flex-col ">
      {/* Render the Paper component */}
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RenderItem} />
      {/* Button to add a new element directly via the graph */}
      <div className="flex flex-row">
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() =>
            store.dispatch(
              addElement({
                id: Math.random().toString(36).slice(7), // Generate a random ID
                label: 'New Node',
                x: Math.random() * 200, // Random x-coordinate
                y: Math.random() * 200, // Random y-coordinate
                width: 100,
                height: 50,
              } as CustomElement)
            )
          }
        >
          Add Element Via redux
        </button>
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            store.dispatch(removeLinks());
            store.dispatch(removeLast());
          }}
        >
          Remove Last via Redux
        </button>
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            setElementsViaGraph({
              graph,
              elements: defaultElements,
            });
            setLinksViaGraph({
              graph,
              links: createLinks([
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
              ]),
            });
          }}
        >
          Reset elements via dia.Graph
        </button>
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            store.dispatch(resetToDefault());
            store.dispatch(resetLinkToDefault());
          }}
        >
          Reset elements via Redux
        </button>

        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            store.dispatch(addTwoRandomElements());
          }}
        >
          Add two random elements Redux
        </button>

        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            commandManager.current.undo();
          }}
        >
          Undo
        </button>
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            commandManager.current.redo();
          }}
        >
          Redo
        </button>
      </div>
    </div>
  );
}

// Main component that connects the Redux store to the GraphProvider
function Main(props: Readonly<GraphProps>) {
  // Select links and elements from the Redux store
  const links = useSelector((state: RootState) => state.links);
  const elements = useSelector((state: RootState) => state.elements);

  return (
    <>
      {/* Provide the graph context with initial elements and links */}
      <GraphProvider
        {...props}
        initialLinks={links}
        initialElements={elements}
        onElementsChange={(items) => {
          // Dispatch an action to update elements in the Redux store
          store.dispatch(setElements(items));
        }}
        onLinksChange={(items) => {
          store.dispatch(setLinks(items));
        }}
      >
        <PaperApp />
      </GraphProvider>
    </>
  );
}

// Root component that wraps the application with the Redux Provider
export default function App() {
  return (
    <Provider store={store}>
      <Main />
    </Provider>
  );
}

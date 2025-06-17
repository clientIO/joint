<div style="display:flex;align-items:center;background:#131E29;padding:1.5rem 1rem 1.5rem 1rem;margin-bottom:2rem;">
  <img src="https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg" alt="JointJS Logo" height="56" style="margin-right:1.5rem;display:inline-block;" />
</div>

# @joint/react

A React library for building interactive diagrams, flowcharts, and graph-based visualizations. This library provides React components and hooks that wrap JointJS, making it easy to create powerful diagramming applications.

## What can you build with @joint/react?

- 📊 Flowcharts and process diagrams
- 🌐 Network topology visualizations
- 🧠 Mind maps and organization charts
- ⚙️ State machines and workflow editors
- 📈 Any interactive connected graphs

## Why @joint/react?

- 🎯 **React-First**: React components and hooks for modern React applications
- 🔌 **Easy Integration**: Simple drop-in components with minimal setup
- 🎨 **Customizable**: Full control over node and link appearances
- ⚡ **Interactive**: Built-in support for dragging, connecting, and editing
- 🎭 **Type-Safe**: Written in TypeScript with full type definitions

## Prerequisites

Before installing @joint/react, ensure you have:
- React 16.8+ (for Hooks support)
- Node.js 14+
- A modern browser (Chrome, Firefox, Safari, Edge)

## Installation

Install the library using your preferred package manager:

```sh
# Using npm
npm install @joint/react

# Using yarn
yarn add @joint/react

# Using bun
bun add @joint/react
```

## Documentation

The documentation is available online:
- [API reference](https://changelog.jointjs.com/joint/joint-react-api/index.html)
- [Storybook with examples](https://changelog.jointjs.com/joint/joint-react-storybook/?path=/docs/introduction--docs)

## Core Concepts

Before diving into the code, let's understand the basic building blocks:

- **Elements**: Nodes in your diagram (boxes, circles, or custom shapes)
- **Links**: Connections between elements (lines, arrows, or custom connectors)
- **Paper**: The canvas (UI) where your diagram is rendered
- **Graph**: The data model that holds your diagram's structure

## Quick Start

Here's a complete example of a simple diagram with two connected nodes:

```tsx
import React, { useCallback } from 'react';
import { GraphProvider, Paper, createElements, createLinks } from '@joint/react';

// Define your diagram elements (nodes)
const initialElements = createElements([
  {
    id: '1',
    label: 'Start',
    x: 100,      // Position from left
    y: 50,       // Position from top
    width: 120,
    height: 60
  },
  {
    id: '2',
    label: 'End',
    x: 100,
    y: 200,
    width: 120,
    height: 60
  },
]);

// Define connections between elements
const initialLinks = createLinks([
  {
    id: 'link1',
    source: '1',  // ID of source element
    target: '2'   // ID of target element
  }
]);

// Main component that renders the diagram
function DiagramExample() {
  // Define how each element should look
  const renderElement = useCallback((element) => (
    <div style={{
      padding: '10px',
      border: '2px solid #3498db',
      borderRadius: '8px',
      background: 'white'
    }}>
      {element.label}
    </div>
  ), []);

  return (
    <div style={{ height: '400px', border: '1px solid #ccc' }}>
      <Paper
        initialElements={initialElements}
        width="100%"
        height="100%"
        renderElement={renderElement}
        useHTMLOverlay
      />
    </div>
  );
}

// Wrap your app with GraphProvider
export default function App() {
  return (
    <GraphProvider
      initialElements={initialElements}
      initialLinks={initialLinks}
    >
      <DiagramExample />
    </GraphProvider>
  );
}
```

## Event Handling

@joint/react provides various events to handle user interactions:

```tsx
function DiagramExample() {
  const handleElementClick = useCallback((element) => {
    console.log('Element clicked:', element);
  }, []);

  return (
    <Paper
      width="100%"
      height="100%"
      onElementPointerClick={handleElementClick}
    />
  );
}
```

## TypeScript Support

@joint/react is written in TypeScript and includes comprehensive type definitions. Here's an example of using types:

```tsx
import { InferElement } from '@joint/react';

const elements = createElements([
  { id: '1', label: 'Node', x: 0, y: 0, width: 100, height: 40 }
]);

type CustomElement = InferElement<typeof elements>;

const renderElement = (element: CustomElement) => (
  <div>{element.label}</div>
);
```

## Performance Considerations

To ensure optimal performance:

1. **Memoization**
```tsx
// Memoize render functions
const renderElement = useCallback((element) => {
  return <CustomNode element={element} />;
}, []);

// Memoize event handlers
const handleElementClick = useCallback((element) => {
  // Handle click
}, []);
```

## 📌 Core Components

### 1. **GraphProvider**
The `GraphProvider` component manages a shared [JointJS Graph instance](https://docs.jointjs.com/api/dia/Graph/) to handle the state of your diagram. Wrap it around any components that interact with the graph.

```tsx
import { GraphProvider } from '@joint/react';

<GraphProvider>
  {/* Components like Paper for rendering nodes and edges */}
</GraphProvider>
```

### 2. **Paper**
The `Paper` component wraps [JointJS Paper](https://docs.jointjs.com/learn/quickstart/paper/) to render nodes and links. Use the `renderElement` prop to define how nodes are displayed.

```tsx
import { Paper } from '@joint/react';

const renderElement = (element) => (
  <rect width={element.size().width} height={element.size().height} fill="cyan" />
);

<Paper width={800} height={600} renderElement={renderElement} />
```

### 3. **Rendering HTML Elements**
Although JointJS is SVG-based, you can render HTML content inside nodes using SVG's `<foreignObject>`:

```tsx
const renderElement = ({ width, height }) => (
  <foreignObject width={width} height={height}>
    <div style={{ background: 'lightgray' }}>
      HTML Content here
    </div>
  </foreignObject>
);
```

## 🛠️ Core Hooks and Utilities

### 🔹 Accessing Elements
- `useElements()`: Retrieve all diagram elements (requires `GraphProvider` context).
- `useElement()`: Retrieve individual element data, typically used within `renderElement`.

### 🔹 Modifying Elements
- `useUpdateElement()`: Update existing elements in the diagram.
- `useCreateElement()`: Create new elements in the diagram.
- `useRemoveElement()`: Remove elements from the diagram.

- `useCreateLink()`: Create new elements in the diagram.
- `useRemoveLink()`: Remove elements from the diagram.


### 🔹 Graph and Paper Instances
- `useGraph()`: Access the [dia.Graph](https://docs.jointjs.com/api/dia/Graph/) instance directly.
- `usePaper()`: Access the [dia.Paper](https://docs.jointjs.com/learn/quickstart/paper) instance directly.

### 🔹 Creating Nodes and Links
- `createElements()`: Utility for creating nodes.


```ts
import { createElements } from '@joint/react';

const initialElements = createElements([
  { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
]);
```

- `createLinks()`: Utility for creating links between nodes.

```ts
import { createLinks } from '@joint/react';

const initialLinks = createLinks([
  { source: '1', target: '2', id: '1-2' },
]);
```

---

## How It Works

Under the hood, **@joint/react** listens to changes in the `dia.Graph`, which acts as the single source of truth. When you update the graph—such as adding or modifying cells—the React components automatically observe and react to these changes, keeping the UI in sync.

Hooks like `useUpdateElement` provide a convenient way to update the graph, but you can also directly access the graph using `useGraph()` and call methods like `graph.setCells()`.

---

## Known Issues and Recommendations

### Avoid Certain CSS Properties in `<foreignObject>`
Some CSS properties can cause rendering issues in Safari when used inside an SVG `<foreignObject>`. To ensure compatibility, avoid the following properties:

- `position` (other than `static`)
- `-webkit-transform-style`
- `-webkit-backface-visibility`
- `transition`
- `transform`

### Recommended Workaround
If you need to use HTML inside an SVG with cross-browser support:

- Use minimal CSS inside `<foreignObject>`.
- Stick to static positioning and avoid CSS transforms.
- Consider overlaying HTML outside the SVG using absolute positioning.

### Flickering
React's asynchronous rendering can cause flickering when dynamically adding ports or resizing elements. We are aware of this issue and are working on a fix.

### Controlled Mode
Currently, **@joint/react** uses `useSyncExternalStore` to listen to graph changes. The graph is the source of truth, so `initialElements` and `initialLinks` are only used during initialization. To modify the state, update the graph directly using hooks like `useGraph`, `useUpdateElement`, or `useCreateElement`. A fully controlled mode is under development.

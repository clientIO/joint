# @joint/react

A React library for creating and managing interactive diagrams and graphs using JointJS.

## Overview

**@joint/react** is a React wrapper for [JointJS](https://www.jointjs.com/), designed to simplify the creation and management of interactive diagrams and graphs in React applications. It provides intuitive React components, hooks, and utilities to efficiently manage nodes, links, and user interactions.

## Installation

Install the library using your preferred package manager:

### Yarn
```sh
yarn add @joint/react
```

### Npm
```sh
npm install @joint/react
```

### Bun
```sh
bun add @joint/react
```

## Quick Start

Here’s a simple example to get started:

```tsx
import React, { useCallback } from 'react';
import { GraphProvider, Paper, createElements, createLinks } from '@joint/react';

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'Node 2', x: 100, y: 200, width: 100, height: 50 },
]);

const initialLinks = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

function Main() {
  const renderElement = useCallback(
    (element) => <div className="node">{element.label}</div>,
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" renderElement={renderElement} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultLinks={initialLinks} defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
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
- `useSetElement()`: Update existing elements in the diagram.

### 🔹 Graph and Paper Instances
- `useGraph()`: Access the [dia.Graph](https://docs.jointjs.com/api/dia/Graph/) instance directly.
- `usePaper()`: Access the [dia.Paper](https://docs.jointjs.com/learn/quickstart/paper) instance directly.

### 🔹 Creating Nodes and Links
- `createElements()`: Utility for creating nodes.

```ts
import { createElements } from '@joint/react';

const defaultElements = createElements([
  { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
]);
```

- `createLinks()`: Utility for creating links between nodes.

```ts
import { createLinks } from '@joint/react';

const defaultLinks = createLinks([
  { source: '1', target: '2', id: '1-2' },
]);
```

---

## How It Works

Under the hood, **@joint/react** listens to changes in the `dia.Graph`, which acts as the single source of truth. When you update the graph—such as adding or modifying cells—the React components automatically observe and react to these changes, keeping the UI in sync.

Hooks like `useSetElement` provide a convenient way to update the graph, but you can also directly access the graph using `useGraph()` and call methods like `graph.setCells()`.

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
Currently, **@joint/react** uses `useSyncExternalStore` to listen to graph changes. The graph is the source of truth, so `defaultElements` and `defaultLinks` are only used during initialization. To modify the state, update the graph directly using hooks like `useGraph`, `useSetElement`, or `useAddElement`. A fully controlled mode is under development.

---

## [API Reference](docs/README.md)

For more examples and detailed documentation, visit the [API Reference](docs/README.md).

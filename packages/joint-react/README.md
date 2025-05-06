# @joint/react

A React-based library for creating and managing graphical elements in JointJS.

## Overview

This package provides a set of components, hooks, and utilities for integrating JointJS with React applications. It enables developers to manage elements, links, and graphs efficiently using React patterns.

## Installation

Yarn
```sh
yarn add @joint/react
```
Npm
```sh
npm install @joint/react
```
Bun
```sh
bun add @joint/react
```

### Simple usage

```tsx
import React from 'react';
import { GraphProvider, Paper, PaperProvider, createElements, createLinks } from '@joint/react';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200, width: 100, height: 50 },
])
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }])


function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
    []
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" renderElement={renderElement} />
      <MiniMap />
    </div>
  )
}

export default function App() {
  return (
    <GraphProvider defaultLinks={initialEdges} defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
```


## 📌 Core Components

### 1. **GraphProvider**
- Establishes a shared [dia.Graph](https://docs.jointjs.com/api/dia/Graph/) instance for the diagram. Graph is responsible to handle state of the diagram.
- Required to wrap any component accessing graph data or manipulation methods.

```tsx
import { GraphProvider } from '@joint/react';

<GraphProvider>
  {/* Your paper (rendering nodes and edges) or other components go here */}
</GraphProvider>
```

### 2. **Paper**
- Wraps [dia.Paper](https://docs.jointjs.com/learn/quickstart/paper) for rendering diagram elements and links.
- Key prop `renderElement` accepts a function to render each diagram node:

```tsx
import { Paper } from '@joint/react';

const renderElement = (element) => (
  <rect width={element.size().width} height={element.size().height} fill="cyan" />
);

<Paper width="100%" height={600} renderElement={renderElement} />
```

### 3. **Rendering HTML Elements**
- JointJS is SVG-based; however, you can render HTML content using SVG's [`<foreignObject>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject):

```tsx
const renderElement = ({width, height}) => (
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
- `useElement()`: Access individual element data (used within `renderElement`).

### 🔹 Modifying Elements
- `useSetElement()`: Hook to update existing diagram elements.

### 🔹 Graph and Paper Instances
- `useGraph()`: Direct access to the [dia.Graph](https://docs.jointjs.com/api/dia/Graph/) instance.
- `usePaper()`: Direct access to the [dia.Paper](https://docs.jointjs.com/learn/quickstart/paper) instance - paper is UI for the graph with important `renderElement` prop.

### 🔹 Creating Nodes and Links
- `createElements()`: Helper to generate diagram nodes.
```ts
import { createElements } from '@joint/react';

const defaultElements = createElements([{ id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 }]);
  ```
- `createLinks()`: Helper to create connections between nodes.
```ts
import { createLinks } from '@joint/react';
  
const defaultLinks = createLinks([{ source: '1', target: '2', id: '1-2' }]);
```
---


## [API Reference](docs/README.md)


More examples and documentation can be found in the [API Reference](docs/README.md).





### Missing docs:
1. use links



## Avoid Certain CSS Properties in `<foreignObject>`

Developers have observed that some CSS properties can cause rendering issues in Safari when used inside an SVG `<foreignObject>`. To improve compatibility, it's recommended to **avoid** the following properties within `<foreignObject>` elements:

- `position` (other than `static`)
- `-webkit-transform-style`
- `-webkit-backface-visibility`
- `transition`
- `transform`

These styles can lead to unpredictable behavior, layout issues, or elements not being rendered at all in Safari and other WebKit-based browsers.

### Recommended Workaround

If you must use HTML inside an SVG and need cross-browser support:

- Use only minimal, simple CSS inside `<foreignObject>`.
- Favor static positioning and avoid CSS transforms.
- Consider overlaying HTML outside the SVG using absolute positioning 

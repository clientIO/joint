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
      <Paper width={400} renderElement={renderElement} />
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


## [API Reference](docs/README.md)


More examples and documentation can be found in the [API Reference](docs/README.md).





### Missing docs:
1. use links
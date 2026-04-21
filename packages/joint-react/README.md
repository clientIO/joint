<p align="center">
  <img src="https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg" alt="JointJS" height="56" />
</p>

<h1 align="center">@joint/react</h1>

<p align="center">
  <strong>React-first diagramming.</strong> Build flowcharts, workflows, network maps, and graph UIs with an idiomatic React API on top of JointJS.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/v/@joint/react?style=flat-square&color=0EA5E9" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/types/@joint/react?style=flat-square&color=3178C6" alt="types" /></a>
  <a href="https://bundlephobia.com/package/@joint/react"><img src="https://img.shields.io/bundlephobia/minzip/@joint/react?style=flat-square&color=8B5CF6" alt="bundle" /></a>
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/dm/@joint/react?style=flat-square&color=F59E0B" alt="downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@joint/react?style=flat-square&color=10B981" alt="license" /></a>
</p>

---

## Why @joint/react

| | |
|--|--|
| **🧩 Component API** | Compose `<GraphProvider>` and `<Paper>` — no imperative glue. |
| **🛡️ Strict TypeScript** | First-class types for elements, links, hooks, refs. |
| **🎨 Render anything** | SVG, `<foreignObject>`, or real HTML overlay. |
| **⚡ Reactive hooks** | `useElements`, `useLinks`, `useGraph` with stable selectors. |
| **🔁 Controlled or not** | Per-stream control: elements and links are independent. |
| **🧠 Battle-tested core** | Powered by JointJS — production diagrams since 2013. |

---

## Install

```bash
npm i @joint/react        # or
pnpm add @joint/react     # or
yarn add @joint/react     # or
bun add @joint/react
```

> Requires React **18+** and a modern browser.

---

## 60-second example

```tsx
import { GraphProvider, Paper, type ElementRecord, type LinkRecord } from '@joint/react'

type NodeData = { label: string }

const initialElements: Record<string, ElementRecord<NodeData>> = {
  start: {
    data: { label: 'Start' },
    position: { x: 100, y: 60 },
    size: { width: 120, height: 60 },
  },
  end: {
    data: { label: 'End' },
    position: { x: 100, y: 220 },
    size: { width: 120, height: 60 },
  },
}

const initialLinks: Record<string, LinkRecord> = {
  flow: { source: { id: 'start' }, target: { id: 'end' } },
}

export default function Flow() {
  return (
    <GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
      <Paper
        height={360}
        useHTMLOverlay
        renderElement={(data: NodeData) => (
          <div className="px-4 py-2 rounded-lg border border-blue-500 bg-white shadow">
            {data.label}
          </div>
        )}
      />
    </GraphProvider>
  )
}
```

---

## Core ideas

- **Elements (nodes)** carry `data`, `position`, and `size`. **Links (edges)** carry `data`, `source`, and `target`. Both are stored in a `Record<string, …>` keyed by ID.
- **`renderElement`** / **`renderLink`** receive only the `data` field — your custom payload. Layout (position, size) is read via `useElementSize` / `useElementPosition` inside the renderer.
- The **`GraphProvider`** component provides the graph context; **`Paper`** renders it.
- Elements and links are **independent streams** — each can be *controlled* or *uncontrolled* independently.
- Hooks like `useElements`, `useLinks`, `useGraph`, and `usePaper` read state from anywhere under the provider.

---

## Quick Start (TypeScript)

```tsx
import React from 'react'
import {
  GraphProvider,
  Paper,
  useElementSize,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react'

type NodeData = { label: string }

const initialElements: Record<string, ElementRecord<NodeData>> = {
  node1: {
    data: { label: 'Start' },
    position: { x: 100, y: 50 },
    size: { width: 120, height: 60 },
  },
  node2: {
    data: { label: 'End' },
    position: { x: 100, y: 200 },
    size: { width: 120, height: 60 },
  },
}

const initialLinks: Record<string, LinkRecord> = {
  link1: { source: { id: 'node1' }, target: { id: 'node2' } },
}

function RenderNode({ label }: NodeData) {
  const { width, height } = useElementSize()
  return (
    <foreignObject width={width} height={height}>
      <div style={{
        padding: 10,
        border: '2px solid #3498db',
        borderRadius: 8,
        background: '#fff',
      }}>
        {label}
      </div>
    </foreignObject>
  )
}

export default function App() {
  return (
    <GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
      <Paper height={360} renderElement={RenderNode} />
    </GraphProvider>
  )
}
```

---

## Idiomatic Patterns & Examples

### 1) Multiple views (canvas + minimap)

Share one diagram across views. Give each view a stable `id`.

```tsx
import React from 'react'
import { GraphProvider, Paper, type ElementRecord, type LinkRecord } from '@joint/react'

type NodeData = { label: string }

const initialElements: Record<string, ElementRecord<NodeData>> = {
  a: { data: { label: 'A' }, position: { x: 40,  y: 60  }, size: { width: 80, height: 40 } },
  b: { data: { label: 'B' }, position: { x: 260, y: 180 }, size: { width: 80, height: 40 } },
}

const initialLinks: Record<string, LinkRecord> = {
  'a-b': { source: { id: 'a' }, target: { id: 'b' } },
}

export function MultiView() {
  return (
    <GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
      <Paper id="main" height={420} />
      <div style={{ position: 'absolute', right: 16, bottom: 16 }}>
        <Paper id="mini" width={180} height={120} interactive={false} scale={0.25} />
      </div>
    </GraphProvider>
  )
}
```

### 2) SVG vs real HTML nodes

SVG with `<foreignObject>` keeps everything in one tree; `useHTMLOverlay` renders real HTML above the SVG for full CSS support.

```tsx
import { Paper, useElementSize } from '@joint/react'

// ForeignObject (SVG)
function SvgNode({ label }: { label: string }) {
  const { width, height } = useElementSize()
  return (
    <foreignObject width={width} height={height}>
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', background: '#eee' }}>
        {label}
      </div>
    </foreignObject>
  )
}

<Paper renderElement={SvgNode} />

// HTML overlay (React portal outside SVG)
<Paper
  useHTMLOverlay
  renderElement={({ label }: { label: string }) => (
    <div style={{ padding: 8, borderRadius: 8, background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}>
      {label}
    </div>
  )}
/>
```

### 3) Events & interactions

Subscribe to pointer events on elements/links via `Paper` props.

```tsx
<Paper
  onElementPointerClick={({ cellView }) => console.log('Clicked:', cellView.model.id)}
  onBlankPointerDown={() => console.log('Canvas mousedown')}
/>
```

### 4) Controlled updates (React state drives the graph)

Elements and links are **independent streams** — control either, both, or neither.

```tsx
import React, { useState } from 'react'
import { GraphProvider, Paper, type ElementRecord, type LinkRecord } from '@joint/react'

type NodeData = { label: string }

export function Controlled() {
  const [els, setEls] = useState<Record<string, ElementRecord<NodeData>>>({
    n1: {
      data: { label: 'Item' },
      position: { x: 60, y: 60 },
      size: { width: 100, height: 40 },
    },
  })
  const [lns, setLns] = useState<Record<string, LinkRecord>>({})

  return (
    <GraphProvider
      elements={els}
      onElementsChange={setEls}
      links={lns}
      onLinksChange={setLns}
    >
      <Paper height={320} />
    </GraphProvider>
  )
}
```

**Mixed mode.** Control just elements while letting JointJS own the links — or vice versa.

```tsx
<GraphProvider
  elements={els}              // controlled
  onElementsChange={setEls}
  initialLinks={initialLinks} // uncontrolled
>
  <Paper height={320} />
</GraphProvider>
```

**Notifications in uncontrolled mode.** `onElementsChange` and `onLinksChange` fire in *both* modes. In uncontrolled mode they are notification-only — your state is never pushed back to the graph.

```tsx
<GraphProvider
  initialElements={initialElements}
  onElementsChange={(els) => analytics.track('graph:update', els)}
>
  <Paper />
</GraphProvider>
```

### 5) Incremental change mode (Redux, Zustand, etc.)

`onIncrementalChange` is orthogonal to controlled/uncontrolled — it fires in any mode with granular `added` / `changed` / `removed` sets.

```tsx
import React from 'react'
import { GraphProvider, Paper, type ElementRecord, type IncrementalContainerChanges } from '@joint/react'

type NodeData = { label: string }

const initialElements: Record<string, ElementRecord<NodeData>> = {
  n1: {
    data: { label: 'Item' },
    position: { x: 60, y: 60 },
    size: { width: 100, height: 40 },
  },
}

export function IncrementalExample() {
  const handleChange = (changes: IncrementalContainerChanges<NodeData>) => {
    // Dispatch granular changes to your external store
    console.log('Changes:', changes)
  }

  return (
    <GraphProvider
      initialElements={initialElements}
      onIncrementalChange={handleChange}
    >
      <Paper height={320} />
    </GraphProvider>
  )
}
```

### 6) Programmatic cell manipulation

Use the `useSetElement`, `useSetLink`, `useRemoveElement`, and `useRemoveLink` hooks to programmatically add, update, and remove cells.

```tsx
import { useSetElement, useRemoveElement, type ElementRecord } from '@joint/react'

type NodeData = { label: string }

function CellActions() {
  const setElement = useSetElement<NodeData>()
  const removeElement = useRemoveElement()

  const addNode = () => {
    setElement('new-node', {
      data: { label: 'New Node' },
      position: { x: 100, y: 100 },
      size: { width: 120, height: 60 },
    } satisfies ElementRecord<NodeData>)
  }

  const updateNode = () => {
    setElement('new-node', (prev) => ({
      ...prev,
      data: { label: 'Updated' },
    }))
  }

  const deleteNode = () => {
    removeElement('new-node')
  }

  return (
    <div>
      <button onClick={addNode}>Add</button>
      <button onClick={updateNode}>Update</button>
      <button onClick={deleteNode}>Delete</button>
    </div>
  )
}
```

### 7) Imperative access (ref) for one-off actions

Useful for `fitToContent`, scaling, exporting.

```tsx
import React, { useEffect, useRef } from 'react'
import type { dia } from '@joint/core'
import { GraphProvider, Paper } from '@joint/react'

export function FitOnMount() {
  const paperRef = useRef<dia.Paper | null>(null)
  useEffect(() => {
    paperRef.current?.fitToContent({ padding: 20 })
  }, [])

  return (
    <GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
      <Paper ref={paperRef} />
    </GraphProvider>
  )
}
```

---

## Best practices

- **Type your data**: declare a `type NodeData = { … }` and use `ElementRecord<NodeData>` so `renderElement` is typed end-to-end.
- **Memoize renderers & handlers**: `useCallback` to minimize re-renders.
- **Keep overlay HTML lightweight**: prefer simple layout; avoid heavy transforms/animations in `<foreignObject>` (Safari can be picky).
- **Give each view a stable `id`** when rendering multiple `Paper` instances.
- **Prefer declarative first**: reach for hooks/props; use imperative APIs (refs/graph methods) for targeted operations only.
- **Accessing component instances via refs**: `Paper` forwards a ref to the underlying JointJS `dia.Paper` instance. `GraphProvider` forwards a ref to the underlying `dia.Graph`.
- **Choose the right mode**: default to uncontrolled (`initialElements` / `initialLinks`). Switch to controlled (`elements` + `onElementsChange`) only when React must own the source of truth — e.g. for undo/redo, persistence, or multi-store integration. Mix per stream as needed. Use `onIncrementalChange` for granular external-store sync (Redux, Zustand).
- **Use selectors efficiently**: when using `useElements` or `useLinks`, provide custom selectors and equality functions to minimize re-renders.
- **Batch updates**: the library automatically batches updates, but be mindful of rapid state changes in controlled mode.
- **Test in Safari early** when using `<foreignObject>`; fall back to `useHTMLOverlay` if needed.

> **Tip:** You can pass an existing JointJS `dia.Graph` into `GraphProvider` if you need to integrate with external data lifecycles or share a graph across multiple providers.

---

## Notes & caveats

- **`<foreignObject>` CSS** — avoid `position` (non-static), `transform`, `transition`, and certain `-webkit-*` properties inside SVG foreign objects; some browsers (especially Safari) may flicker or misrender. Consider `useHTMLOverlay` for complex HTML.
- **Performance** — favor memoized renderers, avoid heavy component trees inside `renderElement`.
- **Flicker** — rapid port/size changes can cause transient flickers while elements measure; we're improving defaults.

---

## Resources

- 📚 **Docs** — https://react.jointjs.com/api/index.html
- 🧪 **Storybook** — https://react.jointjs.com/learn/?path=/docs/introduction--docs
- 🐛 **Issues** — https://github.com/clientIO/joint/issues
- 📰 **Releases** — https://github.com/clientIO/joint/releases

---

## License

MIT

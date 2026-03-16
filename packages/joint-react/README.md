<div style="display:flex;align-items:center;background:#131E29;padding:1.25rem 1rem;margin-bottom:1.25rem;">
  <img src="https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg" alt="JointJS Logo" height="40" style="margin-right:1rem;display:inline-block;" />
</div>

# @joint/react

**React-first diagramming.** Build flowcharts, workflows, network maps, mind maps — any graph‑based UI — with an idiomatic React API on top of JointJS. Type‑safe, customizable, and production‑ready.

---

## ✨ Highlights

- **API** — Components and hooks, no imperative glue required.
- **TypeScript by default** — Written in TypeScript with full type definitions
- **Custom rendering** — SVG or real HTML with an overlay.
- **Interactive** — Dragging, connecting, selection, events.
- **Composable** — Multiple views per diagram / graph (e.g., canvas + minimap).

---

## 📦 Installation

### npm
```bash
npm install @joint/react
```

### yarn
```bash
yarn add @joint/react
```

### bun
```bash
bun add @joint/react
```

> Requires React 16.8+ and a modern browser (Chrome, Firefox, Safari, Edge).

---

## 🧭 Core Ideas

- **Elements (nodes)** and **links (edges)** are plain objects stored in a `Record<string, Data>` where the key is the ID.
- The **`GraphProvider`** component provides the graph context; **`Paper`** renders it.
- Use hooks like `useElements`, `useLinks`, `useGraph`, `usePaper` for reading/updating state.

---

## 🚀 Quick Start (TypeScript)

Elements and links are stored in a `Record<string, Data>` where the key is the ID.

```tsx
import React from 'react'
import { GraphProvider } from '@joint/react'

const elements = {
  'node1': { label: 'Start', x: 100, y: 50, width: 120, height: 60 },
  'node2': { label: 'End',   x: 100, y: 200, width: 120, height: 60 },
} as const

const links = {
  'link1': { source: 'node1', target: 'node2' },
} as const

// Narrow element type straight from the record:
type Element = typeof elements[keyof typeof elements]

export default function App() {
  return (
    <GraphProvider elements={elements} links={links}>
      <Paper
        
        height={360}
        useHTMLOverlay
        renderElement={(el: Element) => (
          <div style={{
            padding: 10,
            border: '2px solid #3498db',
            borderRadius: 8,
            background: '#fff'
          }}>
            {el.label}
          </div>
        )}
      />
    </GraphProvider>
  )
}
```

---

## 🧩 Idiomatic Patterns & Examples

### 1) Multiple views (canvas + minimap)
Share one diagram across views. Give each view a stable `id`.

```tsx
import React from 'react'
import { GraphProvider } from '@joint/react'

const elements = {
  'a': { label: 'A', x: 40,  y: 60,  width: 80, height: 40 },
  'b': { label: 'B', x: 260, y: 180, width: 80, height: 40 },
} as const

const links = {
  'a-b': { source: 'a', target: 'b' },
} as const

export function MultiView() {
  return (
    <GraphProvider elements={elements} links={links}>
      <Paper id="main"  height={420} />
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
// ForeignObject (SVG)
<Paper
  renderElement={({ width, height, label }) => (
    <foreignObject width={width} height={height}>
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', background: '#eee' }}>
        {label}
      </div>
    </foreignObject>
  )}
/>

// HTML overlay (React portal outside SVG)
<Paper
  useHTMLOverlay
  renderElement={({ label }) => (
    <div style={{ padding: 8, borderRadius: 8, background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}>
      {label}
    </div>
  )}
/>
```

### 3) Events & interactions
Subscribe to pointer events on elements/links.

```tsx
<Paper
  onElementPointerClick={(el) => console.log('Clicked:', el.id)}
  onBlankPointerDown={() => console.log('Canvas mousedown')}
/>
```

### 4) Controlled updates (React state drives the graph)
Pass `elements/links` + `onElementsChange/onLinksChange` to keep React in charge.

**React-controlled mode** gives you full control over graph state, enabling features like undo/redo, persistence, and integration with other React state management.

```tsx
import React, { useState } from 'react'
import { GraphProvider } from '@joint/react'

const initialElements = {
  'n1': { label: 'Item', x: 60, y: 60, width: 100, height: 40 },
} as const

const initialLinks = {} as const

export function Controlled() {
  const [els, setEls] = useState<Record<string, typeof initialElements[keyof typeof initialElements]>>({ ...initialElements })
  const [lns, setLns] = useState<Record<string, never>>({ ...initialLinks })

  return (
    <GraphProvider
      elements={els}
      links={lns}
      onElementsChange={setEls}
      onLinksChange={setLns}
    >
      <Paper height={320} />
    </GraphProvider>
  )
}
```

### 5) Incremental change mode (Redux, Zustand, etc.)
Use `onIncrementalChange` to get granular change events for integration with external stores.

```tsx
import React from 'react'
import { GraphProvider, type IncrementalStateChanges } from '@joint/react'

const initialElements = {
  'n1': { label: 'Item', x: 60, y: 60, width: 100, height: 40 },
} as const

export function IncrementalExample() {
  const handleChange = (changes: IncrementalStateChanges) => {
    // Dispatch granular changes to your external store
    console.log('Changes:', changes)
  }

  return (
    <GraphProvider
      elements={initialElements}
      onIncrementalChange={handleChange}
    >
      <Paper height={320} />
    </GraphProvider>
  )
}
```

### 6) Programmatic cell manipulation
Use the `useCellActions` hook to programmatically add, update, and remove cells.

```tsx
import { useCellActions } from '@joint/react'

function MyComponent() {
  const { set, remove } = useCellActions()

  const addNode = () => {
    set('new-node', {
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      label: 'New Node'
    })
  }

  const updateNode = () => {
    set('new-node', (prev) => ({
      ...prev,
      label: 'Updated'
    }))
  }

  const deleteNode = () => {
    remove('new-node')
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

### 7) Imperative access (ref) for one‑off actions
Useful for `fitToContent`, scaling, exporting.

```tsx
import React, { useEffect, useRef } from 'react'
import type { PaperContext } from '@joint/react'

export function FitOnMount() {
  const ref = useRef<PaperContext | null>(null)
  useEffect(() => {
    ref.current?.paper.fitToContent({ padding: 20 })
  }, [])

  return (
    <GraphProvider elements={elements} links={links}>
      <Paper ref={ref} />
    </GraphProvider>
  )
}
```

---


## 🧠 Best Practices

- **Type elements from data**: `type Element = typeof elements[keyof typeof elements]` — reuse data as your source of truth.
- **Memoize renderers & handlers**: `useCallback` to minimize re-renders.
- **Keep overlay HTML lightweight**: Prefer simple layout; avoid heavy transforms/animations in `<foreignObject>` (Safari can be picky).
- **Give each view a stable `id`** when rendering multiple `Paper` instances.
- **Prefer declarative first**: Reach for hooks/props; use imperative APIs (refs/graph methods) for targeted operations only.
- **Test in Safari early** when using `<foreignObject>`; fall back to `useHTMLOverlay` if needed.
- **Accessing component instances via refs**: Any component that accepts a `ref` (such as `Paper` or `GraphProvider`) exposes its instance/context via the ref. For `Paper`, the instance (including the underlying JointJS Paper) can be accessed via the `paperCtx` property on the ref object.
- **Choose the right mode**: Use uncontrolled mode for simple cases, React-controlled (`onElementsChange`/`onLinksChange`) for full state control, and incremental-controlled (`onIncrementalChange`) for integration with Redux/Zustand.
- **Use selectors efficiently**: When using `useElements` or `useLinks`, provide custom selectors and equality functions to minimize re-renders.
- **Batch updates**: The library automatically batches updates, but be mindful of rapid state changes in controlled mode.

---

> **Tip:** You can pass an existing JointJS `dia.Graph` into `GraphProvider` if you need to integrate with external data lifecycles or share a graph across multiple providers.

---

## 🐞 Notes & caveats

- **`<foreignObject>` CSS** — Avoid `position` (non‑static), `transform`, `transition`, and certain `-webkit-*` properties inside SVG foreign objects; some browsers (esp. Safari) may flicker or misrender. Consider `useHTMLOverlay` for complex HTML.
- **Performance** — Favor memoized renderers, avoid heavy component trees inside `renderElement`.
- **Flicker** — Rapid port/size changes can cause transient flickers while elements measure; we’re improving defaults.

---

## 🔗 Further reading

- API Reference & Guides: https://react.jointjs.com/api/index.html  
- Storybook & Examples: https://react.jointjs.com/learn/?path=/docs/introduction--docs

---

## 📝 License

MIT

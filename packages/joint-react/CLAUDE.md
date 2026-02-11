# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@joint/react` is the React bindings library for JointJS. It provides React components and hooks for building diagramming applications with JointJS, rendering diagram elements as React components via SVG foreignObject portals.

**Stack:** TypeScript 5.9, React 19 (peer: >=18 <20), esbuild (build), Vite (storybook/dev), Jest 30 + @testing-library/react (testing), ESLint 9 flat config, Storybook 10

## Common Commands

```bash
# Build (esbuild → dist/cjs, dist/esm, dist/types)
yarn build

# Run all checks (typecheck + lint + jest)
yarn test

# Run individual checks
yarn typecheck              # tsc --noEmit
yarn lint                   # ESLint
yarn lint-fix               # ESLint with auto-fix
yarn jest                   # Jest tests only

# Run a single test file
yarn jest --testPathPattern="use-elements"

# Run tests in watch mode
yarn jest --watch

# Storybook (dev server on :6006)
yarn storybook

# Build storybook
yarn build-storybook
```

## Architecture

### Three Control Modes

The library supports three state management modes, determined by props on `GraphProvider`:

1. **Uncontrolled** — Pass `elements`/`links` as initial data. The internal `GraphStore` owns state. No `onElementsChange`/`onLinksChange` callbacks.
2. **React-controlled** — Pass `onElementsChange`/`onLinksChange`. Changes flow through React state (`useState` setter pattern).
3. **External-store-controlled** — Pass `externalStore` prop. Integrates with Redux, Zustand, Jotai, etc.

### Component Tree

```
GraphProvider (provides GraphStoreContext)
  └── Paper (provides PaperStoreContext, renders canvas)
        ├── Element portals (React components rendered into SVG via foreignObject)
        └── Link portals (React components for link rendering)
```

### Key Source Directories

- **`src/components/`** — `GraphProvider` and `Paper` (the two public components), plus internal `Link`, `Port`, `TextNode`, `Highlighters`
- **`src/hooks/`** — Public hooks (`useGraph`, `usePaper`, `useElements`, `useLinks`, `useElement`, `useCellActions`, `useNodeSize`, `usePaperEvents`, etc.)
- **`src/store/`** — `GraphStore` (central state: elements, links, sync) and `PaperStore` (per-paper view state, portals, element sizing)
- **`src/models/`** — `ReactElement` (empty markup, React renders via portal), `ReactLink`, `ReactPaper` (extended `dia.Paper` with React view lifecycle)
- **`src/state/`** — Selectors (`mapElementAttributesToData`, `mapLinkAttributesToData`) and sync logic between JointJS models and React state
- **`src/types/`** — `GraphElement`, `GraphLink`, `PaperProps`, event types
- **`src/utils/`** — Joint JSX→markup conversion, event handling, scheduling, equality checks
- **`src/theme/`** — Default link theme and marker presets (arrow, circle, diamond, etc.)

### Data Flow

Elements and links are `Record<dia.Cell.ID, Data>` objects. GraphStore syncs these with JointJS `dia.Graph` models bidirectionally:

1. **React → JointJS:** `updateGraph()` diffs incoming records against current graph cells
2. **JointJS → React:** `stateSync` listens to model `change:*` events, maps attributes back to data via selectors, and flushes updates

### Rendering Pipeline

`Paper` renders elements via React portals into SVG `<foreignObject>` nodes managed by JointJS. `ReactElement` has empty `markup` — all visual content comes from the `renderElement` callback prop. Large graphs (>100 cells) use `useDeferredValue` for performance.

### Build Output

`build.ts` uses esbuild to produce:
- `dist/cjs/` — CommonJS (bundled)
- `dist/esm/` — ES modules (bundled)
- `dist/types/` — TypeScript declarations (via `tsc --project tsconfig.types.json`)

External deps (react, react-dom, @joint/core, use-sync-external-store) are excluded from bundles.

## Test Setup

- **Framework:** Jest 30 with jsdom environment
- **Transform:** @swc/jest for TypeScript/JSX
- **Test location:** `src/**/__tests__/*.test.ts(x)`
- **Mocks:** `__mocks__/jest-setup.ts` provides SVG DOM stubs (SVGPathElement, SVGAngle, SVGMatrix, ResizeObserver)
- **Module aliases:** `@joint/react` → `src/index.ts`, `src/*` → `<rootDir>/src/*`

## Key Patterns

- **Portal-based rendering:** React components render into SVG foreignObject nodes owned by JointJS Paper
- **Context hierarchy:** `GraphStoreContext` → `PaperStoreContext` → `CellIdContext` (nested providers)
- **Selector subscriptions:** Hooks accept `selector` and `equalityFn` params for fine-grained reactivity (similar to Redux `useSelector`)
- **Imperative escape hatch:** `Paper` forwards ref to expose `PaperStore` for imperative operations
- **Scheduler-based batching:** State flushes are batched via a microtask scheduler to avoid excessive re-renders

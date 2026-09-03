# @joint/react

## 4.3.5

### Patch Changes

- <Paper /> - fix links connected to other links staying permanently hidden (the link-end readiness check only looked the end up among the elements) (22422ef3)

## 4.3.4

### Patch Changes

- <Paper /> - fix events dispatched at the paper container itself being guarded as portaled content (20aa3e23)

## 4.3.3

### Patch Changes

- fix stale cell keys when a single commit swaps ids without changing the count (membership changes now notify key-list subscribers, and large-graph rendering no longer defers id updates) (634fb9f1)
- link routing - account for the arrowhead when a custom link anchor is used (68a47586)
- <Paper /> - support interactive controls (buttons, inputs) nested inside magnets without the press starting a link drag or an element move (68a47586)
- useCell - tolerate a cell removed from the graph mid-render (68a47586)
- useCombinedRef - assign the forwarded ref during the commit phase (68a47586)
- useMarkup - tolerate a cell view whose markup has not been rendered yet (synchronous rendering in development) (68a47586)
- Updated dependencies (0a2991b6, 68a47586, 54d98005)
  - @joint/core@4.3.2

## 4.3.2

### Patch Changes

- <Paper /> - fix the visual grid to redraw reactively when `drawGrid`, `drawGridSize`, or `gridSize` change
- Updated dependencies
  - @joint/core@4.3.1

## 4.3.1

### Patch Changes

- useCreateFeature - fix duplicate paper feature registration under React 18 StrictMode causing interactions to fire twice
- useCells - fix ghost cells reported after `resetCells()`

## 4.3.0

### Minor Changes

- new package - idiomatic React components and hooks for JointJS, built directly on the core engine

### Patch Changes

- Updated dependencies
  - @joint/core@4.3.0

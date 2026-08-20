# @joint/react

## 4.3.3

### Patch Changes

- 634fb9f: fix stale cell keys when a single commit swaps ids without changing the count (membership changes now notify key-list subscribers, and large-graph rendering no longer defers id updates)
- 68a4758: link routing - account for the arrowhead when a custom link anchor is used
- 68a4758: <Paper /> - support interactive controls (buttons, inputs) nested inside magnets without the press starting a link drag or an element move
- 68a4758: useCell - tolerate a cell removed from the graph mid-render
- 68a4758: useCombinedRef - assign the forwarded ref during the commit phase
- 68a4758: useMarkup - tolerate a cell view whose markup has not been rendered yet (synchronous rendering in development)
- Updated dependencies [0a2991b]
- Updated dependencies [68a4758]
- Updated dependencies [54d9800]
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

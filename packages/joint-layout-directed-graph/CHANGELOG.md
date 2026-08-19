# @joint/layout-directed-graph

## 4.3.0

### Patch Changes

- Updated dependencies
  - @joint/core@4.3.0

## 4.2.5

### Patch Changes

- Updated dependencies
  - @joint/core@4.2.5

## 4.2.3

### Patch Changes

- layout.DirectedGraph - fix to accept a padding object for `clusterPadding` option of `layout()`
- Updated dependencies
  - @joint/core@4.2.3

## 4.2.2

### Patch Changes

- layout.DirectedGraph - ignore cell layers in the layout
- Updated dependencies
  - @joint/core@4.2.2

## 4.2.0

### Minor Changes

- layout.DirectedGraph - support `clusterPadding: 'default'`
- layout.DirectedGraph - expose Dagre `disableOptimalOrderHeuristic` and `customOrder` options

### Patch Changes

- Updated dependencies
  - @joint/core@4.2.0

## 4.1.4

### Patch Changes

- layout.DirectedGraph - fix `resizeClusters` option logic to only resize top-level clusters whose children were provided to the `layout()` function

## 4.1.3

### Patch Changes

- layout.DirectedGraph - fix to accept `0` value for `nodesep`, `edgesep`, `ranksep` options of `layout()`

## 4.1.1

### Patch Changes

- Updated dependencies
  - @joint/core@4.1.1

## 4.1.0

### Minor Changes

- layout.DirectedGraph - add `graph` option to `fromGraphLib()`

### Patch Changes

- Updated dependencies
  - @joint/core@4.1.0

## 4.0.3

### Patch Changes

- fix distributed `package.json` by resolving `@joint/core` workspace dependency

## 4.0.2

### Patch Changes

- Updated dependencies
  - @joint/core@4.0.2

## 4.0.1

### Patch Changes

- change the constraint on `@joint/core` dependency to allow patches only
- Updated dependencies
  - @joint/core@4.0.1

## 4.0.0

### Major Changes

- move the `DirectedGraph` layout into separate package

### Patch Changes

- upgrade `dagre` to version `1.0.4` (free from `lodash` dependency)
- Updated dependencies
  - @joint/core@4.0.0

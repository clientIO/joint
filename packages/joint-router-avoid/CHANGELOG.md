# @joint/router-avoid

## 4.3.5

### Patch Changes

- MainThreadProvider - free the avoid router and everything added to it on `destroy()` (ba0b3de3)
- update `libavoid-js` to v0.5 (63a777fa)
- WorkerProvider - fix to delete a shape added and removed within one debounced batch (ba0b3de3)
- Updated dependencies (62056500, 4c593a4d, f3ce7a25, ba41299e)
  - @joint/core@4.3.5

## 4.3.3

### Patch Changes

- RouterService - a `routeAll()`/`routeSubgraph()` pass still queued when `start()` is called now resolves as `cancelled` instead of running after `start()`'s full sync and resetting the engine to the pass's subset under the live graph listener - a crash path, since the listener referencing an element the engine no longer held aborted the WASM module irrecoverably (f66524f5)
- MainThreadProvider - fire `processed` (and so the RouterService `idle` event) after every incremental change, not only after a full sync, matching the Worker provider's behaviour (9651d0d4)
- Updated dependencies (f7455fd9)
  - @joint/core@4.3.3

## 4.3.2

### Patch Changes

- Initial release - automatic obstacle-avoiding orthogonal link routing via libavoid (WASM), with main-thread and Web Worker providers (54d98005)
- Updated dependencies (0a2991b6, 68a47586, 54d98005)
  - @joint/core@4.3.2

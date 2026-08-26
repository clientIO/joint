---
"@joint/router-avoid": patch
---

RouterService - a `routeAll()`/`routeSubgraph()` pass still queued when `start()` is called now resolves as `cancelled` instead of running after `start()`'s full sync and resetting the engine to the pass's subset under the live graph listener - a crash path, since the listener referencing an element the engine no longer held aborted the WASM module irrecoverably

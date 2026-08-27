---
"@joint/router-avoid": patch
---

MainThreadProvider - an error thrown by a consumer callback while avoid applies routes no longer aborts the WASM module; it is rethrown once the routing pass has returned

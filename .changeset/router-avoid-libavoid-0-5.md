---
"@joint/router-avoid": patch
---

upgrade `libavoid-js` to 0.5, which loads `libavoid.wasm` from next to its own module rather than relative to the page - pass `libavoidFilePath` when a bundler moves the module away from the binary

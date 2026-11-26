---
"@joint/router-avoid": patch
---

upgrade `libavoid-js` to 0.5, which loads `libavoid.wasm` from next to its own module rather than relative to the page, so bundlers such as webpack and Vite emit it as an asset without `libavoidFilePath`

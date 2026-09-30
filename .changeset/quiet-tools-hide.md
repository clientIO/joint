---
"@joint/core": patch
---

dia.ToolsView - fix a tool hidden with `hide()` right after `addTools()` reappearing when the update is deferred (e.g. `async: true`)

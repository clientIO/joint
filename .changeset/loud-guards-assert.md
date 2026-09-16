---
"@joint/router-avoid": minor
---

RouterService - add the `isSynchronous` getter (`true` with the main-thread provider, `false` with a Worker provider), so code that requires the synchronous routing guarantee can assert on it at startup instead of failing later with silently stale geometry

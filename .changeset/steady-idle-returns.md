---
"@joint/router-avoid": patch
---

MainThreadProvider - fire `processed` (and so the RouterService `idle` event) after every incremental change, not only after a full sync, matching the Worker provider's behaviour

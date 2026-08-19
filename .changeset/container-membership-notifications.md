---
"@joint/react": patch
---

fix stale cell keys when a single commit swaps ids without changing the count (membership changes now notify key-list subscribers, and large-graph rendering no longer defers id updates)

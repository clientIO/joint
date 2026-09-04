---
"@joint/react": patch
---

<GraphProvider /> - fix removed cells' records being resurrected by stale `layout:update` batches, breaking undo of a delete

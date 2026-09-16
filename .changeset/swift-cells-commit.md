---
"@joint/react": patch
---

<GraphProvider /> - rewrite the cells container as a lazy, memoised, Map-backed immutable snapshot: commits are O(change-set) instead of O(n), uncontrolled drags are ~2x faster and consumers receive stable array references

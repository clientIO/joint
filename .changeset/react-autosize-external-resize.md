---
"@joint/react": patch
---

`useMeasureElement` - fix a measured element sticking at a stale size after its size is written externally (controlled-mode sync, `cell.resize()`); the measurement pipeline now re-asserts the measured size from the current layout

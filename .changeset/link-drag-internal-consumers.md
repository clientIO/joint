---
"@joint/core": patch
---

dia.CellView - dragging a new link out of a magnet (`dragLinkStart()`), `elementTools.Connect`, `linkTools.Connect` and `linkTools.Arrowhead` are driven by `dia.LinkDrag`; the `add-link` / `arrowhead-move` batch now stops right after the end is connected, before `link:pointerup` is triggered, and `createLinkFromMagnet()` is added to build the link without adding it to the graph

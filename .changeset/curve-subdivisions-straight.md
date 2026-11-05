---
"@joint/core": patch
---

g.Curve - `getSubdivisions()` now recognizes straight curves with floating point noise in their control points (e.g. from `Curve.throughPoints()`), producing the intended number of subdivisions for them

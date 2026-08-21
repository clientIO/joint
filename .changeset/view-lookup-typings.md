---
"@joint/core": patch
---

types - view lookups (`cell.findView()`, `paper.findViewByModel()`, `paper.getCellView()`) now infer the view type from the model and include the absent-view case in the return type

---
"@joint/core": patch
---

mvc.Collection - store cids in a map separate from ids, so a model id in the cid namespace (e.g. `'c12'`) is never shadowed by another model's auto-generated cid — previously `graph.getCell()` could return the wrong cell or a newly added cell could be silently merged away as a duplicate

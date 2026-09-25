---
"@joint/core": patch
---

Vectorizer - `attr('style', ...)` applies the declaration through the CSSOM, so an inline style survives a Content Security Policy that forbids one

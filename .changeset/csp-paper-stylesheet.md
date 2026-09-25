---
"@joint/core": patch
---

dia.Paper - the stylesheet is adopted as a constructed stylesheet rather than injected as a `<style>` element, so it applies under a Content Security Policy that forbids inline styles, and papers sharing one adopt it once per document; a document that cannot adopt a stylesheet goes without one

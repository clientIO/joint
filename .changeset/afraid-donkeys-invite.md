---
'@joint/vitest-plugin-mock-svg': minor
---

the mocks now come from `@joint/mock-svg` and are plain functions rather than `vi.fn()` spies, so they survive `resetMocks` and friends - the plugin and the `/mocks` entry point are otherwise unchanged

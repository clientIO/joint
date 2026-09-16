---
"@joint/router-avoid": minor
---

initAvoidRouter - add the `worker.createWorker` option and the `@joint/router-avoid/worker` subpath export, so bundlers that do not transform Worker spawns inside dependencies (e.g. the Angular CLI esbuild builder) can spawn the routing Worker from application code

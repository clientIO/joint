// The script of a Web Worker running ELK, for `createWorkerElk()` - published as
// `@joint/layout-elk/worker`, so `elkjs` resolves from this package rather than from the
// app (which may not depend on it, or on another version of it). ELK's own worker script
// sets up the worker's message handling as soon as it's loaded.
import 'elkjs/lib/elk-worker.min.js';

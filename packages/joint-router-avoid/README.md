# JointJS Avoid Router

A module that routes *[JointJS](https://www.jointjs.com)* links using [libavoid](https://github.com/mjwybrow/libavoid), a C++ library for automatic, obstacle-avoiding orthogonal connector routing, compiled to WebAssembly via [libavoid-js](https://github.com/Aksem/libavoid-js).

This library fully depends on [JointJS](https://github.com/clientio/joint) (*>=4.0*), so please read its `README.md` before using this library.

libavoid maintains a single incremental router shared by the whole graph: it tracks every element as an obstacle and every link as a connector, and reroutes affected connectors whenever obstacles move. This package wraps that behavior in a `RouterService` that listens to a `dia.Graph` and, whenever libavoid computes a new route for a link, applies it directly to that link's `vertices` and source/target anchors - there is no `router: { name: ... }` attribute to set on links; once a link is connected to two elements on a routed graph, it is routed automatically. See [`examples/avoid-router-ts`](https://github.com/clientIO/joint/tree/master/examples/avoid-router-ts) for a full demo.

## 🚀 Quick Start

### Installation

```bash
npm install @joint/router-avoid
```

### Basic Usage

```ts
import { dia, shapes } from '@joint/core';
import { initAvoidRouter } from '@joint/router-avoid';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
});

// Loads the libavoid-js WebAssembly module (if not already loaded), then
// registers every element/link currently in the graph as an avoid
// obstacle/connector and keeps them in sync with future graph changes.
const routerService = await initAvoidRouter(graph, {
    shapeBufferDistance: 20,
    idealNudgingDistance: 10,
});

// ... add elements and links to the graph - links connected to two
// elements are picked up and routed automatically, no `router`
// attribute needed:
// new shapes.standard.Link({ source: { id: a.id }, target: { id: b.id } });

// Stop routing this graph and release the underlying resources
// (e.g. terminate a Worker thread) when they're no longer needed.
// routerService.destroy();
```

`initAvoidRouter()` resolves once the module is loaded and the current graph content has been registered with libavoid; the routes themselves are still computed asynchronously and applied as they come in - listen for the `link:routed` event to know when a specific link's route has settled (see below).

Loaded as a script tag rather than via ESM, the same functions are available as `joint.routers.avoid.initAvoidRouter` / `joint.routers.avoid.loadAvoidRouter` on the UMD build.

## 📖 API Reference

### `loadAvoidRouter(filePath?): Promise<void>`

Loads the `libavoid-js` WebAssembly module. `initAvoidRouter()` calls this automatically if the module isn't loaded yet, so calling it directly is only needed to preload the module ahead of time. Accepts an optional path to the `libavoid.wasm` file if it is not served from its default location. Safe to call multiple times - later calls resolve once the first load completes.

### `initAvoidRouter(graph, options?): Promise<RouterService>`

Loads the module (via `loadAvoidRouter()`, if needed), creates a `RouterService` for `graph`, and registers every element/link currently in the graph as an avoid obstacle/connector.

- `graph`: `dia.Graph` - the graph to route.
- `options?`: `InitAvoidOptions`

```ts
interface InitAvoidOptions {
    shapeBufferDistance?: number;  // Default: 10 - spacing added around shapes when computing obstacles, and used as the fallback route's margin around elements
    idealNudgingDistance?: number; // Default: 5 - spacing used to nudge apart overlapping connector segments
    useWorker?: boolean;           // Default: false - run libavoid inside a Web Worker instead of the main thread
    updateDebounceTime?: number;   // Default: 100 - worker only: ms to debounce queued graph updates by before flushing them to the worker
    libraryFilePath?: string;      // Forwarded to loadAvoidRouter()
    skipLink?: (params: { link: dia.Link }) => boolean;         // Exclude a link from being tracked as an avoid connector
    skipElement?: (params: { element: dia.Element }) => boolean; // Exclude an element from being tracked as an avoid obstacle
    // First refusal on a link avoid can't route because one of its ends
    // isn't connected to a tracked element ('unconnected') or is connected
    // to an element excluded via `skipElement` ('untracked-element').
    // Return true to take over routing that link yourself; otherwise the
    // built-in `rightAngle`-based fallback route is applied.
    interceptUnroutableLink?: (params: { link: dia.Link, reason: 'unconnected' | 'untracked-element' }) => boolean;
}
```

### `RouterService` (returned by `initAvoidRouter()`)

The object responsible for keeping libavoid's internal obstacle/connector graph in sync with the `dia.Graph`, applying computed routes to links, and emitting routing events. It mixes in JointJS's `mvc.Events` (`on`/`off`/`trigger`).

- `getRoute(linkId)` - the last route (an array of points, including source and target) computed for the link with that id, or `undefined` if none has been computed yet.
- `addGraphListeners()` / `removeGraphListeners()` - start/stop listening to graph changes (added/removed cells, moved/resized elements, reconnected links). Listening starts automatically when `initAvoidRouter()` resolves.
- `destroy()` - stops routing the graph and releases the resources held by the service and its provider (e.g. terminates a Worker thread). Do not use the instance afterwards.

**Events:**

- `link:pending` `(link)` - emitted when a link's route is (re-)computing.
- `link:routed` `(link, { fallback })` - emitted once a link's route has been applied. `fallback` is `true` when the applied route came from the built-in fallback rather than from libavoid.
- `link:pending:cancelled` `(link)` - emitted when a link with an open `link:pending` cycle becomes unroutable (e.g. disconnected) before libavoid produced a route for it.

## ⚠️ Caveats & Known Limitations

- **Asynchronous setup** - `initAvoidRouter()` loads the WebAssembly module and performs the initial graph sync asynchronously; it must be awaited before the graph is considered routed.
- **Bundler configuration** - `libavoid-js` ships its logic and the `libavoid.wasm` binary as separate files, and `useWorker: true` additionally loads this package's own worker script as a module. Consuming applications are responsible for ensuring both are served alongside the rest of the bundle (e.g. via a copy plugin for your bundler of choice).
- **Fallback routing** - libavoid does not expose a way to check whether a computed route is valid, so a heuristic is used. When the route is deemed invalid, or when a link isn't connected to elements on both ends, the built-in `rightAngle`-based fallback route is applied instead (unless `interceptUnroutableLink` takes over).
- **One `RouterService` per graph** - constructing more than one `RouterService` for the same `dia.Graph` results in both instances applying routes to the same links; call `destroy()` on a previous instance before creating a new one for the same graph.
- **Custom vertices (checkpoints)** are not currently supported.

## 📄 License

The code in this package is licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/).

Copyright © 2013-2026 client IO

This package depends on [`libavoid-js`](https://github.com/Aksem/libavoid-js), which is licensed under the [LGPL-2.1-or-later license](https://github.com/Aksem/libavoid-js?tab=LGPL-2.1-1-ov-file#readme).

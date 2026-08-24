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

Loads the module (via `loadAvoidRouter()`, if needed) and creates a `RouterService` for `graph`. The returned service is not started - call `start()` to keep the graph continuously routed, or `routeAll()`/`routeSubgraph()` for a one-shot routing pass.

- `graph`: `dia.Graph` - the graph to route.
- `options?`: `InitAvoidOptions`

```ts
interface InitAvoidOptions {
    shapeBufferDistance?: number;  // Default: 10 - spacing added around shapes when computing obstacles, and used as the fallback route's margin around elements
    idealNudgingDistance?: number; // Default: 5 - spacing used to nudge apart overlapping connector segments
    worker?: boolean | WorkerOptions; // Default: false - run libavoid inside a Web Worker instead of the main thread; pass an object to configure the Worker
    libavoidFilePath?: string;     // Forwarded to loadAvoidRouter()
    trackLink?: (params: { link: dia.Link }) => boolean;          // Which links to route; return false to exclude one. Default: all
    trackElement?: (params: { element: dia.Element }) => boolean; // Which elements to track as avoid obstacles; return false to exclude one. Default: all
    // First refusal on a link avoid can't route because one of its ends
    // isn't connected to a cell ('unconnected'), is connected to another
    // link ('unsupported'), or is connected to an element excluded via
    // `trackElement` ('untracked'). Return true to take over routing that
    // link yourself; otherwise the built-in `rightAngle`-based fallback
    // route is applied.
    interceptUnroutableLink?: (params: { link: dia.Link, reason: 'unconnected' | 'untracked' | 'unsupported' }) => boolean;
    // Override how computed route attributes are applied to a link, e.g. to
    // route the update through a command manager. Default: link.set()
    setRouteAttributes?: (params: { link, attributes, origin, routing, unroutableReason }) => void;
    changeFlag?: string;           // Default: 'avoidRouter' - name of the opt flag marking this router's own link.set() calls
}

interface WorkerOptions {
    debounceTime?: number; // Default: 100 - ms the Worker waits after the last received change before recomputing routes in a single batch; 0 applies every change immediately
}
```

### `RouterService` (returned by `initAvoidRouter()`)

The object responsible for keeping libavoid's internal obstacle/connector graph in sync with the `dia.Graph`, applying computed routes to links, and emitting routing events. It mixes in JointJS's `mvc.Events` (`on`/`off`/`trigger`).

- `start()` / `stop()` - start/stop listening to graph changes (added/removed cells, moved/resized elements, reconnected links). `start()` also syncs every cell the graph already holds.
- `isStarted` - whether the service is currently listening to its graph.
- `routeAll()` - one-shot: routes every cell currently in the graph, resolving once all routes are applied. No graph listener is attached. Throws while started. Resolves with a `RoutingResult` - `{ status: 'done' }`, or `{ status: 'cancelled' }` if the pass was interrupted by `destroy()`. Overlapping calls are queued and run one after another.
- `routeSubgraph(cells)` - one-shot: routes only `cells`, independently of the rest of the graph (cells outside the array are neither routed nor obstacles). Throws while started. Resolves with the same `RoutingResult` as `routeAll()`.
- `changeFlag` - the `opt` flag name marking this router's own `link.set()` calls, for filtering them out of your own `change` listeners.
- `destroy()` - stops routing the graph, cancels open routing cycles, and releases the resources held by the service and its provider (e.g. terminates a Worker thread). Do not use the instance afterwards.

**Events:**

- `link:routing` `(link)` - emitted when a link's route is (re-)computing.
- `link:routed` `(link, { origin, reason })` - emitted once a link's route has been applied. `origin` is `'avoid'` or `'fallback'`; `reason` is set when the fallback route was applied because the link was unroutable.
- `link:routing:cancelled` `(link)` - emitted when a link with an open `link:routing` cycle becomes unroutable (e.g. disconnected) before libavoid produced a route for it.
- `idle` `()` - emitted when there are no more open routing cycles.

## ⚠️ Caveats & Known Limitations

- **Asynchronous setup** - `initAvoidRouter()` loads the WebAssembly module and performs the initial graph sync asynchronously; it must be awaited before the graph is considered routed.
- **Bundler configuration** - `libavoid-js` ships its logic and the `libavoid.wasm` binary as separate files, and `worker: true` additionally loads this package's own worker script as a module. Consuming applications are responsible for ensuring both are served alongside the rest of the bundle (e.g. via a copy plugin for your bundler of choice).
- **Fallback routing** - libavoid does not expose a way to check whether a computed route is valid, so a heuristic is used. When the route is deemed invalid, or when a link isn't connected to elements on both ends, the built-in `rightAngle`-based fallback route is applied instead (unless `interceptUnroutableLink` takes over).
- **One `RouterService` per graph** - constructing more than one `RouterService` for the same `dia.Graph` results in both instances applying routes to the same links; call `destroy()` on a previous instance before creating a new one for the same graph.
- **Custom vertices (checkpoints)** are not currently supported.

## 📄 License

The code in this package is licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/), same as the rest of JointJS.

It depends on [`libavoid-js`](https://www.npmjs.com/package/libavoid-js), a WebAssembly build of [libavoid](https://github.com/mjwybrow/adaptagrams), which is licensed under the **GNU LGPL 2.1 or later** - applications shipping this package also ship the `libavoid.wasm` binary under that license. Keep the binary a separately served file (as described under bundler configuration above); don't configure your bundler to inline it into your application bundle.

Copyright © 2013-2026 client IO

This package depends on [`libavoid-js`](https://github.com/Aksem/libavoid-js), which is licensed under the [LGPL-2.1-or-later license](https://github.com/Aksem/libavoid-js?tab=LGPL-2.1-1-ov-file#readme).

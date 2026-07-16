# JointJS Libavoid Router

A module that routes *[JointJS](https://www.jointjs.com)* links using [libavoid](https://github.com/mjwybrow/libavoid), a C++ library for automatic, obstacle-avoiding orthogonal connector routing, compiled to WebAssembly via [libavoid-js](https://github.com/Aksem/libavoid-js).

This library fully depends on [JointJS](https://github.com/clientio/joint) (*>=4.0*), so please read its `README.md` before using this library.

Unlike the built-in `@joint/core` routers (e.g. `manhattan`, `rightAngle`), which route one link at a time, libavoid maintains a single incremental router shared by the whole graph: it tracks every element as an obstacle and every link as a connector, and reroutes affected connectors whenever obstacles move.

This package exposes that behavior as a [custom router](https://docs.jointjs.com/learn/features/diagram-basics/links/#custom-router), so it plugs into `@joint/core` the same way as any built-in router (`manhattan`, `rightAngle`, ...). See [`examples/libavoid-router`](https://github.com/clientIO/joint/tree/master/examples/libavoid-router) for a full demo.

## 🚀 Quick Start

### Installation

```bash
npm install @joint/routers-libavoid
```

### Basic Usage

The underlying WebAssembly module must be loaded once, asynchronously, before an `AvoidRouter` instance is created. The `libavoid` router is then registered like any other custom router:

```ts
import { dia, shapes, routers } from '@joint/core';
import { AvoidRouter, libavoid } from '@joint/routers-libavoid';

await AvoidRouter.load();

// Register the router under a name, so it can be referenced from links.
routers.libavoid = libavoid;

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
});

// ... add elements and links to the graph ...
// Links routed by libavoid must use the router by name:
// new shapes.standard.Link({ router: { name: 'libavoid' }, ... })

// Create the manager that tracks elements/links as libavoid
// obstacles/connectors for this graph, and computes their routes.
const avoidRouter = new AvoidRouter(graph, {
    shapeBufferDistance: 20,
    idealNudgingDistance: 10,
});

// Register every element and link currently in the graph, and route them.
avoidRouter.routeAll();

// Keep the router in sync with future graph changes.
avoidRouter.addGraphListeners();
```

Alternatively, the router can be used without registering it globally, by passing the function directly: `link.router(libavoid)`.

## 📖 API Reference

### `libavoid(vertices, args, linkView): dia.Point[]`

The router function itself, following the [custom router](https://docs.jointjs.com/learn/features/diagram-basics/links/#custom-router) signature. It looks up the `AvoidRouter` instance registered for the link's graph and returns the route currently computed by libavoid for that link. Falls back to the built-in `rightAngle` router when no `AvoidRouter` exists yet for the graph, or when the last computed libavoid route is not valid (see Caveats below).

### `AvoidRouter.load(wasmPath?): Promise<void>`

Loads the `libavoid-js` WebAssembly module. Must resolve before any `AvoidRouter` instance is created. Accepts an optional path to the `libavoid.wasm` file if it is not served from its default location.

### `new AvoidRouter(graph, options?)`

The manager responsible for keeping libavoid's internal obstacle/connector graph in sync with a `dia.Graph`, and for computing the routes that the `libavoid` router function reads.

- `graph`: `dia.Graph` - the graph to route.
- `options?`: `AvoidRouterOptions`

```ts
interface AvoidRouterOptions {
    idealNudgingDistance?: number; // Default: 10
    shapeBufferDistance?: number;  // Default: 0
    portOverflow?: number;         // Default: 0
    commitTransactions?: boolean;  // Default: true
}
```

### Instance Methods

- `routeAll()` - registers every element/link currently in the graph with the router and routes them.
- `addGraphListeners()` / `removeGraphListeners()` - keep the router in sync with graph changes (added/removed cells, moved/resized elements, reconnected links).
- `updateShape(element)` / `deleteShape(element)` - register/remove an obstacle.
- `updateConnector(link)` / `deleteConnector(link)` - register/remove a connector.
- `routeLink(link)` - recomputes and caches the libavoid route for a single link, and updates its anchors accordingly.
- `getRoute(link)` - the last route cached for a link (used by the `libavoid` router function).

## ⚠️ Caveats & Known Limitations

- **Asynchronous setup** - the WebAssembly module must be loaded with `AvoidRouter.load()` before use; this is asynchronous and must be awaited.
- **Bundler configuration** - `libavoid-js` ships its logic and the `libavoid.wasm` binary as separate files. Consuming applications are responsible for ensuring `libavoid.wasm` is served alongside the rest of the bundle (e.g. via a copy plugin for your bundler of choice).
- **Fallback routing** - libavoid does not expose a way to check whether a computed route is valid, so a heuristic is used. When the route is deemed invalid, the `libavoid` router falls back to the `rightAngle` router.
- **One `AvoidRouter` per graph** - constructing more than one `AvoidRouter` for the same `dia.Graph` replaces the instance used by the `libavoid` router function.
- **Custom vertices (checkpoints)** are not currently supported.

## 📄 License

The code in this package is licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/).

Copyright © 2013-2026 client IO

This package depends on [`libavoid-js`](https://github.com/Aksem/libavoid-js), which is licensed under the [LGPL-2.1-or-later license](https://github.com/Aksem/libavoid-js?tab=LGPL-2.1-1-ov-file#readme).

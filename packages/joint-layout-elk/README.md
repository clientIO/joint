# JointJS ELK Layout

A module for automatic layout of *[JointJS](https://www.jointjs.com)* graphs using the [Eclipse Layout Kernel (ELK)](https://www.eclipse.org/elk/), via its JavaScript port [elkjs](https://github.com/kieler/elkjs).

This library depends on [JointJS](https://github.com/clientio/joint) (*>=4.0*), so please read its `README.md` before using this library.

`layout()` is a one-off, asynchronous transform: it builds an ELK graph from a JointJS graph (embedded elements become nested containers at any depth, ports and link labels are included), runs ELK's layout algorithm, and writes the result (positions, sizes, link vertices/anchors, label positions) back onto the graph. It does not keep the graph laid out afterwards - call it again after further changes.

## 🚀 Quick Start

### Installation

```bash
npm install @joint/layout-elk
```

#### UMD build (script tags)

`dist/umd/index.js` keeps `@joint/core` and `elkjs` external - load both first: `@joint/core` as the `joint` global, and `elkjs/lib/elk.bundled.js` as the `ELK` global, which `layout()` runs on the main thread. The package then is `joint.layout.ELK`.

```html
<script src="node_modules/@joint/core/dist/joint.min.js"></script>
<script src="node_modules/elkjs/lib/elk.bundled.js"></script>
<script src="node_modules/@joint/layout-elk/dist/umd/index.min.js"></script>
<script>
    joint.layout.ELK.layout(graph).then(({ bbox }) => { /* ... */ });
</script>
```

### Basic Usage

```ts
import { dia, shapes } from '@joint/core';
import { layout } from '@joint/layout-elk';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
});

const rect1 = new shapes.standard.Rectangle({ id: 'a', size: { width: 80, height: 40 }, attrs: { label: { text: 'A' }}});
const rect2 = new shapes.standard.Rectangle({ id: 'b', size: { width: 80, height: 40 }, attrs: { label: { text: 'B' }}});
const link = new shapes.standard.Link({ source: { id: 'a' }, target: { id: 'b' }});

graph.addCells([rect1, rect2, link]);

const { bbox } = await layout(graph, {
    elkLayoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.edgeRouting': 'ORTHOGONAL'
    }
});
```

## 📖 API Reference

### `layout(graphOrCells, options?): Promise<LayoutResult>`

- `graphOrCells`: `dia.Graph | dia.Cell[]` - the graph to lay out, or the cells to lay out.
- `options?`: `LayoutOptions` - layout configuration (see below).

A list of cells is both the selection and the order:

- **Selection** - only the given elements are laid out. An element whose parent isn't given is laid out as a top-level element.
- **Links** - a link is laid out only if both of the elements it connects are given too. One that isn't - including a link connected to a point, to another link, or one that is in no graph, whose ends cannot be resolved at all - is left out of the layout entirely: no `exportLink` call, no route, and its vertices, anchors and label positions are left as they are.
- **Order** - the top-level elements follow the order they are given in, and so do each container's children. The links follow their order too, inside each container.
- Elements and links go in the same list, in any order - a link may come before the elements it connects. A cell listed more than once is laid out once.
- ELK identifies everything by a string, so two cells whose ids differ only in type - `5` and `'5'` - would share one id in the ELK graph. `layout()` rejects rather than lay one of them out and leave the other where it was. (Ports are unaffected: JointJS already treats `5` and `'5'` as the same port.)

The layout is applied in a single `'layout'` batch on the graph the cells belong to, so it emits one combined change rather than one per element, port and link. An element that is in no graph is laid out and positioned like any other, but contributes no change events - which makes it useful as a container that only exists to group others for the layout.

```ts
// Lay out a selection, with its embedded elements and the links between its elements.
// Everything else in the graph is left alone.
await layout(graph.getSubgraph(selectedElements, { deep: true }));
```

```ts
interface LayoutResult {
    bbox: g.Rect;      // Tight bounding box of the laid out graph
    elkGraph: ElkNode;  // The raw ELK layout result (e.g. for junction points)
}
```

### `LayoutOptions`

```ts
interface LayoutOptions {
    // The ELK instance to lay out with, e.g. one running in a Web Worker (see `createWorkerElk()` below).
    elk?: WorkerElk | ELK; // Default: a shared instance running on the main thread
    // ELK layout options, passed through to ELK unmodified.
    elkLayoutOptions?: ElkLayoutOptions; // Default: { 'elk.algorithm': 'layered', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.layered.considerModelOrder.portModelOrder': 'true', 'elk.json.edgeCoords': 'ROOT' }
    // Aborts the layout - `layout()` rejects with the signal's reason and applies nothing.
    signal?: AbortSignal;

    // Export callbacks (JointJS graph -> ELK graph) - see below.
    exportElement?: ExportElementCallback;
    exportPort?: ExportPortCallback;
    exportPortLabel?: ExportPortLabelCallback;
    exportLink?: ExportLinkCallback;
    exportLinkLabel?: ExportLinkLabelCallback;

    // Import callbacks (ELK layout result -> JointJS graph) - see below.
    setElementAttributes?: SetElementAttributesCallback;
    setPortAttributes?: SetPortAttributesCallback;
    setLinkAttributes?: SetLinkAttributesCallback;
}
```

### Export callbacks

Each receives an ELK draft already populated with what this package computed for that element/port/link/label, to mutate in place (e.g. to set `elk.*` `layoutOptions`). Returning `false` instead drops it from the ELK graph entirely - for `exportElement`, its whole subtree (embeds, ports, any connected edge) goes with it, and for `exportPort`, the links connected to that port, which ELK can no longer route to. A link left out this way keeps the route it already had.

```ts
type ExportElementCallback = (params: { element: dia.Element; elkNode: ElkNodeDraft }) => void | false;
type ExportPortCallback = (params: { portId: string; element: dia.Element; elkPort: ElkPortDraft }) => void | false;
type ExportPortLabelCallback = (params: { portId: string; element: dia.Element; elkPortLabel: ElkLabelDraft }) => void | false;
type ExportLinkCallback = (params: { link: dia.Link; elkEdge: ElkEdgeDraft }) => void | false;
type ExportLinkLabelCallback = (params: { link: dia.Link; labelIndex: number; elkEdgeLabel: ElkLabelDraft }) => void | false;
```

### Import callbacks

Each applies the ELK-computed attributes itself, in place of the package's own default (`element.set(...)`/`element.portProp(...)`/`link.set(...)`) - use one to redirect where the result goes, e.g. into a `transition()`.

```ts
type SetElementAttributesCallback = (params: { element: dia.Element; attributes: { position: dia.Point; size?: dia.Size }; elkNode: ElkNode }) => void;
type SetPortAttributesCallback = (params: { element: dia.Element; portId: string; attributes: { position: { args: dia.Point }; label?: { position: { args: dia.Point } } }; elkPort: ElkPort }) => void;
type SetLinkAttributesCallback = (params: { link: dia.Link; attributes: { vertices: dia.Point[]; source?: dia.Link.EndJSON; target?: dia.Link.EndJSON; labels?: dia.Link.Label[] }; elkEdge: ElkExtendedEdge }) => void;
```

### Running ELK in a Web Worker

By default, `layout()` runs ELK on the main thread - nothing to set up with a bundler or in Node, and it works anywhere (browsers, Node/SSR, tests, and the UMD build once `elkjs` is loaded - see "UMD build" above). ELK blocks the page while it runs, though: a few milliseconds for a small graph, but up to seconds for one with thousands of elements. To keep the page responsive, run ELK in a Web Worker instead - start one with `createWorkerElk()` and pass it to `layout()` as `elk`:

```ts
import { layout, createWorkerElk } from '@joint/layout-elk';

const elk = createWorkerElk(() => new Worker(new URL('@joint/layout-elk/worker', import.meta.url), { type: 'module' }));

await layout(graph, { elk });

// Once no longer needed.
elk.terminate();
```

#### `createWorkerElk(createWorker: () => Worker): WorkerElk`

`createWorker` starts the worker - running `@joint/layout-elk/worker`, the package's worker script (ELK's own, `elkjs/lib/elk-worker.min.js`). Starting it is up to you, since only your bundler knows where the script ends up:

- **webpack 5, Vite** (dev server and builds) - `new Worker(new URL('@joint/layout-elk/worker', import.meta.url), { type: 'module' })`, as above. Both bundle the worker script as a file of its own. With webpack, keep `output.publicPath` at `'auto'` (the default), so the file is found wherever the app is served from.
- **Vite** - also `import ElkWorker from '@joint/layout-elk/worker?worker'`, then `createWorkerElk(() => new ElkWorker())`.
- **No bundler** (e.g. the UMD build) - serve a copy of `elkjs/lib/elk-worker.min.js`, then `createWorkerElk(() => new Worker('/path/to/elk-worker.min.js'))`.

The returned `WorkerElk`:

- **Starts the worker on its first layout**, then lays out every graph in it, one at a time - share one instance between layouts.
- **Stops an aborted layout** (see `signal` below) by terminating the worker, if it is busy with it - a new worker takes over the layouts still waiting.
- **Rejects the layout the worker crashes during** (e.g. out of memory) - a new worker takes over the layouts still waiting.
- **Rejects every layout when the worker fails to load** (e.g. its script isn't served where `createWorker` starts it from) or can't be started (e.g. a CSP `worker-src` that blocks it) - with an error saying so, rather than running ELK on the main thread. The next layout tries again with a new worker.
- **`terminate()`** terminates the worker - layouts not settled yet are rejected, and a later layout starts a new worker.

Any other ELK instance works as `elk` too, e.g. `elkjs`'s own `new ELK({ workerUrl })` (`elkjs/lib/elk-api.js`) - without stopping an aborted layout, though (see below).

### Aborting a layout

`layout()` is asynchronous, so the graph may change while ELK is still computing - pass an `AbortSignal` to drop a layout that is no longer wanted (or takes too long). An aborted `layout()` rejects with the signal's reason (an `AbortError` `DOMException` by default) and applies nothing to the graph.

```ts
let controller: AbortController | undefined;

async function runLayout() {
    // Only the latest layout is applied.
    controller?.abort();
    controller = new AbortController();
    try {
        await layout(graph, { signal: controller.signal });
    } catch (error) {
        if ((error as Error).name !== 'AbortError') throw error;
    }
}

// Give up after 5 seconds.
await layout(graph, { signal: AbortSignal.timeout(5000) });
```

ELK can't stop a layout in progress, so a layout a `createWorkerElk()` worker is busy with is stopped by terminating the worker - a new one takes over the layouts still waiting. A layout on the main thread, or in any other `elk` instance, keeps running - only its result is ignored.

## ⚠️ Caveats & Known Limitations

- **Edge coordinates are graph-absolute** - `layout()` sets `elk.json.edgeCoords: 'ROOT'`, so ELK returns every edge's route points and labels relative to the root, whichever container the edge is in, and the default import applies them as they are. Overriding it (e.g. `'CONTAINER'`) is allowed, but the default import then misplaces vertices, end anchors and labels of edges inside containers - convert them yourself in `setLinkAttributes` (from `elkEdge`). The same applies to the raw `elkGraph` in `layout()`'s result.
- **Node labels are not supported** - ELK's node-label placement assumes labels are layout participants, whereas JointJS labels are attrs inside the shape. Link labels are supported.
- **Ports keep their JointJS-computed position by default** - every element with ports is exported with `elk.portConstraints: 'FIXED_POS'`, so ELK keeps each port where the element's port groups place it and edges route to/from that exact spot. Opt into ELK repositioning/reordering them by overriding it (e.g. `'FIXED_SIDE'`/`'FREE'`) in `exportElement` - setting it in `elkLayoutOptions` has no effect, since the per-node value takes precedence. `layout()` also defaults `elk.layered.considerModelOrder.portModelOrder` to `'true'`, so that a port freed this way keeps the order of the element's `ports.items`; override it in `elkLayoutOptions` to let ELK reorder them to reduce edge crossings.
- **Asynchronous** - unlike `@joint/layout-directed-graph`, `layout()` returns a `Promise`, since `elkjs` computes layouts asynchronously - even on the main thread.
- **Main thread by default** - without an `elk` option, ELK runs on the main thread and blocks the page while it runs - see "Running ELK in a Web Worker" above. In the ESM build, the main-thread copy of ELK (`elkjs/lib/elk.bundled.js`) is imported dynamically, so bundlers split it into a chunk of its own, only loaded by the first layout without an `elk` option. The UMD build can't load a chunk - it uses the `ELK` global instead, which the page has to load first (see "UMD build" above).

## 📄 License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

The code in this package is licensed under the Mozilla Public License 2.0, same as the rest of JointJS. It contains no ELK code: it only calls ELK through its API, and its TypeScript option types link to [ELK's option reference](https://eclipse.dev/elk/reference/options.html) instead of reproducing it.

It depends on [`elkjs`](https://github.com/kieler/elkjs), which is dual-licensed under the [Eclipse Public License 2.0](https://github.com/kieler/elkjs/blob/master/LICENSE.md) or GPL-3.0-or-later (`EPL-2.0 OR GPL-3.0-or-later`) - you can use it under the EPL-2.0. `elkjs` is installed as a regular dependency and kept external to this package's own builds (ESM and UMD) - it is never copied or inlined into them. An application that bundles this package does ship `elkjs` code though (the main-thread chunk, and the Web Worker file if it uses `@joint/layout-elk/worker`), under that license: keep `elkjs`'s license notice with it (e.g. with your bundler's license extraction), and note where its source is available (it is published on [GitHub](https://github.com/kieler/elkjs) and [npm](https://www.npmjs.com/package/elkjs)).

Copyright © 2013-2026 client IO

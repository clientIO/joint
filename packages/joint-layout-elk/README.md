# JointJS ELK Layout

A module for automatic layout of *[JointJS](https://www.jointjs.com)* graphs using the [Eclipse Layout Kernel (ELK)](https://www.eclipse.org/elk/), via its JavaScript port [elkjs](https://github.com/kieler/elkjs).

This library depends on [JointJS](https://github.com/clientio/joint) (*>=4.0*), so please read its `README.md` before using this library.

`layout()` is a one-off, asynchronous transform: it builds an ELK graph from a JointJS graph (embedded elements become nested containers at any depth, ports and link labels are included), runs ELK's layout algorithm, and writes the result (positions, sizes, link vertices/anchors, label positions) back onto the graph. It does not keep the graph laid out afterwards - call it again after further changes.

## 🚀 Quick Start

### Installation

```bash
npm install @joint/layout-elk
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

### `layout(graph, options?): Promise<LayoutResult>`

- `graph`: `dia.Graph` - the graph to lay out.
- `options?`: `LayoutOptions` - layout configuration (see below).

```ts
interface LayoutResult {
    bbox: g.Rect;      // Tight bounding box of the laid out graph
    elkGraph: ElkNode;  // The raw ELK layout result (e.g. for junction points)
}
```

### `LayoutOptions`

```ts
interface LayoutOptions {
    // A custom ELK instance, e.g. one configured to run inside a Web Worker.
    elk?: ELK; // Default: a shared, main-thread instance (`elkjs/lib/elk.bundled.js`)
    // ELK layout options, passed through to ELK unmodified.
    elkLayoutOptions?: ElkLayoutOptions; // Default: { 'elk.algorithm': 'layered', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.json.edgeCoords': 'ROOT' }
    // A name for the layout batch, grouping everything `layout()` applies into one graph change.
    batchName?: string; // Default: 'layout'

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

Each receives an ELK draft already populated with what this package computed for that element/port/link/label, to mutate in place (e.g. to set `elk.*` `layoutOptions`). Returning `false` instead drops it from the ELK graph entirely - for `exportElement`, its whole subtree (embeds, ports, any connected edge) goes with it.

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

## ⚠️ Caveats & Known Limitations

- **Edge coordinates are graph-absolute** - `layout()` sets `elk.json.edgeCoords: 'ROOT'`, so ELK returns every edge's route points and labels relative to the root, whichever container the edge is in, and the default import applies them as they are. Overriding it (e.g. `'CONTAINER'`) is allowed, but the default import then misplaces vertices, end anchors and labels of edges inside containers - convert them yourself in `setLinkAttributes` (from `elkEdge`). The same applies to the raw `elkGraph` in `layout()`'s result.
- **Node labels are not supported** - ELK's node-label placement assumes labels are layout participants, whereas JointJS labels are attrs inside the shape. Link labels are supported.
- **Ports keep their JointJS-computed position by default** - `layout()` only tells ELK where they already are, so edges route to/from the exact spot the element's port groups place them at. Opt into ELK repositioning/reordering them by setting `elk.portConstraints` (e.g. `'FIXED_SIDE'`/`'FREE'`) via `exportElement`/`exportPort`.
- **Asynchronous** - unlike `@joint/layout-directed-graph`, `layout()` returns a `Promise`, since `elkjs` computes layouts asynchronously (and, optionally, inside a Web Worker).
- **ID handling** - ELK requires string ids; element and link ids are converted with `` `${id}` `` internally, but never written back to the graph.

## 📄 License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

This package depends on [`elkjs`](https://github.com/kieler/elkjs), which is licensed under the [Eclipse Public License 2.0](https://github.com/kieler/elkjs/blob/master/LICENSE.md). It is installed automatically as a regular dependency, but is kept external to (never inlined into) this package's own UMD build.

Copyright © 2013-2026 client IO

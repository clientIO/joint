# JointJS ELK Layout

A module for automatic layout of *[JointJS](https://www.jointjs.com)* graphs using the [Eclipse Layout Kernel (ELK)](https://www.eclipse.org/elk/), via its JavaScript port [elkjs](https://github.com/kieler/elkjs).

This library fully depends on [JointJS](https://github.com/clientio/joint) (*>=4.0*), so please read its `README.md` before using this library.

`layout()` is a one-off, asynchronous transform - it computes a layout and writes the result (positions, link vertices, anchors and label positions) back onto the graph. It does not keep the graph laid out afterwards.

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
    layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.edgeRouting': 'ORTHOGONAL'
    }
});
```

## 📖 API Reference

### `layout(graph, options?): Promise<LayoutResult>`

- `graph`: `dia.Graph` - the graph to lay out. Elements embedded in another element are laid out as a container - the parent is resized (and positioned) by ELK to fit its content, at any nesting depth. By default (`positionPorts: 'fixed'`), ports are laid out at the position JointJS itself already computes for them (via the element's port groups) - ELK only uses that position to route edges to/from them; pass `positionPorts: 'fixed-side'` or `'free'` to let ELK reposition them instead (see below).
- `options?`: `Options` - Layout configuration (see below)

```ts
interface LayoutResult {
    bbox: g.Rect;      // Tight bounding box of the laid out graph
    elkGraph: ElkNode;  // The raw ELK layout result (e.g. for junction points, debugging)
}
```

### Options Interface

```ts
type GetSizeCallback = (element: dia.Element) => dia.Size;
type SetPositionCallback = (element: dia.Element, position: dia.Point) => void;
type SetVerticesCallback = (link: dia.Link, vertices: dia.Point[]) => void;
type SetAnchorCallback = (link: dia.Link, element: dia.Element, point: dia.Point, endType: 'source' | 'target') => void;
type SetLabelsCallback = (link: dia.Link, labelBBox: dia.BBox, points: dia.Point[], labelIndex: number) => void;
type NodeOptionsCallback = (element: dia.Element) => ElkLayoutOptions | undefined;
type PortOptionsCallback = (port: dia.Element.Port, element: dia.Element) => ElkLayoutOptions | undefined;
type EdgeOptionsCallback = (link: dia.Link) => ElkLayoutOptions | undefined;
type SetPortPositionCallback = (element: dia.Element, portId: string, position: dia.Point) => void;
// - 'fixed': ports stay exactly where JointJS's own port groups place them (`FIXED_POS`).
// - 'fixed-side': ELK may reposition/reorder ports along their group's assigned side (`FIXED_SIDE`).
// - 'free': ELK may reposition ports anywhere around their element (`FREE`).
type PortPositionsMode = 'fixed' | 'fixed-side' | 'free';

interface Options {
    // A custom ELK instance, e.g. one configured to run inside a Web Worker.
    elk?: ELK; // Default: a shared, main-thread instance (`elkjs/lib/elk.bundled.js`)
    // ELK layout options, passed through to ELK unmodified.
    layoutOptions?: ElkLayoutOptions; // Default: { 'elk.algorithm': 'layered' }
    // Whether to account for link labels during layout and position them afterwards.
    edgeLabels?: boolean; // Default: true
    // How freely ELK may reposition (and reorder) ports itself, instead of keeping
    // them at their JointJS-computed position - see "Letting ELK position ports" below.
    positionPorts?: PortPositionsMode | { mode?: PortPositionsMode; setPortPosition?: SetPortPositionCallback }; // Default: 'fixed'
    // Element sizing callback
    getSize?: GetSizeCallback; // Default: element.size()
    // Callbacks for customizing how the layout is applied
    setPosition?: SetPositionCallback; // Default: element.position(x, y)
    setVertices?: boolean | SetVerticesCallback; // Default: true
    setAnchor?: boolean | SetAnchorCallback; // Default: true
    setLabels?: boolean | SetLabelsCallback; // Default: true
    // Per-cell escape hatches into ELK's option space
    nodeOptions?: NodeOptionsCallback;
    portOptions?: PortOptionsCallback;
    edgeOptions?: EdgeOptionsCallback;
}
```

## 🎯 Examples

### Running ELK in a Web Worker

`elkjs` supports Web Workers natively. Pass your own `ELK` instance, configured with a `workerUrl` - the consumer controls bundling, since bundlers need the literal worker URL at the call site:

```ts
import ELK from 'elkjs/lib/elk-api.js';
import { layout } from '@joint/layout-elk';

const elk = new ELK({
    workerUrl: new URL('elkjs/lib/elk-worker.min.js', import.meta.url).href
});

// The instance can be reused across calls.
await layout(graph, { elk });

// Call this yourself once the instance is no longer needed.
elk.terminateWorker();
```

With no `elk` option, the package creates a default instance running on the main thread (`elkjs/lib/elk.bundled.js`). The public API is identical in both modes.

### Per-cell ELK options

```ts
layout(graph, {
    nodeOptions: (element) => ({ 'partitioning.partition': `${element.get('layer')}` }),
    layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.partitioning.activate': 'true'
    }
});
```

### Letting ELK position ports

By default (`positionPorts: 'fixed'`), ports stay exactly where JointJS's own port groups already place them - ELK only uses that position to route edges. Pass `positionPorts: 'fixed-side'` to let ELK reposition (and reorder) ports along the side their group already assigns them to, e.g. to minimize edge crossings, or `'free'` to let it place them on any side:

```ts
layout(graph, { positionPorts: 'fixed-side' });
```

This only takes visible effect for a port whose group renders it at a plain `x`/`y` (the `'absolute'` position) - `layout()` switches every port-bearing group to that position for you (its `attrs`/`markup`/`label` are left untouched), so this works regardless of how the group was originally configured (`'left'`, `'right'`, a custom callback, ...). To customize how a computed position is applied instead of the default `element.portProp(portId, ['position', 'args'], position)`, pass an object (`mode` defaults to `'fixed'` here too, so it still needs to be given explicitly):

```ts
layout(graph, {
    positionPorts: {
        mode: 'fixed-side',
        setPortPosition: (element, portId, position) => element.portProp(portId, ['position', 'args'], position)
    }
});
```

### Animated transitions

```ts
import { util } from '@joint/core';

layout(graph, {
    setPosition: (element, position) => {
        element.transition('position', position, {
            duration: 500,
            timingFunction: util.timing.cubic,
            valueFunction: util.interpolate.object
        });
    }
});
```

## ⚠️ Caveats & Known Limitations

- **Node labels are not supported** - ELK's node-label placement assumes labels are layout participants, whereas JointJS labels are attrs inside the shape. Link labels are supported (behind `edgeLabels`).
- **Ports keep their JointJS-computed position by default** (`positionPorts: 'fixed'`) - `layout()` only tells ELK where they already are (`elk.portConstraints: FIXED_POS`), so edges route to/from the exact spot the element's port groups place them at. Opt into ELK repositioning them with `positionPorts: 'fixed-side'`/`'free'` (see above).
- **Asynchronous** - unlike `@joint/layout-directed-graph`, `layout()` returns a `Promise`, since `elkjs` computes layouts asynchronously (and, optionally, inside a Web Worker).
- **ID handling** - ELK requires string ids; element and link ids are converted with `` `${id}` `` internally, but never written back to the graph.

## 📄 License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

This package depends on [`elkjs`](https://github.com/kieler/elkjs), which is licensed under the [Eclipse Public License 2.0](https://github.com/kieler/elkjs/blob/master/LICENSE.md). It is installed automatically as a regular dependency, but is kept external to (never inlined into) this package's own UMD build.

Copyright © 2013-2026 client IO

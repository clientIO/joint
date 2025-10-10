# JointJS MSAGL Layout

A module for automatic layout of *[JointJS](https://www.jointjs.com)* graphs using the [Microsoft Automatic Graph Layout (MSAGL)](https://github.com/microsoft/msagljs).

This library fully depends on [JointJS](https://github.com/clientio/joint) (*>=4.0*), so please read its `README.md` before using this library.

This library provides hierarchical (Sugiyama) layout with support for nested subgraphs and multiple edge routing modes.

## 🚀 Quick Start

### Installation

```bash
npm install @joint/layout-msagl
```

### Basic Usage

```ts
import { dia, shapes } from '@joint/core';
import { layout, EdgeRoutingMode } from '@joint/layout-msagl';

// Create your JointJS graph
const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
});
const rect1 = new shapes.standard.Rectangle({
    id: 'a',
    size: { width: 80, height: 40 },
    attrs: { label: { text: 'A' } }
});
const rect2 = new shapes.standard.Rectangle({
    id: 'b',
    size: { width: 80, height: 40 },
    attrs: { label: { text: 'B' } }
});
const link = new shapes.standard.Link({ source: { id: 'a' }, target: { id: 'b' } });

graph.addCells([rect1, rect2, link]);

// Or with custom options
layout(graph, {
    layerSeparation: 60,
    nodeSeparation: 30,
    edgeRoutingMode: EdgeRoutingMode.Rectilinear
});
```

## 📖 API Reference

### Main Functions

#### `layout(graphOrCells, options?): LayoutResult`

Main layout function with full customization options.

**Parameters:**
- `graphOrCells`: `dia.Graph | dia.Cell[]` - JointJS graph or array of cells to layout
- `options?`: `Options` - Layout configuration (see below)

**Returns:** `LayoutResult`

```ts
interface LayoutResult {
    bbox: g.Rect;           // Tight bounding box of the laid out graph
    msGraph: Graph;         // Underlying MSAGL graph data structure
    msGeomGraph: GeomGraph; // Geometry instance used by MSAGL to layout graph
}
```

### Options Interface

```ts
// Callback type definitions
type GetSizeCallback = (element: dia.Element) => dia.Size;
type GetLabelSizeCallback = (cell: dia.Cell) => dia.Size | undefined;
type SetPositionCallback = (element: dia.Element, position: dia.Point) => void;
type SetVerticesCallback = (link: dia.Link, vertices: dia.Point[]) => void;
type SetLabelsCallback = (link: dia.Link, labelBBox: dia.BBox, points: dia.Point[]) => void;
type SetAnchorCallback = (link: dia.Link, linkEndPoint: dia.Point, bbox: dia.BBox, endType: 'source' | 'target') => void;

interface Options {
    // Layout direction
    layerDirection?: LayerDirectionEnum; // Default: LayerDirectionEnum.TB
    // Spacing
    layerSeparation?: number; // Default: 40
    nodeSeparation?: number; // Default: 20
    // Edge routing
    edgeRoutingMode?: EdgeRoutingMode; // Default: EdgeRoutingMode.Rectilinear
    polylinePadding?: number; // Default: 1
    // Rectilinear self-loop offset
    // Vertical pixel offset applied to the two inner vertices of a self-edge
    // when edgeRoutingMode is Rectilinear. Default: 10
    rectilinearSelfEdgeOffset?: number;
    // Grid and margins
    gridSize?: number; // Default: 0
    marginX?: number; // Default: 10
    marginY?: number; // Default: 10
    clusterPadding?: { // Default: { left: 10, right: 10, top: 10, bottom: 10 }
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    // Element sizing callbacks
    getSize?: GetSizeCallback; // Default: element.size()
    getLabelSize?: GetLabelSizeCallback; // Default: element.get('labelSize')
    // Callbacks for customizing how the layout is applied
    setPosition?: SetPositionCallback; // Default: element.position(x, y)
    setVertices?: boolean | SetVerticesCallback; // Default: true
    setLabels?: boolean | SetLabelsCallback; // Default: true  
    setAnchor?: boolean | SetAnchorCallback; // Default: true
}
```

### Enums

#### `LayerDirectionEnum`
- `TB` - Top to Bottom (default)
- `BT` - Bottom to Top  
- `LR` - Left to Right
- `RL` - Right to Left

#### `EdgeRoutingMode`
- `Rectilinear` - Orthogonal edges with right angles (default)
- `SplineBundling` - Smooth curved edges

## 🎯 Examples

### Basic Hierarchical Layout

```ts
import { dia, shapes } from '@joint/core';
import { layout, LayerDirectionEnum, EdgeRoutingMode } from '@joint/layout-msagl';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
});

// Create elements
const elements = ['A', 'B', 'C', 'D'].map(id => 
    new shapes.standard.Rectangle({ 
        id, 
        size: { width: 80, height: 40 },
        attrs: { label: { text: id } }
    })
);

// Create links to form a hierarchy: A -> B, A -> C, B -> D, C -> D
const links = [
    new shapes.standard.Link({ source: { id: 'A' }, target: { id: 'B' } }),
    new shapes.standard.Link({ source: { id: 'A' }, target: { id: 'C' } }),
    new shapes.standard.Link({ source: { id: 'B' }, target: { id: 'D' } }),
    new shapes.standard.Link({ source: { id: 'C' }, target: { id: 'D' } })
];

graph.addCells([...elements, ...links]);

// Apply layout
const bbox = layout(graph, {
    layerDirection: LayerDirectionEnum.TB,
    layerSeparation: 50,
    nodeSeparation: 30,
    edgeRoutingMode: EdgeRoutingMode.Rectilinear
});
```

### Nested Subgraphs

```ts
import { dia, shapes } from '@joint/core';
import { layout } from '@joint/layout-msagl';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
});

const parent = new shapes.standard.Rectangle({ 
    id: 'parent',
    size: { width: 200, height: 150 }
});

const child1 = new shapes.standard.Rectangle({ 
    id: 'child1', 
    size: { width: 60, height: 30 } 
});

const child2 = new shapes.standard.Rectangle({ 
    id: 'child2', 
    size: { width: 60, height: 30 } 
});

// Embed children in parent
parent.embed(child1);
parent.embed(child2);

// Add internal link between children
const internalLink = new shapes.standard.Link({
    source: { id: 'child1' },
    target: { id: 'child2' }
});

graph.addCells([parent, child1, child2, internalLink]);

// Layout will automatically handle the subgraph
layout(graph);
```

### Edge Routing with Labels

```ts
import { dia, shapes } from '@joint/core';
import { layout } from '@joint/layout-msagl';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
});

const rect1 = new shapes.standard.Rectangle({
    id: 'A',
    size: { width: 80, height: 40 },
    attrs: { label: { text: 'A' } }
});

const rect2 = new shapes.standard.Rectangle({
    id: 'B',
    size: { width: 80, height: 40 },
    attrs: { label: { text: 'B' } }
});

// Set label size on links for proper label positioning
const link = new shapes.standard.Link({
    source: { id: 'A' },
    target: { id: 'B' },
    labels: [
        {
            attrs: {
                text: {
                    text: 'Label'
                }
            }
        }
    ],
    labelSize: { width: 80, height: 20 } // Required for label layout
});

graph.addCells([rect1, rect2, link]);

layout(graph);
```

### Custom Callbacks

```ts
import { dia, util } from '@joint/core';

layout(graph, {
    // Custom positioning with animation
    setPosition: (element: dia.Element, position: dia.Point) => {
        element.transition('position', position, {
            duration: 500,
            timingFunction: util.timing.cubic,
            valueFunction: util.interpolate.object
        });
    }
});
```

## 🔧 Advanced Features

### Label Positioning

The layout automatically positions labels on links and reserves space for element labels in subgraphs. Label sizing is controlled by the `getLabelSize` callback:

**Default behavior** - reads from the `labelSize` property:
```ts
link.set('labelSize', { width: 100, height: 20 });
parentElement.set('labelSize', { width: 120, height: 25 });
```

**Custom label sizing** - provide your own callback:
```ts
layout(graph, {
    getLabelSize: (cell) => {
        if (cell.isLink()) {
            // Calculate link label size based on text content
            const text = cell.label(0)?.attrs?.text?.text || '';
            return { width: text.length * 8, height: 20 };
        } else {
            // Calculate element label size
            const text = cell.attr('label/text') || '';
            return { width: text.length * 10, height: 25 };
        }
    }
});
```

If `getLabelSize` returns `undefined` for a cell, no space is reserved for its label.

## ⚠️ Caveats & Known Limitations

- **Rectilinear self‑loops** – When `edgeRoutingMode` is set to `Rectilinear`, self‑edges use a configurable vertical offset controlled by `rectilinearSelfEdgeOffset` (default `10`). This is a stop‑gap until upstream `msagljs` provides native rectilinear self‑loop geometry.
- **Subgraph resizing** – Parent elements that embed other elements are resized by the layout to tightly pack all their children.
- **Subgraph layout direction** - Layout inside subgraphs is always set to `TB` (Top-to-Bottom) direction, as other directions can cause layout issues.
- **Link labels in subgraphs** – Link labels within subgraphs may be positioned incorrectly, despite the layout correctly reserving space for them.
- **Obstacle padding (first‑bend distance)** – MSAGL exposes an `edgeRoutingSettings.Padding` option intended to keep edges a minimum distance away from obstacles (nodes) and thus control where the first bend occurs. In msagljs this setting is currently not working.

## 📄 License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

Copyright 2013-2025 client IO

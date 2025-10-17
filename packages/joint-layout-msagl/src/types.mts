import type { LayerDirectionEnum } from "@msagl/core";
import type { dia, g } from "@joint/core";
import type { Graph, GeomGraph } from "@msagl/core";
import type { EdgeRoutingMode } from "./enums.mjs";

type GetSizeCallback = (element: dia.Element) => dia.Size;
type GetLabelSizeCallback = (cell: dia.Cell) => dia.Size | undefined;
type SetPositionCallback = (element: dia.Element, position: dia.Point) => void;
type SetVerticesCallback = (link: dia.Link, vertices: dia.Point[]) => void;
type SetLabelsCallback = (link: dia.Link, labelBBox: dia.BBox, points: dia.Point[]) => void;
type SetAnchorCallback = (link: dia.Link, linkEndPoint: dia.Point, bbox: dia.BBox, endType: 'source' | 'target') => void;
type SetClusterSizeCallback = (element: dia.Element, size: dia.Size) => void;

/**
 * Layout configuration options.
 */
export interface Options {
    /** Layout direction (TB, BT, LR, RL).
     * @defaultValue LayerDirectionEnum.TB
     */
    layerDirection?: LayerDirectionEnum,
    /** Vertical distance between layers.
     * @defaultValue 40
     */
    layerSeparation?: number,
    /** Minimum distance between nodes within the same layer.
     * @defaultValue 20
     */
    nodeSeparation?: number,
    /** Polyline padding used by the edge router.
     * @defaultValue 1
     */
    polylinePadding?: number,
    /** Vertical offset used for rectilinear self-loops.
     * @remarks Applies to self-edges when edgeRoutingMode is Rectilinear.
     * @defaultValue 10
     */
    rectilinearSelfEdgeOffset?: number,
    /** Grid size for routing; applied to X and Y.
     * @defaultValue 0
     */
    gridSize?: number,
    /** Edge routing mode.
     * @defaultValue EdgeRoutingMode.Rectilinear
     */
    edgeRoutingMode?: EdgeRoutingMode
    /** Horizontal origin of the top-level graph.
     * @defaultValue 0
     */
    x?: number,
    /** Vertical origin of the top-level graph.
     * @defaultValue 0
     */
    y?: number,
    /** Padding applied to subgraph clusters.
     * @defaultValue 10
     */
    clusterPadding?: dia.Sides,
    /**
     * Returns the element's size used during layout.
     * @defaultValue element.size()
     * @example
     * getSize: (element) => element.size()
     */
    getSize?: GetSizeCallback,
    /**
     * Returns the label size that should be used to reserve space for a cell.
     * @remarks If the callback returns `undefined`, the label is ignored in the layout.
     * @defaultValue For elements: `element.get('labelSize')`; for links: `link.get('labelSize')`
     */
    getLabelSize?: GetLabelSizeCallback,
    /**
     * Applies a new position to an element after layout.
     * @defaultValue element.position(x, y)
     * @example
     * setPosition: (el, pos) => el.position(pos.x, pos.y)
     */
    setPosition?: SetPositionCallback,
    /**
     * Sets vertices on a link. This callback is called after the edge routing is applied.
     * @remarks When set to `true`, the built-in vertices setter is used. Provide a function to customize.
     * @defaultValue true
     * @example
     * setVertices: (link, vertices) => link.vertices(vertices)
     */
    setVertices?: boolean | SetVerticesCallback;
    /**
     * Sets label position on a link.
     * @remarks When set to `true`, the built-in label setter is used. A custom function receives the label bounding box and polyline points.
     * @defaultValue true
     * @example
     * setLabels: (link, labelBBox, points) => link.label(0, {
     *   position: { distance: 0, offset: 0 }
     * });
     */
    setLabels?: boolean | SetLabelsCallback;
    /**
     * Sets a link's anchor at either source or target based on computed geometry.
     * @remarks When set to `true`, the built-in `modelCenter` anchor with automatic offset is used.
     * @defaultValue true
     * @example
     * setAnchor: (link, point, bbox, end) => link.prop(`${end}/anchor`, {
     *   name: 'modelCenter',
     *   args: {
     *     dx: point.x - bbox.x - bbox.width / 2,
     *     dy: point.y - bbox.y - bbox.height / 2
     *   }
     * });
     */
    setAnchor?: boolean | SetAnchorCallback;
    /**
     * Sets the size of a cluster.
     * @remarks The function will be called with the cluster element and the size that was computed by the layout.
     * @defaultValue (element, size) => element.size(size)
     */
    setClusterSize?: SetClusterSizeCallback;
}

export interface LayoutResult {
    bbox: g.Rect;
    msGraph: Graph;
    msGeomGraph: GeomGraph;
}

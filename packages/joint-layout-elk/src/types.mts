import type { dia, g } from '@joint/core';
import type {
    ELK,
    ElkNode,
    ElkExtendedEdge,
    ElkLabel,
    LayoutOptions as ElkLayoutOptions
} from 'elkjs/lib/elk-api.js';

export type { ELK, ElkNode, ElkExtendedEdge, ElkLabel, ElkLayoutOptions };

type GetSizeCallback = (element: dia.Element) => dia.Size;
type SetPositionCallback = (element: dia.Element, position: dia.Point) => void;
type SetVerticesCallback = (link: dia.Link, vertices: dia.Point[]) => void;
type SetAnchorCallback = (link: dia.Link, element: dia.Element, point: dia.Point, endType: 'source' | 'target') => void;
type SetLabelsCallback = (link: dia.Link, labelBBox: dia.BBox, points: dia.Point[], labelIndex: number) => void;
type NodeOptionsCallback = (element: dia.Element) => ElkLayoutOptions | undefined;
type EdgeOptionsCallback = (link: dia.Link) => ElkLayoutOptions | undefined;

/**
 * Layout configuration options.
 */
export interface Options {
    /**
     * A custom ELK instance, e.g. one configured to run inside a Web Worker.
     * The instance is not terminated by the package - call `elk.terminateWorker()`
     * yourself when it is no longer needed.
     * @defaultValue a shared, main-thread instance (`elkjs/lib/elk.bundled.js`)
     * @example
     * import ELK from 'elkjs/lib/elk-api.js';
     * const elk = new ELK({ workerUrl: new URL('elkjs/lib/elk-worker.min.js', import.meta.url).href });
     * layout(graph, { elk });
     */
    elk?: ELK;
    /**
     * ELK layout options, passed through to ELK unmodified.
     * @see https://eclipse.dev/elk/reference/options.html
     * @defaultValue `{ 'elk.algorithm': 'layered' }`
     */
    layoutOptions?: ElkLayoutOptions;
    /**
     * Whether to account for link labels during layout and position them
     * along the routed link afterwards.
     * @defaultValue true
     */
    edgeLabels?: boolean;
    /**
     * Returns the element's size used during layout.
     * @defaultValue element.size()
     */
    getSize?: GetSizeCallback;
    /**
     * Applies a new position to an element after layout.
     * @defaultValue element.position(x, y)
     * @example
     * setPosition: (el, pos) => el.position(pos.x, pos.y)
     */
    setPosition?: SetPositionCallback;
    /**
     * Sets vertices on a link from the bend points of the ELK edge section.
     * @remarks When set to `true`, the built-in vertices setter is used. Provide a function to customize.
     * @defaultValue true
     * @example
     * setVertices: (link, vertices) => link.vertices(vertices)
     */
    setVertices?: boolean | SetVerticesCallback;
    /**
     * Sets a link's anchor at either source or target, based on the start/end
     * point of the ELK edge section.
     * @remarks When set to `true`, the built-in `topLeft` anchor is used. Provide a function to customize.
     * @defaultValue true
     */
    setAnchor?: boolean | SetAnchorCallback;
    /**
     * Sets a link label's position, based on the ELK edge label.
     * Only takes effect when `edgeLabels` is enabled.
     * @remarks When set to `true`, the built-in label setter is used. Provide a function to customize.
     * @defaultValue true
     * @example
     * setLabels: (link, labelBBox, points, labelIndex) => link.label(labelIndex, {
     *   position: { distance: 0, offset: 0 }
     * });
     */
    setLabels?: boolean | SetLabelsCallback;
    /**
     * Per-element ELK layout options, merged into the generated ELK node.
     * @example
     * nodeOptions: (element) => ({ 'partitioning.partition': element.get('layer') })
     */
    nodeOptions?: NodeOptionsCallback;
    /**
     * Per-link ELK layout options, merged into the generated ELK edge.
     */
    edgeOptions?: EdgeOptionsCallback;
}

export interface LayoutResult {
    /** Tight bounding box of the laid out graph. */
    bbox: g.Rect;
    /** The raw ELK layout result, for anything not mapped back onto the graph (e.g. junction points). */
    elkGraph: ElkNode;
}

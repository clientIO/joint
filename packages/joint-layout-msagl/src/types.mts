import { LayerDirectionEnum } from "@msagl/core";
import { type dia } from "@joint/core";

export enum EdgeRoutingMode {
    SplineBundling = 1,
    Rectilinear = 4
}

export { LayerDirectionEnum };

type GetSizeCallback = (element: dia.Element) => dia.Size;
type GetLabelSizeCallback = (cell: dia.Link | dia.Element) => dia.Size | undefined;
type SetPositionCallback = (element: dia.Element, position: dia.Point) => void;
type SetVerticesCallback = (link: dia.Link, vertices: dia.Point[]) => void;
type SetLabelsCallback = (link: dia.Link, labelBBox: dia.BBox, points: dia.Point[]) => void;
type SetAnchorCallback = (link: dia.Link, linkEndPoint: dia.Point, bbox: dia.BBox, endType: 'source' | 'target') => void;

export interface Options {
    layerDirection?: LayerDirectionEnum,
    layerSeparation?: number,
    nodeSeparation?: number,
    polylinePadding?: number,
    // Vertical offset for rendering rectilinear self-loops
    rectilinearSelfEdgeOffset?: number,
    gridSize?: number,
    edgeRoutingMode?: EdgeRoutingMode
    margins?: {
        left: number,
        right: number,
        top: number,
        bottom: number
    },
    getSize?: GetSizeCallback,
    getLabelSize?: GetLabelSizeCallback,
    setPosition?: SetPositionCallback,
    setVertices?: boolean | SetVerticesCallback;
    setLabels?: boolean | SetLabelsCallback;
    setAnchor?: boolean | SetAnchorCallback;
}

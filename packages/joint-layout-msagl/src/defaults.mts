import { type dia, g } from "@joint/core";
import { type Options } from './types.mjs';
import { EdgeRoutingMode, LayerDirectionEnum } from "./enums.mjs";

export const defaultOptions: Required<Options> = {
    layerDirection: LayerDirectionEnum.TB,
    layerSeparation: 40,
    nodeSeparation: 20,
    polylinePadding: 1,
    rectilinearSelfEdgeOffset: 10,
    gridSize: 0,
    edgeRoutingMode: EdgeRoutingMode.Rectilinear,
    x: 10,
    y: 10,
    clusterPadding: 10,
    getSize,
    getLabelSize,
    setPosition,
    setVertices: true,
    setLabels: true,
    setAnchor: true
};

// --- Default Callbacks

function getSize(element: dia.Element): dia.Size {
    return element.size();
}

function getLabelSize(cell: dia.Cell): dia.Size | undefined {
    return cell.get('labelSize') as dia.Size | undefined;
}

function setPosition(element: dia.Element, position: dia.Point) {
    element.position(position.x, position.y);
}

export function setVertices(link: dia.Link, vertices: dia.Point[]) {
    link.vertices(vertices);
}

export function setLabels(link: dia.Link, labelBBox: dia.BBox, points: dia.Point[]) {

    const polyline = new g.Polyline(points);

    const { x, y, width, height } = labelBBox;

    const cx = x + width / 2;
    const cy = y + height / 2;

    const center = new g.Point(cx, cy);

    const distance = polyline.closestPointLength(center);
    // Get the tangent at the closest point to calculate the offset
    const tangent = polyline.tangentAtLength(distance);

    link.label(0, {
        position: {
            distance,
            offset: tangent?.pointOffset(center) || 0
        }
    });
}

export function setAnchor(link: dia.Link, linkEndPoint: dia.Point, bbox: dia.BBox, endType: 'source' | 'target') {
    link.prop(`${endType}/anchor`, {
        name: 'modelCenter',
        args: {
            dx: linkEndPoint.x - bbox.x - bbox.width / 2,
            dy: linkEndPoint.y - bbox.y - bbox.height / 2,
        }
    });
}

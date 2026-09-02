import { type dia, g } from '@joint/core';
import { type ElkLayoutOptions, type Options } from './types.mjs';

/** Zero-config default: a layered (Sugiyama-style) layout. */
export const DEFAULT_LAYOUT_OPTIONS: ElkLayoutOptions = {
    'elk.algorithm': 'layered'
};

export const DEFAULT_LABEL_SIZE: dia.Size = {
    width: 50,
    height: 20
};

export const defaultOptions: Required<Omit<Options, 'elk' | 'layoutOptions'>> = {
    edgeLabels: true,
    getSize,
    setPosition,
    setVertices: true,
    setAnchor: true,
    setLabels: true,
    nodeOptions,
    edgeOptions
};

// --- Default Callbacks

function getSize(element: dia.Element): dia.Size {
    return element.size();
}

function setPosition(element: dia.Element, position: dia.Point) {
    element.position(position.x, position.y);
}

function nodeOptions(): ElkLayoutOptions | undefined {
    return undefined;
}

function edgeOptions(): ElkLayoutOptions | undefined {
    return undefined;
}

export function setVertices(link: dia.Link, vertices: dia.Point[]) {
    link.vertices(vertices);
}

export function setAnchor(link: dia.Link, element: dia.Element, point: dia.Point, endType: 'source' | 'target') {
    const delta = element.getRelativePointFromAbsolute(point);
    link.prop(`${endType}/anchor`, {
        name: 'topLeft',
        args: {
            dx: delta.x,
            dy: delta.y,
            useModelGeometry: true
        }
    });
}

export function setLabels(link: dia.Link, labelBBox: dia.BBox, points: dia.Point[], labelIndex: number) {

    const polyline = new g.Polyline(points);

    const { x, y, width, height } = labelBBox;
    const center = new g.Point(x + width / 2, y + height / 2);

    const distance = polyline.closestPointLength(center);
    // Get the tangent at the closest point to calculate the offset
    const tangent = polyline.tangentAtLength(distance);

    link.label(labelIndex, {
        position: {
            distance,
            offset: tangent ? tangent.pointOffset(center) : 0
        }
    });
}

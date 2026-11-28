import { shapes, util } from '@joint/core';

const portAttrs = {
    circle: {
        cursor: 'crosshair',
        fill: '#4D64DD',
        stroke: '#F4F7F6',
        magnet: 'active',
        r: 6,
    },
};

export class Node extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'Node',
            z: 2,
            size: { width: 120, height: 60 },
            attrs: {
                body: {
                    fill: 'rgba(70,101,229,0.15)',
                    stroke: '#4665E5',
                    strokeWidth: 1,
                    rx: 2,
                    ry: 2,
                },
                label: {
                    fill: '#464454',
                    fontSize: 13,
                },
            },
            ports: {
                groups: {
                    top: { position: 'top', attrs: portAttrs },
                    bottom: { position: 'bottom', attrs: portAttrs },
                    right: { position: 'right', attrs: portAttrs },
                    left: { position: 'left', attrs: portAttrs },
                },
            },
        }, super.defaults);
    }
}

// A point where several links meet. The router (`experimental_isJunction`)
// turns it into an avoid junction and, unless `junctionFixed` is set, moves
// it to the position avoid recommends.
export class Junction extends shapes.standard.Circle {
    static SIZE = 10;

    defaults() {
        return util.defaultsDeep({
            type: 'Junction',
            z: 3,
            size: { width: Junction.SIZE, height: Junction.SIZE },
            junctionFixed: false,
            attrs: {
                body: {
                    fill: '#464454',
                    stroke: '#EA3C24',
                    strokeWidth: 0,
                    cursor: 'move',
                    // Links can end here, but dragging moves the junction.
                    magnet: 'passive',
                },
            },
        }, super.defaults);
    }
}

export class Edge extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'Edge',
            z: 1,
            attrs: {
                line: {
                    stroke: '#464454',
                    strokeWidth: 1.5,
                    targetMarker: { d: 'M 6 3 0 0 6 -3 Z' },
                },
            },
        }, super.defaults);
    }
}

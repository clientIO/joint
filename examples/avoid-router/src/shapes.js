import { shapes, util } from '@joint/core';

const portRadius = 8;
const portAttrs = {
    circle: {
        cursor: 'crosshair',
        fill: '#4D64DD',
        stroke: '#F4F7F6',
        magnet: 'active',
        r: portRadius,
    },
};

export class Node extends shapes.standard.Rectangle {
    static PORT_RADIUS = portRadius;

    defaults() {
        return util.defaultsDeep({
            type: 'Node',
            z: 2,
            attrs: {
                root: {
                    highlighterSelector: 'body',
                    magnetSelector: 'body',
                },
                body: {
                    fill: 'rgba(70,101,229,0.15)',
                    stroke: '#4665E5',
                    strokeWidth: 1,
                    rx: 2,
                    ry: 2,
                }
            },
            ports: {
                groups: {
                    top: {
                        position: 'top',
                        attrs: portAttrs,
                    },
                    bottom: {
                        position: 'bottom',
                        attrs: portAttrs,
                    },
                    right: {
                        position: 'right',
                        attrs: portAttrs,
                    },
                    left: {
                        position: 'left',
                        attrs: portAttrs,
                    },
                },
            },
        }, super.defaults);
    }
}

// A free-floating annotation. It is excluded from the avoid router via the
// `doNotRoute` flag, so links are free to route straight through it.
export class Note extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'Note',
            z: 0,
            size: { width: 140, height: 70 },
            doNotRoute: true,
            attrs: {
                body: {
                    fill: '#FFF6BF',
                    stroke: '#E0CC6B',
                    strokeWidth: 1,
                    strokeDasharray: '4,2',
                    rx: 2,
                    ry: 2,
                },
                label: {
                    text: 'Note',
                    fill: '#7A6B2E',
                    fontFamily: 'sans-serif',
                    fontSize: 12,
                    fontStyle: 'italic',
                    textWrap: {
                        width: -10,
                        height: -10,
                    },
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
                    strokeWidth: 1,
                    targetMarker: { d: 'M 5 2.5 0 0 5 -2.5 Z' },
                },
            }
        }, super.defaults);
    }
}

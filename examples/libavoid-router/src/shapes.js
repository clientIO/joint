import { shapes } from '@joint/core';
import { libavoid } from '@joint/routers-libavoid';

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
        return {
            ...super.defaults,
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
        };
    }
}

export class Edge extends shapes.standard.Link {
    defaults() {
        return {
            ...super.defaults,
            type: 'Edge',
            z: 1,
            router: libavoid,
            attrs: {
                line: {
                    stroke: '#464454',
                    strokeWidth: 1,
                    targetMarker: { d: 'M 5 2.5 0 0 5 -2.5 Z' },
                },
            },
        };
    }
}

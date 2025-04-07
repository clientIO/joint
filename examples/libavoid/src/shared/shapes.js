import { shapes } from '@joint/core';

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

export const Node = shapes.standard.Rectangle.define(
    'Node',
    {
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
    },
    null,
    {
        PORT_RADIUS: portRadius,
    }
);

export const Edge = shapes.standard.Link.define(
    'Edge',
    {
        z: 1,
        attrs: {
            line: {
                stroke: '#464454',
                strokeWidth: 1,
                targetMarker: { d: 'M 5 2.5 0 0 5 -2.5 Z' },
            },
        },
    }
);

import { dia } from '@joint/core';

const PORT_RADIUS = 6;

export const Message = dia.Element.define('app.Message', {
    size: { width: 344, height: 80 },
    z: 2,
    attrs: {
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            fill: 'rgba(70,101,229,0.15)',
            stroke: '#4665E5',
            strokeWidth: 1,
            rx: 4,
            ry: 4,
        },
        label: {
            text: 'Message',
            x: 'calc(0.5 * w)',
            y: 'calc(0.5 * h)',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontFamily: 'sans-serif',
            fontSize: 14,
            fontWeight: 600,
            fill: '#322A49',
            textWrap: {
                width: -16,
                maxLineCount: 1,
                ellipsis: true,
            },
        },
    },
    ports: {
        groups: {
            in: {
                position: 'left',
                markup: [{ tagName: 'circle', selector: 'portBody' }],
                attrs: {
                    portBody: {
                        r: PORT_RADIUS,
                        fill: '#FFFFFF',
                        stroke: '#4665E5',
                        strokeWidth: 1,
                        magnet: 'passive',
                    },
                },
            },
            out: {
                position: 'right',
                markup: [{ tagName: 'circle', selector: 'portBody' }],
                attrs: {
                    portBody: {
                        r: PORT_RADIUS,
                        fill: '#4665E5',
                        stroke: '#FFFFFF',
                        strokeWidth: 1,
                        magnet: 'active',
                    },
                },
            },
        },
    },
}, {
    markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
    ],
});

export const FlowchartStart = dia.Element.define('app.FlowchartStart', {
    size: { width: 48, height: 48 },
    z: 2,
    attrs: {
        body: {
            cx: 'calc(0.5 * w)',
            cy: 'calc(0.5 * h)',
            r: 'calc(0.5 * w)',
            fill: '#4665E5',
            stroke: 'none',
        },
        label: {
            text: 'Start',
            x: 'calc(0.5 * w)',
            y: 'calc(h + 8)',
            textAnchor: 'middle',
            textVerticalAnchor: 'top',
            fontFamily: 'sans-serif',
            fontSize: 12,
            fill: '#655E77',
        },
    },
    ports: {
        groups: {
            out: {
                position: 'bottom',
                markup: [{ tagName: 'circle', selector: 'portBody' }],
                attrs: {
                    portBody: {
                        r: PORT_RADIUS,
                        fill: '#4665E5',
                        stroke: '#FFFFFF',
                        strokeWidth: 1,
                        magnet: 'active',
                    },
                },
            },
        },
    },
}, {
    markup: [
        { tagName: 'circle', selector: 'body' },
        { tagName: 'text', selector: 'label' },
    ],
});

export const Link = dia.Link.define('app.Link', {
    z: 1,
    attrs: {
        line: {
            fill: 'none',
            connection: true,
            stroke: '#464454',
            strokeWidth: 1,
            targetMarker: { d: 'M 5 2.5 0 0 5 -2.5 Z' },
        },
    },
}, {
    markup: [{ tagName: 'path', selector: 'line' }],
    defaultLabel: {
        markup: [
            { tagName: 'rect', selector: 'labelBody' },
            { tagName: 'text', selector: 'labelText' },
        ],
        attrs: {
            labelText: {
                fontFamily: 'sans-serif',
                fontSize: 12,
                fill: '#464454',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                pointerEvents: 'none',
            },
            labelBody: {
                ref: 'labelText',
                fill: '#F3F7F6',
                stroke: '#F3F7F6',
                strokeWidth: 4,
                width: 'calc(w)',
                height: 'calc(h)',
                x: 'calc(x)',
                y: 'calc(y)',
            },
        },
    },
});

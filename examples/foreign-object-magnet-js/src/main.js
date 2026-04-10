import { dia, shapes } from '@joint/core';
import './styles.css';

// Shared badge style (position set per-badge below)
const BASE_BADGE_STYLE = {
    position: 'absolute',
    width: '84px',
    height: '28px',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,.25)',
    letterSpacing: '.5px',
    textTransform: 'uppercase',
    userSelect: 'none',
    pointerEvents: 'none'
};

// CSS positions for each border edge (centered via transform)
const BADGE_POSITIONS = {
    top: { top: '0', left: '50%', transform: 'translate(-50%, -50%)' },
    right: { top: '50%', right: '0', transform: 'translate(50%, -50%)' },
    bottom: { bottom: '0', left: '50%', transform: 'translate(-50%, 50%)' },
    left: { top: '50%', left: '0', transform: 'translate(-50%, -50%)' }
};

// Single foreignObject containing all 4 badge divs as direct children.
// Each badge div gets a `selector` which JointJS serialises as the
// `joint-selector` attribute on the DOM element.
const borderBadgeMarkup = [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'text', selector: 'label' },
    {
        tagName: 'foreignObject',
        selector: 'badgesFO',
        children: [
            { tagName: 'div', namespaceURI: 'http://www.w3.org/1999/xhtml', selector: 'topBadge' },
            { tagName: 'div', namespaceURI: 'http://www.w3.org/1999/xhtml', selector: 'rightBadge' },
            { tagName: 'div', namespaceURI: 'http://www.w3.org/1999/xhtml', selector: 'bottomBadge' },
            { tagName: 'div', namespaceURI: 'http://www.w3.org/1999/xhtml', selector: 'leftBadge' }
        ]
    },
    {
        tagName: 'rect',
        selector: 'svgMagnet'
    }
];

// Base attrs: foreignObject covers the full shape; badges are absolutely
// positioned relative to the foreignObject's implicit HTML viewport.
const BASE_ATTRS = {
    body: {
        width: 'calc(w)',
        height: 'calc(h)',
        rx: 10,
        ry: 10,
        strokeWidth: 2,
        stroke: '#7b8cde',
        fill: '#eef0fb'
    },
    label: {
        text: 'Shape',
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 15,
        fontFamily: 'sans-serif',
        fill: '#3d4a7a'
    },
    badgesFO: {
        x: 0,
        y: 0,
        width: 'calc(w)',
        height: 'calc(h)',
        overflow: 'visible'
    },
    svgMagnet: {
        width: 60,
        height: 20,
        fill: '#7b8cde',
        stroke: '#7b8cde',
        strokeWidth: 1,
        x: 170,
        y: 120,
    },
    topBadge: { style: { ...BASE_BADGE_STYLE, ...BADGE_POSITIONS.top } },
    rightBadge: { style: { ...BASE_BADGE_STYLE, ...BADGE_POSITIONS.right } },
    bottomBadge: { style: { ...BASE_BADGE_STYLE, ...BADGE_POSITIONS.bottom } },
    leftBadge: { style: { ...BASE_BADGE_STYLE, ...BADGE_POSITIONS.left } }
};

const BorderBadgeElement = dia.Element.define(
    'custom.BorderBadgeElement',
    { size: { width: 200, height: 120 }, attrs: BASE_ATTRS },
    { markup: borderBadgeMarkup }
);

// --- Paper & Graph ---

const namespace = { ...shapes, custom: { BorderBadgeElement } };

const graph = new dia.Graph({}, { cellNamespace: namespace });

const paper = new dia.Paper({
    el: document.getElementById('paper-container'),
    model: graph,
    width: '100%',
    height: '100%',
    gridSize: 20,
    async: false,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    cellViewNamespace: namespace
});

paper.setGrid('mesh');

paper.scale(1.5, 1.5);
paper.translate(100, 0);

// --- Shape 1: Process Node ---

const shape1 = new BorderBadgeElement({
    position: { x: 140, y: 160 },
    attrs: {
        body: { stroke: '#2980b9', fill: '#ebf5fb' },
        label: { text: 'Process Node', fill: '#1a5276' },
        topBadge: { html: 'In: 3', style: { backgroundColor: '#2980b9' } },
        rightBadge: { html: 'Out: 2', style: { backgroundColor: '#27ae60' } },
        bottomBadge: { html: 'Status: OK', style: { backgroundColor: '#16a085' } },
        leftBadge: { html: 'ID: A1', style: { backgroundColor: '#8e44ad' } }
    },
    ports: {
        items: [{
            size: { width: 32, height: 16 },
            position: {
                name: 'absolute',
                args: { x: 200, y: 0 }
            },
            attrs: {
                portBody: {
                    magnet: true,
                    width: 32,
                    height: 16,
                    x: -16,
                    y: -8,
                    fill: '#03071E'
                },
            },
            markup: [{
                tagName: 'rect',
                selector: 'portBody'
            }]
        }]
    }
});

shape1.addTo(graph);

shape1.rotate(30);

// --- Shape 2: Data Store ---

const shape2 = new BorderBadgeElement({
    position: { x: 520, y: 160 },
    attrs: {
        body: { stroke: '#c0392b', fill: '#fdedec' },
        label: { text: 'Data Store', fill: '#78281f' },
        topBadge: { html: 'Read', style: { backgroundColor: '#e74c3c' } },
        rightBadge: { html: 'Write', style: { backgroundColor: '#e67e22' } },
        bottomBadge: { html: 'Cache', style: { backgroundColor: '#d35400' } },
        leftBadge: { html: 'Index', style: { backgroundColor: '#c0392b' } }
    }
});

shape2.addTo(graph);

// --- Link ---

const link = new shapes.standard.Link({
    source: {
        id: shape1.id,
        port: shape1.getPorts()[0].id,
        //magnet: 'rightBadge',
        connectionPoint: { name: 'rectangle', args: { useModelGeometry: true } }
    },
    target: {
        id: shape2.id,
        magnet: 'leftBadge'
    },
    attrs: {
        line: {
            stroke: '#999',
            strokeWidth: 2
        }
    }
});

link.addTo(graph);

// Paper Viewport Option: https://resources.jointjs.com/docs/jointjs/v3.5/html#dia.Paper.prototype.options.viewport

import { dia, shapes } from '@joint/core';
import './styles.css';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paperOptions = {
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 20,
    drawGrid: { name: 'mesh' },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    frozen: false,
    defaultConnectionPoint: { name: 'boundary' },
    background: { color: '#F3F7F6' }
};

const paper1 = new dia.Paper({
    ...paperOptions,
    viewport: (view) => view.model.get('subgraph') !== 2
});
const paperContainer1 = document.getElementById('paper-container1');
paperContainer1.appendChild(paper1.el);

const paper2 = new dia.Paper({
    ...paperOptions,
    viewport: (view) => view.model.get('subgraph') !== 1
});
const paperContainer2 = document.getElementById('paper-container2');
paperContainer2.appendChild(paper2.el);

graph.resetCells([
    // common
    {
        id: 'r1',
        type: 'standard.Rectangle',
        size: { width: 100, height: 100 },
        position: { x: 300, y: 100 },
        attrs: { label: { text: 'Common' }}
    },
    {
        id: 'r2',
        type: 'standard.Rectangle',
        size: { width: 100, height: 100 },
        position: { x: 300, y: 300 },
        attrs: { label: { text: 'Common' }}
    },

    { type: 'standard.Link', source: { id: 'r1' }, target: { id: 'r2' }},
    // subgraph 1
    {
        id: 'c1',
        type: 'standard.Circle',
        size: { width: 100, height: 100 },
        position: { x: 100, y: 100 },
        attrs: { label: { text: 'Subgraph 1' }},
        subgraph: 1
    },
    {
        id: 'c2',
        type: 'standard.Circle',
        size: { width: 100, height: 100 },
        position: { x: 100, y: 300 },
        attrs: { label: { text: 'Subgraph 1' }},
        subgraph: 1
    },
    {
        type: 'standard.Link',
        source: { id: 'c1' },
        target: { id: 'c2' },
        subgraph: 1
    },
    // subgraph 2
    {
        id: 'h1',
        type: 'standard.HeaderedRectangle',
        size: { width: 100, height: 100 },
        position: { x: 100, y: 100 },
        attrs: { bodyText: { text: 'Subgraph 2' }},
        subgraph: 2
    },
    {
        id: 'h2',
        type: 'standard.HeaderedRectangle',
        size: { width: 100, height: 100 },
        position: { x: 100, y: 300 },
        attrs: { bodyText: { text: 'Subgraph 2' }},
        subgraph: 2
    },
    {
        type: 'standard.Link',
        source: { id: 'h1' },
        target: { id: 'h2' },
        subgraph: 2
    }
]);

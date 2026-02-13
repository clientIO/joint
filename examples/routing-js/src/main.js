import { dia, shapes, linkTools } from '@joint/core';
import './styles.css';

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
    el: document.getElementById('paper-container'),
    width: 1000,
    height: 600,
    gridSize: 10,
    async: true,
    model: graph,
    cellViewNamespace: shapes,
});

const source = new shapes.standard.Rectangle({
    position: { x: 50, y: 50 },
    size: { width: 140, height: 70 },
    attrs: {
        body: {
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: '0%', color: '#f7a07b' },
                    { offset: '100%', color: '#fe8550' }
                ],
                attrs: { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
            },
            stroke: '#ed8661',
            strokeWidth: 2
        },
        label: {
            text: 'Source',
            fill: '#f0f0f0',
            fontSize: 18,
            fontWeight: 'lighter',
            fontVariant: 'small-caps'
        }
    }
});

const target = source.clone().translate(750, 400).attr('label/text', 'Target');

const link = new shapes.standard.Link({
    source: { id: source.id },
    target: { id: target.id },
    router: { name: 'manhattan' },
    connector: { name: 'rounded' },
    attrs: {
        line: {
            stroke: '#333333',
            strokeWidth: 3
        }
    }
});

const obstacle = source.clone().translate(300, 100).attr({
    label: {
        text: 'Obstacle',
        fill: '#eee'
    },
    body: {
        fill: {
            stops: [{ color: '#b5acf9' }, { color: '#9687fe' }]
        },
        stroke: '#8e89e5',
        strokeWidth: 2
    }
});

const obstacles = [
    obstacle,
    obstacle.clone().translate(200, 100),
    obstacle.clone().translate(-200, 150)
];

graph.addCells(obstacles).addCells([source, target, link]);

link.toBack();

graph.on('change:position', function(cell) {

    // has an obstacle been moved? Then reroute the link.
    if (obstacles.indexOf(cell) > -1) {
        link.findView(paper).requestConnectionUpdate();
    }
});

paper.on('link:mouseenter', function(linkView) {
    const tools = new dia.ToolsView({
        tools: [new linkTools.Vertices()]
    });
    linkView.addTools(tools);
});

paper.on('link:mouseleave', function(linkView) {
    linkView.removeTools();
});

document.getElementById('router-switches').addEventListener('click', function(evt) {
    if (!evt.target.matches('button')) return;
    const router = evt.target.dataset.router;
    const connector = evt.target.dataset.connector;

    if (router) {
        link.set('router', { name: router });
    } else {
        link.unset('router');
    }

    link.set('connector', { name: connector });
}, false);

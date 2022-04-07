import * as joint from '../../../joint.mjs';
import Pathfinder from './models/Pathfinder.mjs';
import { debugConf, debugStore } from './debug.mjs';

// ===============================================================================
// JointJS - Core + Pathfinder
// ===============================================================================
const graph = new joint.dia.Graph();
const pathfinder = new Pathfinder(graph, {
    step: 10,
    startDirections: ['top', 'right', 'bottom', 'left'],
    endDirections: ['top', 'right', 'bottom', 'left'],
    gridBounds: {
        lo: { x: 0, y: 0 },
        hi: { x: 80, y: 60 }
    },
    directionChangePenalty: 10,
    isGridNodeObstacle: (cells = [], linkView) => {
        const filtered = cells.filter(cell => !cell.get('passable'));
        return filtered.length === 0;
    },
});
const paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 600,
    gridSize: 10,
    async: true,
    model: graph,
    defaultRouter: pathfinder.search.bind(pathfinder)
});

// ======= Demo events
paper.on('link:mouseenter', function(linkView) {
    const tools = new joint.dia.ToolsView({
        tools: [new joint.linkTools.Vertices()]
    });
    linkView.addTools(tools);
});

paper.on('link:mouseleave', function(linkView) {
    linkView.removeTools();
});

paper.on('cell:pointerdblclick', function(cellView) {
    if (cellView.model.get('obstacle')) {
        cellView.model.remove();
    }
});

paper.on('render:done', () => {
    if (debugConf.fullRouterBenchmark && !debugStore.fullRouterTimeDone) {
        console.info('Took ' + debugStore.fullRouterTime.toFixed(2) + ' ms to calculate ' + graph.getLinks().length + ' routes.');
        debugStore.fullRouterTimeDone = true;
    }

    if (debugConf.fullGridUpdateBenchmark && !debugStore.fullGridTimeDone) {
        console.info('Took ' + debugStore.fullGridTime.toFixed(2) + ' ms to build initial grid.');
        debugStore.fullGridTimeDone = true;
    }
});

// ======= Demo shapes
const source = new joint.shapes.standard.Rectangle({
    position: { x: 0, y: 0 },
    size: { width: 110, height: 50 },
    attrs: {
        body: {
            fill: '#0e650e',
            stroke: '#000',
            strokeWidth: 2
        },
        label: {
            text: 'SOURCE',
            fill: '#FFF',
            fontSize: 18,
        }
    }
});
const target = source.clone().attr('label/text', 'TARGET').attr('body/fill', '#0c1e6a');
const link = new joint.shapes.standard.Link({
    source: { id: source.id },
    target: { id: target.id },
    attrs: {
        line: {
            stroke: '#333333',
            strokeWidth: 3
        }
    }
});
const obstacle = source.clone().position(0, 0).attr({
    label: {
        text: 'obstacle',
        fill: '#eee'
    },
    body: {
        fill: '#f00',
        stroke: '#000',
        strokeWidth: 2
    }
});

// ======= Obstacles
const { width, height } = paper.getComputedSize(), obstacles = [], obsCount = 5;
for (let i = 0; i < obsCount; i++) {
    const obs = obstacle.clone();
    obs.set('obstacle', true);

    const passable = Math.round(Math.random());
    if (passable) {
        obs.set('passable', true);
        obs.attr('label/text', 'passable');
        obs.attr('body/fill', '#606060');
    }

    obs.translate(200 + Math.random() * (width - 500), 50 + Math.random() * (height - 100));
    obstacles.push(obs);
}

// ======= More source/target pairs
const pairsCount = 5, //Math.floor(height / source.size().height / 2),
    stPairs = [];
for (let i = 0; i < pairsCount; i++) {
    const s = source.clone();
    s.translate(50, i * (s.size().height * 2) + 50);

    const t = target.clone();
    t.translate(width - t.size().width - 50, i * (t.size().height * 2) + 50);

    const l = link.clone();
    l.set('source', { id: s.id });
    l.set('target', { id: t.id });

    stPairs.push(...[s, t, l]);
}

graph.addCells([...stPairs, ...obstacles]);
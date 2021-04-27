// import * as joint from '../../../joint.mjs';
import * as joint from '../../../../rappid/rappid.mjs';
import Pathfinder from './models/Pathfinder.mjs';
import { JumpPointFinder } from './finders/index.mjs';
import { debugConf, debugStore, showDebugGrid } from './debug.mjs';

// ===============================================================================
// JointJS - Core
// ===============================================================================
const graph = new joint.dia.Graph();
const paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 700,
    gridSize: 20,
    async: true,
    model: graph,
    defaultRouter: jumpPointSearch
});
const pathfinder = new Pathfinder({
    graph,
    paper,
    step: 20,
    padding: 10,
    startDirections: ['right'],
    endDirections: ['left'],
    // excludeEnds: [],
    // excludeTypes: [],
});

// ======= Events
graph.on('add', function(cell) {
    if (cell.isElement() && !cell.get('debugIgnore')) {
        const s = window.performance.now();
        pathfinder.addObstacle(cell);
        const e = window.performance.now();
        debugStore.fullGridTime += (e - s);
    }
});

graph.on('change:position', function(cell) {
    if (cell.isElement() && !cell.get('debugIgnore')) {
        const obstacle = pathfinder.getObstacleByCellId(cell.id);

        if (!obstacle) return;

        const start = window.performance.now();
        obstacle.update();
        const end = window.performance.now();
        if (debugConf.gridUpdateBenchmark) {
            console.info('Took ' + (end - start).toFixed(2) + 'ms to update Grid.');
        }
    }
});

graph.on('change:size', function() {
    console.log('size');
});

graph.on('remove', function() {
    console.log('remove');
});

paper.on('render:done', function() {
    if (debugConf.fullRouterBenchmark && !debugStore.fullRouterTimeDone) {
        console.info('Took ' + debugStore.fullRouterTime.toFixed(2) + ' ms to calculate ' + graph.getLinks().length + ' routes.');
        debugStore.fullRouterTimeDone = true;
    }

    if (debugConf.fullGridUpdateBenchmark && !debugStore.fullGridTimeDone) {
        console.info('Took ' + debugStore.fullGridTime.toFixed(2) + ' ms to build initial grid.');
        debugStore.fullGridTimeDone = true;
    }

    if (debugConf.showGrid && !debugStore.gridPrinted) {
        showDebugGrid(pathfinder);
        debugStore.gridPrinted = true;
    }
});

// ======= Demo events - TO BE REMOVED
paper.on('link:mouseenter', function(linkView) {
    const tools = new joint.dia.ToolsView({
        tools: [new joint.linkTools.Vertices()]
    });
    linkView.addTools(tools);
});
paper.on('link:mouseleave', function(linkView) {
    linkView.removeTools();
});

// ======= Shapes
const source = new joint.shapes.standard.Rectangle({
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
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
const obstacle = source.clone().position(0,0).attr({
    label: {
        text: 'O',
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
    obs.translate(200 + Math.random() * (width - 500), 50 + Math.random() * (height - 100));
    obstacles.push(obs);
}

// ======= More source/target pairs
const pairsCount = Math.floor(height / source.size().height / 2), stPairs = [];
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

let s, e;
function jumpPointSearch(vertices, args, linkView) {

    // todo: multiple start/end points
    const start = pathfinder.bboxToPoint(linkView.sourceBBox, 'right');
    const end = pathfinder.bboxToPoint(linkView.targetBBox, 'left');

    const finder = new JumpPointFinder({ grid: pathfinder.grid });

    s = window.performance.now();
    const path = finder.findPath(start, end, vertices);
    e = window.performance.now();
    debugStore.fullRouterTime += (e - s);

    if (debugConf.routerBenchmark) {
        console.info('Took ' + (e - s).toFixed(2) + ' ms to calculate route');
    }

    return path;
}


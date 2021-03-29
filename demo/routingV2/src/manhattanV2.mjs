import * as joint from '../../../joint.mjs';
import ndarray from 'ndarray';
import createPlanner from 'l1-path-finder';

// ======= Debugging
const debugConf = {
    showGraph: true,
    plannerBenchmark: true,
    routerBenchmark: true,
}
const debugLog = function () {};

// ======= Testing config
const paperWidth = 1000;
const paperHeight = 800;
const obstacleCount = 50;

// ======= Router config
const config = {
    step: 10,
    padding: 10,
    algorithm: 'l1',                    // todo: new feature; l1 be default, other `a-star`, `dijkstra` etc.
    startDirections: ['bottom'],        // todo
    endDirections: ['top'],             // todo
    preferRoute: 'tight',               // todo: new feature; by default sticks links to obstacles: 'tight', 'lessCorners'
    perpendicular: true,                // todo
    minFirstSegmentLength: 0,           // todo: new feature
    excludeEnds: [],                    // todo
    excludeTypes: [],                   // todo: should we even have it in this form, or should it be done via obstacles API
};

// ===============================================================================
// JointJS
// ===============================================================================
const graph = new joint.dia.Graph();
const paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: paperWidth,
    height: paperHeight,
    defaultRouter: function(vertices, args, linkView) {
        const routerStartTime = window.performance.now();
        // POC code
        if (!config.planner) return vertices;

        const sourceBBox = linkView.sourceBBox.moveAndExpand({
            x: -config.padding,
            y: -config.padding,
            width: 2 * config.padding,
            height: 2 * config.padding
        });
        const targetBBox = linkView.targetBBox.moveAndExpand({
            x: -config.padding,
            y: -config.padding,
            width: 2 * config.padding,
            height: 2 * config.padding
        });

        // TODO: PRESERVE PREVIOUS POINTS
        const path = [];

        config.planner.search(
            sourceBBox.center().x / config.step,
            sourceBBox.center().y / config.step,
            targetBBox.center().x / config.step,
            targetBBox.center().y / config.step,
            path
        );

        while (path.length > 1) {
            const coords = path.splice(0, 2);
            vertices.push({
                x: coords[0] * config.step,
                y: coords[1] * config.step
            });

            // todo: config.preferRoute
        }

        const routerEndTime = window.performance.now();
        if (debugConf.routerBenchmark) {
            console.warn('Router time: ' + (routerEndTime-routerStartTime).toFixed(2) + 'ms');
        }
        return vertices;
    },
    gridSize: config.step,
    async: true,
    model: graph
});

// ======= Shapes
const source = new joint.shapes.standard.Rectangle({
    position: { x: 50, y: 50 },
    size: { width: 100, height: 50 },
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

// ======= Obstacles
const obstacle = source.clone().position(0,0).attr({
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
const obstacles = [];
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
function snapToGrid(num) {
    return Math.floor( num / config.step) * config.step;
}
const calculateObstacles = function() {
    obstacles.length = 0;

    for (let f = 0; f < obstacleCount; f++) {
        const obs = obstacle.clone();
        const bbox = obs.getBBox();
        obs.translate(snapToGrid(getRandomInt(0, paperWidth - bbox.width)), snapToGrid(getRandomInt(0, paperHeight - bbox.height)));
        obstacles.push(obs);
    }
};
calculateObstacles();

// ======= Init
graph.addCells(obstacles).addCells([source, target, link]);

// ======= L1 POC
const grid = ndarray(new Int8Array((paperWidth / config.step) * (paperHeight / config.step)).fill(0), [paperWidth / config.step, paperHeight / config.step]);

const plannerStartTime = window.performance.now();
obstacles.forEach(go => {
    const bb = go.getBBox().moveAndExpand({
        x: -config.padding,
        y: -config.padding,
        width: 2 * config.padding,
        height: 2 * config.padding
    });

    const gridX = Math.round(bb.x / config.step);
    const gridY = Math.round(bb.y / config.step);
    const boundX = Math.round((bb.x + bb.width + config.padding) / config.step);
    const boundY = Math.round((bb.y + bb.height + config.padding) / config.step);

    for(let i = gridX; i < boundX; ++i) {
        for(let j = gridY; j < boundY; ++j) {
            grid.set(i, j, 1);
        }
    }
})
config.planner = createPlanner(grid);

// ======= Benchmark
const plannerEndTime = window.performance.now();
if (debugConf.plannerBenchmark) {
    console.group('Planner benchmark');
    console.warn('Obstacles: ' + obstacleCount);
    console.warn('Grid nodes: ' + config.planner.geometry.grid.data.length);
    console.warn('Vertices: ' + config.planner.graph.verts.length);
    console.warn('Planer init time: ' + (plannerEndTime-plannerStartTime).toFixed(2) + 'ms');
    console.groupEnd();
}

// ============================================================================
// Router V2
// ============================================================================
function Pathfinder(graph, {} = {}) {
    if (!graph) {
        return debugLog('World requires an instance of dia.Graph.');
    }

    this._graph = graph;
}
Pathfinder.prototype.bake = () => {}
Pathfinder.prototype.clear = () => {}

function Planner() {}
Planner.prototype.getPath = () => {}
Planner.prototype.connectChunks = () => {}
Planner.prototype.separateChunks = () => {}

function Chunks() {}
Chunks.prototype.add = () => {}
Chunks.prototype.get = () => {}
Chunks.prototype.remove = () => {}

function Chunk() {}
Chunk.prototype.bake = () => {}
Chunk.prototype.registerObstacle = () => {}
Chunk.prototype.registerCell = () => {}
Chunk.prototype.getObstacles = () => {}
Chunk.prototype.getCells = () => {}
Chunk.prototype.unregisterObstacle = () => {}
Chunk.prototype.unregisterCell = () => {}

function Grid() {}
Grid.prototype.isCoordinateFree = () => {}

function Obstacles() {}
Obstacles.prototype.add = () => {}
Obstacles.prototype.get = () => {}
Obstacles.prototype.remove = () => {}

function Obstacle() {}
Obstacle.prototype.update = () => {}
Obstacle.prototype.subGrid = () => {}

// support structures
function ObjectPool() {}
function BinaryHeap() {}

// graph.on('change:position', function(cell) {
//     if (obstacles.indexOf(cell) > -1) {
//         calculateObstacles();
//         obstacles.forEach(go => {
//             const bb = go.getBBox().moveAndExpand({
//                 x: -config.padding,
//                 y: -config.padding,
//                 width: 2 * config.padding,
//                 height: 2 * config.padding
//             });
//
//             const gridX = Math.round(bb.x / config.step);
//             const gridY = Math.round(bb.y / config.step);
//             const boundX = Math.round((bb.x + bb.width + config.padding) / config.step);
//             const boundY = Math.round((bb.y + bb.height + config.padding) / config.step);
//
//             for(var i = gridX; i < boundX; ++i) {
//                 for(var j = gridY; j < boundY; ++j) {
//                     grid.set(i, j, 1);
//                 }
//             }
//         });
//         config.planner = createPlanner(grid);
//
//         link.findView(paper).requestConnectionUpdate();
//     }
//
//     if (obstacles.indexOf(cell) > -1) {
//         const bb = cell.getBBox();
//         const { x, y } = cell.previous('position');
//         const oldBB = bb.clone().translate(x - bb.x, y - bb.y);
//         link.findView(paper).requestConnectionUpdate();
//     }
// });
// paper.on('link:mouseenter', function(linkView) {
//     var tools = new joint.dia.ToolsView({
//         tools: [new joint.linkTools.Vertices()]
//     });
//     linkView.addTools(tools);
// });
//
// paper.on('link:mouseleave', function(linkView) {
//     linkView.removeTools();
// });

// mental notes
// const SubGrid = function({
//                              x = 0,
//                              y = 0,
//                              cols = 1,
//                              rows = 1,
//                              step = 1,
//                              padding = 0
//                          }) {
//     this.x = x;
//     this.y = y;
//     this.step = step;
//     this.padding = padding;
//
//     this.grid = ndarray(new Int8Array(cols * rows).fill(1), [cols, rows]);
// }
//
// SubGrid.prototype.fromBBox = function (bbox, opt = {}) {
//     const { step, padding } = joint.util.assign(opt, {
//         step: this.step,
//         padding: this.padding,
//     });
//
//     this.step = step;
//     this.padding = padding;
//
//     this.x = bbox.x;
//     this.y = bbox.y;
// }
// SubGrid.prototype.difference = function (sub) {}
// SubGrid.prototype.localCoordinateToGlobal = function (coordinate) {
//     return {
//         x: coordinate.x + this.x,
//         y: coordinate.y + this.y
//     }
// }

// ======= Visual debugging
if (debugConf.showGraph) {
    const c = new joint.shapes.standard.Circle({
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
        attrs: {
            body: {
                refCx: 0,
                refCy: 0,
                pointerEvents: 'none',
                fill: 'white',
                stroke: 'red',
                strokeWidth: 3
            }
        }
    });

    const l = new joint.shapes.standard.Link({
        router: {
            name: 'normal'
        },
        attrs: {
            line: {
                sourceMarker: null,
                targetMarker: null,
                stroke: 'blue',
                strokeDasharray: '5 5',
                strokeOpacity: 0.5,
                strokeWidth: 1
            }
        },
        markup: [{
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }],
        z: -1
    });

    const debugCells = [];
    const debugLinks = [];

    config.planner.graph.verts.forEach(vert => {
        const ds = c.clone();
        ds.position(vert.x * config.step, vert.y * config.step);

        vert.edges.forEach(edge => {
            const ls = l.clone();
            l.source({ x: vert.x * config.step, y: vert.y * config.step });
            l.target({ x: edge.x * config.step, y: edge.y * config.step });
            debugLinks.push(ls);
        });

        debugCells.push(ds);
    });

    graph.addCells(debugLinks).addCells(debugCells);
}

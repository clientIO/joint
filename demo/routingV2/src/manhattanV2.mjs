import * as joint from '../../../joint.mjs';
import ndarray from 'ndarray';
import ops from 'ndarray-ops';
import prefixSum from 'ndarray-prefix-sum';
import createPlanner from 'l1-path-finder';

// From talks with Roman
// [ ][benched] - no grid, no negative coords, just +/- 100000 OR
// [ ][benched] - no grid, no negative coords, just 0,0 and higher
// [x] - remove the additional bends
// [x] - preserve old vertices
// [x] - start/end directions
// [ ] - improved start/end directions - better first verts
// [ ] - to/from a port connection
// [ ] - simplify when only 4 points
// [ ][benched] - limit grid updates to speed up path-finding

// ======= Debugging
const debugConf = {
    showGraph: true,
    showGrid: true,
    plannerBenchmark: true,
    routerBenchmark: true,
}
const debugStore = {
    gridPrinted: false,
    graphPrinted: false,
}
const debugLog = function () {};

// ======= Testing config
const paperWidth = 1000;
const paperHeight = 800;
const obstacleCount = 10;

// ======= Router config
const config = {
    step: 53,
    padding: 16,
    algorithm: 'l1',                                        // todo: new feature; l1 be default, other `a-star`, `dijkstra` etc.
    startDirections: ['top', 'right', 'bottom', 'left'],
    endDirections: ['top', 'right', 'bottom', 'left'],
    preferRoute: 'simple',                                  // todo: new feature; by default sticks links to obstacles: 'tight', 'lessCorners'
    perpendicular: true,                                    // todo
    excludeEnds: [],                                        // todo
    excludeTypes: [],                                       // todo: should we even have it in this form, or should it be done via obstacles API
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
        // this is all POC code to find the visual results we're happy with
        const routerStartTime = window.performance.now();
        const pathfinder = new Pathfinder(graph, config).bake();

        // silly implementation, requires fool-proofing
        const oldVertices = [...vertices], newVertices = [];
        let shortestPath = [], shortestDistance = Infinity, startNudge, endNudge, startAxis, endAxis;
        for (let sd = 0; sd < config.startDirections.length; sd++) {
            const sourcePoint = bboxToPoint(linkView.sourceBBox, config.startDirections[sd]);

            for (let td = 0; td < config.endDirections.length; td++) {
                const targetPoint = bboxToPoint(linkView.targetBBox, config.endDirections[td]);

                let from, to;
                for (let i = 0; i <= oldVertices.length; i++) {
                    from = sourcePoint.clone();
                    to = oldVertices[i];

                    if (!to) {
                        to = targetPoint.clone();
                    }

                    const path = [];
                    const distance = pathfinder.planner.search(
                        from.x / config.step,
                        from.y / config.step,
                        to.x / config.step,
                        to.y / config.step,
                        path
                    );

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        shortestPath = path;
                        startNudge = from;
                        endNudge = to;
                        startAxis = config.startDirections[sd];
                        endAxis = config.startDirections[td];
                    }

                    if (i === oldVertices.length) {
                        break;
                    }
                }
            }
        }

        const simplePath = config.preferRoute === 'simple' ? simplifyPath(shortestPath, pathfinder.grid) : shortestPath;
        while (simplePath.length > 1) {
            const coords = simplePath.splice(0, 2);
            newVertices.push({
                x: coords[0] * config.step,
                y: coords[1] * config.step
            });
        }

        if (newVertices.length >= 2) {
            const count = newVertices.length;
            const sAxis = newVertices[0].x === newVertices[1].x ? 'x' : 'y';
            const tAxis = newVertices[count - 1].x === newVertices[count - 2].x ? 'x' : 'y';

            let si = 0;
            const adjustedStart = newVertices[si][sAxis];
            while (true) {
                if (newVertices[si] === undefined) break;

                if (newVertices[si][sAxis] === adjustedStart) {
                    newVertices[si][sAxis] = startNudge[sAxis];
                    si++;
                } else {
                    break;
                }
            }

            let ti = count - 1;
            const adjustedEnd = newVertices[ti][tAxis];
            while (true) {
                if (newVertices[ti] === undefined) break;

                if (newVertices[ti][tAxis] === adjustedEnd) {
                    newVertices[ti][tAxis] = endNudge[tAxis];
                    ti--;
                } else {
                    break;
                }
            }

            newVertices.splice(0, 1, startNudge);
            newVertices.splice(newVertices.length - 1, 1, endNudge);
        }

        const routerEndTime = window.performance.now();
        if (debugConf.routerBenchmark) {
            console.warn('Router time: ' + (routerEndTime-routerStartTime).toFixed(2) + 'ms');
        }
        return newVertices;

        function bboxToPoint(bbox, dir) {
            const pts = {
                top: bbox.topMiddle().translate(0, -config.padding),
                right: bbox.rightMiddle().translate(config.padding, 0),
                bottom: bbox.bottomMiddle().translate(0, config.padding),
                left: bbox.leftMiddle().translate(-config.padding, 0)
            }
            return pts[dir];
        }
    },
    gridSize: config.step,
    async: true,
    model: graph
});

const simplifyPath = function(path, grid) {
    const simplePath = [];
    while (path.length > 1) {
        if (path.length <= 4) {
            simplePath.push(...path);
            path.length = 0;
        } else if (isStacked(path)) {
            path.splice(0, 2);
        } else if (isVertical(path) || isHorizontal(path)) {
            path.splice(0, 4, path[0], path[1]);
        } else if (isDownStep(path)) {
            const head = path.splice(0, 2);
            const tail = path.slice(0, 8);
            const simplified = [head[0], head[1], head[0], tail[7], tail[6], tail[7]];

            if (isPathClear(simplified, grid)) {
                path.splice(0, 8);
                path.unshift(...simplified);
            } else {
                simplePath.push(...head);
            }
        } else if (isUpStep(path)) {
            const head = path.splice(0, 2);
            const tail = path.slice(0, 8);
            const simplified = [head[0], head[1], tail[6], head[1], tail[6], tail[7]];

            if (isPathClear(simplified, grid)) {
                path.splice(0, 8);
                path.unshift(...simplified);
            } else {
                simplePath.push(...head);
            }
        } else {
            simplePath.push(...path.splice(0, 2));
        }
    }
    return simplePath;

    function isStacked(s) {
        return s[0] === s[2] && s[1] === s[3];
    }

    function isVertical(s) {
        return s[0] === s[2] && s[2] === s[4];
    }

    function isHorizontal(s) {
        return s[1] === s[3] && s[3] === s[5];
    }

    function isDownStep(s) {
        return (s.length >= 10) *
            (s[0] === s[2] && s[2] !== s[4]) *
            (s[1] !== s[3] && s[3] === s[5]) *
            (s[4] === s[6] && s[6] !== s[8]) *
            (s[5] !== s[7] && s[7] === s[9]);
    }

    function isUpStep(s) {
        return (s.length >= 10) *
            (s[1] === s[3] && s[3] !== s[5]) *
            (s[0] !== s[2] && s[2] === s[4]) *
            (s[5] === s[7] && s[7] !== s[9]) *
            (s[4] !== s[6] && s[6] === s[8]);
    }

    function isPathClear(s, grid) {
        let obstructed;
        for (let i = 0; i < s.length; i += 2) {
            const vertical = s[i] === s[i + 2];
            const bounds = vertical ? [s[i + 1], s[i + 3]] : [s[i], s[i + 2]];
            bounds.sort((a, b) => { return a - b });

            for (let j = bounds[0]; j <= bounds[1]; j++) {
                if (grid.get(
                    vertical ? s[i] : j ,
                    vertical ? j : s[i + 1]
                ) === 1) {
                    obstructed = true;
                    break;
                }
            }
        }

        return !obstructed;
    }
}

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
const addObstacles = function() {
    obstacles.length = 0;

    for (let f = 0; f < obstacleCount; f++) {
        const obs = obstacle.clone();
        const bbox = obs.getBBox();
        obs.translate(getRandomInt(0, paperWidth - bbox.width), getRandomInt(0, paperHeight - bbox.height));
        obstacles.push(obs);
    }
};
addObstacles();

// ======= Init
graph.addCells(obstacles).addCells([source, target, link]);

// ============================================================================
// Router V2
// ============================================================================
function Pathfinder(graph, {
    step = 10,
    padding = 0,
    chunkSize = 100,
    algorithm = 'l1'
} = {}) {
    if (!graph) {
        return debugLog('Pathfinder requires an instance of dia.Graph.');
    }

    this.planner = null;
    this.grid = null;

    this._graph = graph;
    this._step = step;
    this._padding = padding;

    const { cols, rows } = getGridSize(paperWidth, paperHeight, step), size = cols * rows;
    if (!Number.isNaN(size) && size <= Number.MAX_SAFE_INTEGER) {
        this.grid = ndarray( new Int8Array(size).fill(0), [cols, rows]);
    } else {
        debugLog('Invalid grid size.');
    }

    function getGridSize(paperWidth, paperHeight, step) {
        return {
            cols: Math.ceil(paperWidth / step),
            rows: Math.ceil(paperHeight / step)
        }
    }

    // todo:
    // this.chunks = new Chunks({ step, chunkSize });
}
Pathfinder.prototype.bake = function() {
    this._graph.getElements().forEach(element => {
        if (element.id === source.id || element.id === target.id || element.get('type') === 'dc') {
            return;
        }

        const bb = element.getBBox().moveAndExpand({
            x: -this._padding,
            y: -this._padding,
            width: 2 * this._padding,
            height: 2 * this._padding
        });

        const gridX = Math.floor(bb.x / this._step);
        const gridY = Math.floor(bb.y / this._step);
        const boundX = Math.ceil((bb.x + bb.width) / this._step);
        const boundY = Math.ceil((bb.y + bb.height) / this._step);

        for(let i = gridX; i < boundX; ++i) {
            for(let j = gridY; j < boundY; ++j) {
                this.grid.set(i, j, 1);
            }
        }
    });
    this.planner = createPlanner(this.grid);

    if (debugConf.showGrid && !debugStore.gridPrinted) {
        showDebugGrid(this.grid);
        debugStore.gridPrinted = true;
    }

    if (debugConf.showGraph && !debugStore.graphPrinted) {
        showDebugGraph(this.planner);
        debugStore.graphPrinted = true;
    }

    return this;
}

function Planner() {}
Planner.prototype.getPath = () => {}
Planner.prototype.connectChunks = () => {}
Planner.prototype.separateChunks = () => {}

function Chunks({ step, chunkSize } = {}) {
    this._chunkSize = step * chunkSize;

    // quadrants allows for negative coordinate chunk storage
    // each quadrant consists of a flat array interpreted as 2d array
    // i.e. [0,0] is index 0; [1,0] is index 1, [0,1] is index 2 and so on...
    //  3 | 1
    // ---|---
    //  2 | 0
    this.quadrants = new Array(4).fill([]);
}
Chunks.prototype.get = (quadrant, x, y) => {
    return this.quadrants[quadrant][x + y * 2];
}
Chunks.prototype.set = (quadrant, x, y, chunk) => {
    return this.quadrants[quadrant][x + y * 2] = chunk;
}
Chunks.prototype.fromPoint = (point) => {
    if (Number.isNaN(point.x) || Number.isNaN(point.y)) {
        return debugLog('Invalid point provided.');
    }

    const q = (1 * (point.y < 0)) + (2 * (point.x < 0));
    const qx = Math.floor(Math.abs(position.x) / this._chunkSize);
    const qy = Math.floor(Math.abs(position.y) / this._chunkSize);

    return this.quadrants[q][qx + qy * 2];
}
Chunks.prototype.remove = () => {}

function Chunk() {
    this.id = 0; // int id
    this.obstacles = new Obstacles();
}
Chunk.prototype.bake = () => {}
Chunk.prototype.update = () => {}
Chunk.prototype.registerObstacle = () => {}
Chunk.prototype.registerCell = () => {}
Chunk.prototype.getObstacles = () => {}
Chunk.prototype.getCells = () => {}
Chunk.prototype.unregisterObstacle = () => {}
Chunk.prototype.unregisterCell = () => {}

function Grid() {}
Grid.prototype.isCoordinateFree = () => {}

function Obstacles() {
    this.store = {};
    // this.length = Infinity;
}
Obstacles.prototype.get = () => {
    return this.store;
}
Obstacles.prototype.get = (cellId) => {
    return this.store[cellId]?.index;
}
Obstacles.prototype.set = (cellId, obstacle) => {
    return this.store[cellId] = obstacle;
}
Obstacles.prototype.remove = (cellId) => {
    delete this.store[cellId];
}

function Obstacle() {
    this.index = 0;     // index used by ndarray
    this.cellId = null; // can't be null
    this.bounds = new ArrayBuffer(4);   // 4 byte array buffer to ease ndarray operations
}
Obstacle.prototype.size = () => {
    return {
        width: this.bounds[2],
        height: this.bounds[3]
    }
}
Obstacle.prototype.size = ({ width = 0, height = 0 } = {}) => {
    this.bounds[2] = this.bounds[0] + width;
    this.bounds[3] = this.bounds[1] + height;
}
Obstacle.prototype.position = () => {
    return {
        x: this.bounds[0],
        y: this.bounds[1]
    }
}
Obstacle.prototype.position = (x, y) => {
    this.bounds[0] = x;
    this.bounds[1] = y;
}

// ======= Support data structures
function ObjectPool() {}
function BinaryHeap() {}

// ======= Pathfinder Core
function PathfinderGeometry(graph) {
    this._graph = graph;
    this.corners = [];
    this.entities = [];
}

PathfinderGeometry.prototype.build = function(config) {
    const grid = ndarray(new Int8Array((paperWidth / config.step) * (paperHeight / config.step)).fill(0), [paperWidth / config.step, paperHeight / config.step]);

    this.obstacles = [];
    this.corners = [];
    graph.getElements().forEach(element => {
        const bb = element.getBBox().moveAndExpand({
            x: -config.padding,
            y: -config.padding,
            width: 2 * config.padding,
            height: 2 * config.padding
        });

        const gridX = Math.round(bb.x / config.step);
        const gridY = Math.round(bb.y / config.step);
        const boundX = Math.round((bb.x + bb.width + config.padding) / config.step);
        const boundY = Math.round((bb.y + bb.height + config.padding) / config.step);

        this.obstacles.push(element.id);
        this.corners.push(gridX, gridY, boundX, boundY);
    });

    const img = ndarray(new Int32Array(grid.shape[0]*grid.shape[1]), grid.shape);
    ops.gts(img, grid, 0);
    prefixSum(img);

    this.img = img;
}

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
paper.on('link:mouseenter', function(linkView) {
    var tools = new joint.dia.ToolsView({
        tools: [new joint.linkTools.Vertices()]
    });
    linkView.addTools(tools);
});

paper.on('link:mouseleave', function(linkView) {
    linkView.removeTools();
});

// ======= Visual debugging
function showDebugGraph(planner) {
    const c = new joint.shapes.standard.Circle({
        type: 'dc',
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
        type: 'dl',
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

    planner.graph.verts.forEach(vert => {
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

function showDebugGrid(grid) {
    const ro = new joint.shapes.standard.Rectangle({
        type: 'dc',
        position: { x: 0, y: 0 },
        size: { width: config.step, height: config.step },
        attrs: {
            body: {
                pointerEvents: 'none',
                fill: '#ff0000',
                fillOpacity: 0.2,
                stroke: 'white',
                strokeWidth: 1
            }
        }
    });

    const gridCells = [];
    for (let i = 0; i < grid.shape[0]; i++) {
        for (let j = 0; j < grid.shape[1]; j++) {
            if (grid.get(i, j) === 1) {
                const dc = ro.clone();
                dc.position(i * config.step, j * config.step);
                gridCells.push(dc);
            }
        }
    }

    graph.addCells(gridCells);
}

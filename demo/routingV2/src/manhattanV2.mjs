// import * as joint from '../../../joint.mjs';
import * as joint from '../../../../rappid/rappid.mjs';
import Pathfinder from './models/Pathfinder.mjs';
import { debugConf, debugStore, showDebugGraph, showDebugGrid } from './debug.mjs';

// ======= Router config
const config = {
    step: 20,
    padding: 10, // joint.util.normalizeSides
    algorithm: 'l1',                                        // todo: new feature; l1 be default, other `a-star`, `dijkstra` etc.
    startDirections: ['right'],
    endDirections: ['left'],
    excludeEnds: [],                                        // todo: 'source', 'target'
    excludeTypes: [],                                       // todo: should we even have it in this form, or should it be done via obstacles API
};

// ===============================================================================
// JointJS
// ===============================================================================
const graph = new joint.dia.Graph();
const paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 3000,
    height: 1800,
    gridSize: config.step,
    interactive: {
        elementMove: false
    },
    async: true,
    model: graph,
    defaultRouter: routerV2
    // defaultRouter: { name: 'manhattan', args: { padding: 10 }}
});

// ======= Pathfinder
const pathfinder = new Pathfinder(graph, paper, config);

// ======= Events
graph.on('add', function(cell) {
    if (cell.isElement() && !cell.get('debugIgnore')) {
        pathfinder.addObstacle(cell);
    }
});

graph.on('remove', function(cell) {
    console.log('remove');
});

graph.on('change:position', function(cell) {
    if (cell.isElement() && !cell.get('debugIgnore')) {
        const obstacle = pathfinder.getObstacleByCellId(cell.id);

        if (!obstacle) return;

        const start = window.performance.now();
        obstacle.update();
        const end = window.performance.now();
        if (debugConf.gridUpdateBenchmark) {
            console.warn('Took ' + (end - start).toFixed(2) + 'ms to update Grid.');
        }
    }
});

graph.on('change:size', function(cell) {
    console.log('size');
});

paper.on('element:pointermove', function(view, evt, x, y) {
    const data = evt.data;
    let ghost = data.ghost;
    if (!ghost) {
        const position = view.model.position();
        ghost = view.vel.clone();
        ghost.attr('opacity', 0.3);
        ghost.appendTo(this.viewport);
        evt.data.ghost = ghost;
        evt.data.dx = x - position.x;
        evt.data.dy = y - position.y;
    }
    const pt = new joint.g.Point(x - data.dx, y - data.dy).snapToGrid(config.step);
    ghost.attr('transform', 'translate(' + [pt.x, pt.y] + ')');
});

paper.on('element:pointerup', function(view, evt, x, y) {
    let data = evt.data;
    if (data.ghost) {
        data.ghost.remove();
        const pt = new joint.g.Point(x - data.dx, y - data.dy).snapToGrid(config.step);
        view.model.position(pt.x, pt.y);
    }
});

paper.on('render:done', function() {
    if (debugConf.fullRouterBenchmark && !debugStore.fullRouterTimeDone) {
        console.warn('Took ' + debugStore.fullRouterTime.toFixed(2) + 'ms to calculate all routes.');
        debugStore.fullRouterTimeDone = true;
    }

    if (debugConf.showGrid && !debugStore.gridPrinted) {
        showDebugGrid(pathfinder);
        debugStore.gridPrinted = true;
    }

    if (debugConf.showGraph && !debugStore.graphPrinted) {
        showDebugGraph(pathfinder);
        debugStore.graphPrinted = true;
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
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

if (debugConf.graphType === 'grid-layout') {
    const { width, height } = paper.getComputedSize(), pairsCount = 1000, sources = [], targets = [];
    for (let i = 0; i < pairsCount; i++) {
        const s = source.clone();
        s.translate(Math.random() * (width - s.size().width), Math.random() * (height - s.size().height));

        const t = target.clone();
        t.translate(Math.random() * (width - t.size().width), Math.random() * (height - t.size().height));

        sources.push(s);
        targets.push(t);
    }

    const st = [...sources, ...targets].sort(() => (Math.random() > .5 ? 1 : -1));
    const toLink = [...targets], links = [];
    sources.forEach(s => {
        const i = getRandomInt(0, toLink.length);
        const [t] = toLink.splice(i, 1);
        const l = link.clone();
        l.set('source', { id: s.id });
        l.set('target', { id: t.id });

        links.push(l);
    });

    // ======= Init
    graph.addCells([...st, ...links]);

    const layout = joint.layout;
    layout.GridLayout.layout(graph, {
        columns: 40,
        columnWidth: 250,
        rowHeight: 150
    });
} else {
    const { width, height } = paper.getComputedSize(), obstacles = [], obsCount = 100;
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
}

// ======= V2 Router
function routerV2(vertices, args, linkView) {
    // todo: switch on strategy/algorithm

    // this is all POC code to find the visual results we're happy with
    if (vertices.length > 0) {
        // snap existing vertices
        vertices.forEach((vertex, index) => {
            vertices[index] = new joint.g.Point(vertex).snapToGrid(config.step);
        });

        linkView.model.vertices(vertices);
    }

    const routerStartTime = window.performance.now();

    const startTarget = vertices.length > 0 ? vertices[0] : linkView.targetBBox.center();
    const startDirections = getSortedDirections(linkView.sourceBBox.center(), startTarget, config.startDirections);
    const endSource = vertices.length > 0 ? vertices[vertices.length - 1] : linkView.sourceBBox.center();
    const endDirections = getSortedDirections(linkView.targetBBox.center(), endSource, config.endDirections);

    const pathSegments = [];
    let startPosition, endPosition;
    for (let s = 0; s <= vertices.length; s++) {
        const segmentStart = vertices[s - 1];
        const segmentEnd = vertices[s];

        let fromPoints = [segmentStart], toPoints = [segmentEnd];
        if (segmentStart === undefined) {
            fromPoints = startDirections;
        }

        if (segmentEnd === undefined) {
            toPoints = endDirections;
        }

        let shortestDistance = Infinity, from, to;
        for (let f = 0; f < fromPoints.length; f++) {
            from = fromPoints[f];
            if (!(from instanceof joint.g.Point)) {
                from = bboxToPoint(linkView.sourceBBox, from);
            }

            for (let t = 0; t < toPoints.length; t++) {
                to = toPoints[t];
                if (!(to instanceof joint.g.Point)) {
                    to = bboxToPoint(linkView.targetBBox, to);
                }

                const path = [];
                const sx = from.x / config.step;
                const sy = from.y / config.step;
                const tx = to.x / config.step;
                const ty = to.y / config.step;
                const distance = pathfinder.search(sx, sy, tx, ty, path);

                let endpointDistance = 0, dirs = {};
                if (s === 0) {
                    // start-point segment
                    endpointDistance += (from.distance(linkView.sourceBBox.center()) / config.step);
                    dirs.start = fromPoints[f];
                }

                if (s === vertices.length) {
                    // end-point segment
                    endpointDistance += (to.distance(linkView.targetBBox.center()) / config.step);
                    dirs.end = toPoints[t];
                }

                if (distance + endpointDistance < shortestDistance) {
                    shortestDistance = distance + endpointDistance;

                    if (s === 0) {
                        startPosition = from;
                    }

                    if (s === vertices.length) {
                        endPosition = to;
                    }

                    pathSegments[s] = removeTurnsFromPath(path, pathfinder.grid, dirs);
                    // pathSegments[s] = path;
                }
            }
        }

        // path not found, source/target most probably within obstacle
        if (shortestDistance === Infinity) {
            let from = fromPoints[0];
            let to = toPoints[0];

            if (!(from instanceof joint.g.Point)) {
                from = bboxToPoint(linkView.sourceBBox, from);
            }


            if (!(to instanceof joint.g.Point)) {
                to = bboxToPoint(linkView.targetBBox, to);
            }

            let fromObstacleNodes = [], toObstacleNodes = [];

            const fromX = Math.floor(from.x / config.step), fromY = Math.floor(from.y / config.step);
            if (pathfinder.grid.getBinary(fromX, fromY) === 1) {
                fromObstacleNodes = pathfinder.grid.getObstacleBlob(fromX, fromY, pathfinder.grid);
            }

            const toX = Math.floor(to.x / config.step), toY = Math.floor(to.y / config.step);
            if (pathfinder.grid.getBinary(toX, toY) === 1) {
                toObstacleNodes = pathfinder.grid.getObstacleBlob(toX, toY, pathfinder.grid);
            }


            fromObstacleNodes.forEach(node => pathfinder.grid.set(node.x, node.y, 0));
            toObstacleNodes.forEach(node => pathfinder.grid.set(node.x, node.y, 0));
            pathfinder._dirty = true;

            let path = [];
            const dist = pathfinder.search(
                from.x / config.step,
                from.y / config.step,
                to.x / config.step,
                to.y / config.step,
                path
            );

            if (dist < shortestDistance && dist !== Infinity) {
                if (s === 0) {
                    startPosition = from;
                }

                if (s === vertices.length - 1) {
                    endPosition = to;
                }

                pathSegments[s] = removeTurnsFromPath(path, pathfinder.grid, {
                    start: startDirections[0],
                    end: endDirections[0]
                });
            }

            fromObstacleNodes.forEach(node => pathfinder.grid.set(node.x, node.y, node));
            toObstacleNodes.forEach(node => pathfinder.grid.set(node.x, node.y, node));
            pathfinder._dirty = true;
        }
    }

    const newVertices = [];
    pathSegments.forEach(segment => {
        while (segment.length > 1) {
            const coords = segment.splice(0, 2);
            newVertices.push(new joint.g.Point(coords[0] * config.step, coords[1] * config.step));
        }
    });

    if (newVertices.length >= 2) {
        const count = newVertices.length;
        const sAxis = newVertices[0].x === newVertices[1].x ? 'x' : 'y';
        const tAxis = newVertices[count - 1].x === newVertices[count - 2].x ? 'x' : 'y';

        let si = 0;
        const adjustedStart = newVertices[si][sAxis];
        while (startPosition) {
            if (newVertices[si] === undefined) break;

            if (newVertices[si][sAxis] === adjustedStart) {
                newVertices[si][sAxis] = startPosition[sAxis];
                si++;
            } else {
                break;
            }
        }

        let ti = count - 1;
        const adjustedEnd = newVertices[ti][tAxis];
        while (endPosition) {
            if (newVertices[ti] === undefined) break;

            if (newVertices[ti][tAxis] === adjustedEnd) {
                newVertices[ti][tAxis] = endPosition[tAxis];
                ti--;
            } else {
                break;
            }
        }

        if (startPosition) {
            newVertices.splice(0, 1, startPosition);
        }

        if (endPosition) {
            newVertices.splice(newVertices.length - 1, 1, endPosition);
        }
    }

    if (debugConf.showGetInBox) {
        const origin = linkView.sourceBBox.origin();
        const width = linkView.targetBBox.corner().x - origin.x;
        const height = linkView.targetBBox.corner().y - origin.y;
        const area = new joint.g.Rect(origin.x, origin.y, width, height);

        const startbb = window.performance.now();
        const cells = pathfinder.getObstaclesInArea(area);
        const endbb = window.performance.now();

        const startbbg = window.performance.now();
        const cells1 = graph.findModelsInArea(area);
        const endbbg = window.performance.now();

        console.warn('Found: ' + Object.keys(cells).length + ' cells in ' + (endbb-startbb).toFixed(2) + 'ms using Pathfinder, and ' + cells1.length + ' cells in ' + (endbbg-startbbg).toFixed(2) + ' ms using findModelsInArea');
    }

    const routerEndTime = window.performance.now();
    if (!debugStore.fullRouterTimeDone) {
        debugStore.fullRouterTime += (routerEndTime - routerStartTime);
    }
    if (debugConf.routerBenchmark) {
        console.warn('Took ' + (routerEndTime - routerStartTime).toFixed(2) + 'ms to calculate route.');
    }
    return newVertices;

    function bboxToPoint(bbox, dir) {
        const pts = {
            top: bbox.topMiddle().translate(0, -(config.padding + config.step)),
            right: bbox.rightMiddle().translate((config.padding + config.step), 0),
            bottom: bbox.bottomMiddle().translate(0, (config.padding + config.step)),
            left: bbox.leftMiddle().translate(-(config.padding + config.step), 0)
        }
        return pts[dir];
    }
}

// ======= Helpers
const removeTurnsFromPath = function(path, grid, directions) {
    const fixed = [], toFix = [...path];

    let horizontal = directions.start === 'left' || directions.start === 'right', tried = false;
    while (toFix.length >= 6) {
        const midX = horizontal ? toFix[4] : toFix[0];
        const midY = horizontal ? toFix[1] : toFix[5];
        const p = [toFix[0], toFix[1], midX, midY, toFix[4], toFix[5]];

        if (isPathClear(p, grid)) {
            toFix.splice(0, 6, ...p);
            fixed.push(...toFix.splice(0, 2));
        } else if (!tried) {
            horizontal = !horizontal;
            tried = true;
        } else {
            tried = false;
            fixed.push(...toFix.splice(0, 2));
        }
    }

    fixed.push(...toFix);
    return fixed;

    function isPathClear(s, grid) {
        let obstructed;
        for (let i = 0; i < s.length; i += 2) {
            const vertical = s[i] === s[i + 2];
            const bounds = vertical ? [s[i + 1], s[i + 3]] : [s[i], s[i + 2]];
            bounds.sort((a, b) => { return a - b });

            for (let j = bounds[0]; j <= bounds[1]; j++) {
                if (grid.getBinary(
                    vertical ? s[i] : j ,
                    vertical ? j : s[i + 1]
                ) === 1) {
                    obstructed = true;
                    break;
                }
            }

            if (obstructed) {
                break;
            }
        }

        return !obstructed;
    }
}

function getSortedDirections(from, to, directions) {
    let dirs = [...directions], additional = [];

    if (directions.indexOf('horizontal') > -1) {
        additional.concat(['left', 'right']);
    }

    if (directions.indexOf('vertical') > -1) {
        additional.concat(['top', 'bottom']);
    }

    const priorityDirections = [
        from.y - to.y <= 0 ? 'bottom' : 'top',
        from.x - to.x <= 0 ? 'right' : 'left'
    ];

    if (Math.abs(from.x - to.x) >= Math.abs(from.y - to.y)) {
        priorityDirections.reverse();
    }

    priorityDirections.forEach(dir => {
        if (dirs.indexOf(dir) > -1) {
            dirs.unshift(dir);
        }
    });

    return joint.util.uniq(dirs);
}


import { util } from '../../../../joint.mjs';

import Grid from './Grid.mjs';
import Obstacle from './Obstacle.mjs';

import { debugConf, debugLog, debugStore, showDebugGrid } from '../debug.mjs';
import { JumpPointFinder } from '../finders/index.mjs';

const config = {
    step: 10,
    padding: 10,
    startDirections: ['top', 'right', 'bottom', 'left'],
    endDirections: ['top', 'right', 'bottom', 'left'],
}

let s, e;
export default class Pathfinder {

    constructor(graph, paper, opt = {}) {
        if (!graph) {
            return debugLog('Pathfinder requires an instance of dia.Graph.');
        }

        this.opt = resolveOptions(opt);

        // Grid
        const { width, height } = getGridSize(paper, opt.step);
        this.grid = new Grid(opt.step, width, height);

        // Obstacles and ref to Graph cells
        this._obstacles = {};
        this._cells = {};

        // References
        this._graph = graph;

        // Flags
        this._dirty = false;

        // Initialize all events bridging Pathfinder with Paper and Graph
        this._initEvents(graph, paper);
    }

    search(vertices, args, linkView) {
        const { opt } = this;
        const finder = new JumpPointFinder({ grid: this.grid });

        const from = getRectPoints(linkView.sourceBBox, opt.startDirections, opt);
        const to = getRectPoints(linkView.targetBBox, opt.endDirections, opt)[0];

        s = window.performance.now();
        const path = finder.findPath(from, to, vertices, linkView);
        e = window.performance.now();

        if (debugConf.routerBenchmark) {
            console.info('Took ' + (e - s).toFixed(2) + ' ms to calculate route');
        }
        debugStore.fullRouterTime += (e - s);

        return path;
    }

    addObstacle(element) {
        const obstacle = new Obstacle(element, this);
        const fragment = obstacle.fragment();

        for(let i = 0; i < fragment.shape[0]; ++i) {
            for(let j = 0; j < fragment.shape[1]; ++j) {
                let prev = {};
                if (fragment.get(i, j) === 1) {
                    prev = fragment.data.item(fragment.index(i, j));
                }

                prev[obstacle.index] = true;
                fragment.set(i, j, prev);
            }
        }

        this._obstacles[obstacle.index] = obstacle;
        this._cells[element.id] = obstacle.index;
    }

    getObstacleByCellId(cellId) {
        return this._obstacles[this._cells[cellId]] || null;
    }

    getObstaclesInArea(rect) {
        const fragment = this.grid.getFragment(Obstacle.rectToBounds(rect, this.step));

        const obstacles = {};
        for(let i = 0; i < fragment.shape[0]; ++i) {
            for(let j = 0; j < fragment.shape[1]; ++j) {
                const node = fragment.data.item(fragment.index(i, j));
                if (node === undefined) {
                    continue;
                }

                Object.assign(obstacles, node.obstacles);
            }
        }

        return Object.keys(obstacles).map((id) => this._obstacles[id]._cell);
    }

    _initEvents(graph, paper) {
        // ======= Events
        graph.on('add', (cell) => {
            if (cell.isElement() && !cell.get('debugIgnore')) {
                const s = window.performance.now();
                this.addObstacle(cell);
                const e = window.performance.now();
                debugStore.fullGridTime += (e - s);
            }
        });

        graph.on('change:position', (cell) => {
            if (cell.isElement() && !cell.get('debugIgnore')) {
                const obstacle = this.getObstacleByCellId(cell.id);

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

        paper.on('render:done', () => {
            if (debugConf.fullRouterBenchmark && !debugStore.fullRouterTimeDone) {
                console.info('Took ' + debugStore.fullRouterTime.toFixed(2) + ' ms to calculate ' + graph.getLinks().length + ' routes.');
                debugStore.fullRouterTimeDone = true;
            }

            if (debugConf.fullGridUpdateBenchmark && !debugStore.fullGridTimeDone) {
                console.info('Took ' + debugStore.fullGridTime.toFixed(2) + ' ms to build initial grid.');
                debugStore.fullGridTimeDone = true;
            }

            if (debugConf.showGrid && !debugStore.gridPrinted) {
                showDebugGrid(this);
                debugStore.gridPrinted = true;
            }
        });
    }
}

function getRectPoints(rect, directions, opt) {
    const bbox = rect.clone().moveAndExpand(opt.paddingBox), points = [];

    directions.forEach(dir => {
        switch (dir) {
            case 'top':
                points.push(bbox.topMiddle().translate(0, -opt.step));
               break;
            case 'right':
               points.push(bbox.rightMiddle().translate(opt.step, 0));
               break;
            case 'bottom':
               points.push(bbox.bottomMiddle().translate(0, opt.step));
               break;
            case 'left':
               points.push(bbox.leftMiddle().translate(-opt.step, 0));
               break;
        }
    });

    return points;
}

const getGridSize = (paper, step) => {
    const { width, height } = paper.getComputedSize();

    return {
        width: Math.ceil(width / step),
        height: Math.ceil(height / step)
    }
}

function resolveOptions(opt) {
    opt = util.assign({}, config, opt);

    opt.paddingBox = util.result(opt, 'paddingBox');
    opt.padding = util.result(opt, 'padding');

    if (opt.padding) {
        // if both provided, opt.padding wins over opt.paddingBox
        const sides = util.normalizeSides(opt.padding);
        opt.paddingBox = {
            x: -sides.left,
            y: -sides.top,
            width: sides.left + sides.right,
            height: sides.top + sides.bottom
        };
    }

    return opt;
}

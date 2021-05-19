import { util, g } from '../../../../joint.mjs';
import { debugConf, debugLog, debugStore, showDebugGrid } from '../debug.mjs';

import Grid from './Grid.mjs';
import Obstacle from './Obstacle.mjs';
import { JumpPointFinder } from '../finders/index.mjs';

const config = {
    step: 10,
    padding: 10,
    startDirections: ['top', 'right', 'bottom', 'left'],
    endDirections: ['top', 'right', 'bottom', 'left'],
    quadrantSize: 94906265, // floor(sqrt(MAX_SAFE_INTEGER))
}

export default class Pathfinder {

    constructor(graph, paper, opt = {}) {
        if (!graph) {
            return debugLog('Pathfinder requires an instance of dia.Graph.');
        }

        this.opt = resolveOptions(opt);
        const { step, quadrantSize } = this.opt;

        // Grid
        const { width, height } = getGridSize(paper, step);
        this.grid = new Grid(step, width, height, quadrantSize);

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

        const from = this._getRectPoints(linkView.sourceBBox, opt.startDirections, opt);
        const to = this._getRectPoints(linkView.targetBBox, opt.endDirections, opt);

        const s = window.performance.now();
        const path = finder.findPath(from, to, vertices);
        const e = window.performance.now();

        if (debugConf.routerBenchmark) {
            console.info('Took ' + (e - s).toFixed(2) + ' ms to calculate route');
        }
        debugStore.fullRouterTime += (e - s);

        return path;
    }

    addObstacle(element) {
        const obstacle = new Obstacle(element, this);
        const { hi, lo } = obstacle.bounds;

        for (let x = lo.x; x < hi.x; ++x) {
            for (let y = lo.y; y < hi.y; ++y) {
                let prev = {};
                if (!this.grid.v2traversable(x, y)) {
                    prev = this.grid.v2get(x, y);
                }

                if (prev) {
                    prev[obstacle.id] = obstacle.cell;
                    this.grid.v2set(x, y, prev);
                }
            }
        }

        this._obstacles[obstacle.id] = obstacle;
        this._cells[element.id] = obstacle.id;
    }

    getObstacleByCellId(cellId) {
        return this._obstacles[this._cells[cellId]] || null;
    }

    // todo: update from L1
    getObstaclesInArea(rect) {
        const { lo, hi } = Obstacle.rectToBounds(rect, this.opt.step);

        const obstacles = {};
        for (let x = lo.x; x < hi.x; ++x) {
            for (let y = lo.y; y < hi.y; ++y) {
                const node = this.grid.v2get(x, y);
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

    _getRectPoints(rect, directions, opt) {
        const transform = new g.Rect(opt.paddingBox)
            .moveAndExpand({ x: -opt.step, y: -opt.step, width: 2 * opt.step, height: 2 * opt.step });
        const bbox = rect.clone().moveAndExpand(transform);
        const center = bbox.center();

        const points = {};
        directions.forEach(dir => {
            switch (dir) {
                case 'top':
                    const top = bbox.topMiddle();
                    points.top = {
                        coordinates: top,
                        offset: top.distance(center) / opt.step
                    };
                    break;
                case 'right':
                    const right = bbox.rightMiddle();
                    points.right = {
                        coordinates: right,
                        offset: right.distance(center) / opt.step
                    };
                    break;
                case 'bottom':
                    const bottom = bbox.bottomMiddle();
                    points.bottom = {
                        coordinates: bottom,
                        offset: bottom.distance(center) / opt.step
                    };
                    break;
                case 'left':
                    const left = bbox.leftMiddle();
                    points.left = {
                        coordinates: left,
                        offset: left.distance(center) / opt.step
                    }
                    break;
            }
        });

        return points;
    }
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
    opt.quadrantSize = util.result(opt, 'quadrantSize');

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

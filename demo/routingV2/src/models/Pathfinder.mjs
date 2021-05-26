import { util, g } from '../../../../joint.mjs';
import { debugConf, debugLog, debugStore, showDebugGrid } from '../debug.mjs';

import Grid from './Grid.mjs';
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

        // Grid
        const { width, height } = getGridSize(paper, this.opt.step);
        this.grid = new Grid(width, height, this.opt);

        // References
        this._graph = graph;

        // Initialize all events bridging Pathfinder with Paper and Graph
        this._initEvents(graph, paper);
    }

    search(vertices, args, linkView) {
        const { opt } = this;
        const finder = new JumpPointFinder({ grid: this.grid });

        const from = this._getRectPoints(linkView.sourceBBox, opt.startDirections, opt);
        const to = this._getRectPoints(linkView.targetBBox, opt.endDirections, opt);

        const s = window.performance.now();
        const path = finder.findPath(from, to, vertices, linkView);
        const e = window.performance.now();

        // const origin = linkView.sourceBBox.origin();
        // const width = linkView.targetBBox.corner().x - origin.x;
        // const height = linkView.targetBBox.corner().y - origin.y;
        // const area = new g.Rect(origin.x, origin.y, width, height);
        //
        // const startbb = window.performance.now();
        // const cells = this.getObstaclesInArea(area);
        // console.log(cells);
        // const endbb = window.performance.now();
        // console.info('Took ' + (endbb - startbb).toFixed(2) + ' ms to calculate obstacles in area.');


        if (debugConf.routerBenchmark) {
            console.info('Took ' + (e - s).toFixed(2) + ' ms to calculate route');
        }
        debugStore.fullRouterTime += (e - s);

        return path;
    }

    _initEvents(graph, paper) {
        // ======= Events
        graph.on('add', (cell) => {
            if (cell.isElement() && !cell.get('debugIgnore')) {
                const s = window.performance.now();
                this.grid.addObstacle(cell);
                const e = window.performance.now();
                debugStore.fullGridTime += (e - s);
            }
        });

        graph.on('change:position', (cell) => {
            if (cell.isElement() && !cell.get('debugIgnore')) {
                const obstacle = this.grid.getObstacleByCellId(cell.id);

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

        graph.on('change:angle', function() {
            console.log('angle');
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
                    points['N'] = {
                        coordinates: top,
                        offset: top.distance(center) / opt.step
                    };
                    break;
                case 'right':
                    const right = bbox.rightMiddle();
                    points['E'] = {
                        coordinates: right,
                        offset: right.distance(center) / opt.step
                    };
                    break;
                case 'bottom':
                    const bottom = bbox.bottomMiddle();
                    points['S'] = {
                        coordinates: bottom,
                        offset: bottom.distance(center) / opt.step
                    };
                    break;
                case 'left':
                    const left = bbox.leftMiddle();
                    points['W'] = {
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

import ndarray from 'ndarray';
import HashStore from '../structures/HashStore.mjs';
import Obstacle from './Obstacle.mjs';
import { debugConf, debugStore } from '../debug.mjs';

// Grid approximates Paper coordinates using opt.step.
// It is possible that multiple close coordinates can be registered in the same GridNode.
// Note: It is NOT possible to reconstruct exact Paper coordinates from a GridNode.
export default class Grid {
    constructor(graph, opt) {
        this.opt = opt;
        this.ignoreObstacles = false;

        // To quickly find Grid Node indices, the Grid is split into four quadrants around the 0,0 origin.
        // Absolute values of coordinates are used to find coordinate within a quadrant.
        // Quadrant 0 has both coordinates with positive sign, quadrant 1 handles
        // negative x and positive y coordinates etc.
        //  3 | 2
        // ---o---
        //  1 | 0
        this._quadrants = [
            ndarray(new HashStore(), [opt.quadrantSize, opt.quadrantSize]),
            ndarray(new HashStore(), [opt.quadrantSize, opt.quadrantSize]),
            ndarray(new HashStore(), [opt.quadrantSize, opt.quadrantSize]),
            ndarray(new HashStore(), [opt.quadrantSize, opt.quadrantSize])
        ];

        // Map of all Obstacles, <[key: id]: Obstacle>
        this._obstacles = new Map();

        // Mapping from Joint.dia.Cell id to Obstacle id
        this._cells = new Map();

        // References
        this._graph = graph;

        // Initialize all events bridging Grid with Graph
        this._initEvents(graph);
    }

    get(x, y) {
        if (!this.in(x, y)) {
            return null;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);

        return chunk.data.item(chunk.index(ax, ay));
    }

    set(x, y, v) {
        if (!this.in(x, y)) {
            return null;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);
        return chunk.data.set(chunk.index(ax, ay), v);
    }

    remove(x, y) {
        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);
        return chunk.data.remove(chunk.index(ax, ay));
    }

    traversable(x, y, linkView) {
        if (!this.in(x, y)) {
            return false;
        }

        if (this.ignoreObstacles) {
            return true;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);

        const gridCell = chunk.data.item(chunk.index(ax, ay));

        // if Grid coordinate is empty, assume it's traversable
        if (!gridCell || gridCell.size === 0) {
            return true;
        }

        const cells = Array.from(gridCell.values());
        // run the custom isGridNodeObstacle function only if there are any cells present
        if (typeof this.opt.isGridNodeObstacle === 'function' && gridCell.size > 0) {
            return this.opt.isGridNodeObstacle.call(linkView, cells, linkView);
        }

        // otherwise there is something in the cell.
        // filter for provided types to be excluded
        return cells.filter(cell => this.opt.excludeTypes.indexOf(cell.get('type')) === -1).length === 0;
    }

    in(x, y) {
        const { lo, hi } = this.opt.gridBounds;
        return x > lo.x && y > lo.y && x < hi.x && y < hi.y;
    }

    get step() {
        return this.opt.step;
    }

    // Obstacles
    addObstacle(element) {
        const obstacle = new Obstacle(element, this);
        const { hi, lo } = obstacle.bounds;

        for (let x = lo.x; x < hi.x; ++x) {
            for (let y = lo.y; y < hi.y; ++y) {
                const node = this.get(x, y) || new Map();
                node.set(obstacle.id, obstacle.cell);
                this.set(x, y, node);
            }
        }

        this._obstacles.set(obstacle.id, obstacle);
        this._cells.set(element.id, obstacle.id);
    }

    getObstacleByCellId(cellId) {
        return this._obstacles.get(this._cells.get(cellId)) || null;
    }

    getObstaclesInArea(rect) {
        const { lo, hi } = Obstacle.rectToBounds(rect, this.opt.step);

        const obstacles = new Map();
        for (let x = lo.x; x < hi.x; ++x) {
            for (let y = lo.y; y < hi.y; ++y) {
                const node = this.get(x, y);
                if (!node || node.count === 0) {
                    continue;
                }


                node.forEach(cell => obstacles.set(cell.id, cell));
            }
        }

        return Array.from(obstacles.values());
    }

    _initEvents(graph) {
        // ======= Events
        graph.on('add', (cell) => {
            if (cell.isElement()) {
                const s = window.performance.now();
                this.addObstacle(cell);
                const e = window.performance.now();
                debugStore.fullGridTime += (e - s);
            }
        });

        graph.on('change:position', (cell) => {
            if (cell.isElement()) {
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

        graph.on('change:angle', function() {
            console.log('angle');
        });

        graph.on('remove', function() {
            console.log('remove');
        });
    }

    // helpers
    // todo: probably not needed
    // getObstacleBlob(x, y, {
    //     maxLoops = 1000,
    // } = {}) {
    //     if (this.getBinary(x, y) === 0) return null;
    //
    //     const startKey = `${x};${y}`
    //     const frontier = { [startKey]: { x, y }}, visited = {}, nodes = [];
    //
    //     let loops = maxLoops;
    //     while (Object.keys(frontier).length > 0 && loops > 0) {
    //         const key = Object.keys(frontier)[0];
    //         const { x, y } = frontier[key];
    //         nodes.push(frontier[key]);
    //
    //         [{ x: 1, y: 0 },
    //             { x: -1, y: 0 },
    //             { x: 0, y: 1 },
    //             { x: 0, y: -1 }].forEach(dir => {
    //             const neighbour = { x: x + dir.x, y: y + dir.y };
    //             const neighbourKey = `${neighbour.x};${neighbour.y}`;
    //
    //             if (visited[neighbourKey] === true) {
    //                 return;
    //             }
    //
    //             if (this.getBinary(neighbour.x, neighbour.y) === 1) {
    //                 frontier[neighbourKey] = neighbour;
    //             } else {
    //                 visited[neighbourKey] = true;
    //             }
    //         });
    //
    //         delete frontier[key];
    //         visited[key] = true;
    //         loops--;
    //     }
    //
    //     return nodes;
    // }
}

export function quadrant(x, y) {
    return ((x < 0) << 0) + ((y < 0) << 1);
}

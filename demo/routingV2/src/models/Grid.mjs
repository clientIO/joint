import ndarray from 'ndarray';
import HashStore from '../structures/HashStore.mjs';
import Obstacle from './Obstacle.mjs';

export default class Grid {
    constructor(width, height, opts) {
        // todo: add grid bounds to opts
        this._ox = 0;
        this._oy = 0;
        this._width = width;
        this._height = height;
        this._opts = opts;

        this._step = opts.step;
        this._array = ndarray(new HashStore(), [width, height]);

        //  3 | 2
        // ---|---
        //  1 | 0
        this._quadrants = [
            ndarray(new HashStore(), [opts.quadrantSize, opts.quadrantSize]),
            ndarray(new HashStore(), [opts.quadrantSize, opts.quadrantSize]),
            ndarray(new HashStore(), [opts.quadrantSize, opts.quadrantSize]),
            ndarray(new HashStore(), [opts.quadrantSize, opts.quadrantSize])
        ];

        this._obstacles = new Map();
        this._cells = new Map();
    }

    v2get(x, y) {
        if (!this.in(x, y)) {
            return null;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);

        return chunk.data.item(chunk.index(ax, ay));
    }

    v2set(x, y, v) {
        if (!this.in(x, y)) {
            return null;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);
        return chunk.data.set(chunk.index(ax, ay), v);
    }

    v2remove(x, y) {
        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);
        return chunk.data.remove(chunk.index(ax, ay));
    }

    v2traversable(x, y) {
        if (!this.in(x, y)) {
            return false;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);
        return chunk.get(ax, ay) === 0;
    }

    in(x, y) {
        return x > this._ox && y > this._oy && x < this._width && y < this._height;
    }

    get step() {
        return this._step;
    }

    // Obstacles
    addObstacle(element) {
        const obstacle = new Obstacle(element, this);
        const { hi, lo } = obstacle.bounds;

        for (let x = lo.x; x < hi.x; ++x) {
            for (let y = lo.y; y < hi.y; ++y) {
                const node = this.v2get(x, y) || new Map();
                node.set(obstacle.id, obstacle.cell);
                this.v2set(x, y, node);
            }
        }

        this._obstacles.set(obstacle.id, obstacle);
        this._cells.set(element.id, obstacle.id);
    }

    getObstacleByCellId(cellId) {
        return this._obstacles.get(this._cells.get(cellId)) || null;
    }

    getObstaclesInArea(rect) {
        const { lo, hi } = Obstacle.rectToBounds(rect, this._step);

        const obstacles = new Map();
        for (let x = lo.x; x < hi.x; ++x) {
            for (let y = lo.y; y < hi.y; ++y) {
                const node = this.v2get(x, y);
                if (!node || node.count === 0) {
                    continue;
                }


                node.forEach(cell => obstacles.set(cell.id, cell));
            }
        }

        return Array.from(obstacles.values());
    }

    // helpers
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

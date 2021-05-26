import ndarray from 'ndarray';
import HashStore from '../structures/HashStore.mjs';
import Obstacle from './Obstacle.mjs';

// Grid approximates Paper coordinates using opt.step.
// It is possible that multiple close coordinates can be registered in the same GridNode.
// Note: It is NOT possible to reconstruct exact Paper coordinates from a GridNode.
export default class Grid {
    constructor(opt) {
        this.opt = opt;

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

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);

        const gridCell = chunk.data.item(chunk.index(ax, ay));

        // if Grid coordinate is empty, assume it's traversable
        if (!gridCell || gridCell.size === 0) {
            return true;
        }

        // run the custom canPass function only if there are any cells present
        if (typeof this.opt.canPass === 'function' && gridCell.size > 0) {
            const cells = Array.from(gridCell.values());
            return this.opt.canPass.call(this, cells, linkView);
        }

        // otherwise there is something in the cell, and there is no custom function provided,
        // so assume coordinate is not traversable
        return false;
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

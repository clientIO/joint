import { util } from '../../../../joint.mjs';

export default class Obstacle {
    constructor(element, pathfinder) {
        this._id = Number.parseInt(util.uniqueId());
        this._bounds = Obstacle.elementToBounds(element, pathfinder.opt);
        this._pathfinder = pathfinder;
        this._cell = element;
    }

    update() {
        // todo: highly unoptimized poc
        // remove obstacle from grid completely
        let { hi, lo } = this.bounds;
        for (let x = lo.x; x < hi.x; ++x) {
            for (let y = lo.y; y < hi.y; ++y) {
                const node = this.pathfinder.grid.v2get(x, y);
                if (node) {
                    node.delete(this.id);

                    if (node.size === 0) {
                        this.pathfinder.grid.v2remove(x, y);
                    }
                }
            }
        }

        // add obstacle back to the grid, from scratch
        const { opt } = this._pathfinder;
        this._bounds = Obstacle.elementToBounds(this._cell, opt);

        lo = this._bounds.lo;
        hi = this._bounds.hi;

        for(let x = lo.x; x < hi.x; ++x) {
            for(let y = lo.y; y < hi.y; ++y) {
                const node = this.pathfinder.grid.v2get(x, y) || new Map();
                node.set(this.id, this._cell);
                this.pathfinder.grid.v2set(x, y, node);
            }
        }

        this._pathfinder._dirty = true;
    }

    get bounds() {
        return this._bounds;
    }

    get id() {
        return this._id;
    }

    get pathfinder() {
        return this._pathfinder;
    }

    get cell() {
        return this._cell;
    }

    static elementToBounds(element, opt) {
        const rect = element.getBBox().moveAndExpand(opt.paddingBox);

        return Obstacle.rectToBounds(rect, opt.step);
    }

    static rectToBounds(rect, step) {
        return {
            hi: {
                x: Math.ceil((rect.x + rect.width) / step),
                y: Math.ceil((rect.y + rect.height) / step)
            },
            lo: {
                x: Math.floor(rect.x / step),
                y: Math.floor(rect.y / step)
            }
        };
    }
}

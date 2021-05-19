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
                let prev = this.pathfinder.grid.v2get(x, y) || {};
                delete prev[this.id];

                if (Object.keys(prev).length === 0) {
                    this.pathfinder.grid.v2remove(x, y);
                } else {
                    this.pathfinder.grid.v2set(x, y, prev);
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
                let prev = {};
                if (!this.pathfinder.grid.v2traversable(x, y)) {
                    prev = this.pathfinder.grid.v2get(x, y);
                }

                if (prev) {
                    prev[this.id] = this._cell;
                    this.pathfinder.grid.v2set(x, y, prev);
                }
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

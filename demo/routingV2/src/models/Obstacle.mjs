import { util } from '../../../../joint.mjs';

export default class Obstacle {
    constructor(element, pathfinder) {
        this._index = Number.parseInt(util.uniqueId());
        this._bounds = Obstacle.elementToBounds(element, pathfinder.opt);
        this._pathfinder = pathfinder;
        this._cell = element;
    }

    fragment() {
        // todo: cache fragment
        return this._pathfinder.grid.getFragment(this.bounds);
    }

    update() {
        // remove obstacle from grid completely
        const prevFragment = this.fragment();
        for(let i = 0; i < prevFragment.shape[0]; ++i) {
            for(let j = 0; j < prevFragment.shape[1]; ++j) {
                let prev = prevFragment.data.item(prevFragment.index(i, j)) || {};
                delete prev[this.index];

                if (Object.keys(prev).length === 0) {
                    prevFragment.data.remove(prevFragment.index(i, j));
                } else {
                    prevFragment.set(i, j, prev);
                }
            }
        }

        // add obstacle back to the grid, from scratch
        const { opt } = this._pathfinder;
        this._bounds = Obstacle.elementToBounds(this._cell, opt);
        const updatedFragment = this.fragment();
        for(let i = 0; i < updatedFragment.shape[0]; ++i) {
            for(let j = 0; j < updatedFragment.shape[1]; ++j) {
                let prev = {};
                if (updatedFragment.get(i, j) === 1) {
                    prev = updatedFragment.data.item(updatedFragment.index(i, j));
                }

                prev[this.index] = true;
                updatedFragment.set(i, j, prev);
            }
        }

        this._pathfinder._dirty = true;
    }

    get bounds() {
        return this._bounds;
    }

    get index() {
        return this._index;
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

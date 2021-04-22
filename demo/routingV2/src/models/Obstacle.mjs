import { util } from '../../../../joint.mjs';

export default class Obstacle {
    constructor(element, pathfinder) {
        this._index = Number.parseInt(util.uniqueId());
        this._bounds = Obstacle.elementToBounds(element, pathfinder.padding, pathfinder.step);
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
                prevFragment.set(i, j, prev);
            }
        }

        // add obstacle back to the grid, from scratch
        const { padding, step } = this._pathfinder;
        this._bounds = Obstacle.elementToBounds(this._cell, padding, step);
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

    static elementToBounds(element, padding, step) {
        const rect = element.getBBox().moveAndExpand({
            x: -padding,
            y: -padding,
            width: 2 * padding,
            height: 2 * padding
        });

        return Obstacle.rectToBounds(rect, step);
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

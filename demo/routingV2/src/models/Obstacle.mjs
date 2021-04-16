import { util } from '../../../../joint.mjs';

export default function Obstacle(element, pathfinder) {
    this.index = Number.parseInt(util.uniqueId());
    this.bounds = elementToBounds(element, pathfinder.padding, pathfinder.step);

    this._pathfinder = pathfinder;
    this._cell = element;
}

Obstacle.prototype.getFragment = function() {
    const { hi, lo } = this.bounds;
    return this._pathfinder.grid.hi(hi.x, hi.y).lo(lo.x, lo.y);
}

Obstacle.prototype.update = function() {
    // remove obstacle from grid completely
    // todo: improve with updated fragment lookup
    const prevFragment = this.getFragment();
    for(let i = 0; i < prevFragment.shape[0]; ++i) {
        for(let j = 0; j < prevFragment.shape[1]; ++j) {
            let prev = prevFragment.data.getItem(prevFragment.index(i, j)) || {};
            delete prev[this.index];
            prevFragment.set(i, j, prev);
        }
    }

    // add obstacle back to the grid, from scratch
    const { padding, step } = this._pathfinder;
    this.bounds = elementToBounds(this._cell, padding, step);
    const updatedFragment = this.getFragment();
    for(let i = 0; i < updatedFragment.shape[0]; ++i) {
        for(let j = 0; j < updatedFragment.shape[1]; ++j) {
            let prev = {};
            if (updatedFragment.get(i, j) === 1) {
                prev = updatedFragment.data.getItem(updatedFragment.index(i, j));
            }

            prev[this.index] = true;
            updatedFragment.set(i, j, prev);
        }
    }

    this._pathfinder._pendingUpdate = true;
}

const elementToBounds = function(element, padding, step) {
    const bbox = element.getBBox().moveAndExpand({
        x: -padding,
        y: -padding,
        width: 2 * padding,
        height: 2 * padding
    });

    return {
        hi: {
            x: Math.ceil((bbox.x + bbox.width) / step),
            y: Math.ceil((bbox.y + bbox.height) / step)
        },
        lo: {
            x: Math.floor(bbox.x / step),
            y: Math.floor(bbox.y / step)
        }
    };
}

import ndarray from 'ndarray';
import HashStore from '../structures/HashStore.mjs';

export default class Grid {
    constructor(step, width, height) {
        this._width = width;
        this._height = height;
        this._step = step;
        this._array = ndarray(new HashStore(), [width, height]);
    }

    get(x, y) {
        return this._array.data.item(this._array.index(x, y));
    }

    getBinary(x, y) {
        return this._array.get(x, y);
    }

    getFragment(bounds) {
        const { hi, lo } = bounds;
        return this._array.hi(hi.x, hi.y).lo(lo.x, lo.y);
    }

    set(x, y, v) {
        this._array.set(this._array.index(x, y), v);
    }

    remove(x, y) {
        this._array.remove(this._array.index(x, y));
    }

    get shape() {
        return this._array.shape;
    }

    get step() {
        return this._step;
    }

    get data() {
        return this._array;
    }

    // helpers
    getObstacleBlob(x, y, {
        maxLoops = 1000,
    } = {}) {
        if (this.getBinary(x, y) === 0) return null;

        const startKey = `${x};${y}`
        const frontier = { [startKey]: { x, y }}, visited = {}, nodes = [];

        let loops = maxLoops;
        while (Object.keys(frontier).length > 0 && loops > 0) {
            const key = Object.keys(frontier)[0];
            const { x, y } = frontier[key];
            nodes.push(frontier[key]);

            [{ x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }].forEach(dir => {
                const neighbour = { x: x + dir.x, y: y + dir.y };
                const neighbourKey = `${neighbour.x};${neighbour.y}`;

                if (visited[neighbourKey] === true) {
                    return;
                }

                if (this.getBinary(neighbour.x, neighbour.y) === 1) {
                    frontier[neighbourKey] = neighbour;
                } else {
                    visited[neighbourKey] = true;
                }
            });

            delete frontier[key];
            visited[key] = true;
            loops--;
        }

        return nodes;
    }
}

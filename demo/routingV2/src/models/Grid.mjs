import ndarray from 'ndarray';
import HashStore from '../structures/HashStore.mjs';

export default class Grid {
    constructor(step, dimensions) {
        this._step = step;
        this._nd = ndarray(new HashStore(), [
            Math.ceil(dimensions.width / step),
            Math.ceil(dimensions.height / step)
        ]);
    }

    get(x, y) {
        return this._nd.data.item(this._nd.index(x, y));
    }

    getBinary(x, y) {
        return this._nd.get(x, y);
    }

    getFragment(bounds) {
        const { hi, lo } = bounds;
        return this._nd.hi(hi.x, hi.y).lo(lo.x, lo.y);
    }

    set(x, y, v) {
        this._nd.set(this._nd.index(x, y), v);
    }

    remove(x, y) {
        this._nd.remove(this._nd.index(x, y));
    }

    getObstacleBlob(x, y, grid, {
        maxLoops = 1000,
    } = {}) {
        if (grid.getBinary(x, y) === 0) return null;

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

                if (grid.getBinary(neighbour.x, neighbour.y) === 1) {
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

    get shape() {
        return this._nd.shape;
    }

    get step() {
        return this._step;
    }

    get data() {
        return this._nd;
    }
}

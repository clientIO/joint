import { createPlanner } from '../l1/L1Planner.mjs';
import Grid from './Grid.mjs';
import Obstacle from './Obstacle.mjs';

import { debugConf, debugLog } from '../debug.mjs';

export default class Pathfinder {

    constructor(graph, paper, {
        step = 10,
        padding = 0,
    } = {}) {
        if (!graph) {
            return debugLog('Pathfinder requires an instance of dia.Graph.');
        }

        // temporary
        this.planner = null;

        // Grid
        const { width, height } = getGridSize(paper, step);
        this.grid = new Grid(step, width, height);
        this.step = step;
        this.padding = padding;

        // todo: decide, should be kept within Grid?
        this._obstacles = {};
        this._cells = {};

        // Pathfinding
        // this.from = null;
        // this.to = null;

        // References
        this._graph = graph;

        // Flags
        this._dirty = false;
    }

    create() {
        this.planner = createPlanner(this.grid);
    }

    search(sx, sy, tx, ty, path) {
        if (this._dirty || !this.planner) {
            this.create();
            this._dirty = false;
        }

        // todo: set start/end points
        // todo: set stops

        return this.planner.search(sx, sy, tx, ty, path);
    }

    addObstacle(element) {
        const obstacle = new Obstacle(element, this);
        const fragment = obstacle.fragment();

        for(let i = 0; i < fragment.shape[0]; ++i) {
            for(let j = 0; j < fragment.shape[1]; ++j) {
                let prev = {};
                if (fragment.get(i, j) === 1) {
                    prev = fragment.data.item(fragment.index(i, j));
                }

                prev[obstacle.index] = true;
                fragment.set(i, j, prev);
            }
        }

        this._obstacles[obstacle.index] = obstacle;
        this._cells[element.id] = obstacle.index;
    }

    getObstacleByCellId(cellId) {
        return this._obstacles[this._cells[cellId]] || null;
    }

    getObstaclesInArea(rect) {
        const fragment = this.grid.getFragment(Obstacle.rectToBounds(rect, this.step));

        const obstacles = {};
        for(let i = 0; i < fragment.shape[0]; ++i) {
            for(let j = 0; j < fragment.shape[1]; ++j) {
                const node = fragment.data.item(fragment.index(i, j));
                if (node === undefined) {
                    continue;
                }

                Object.assign(obstacles, node.obstacles);
            }
        }

        return Object.keys(obstacles).map((id) => this._obstacles[id]._cell);
    }
}

const getGridSize = (paper, step) => {
    const { width, height } = paper.getComputedSize();

    return {
        width: Math.ceil(width / step),
        height: Math.ceil(height / step)
    }
}

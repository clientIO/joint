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

        this.grid = new Grid(step, paper.getComputedSize());
        this.planner = null;

        // todo: abstract config object
        this.step = step;
        this.padding = padding;

        this._obstacles = {};
        this._cells = {};
        this._graph = graph;

        this._dirty = false;
    }

    create() {
        const start = window.performance.now();
        this.planner = createPlanner(this.grid);
        const end = window.performance.now();
        if (debugConf.plannerBenchmark) {
            console.warn('Took ' + (end - start).toFixed(2) + 'ms to preprocess L1 Planner.');
        }
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
        const fragment = this.grid.getFragment(Obstacle.rectToBounds(rect));

        const cells = {};
        for(let i = 0; i < fragment.shape[0]; ++i) {
            for(let j = 0; j < fragment.shape[1]; ++j) {
                const ids = fragment.data.item(fragment.index(i, j));
                if (ids) {
                    Object.keys(ids).forEach(id => {
                        if (this._obstacles[id]) {
                            cells[id] = this._obstacles[id];
                        }
                    });
                }
            }
        }

        return cells;
    }
}

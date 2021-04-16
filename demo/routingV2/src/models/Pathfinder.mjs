import ndarray from 'ndarray';
import createPlanner from 'l1-path-finder';

import { source, target } from '../manhattanV2.mjs';

import Obstacle from './Obstacle.mjs';
import HashStore from '../structures/HashStore.mjs';
import { debugConf, debugStore, debugLog, showDebugGrid, showDebugGraph } from '../debug.mjs';

export default function Pathfinder(graph, paper, {
    step = 10,
    padding = 0,
} = {}) {
    if (!graph) {
        return debugLog('Pathfinder requires an instance of dia.Graph.');
    }

    this.planner = null;
    this.grid = null;
    this.step = step;
    this.padding = padding;

    this._graph = graph;
    this._pendingUpdate = false;
    this._obstacles = {};
    this._cells = {};

    const { cols, rows } = getGridSize(paper, step), size = cols * rows;
    if (!Number.isNaN(size) && size <= Number.MAX_SAFE_INTEGER) {
        this.grid = ndarray(new HashStore(), [cols, rows]);
    } else {
        debugLog('Invalid grid size.');
    }

    function getGridSize(paper, step) {
        const { width, height } = paper.getComputedSize();
        return {
            cols: Math.ceil(width / step),
            rows: Math.ceil(height / step)
        }
    }
}

Pathfinder.prototype.bake = function() {
    const start = window.performance.now();
    this._graph.getElements().forEach(element => {
        if (element.get('id') === source.id || element.get('id') === target.id || element.get('type') === 'dc') {
            return;
        }

        this.addObstacle(element);
    });

    const end = window.performance.now();
    if (debugConf.gridBenchmark) {
        console.warn('Took ' + (end-start).toFixed(2) + 'ms to update grid.');
    }

    this.planner = createPlanner(this.grid);

    if (debugConf.showGrid && !debugStore.gridPrinted) {
        showDebugGrid(this);
        debugStore.gridPrinted = true;
    }

    if (debugConf.showGraph && !debugStore.graphPrinted) {
        showDebugGraph(this);
        debugStore.graphPrinted = true;
    }

    return this;
}

Pathfinder.prototype.addObstacle = function(element) {
    const obstacle = new Obstacle(element, this);
    const fragment = obstacle.getFragment();

    for(let i = 0; i < fragment.shape[0]; ++i) {
        for(let j = 0; j < fragment.shape[1]; ++j) {
            let prev = {};
            if (fragment.get(i, j) === 1) {
                prev = fragment.data.getItem(fragment.index(i, j));
            }

            prev[obstacle.index] = true;
            fragment.set(i, j, prev);
        }
    }

    this._obstacles[obstacle.index] = obstacle;
    this._cells[element.id] = obstacle.index;
}

Pathfinder.prototype.getObstacleByCellId = function(cellId) {
    return this._obstacles[this._cells[cellId]] || null;
}

Pathfinder.prototype.recreate = function() {
    this.planner = createPlanner(this.grid);
}

Pathfinder.prototype.getObstaclesInArea = function(rect) {
    const sub = this.getGridFragment(rect);

    const cells = {};
    for(let i = 0; i < sub.shape[0]; ++i) {
        for(let j = 0; j < sub.shape[1]; ++j) {
            const ids = sub.data.getItem(sub.index(i, j));
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

Pathfinder.prototype.getGridFragment = function (rect) {
    return this.grid
        .hi((rect.x + rect.width) / this.step, (rect.y + rect.height) / this.step)
        .lo(rect.x / this.step, rect.y / this.step)
}

import * as joint from '../../../../joint.mjs';
import ndarray from 'ndarray';
import createPlanner from 'l1-path-finder';

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

    this._graph = graph;
    this._step = step;
    this._padding = padding;

    this._obstacles = {};

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
        if (element.get('type') === 'dc') {
            return;
        }

        // store element under simple int id
        const id = joint.util.uniqueId();
        this._obstacles[id] = element;

        // todo: function GridViewFromBBox
        const bb = element.getBBox().moveAndExpand({
            x: -this._padding,
            y: -this._padding,
            width: 2 * this._padding,
            height: 2 * this._padding
        });

        const gridX = Math.floor(bb.x / this._step);
        const gridY = Math.floor(bb.y / this._step);
        const boundX = Math.ceil((bb.x + bb.width) / this._step);
        const boundY = Math.ceil((bb.y + bb.height) / this._step);

        const sub = this.grid.hi(boundX, boundY).lo(gridX, gridY);

        for(let i = 0; i < sub.shape[0]; ++i) {
            for(let j = 0; j < sub.shape[1]; ++j) {
                let prev = {};
                if (sub.get(i, j) === 1) {
                    prev = sub.data.getItem(sub.index(i, j));
                }

                prev[id] = true;
                sub.set(i, j, prev);
            }
        }
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

Pathfinder.prototype.recreatePlanner = function() {
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
        .hi((rect.x + rect.width) / this._step, (rect.y + rect.height) / this._step)
        .lo(rect.x / this._step, rect.y / this._step)
}

import Grid from './Grid.mjs';
import Obstacle from './Obstacle.mjs';

import { debugLog } from '../debug.mjs';

export default class Pathfinder {

    constructor({
        graph,
        paper,
        step = 10,
        padding = 0,
        startDirections = ['top', 'right', 'bottom', 'left'],
        endDirections = ['top', 'right', 'bottom', 'left'],
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

    bboxToPoint(bbox, dir) {
        const pts = {
            top: bbox.topMiddle().translate(0, -(this.padding + this.step)),
            right: bbox.rightMiddle().translate((this.padding + this.step), 0),
            bottom: bbox.bottomMiddle().translate(0, (this.padding + this.step)),
            left: bbox.leftMiddle().translate(-(this.padding + this.step), 0)
        }
        return pts[dir];
    }
}

const getGridSize = (paper, step) => {
    const { width, height } = paper.getComputedSize();

    return {
        width: Math.ceil(width / step),
        height: Math.ceil(height / step)
    }
}

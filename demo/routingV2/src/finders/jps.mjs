import BinaryHeap from '../structures/BinaryHeap.mjs';
import GridNode from '../models/GridNode.mjs';
import HashStore from '../structures/HashStore.mjs';

export class JumpPointFinder {

    constructor({
        grid,
        heuristic = (dx, dy) => dx + dy,
    } = {}) {
        this.grid = grid;

        this.heuristic = heuristic;
        this.startNode = null;
        this.endNode = null;
        this.openList = null;
    }

    findPath(startX, startY, endX, endY, {
        returnLocalPath = false
    } = {}) {
        this.nodesHash = new HashStore();

        const openList = this.openList = new BinaryHeap((a, b) => a.f - b.f);
        const startNode = this.startNode = this._getNodeAt(startX, startY);
        const endNode = this.endNode = this._getNodeAt(endX, endY);

        startNode.g = 0;
        startNode.f = 0;

        openList.push(startNode);
        startNode.opened = true;

        let node;
        while (!openList.empty()) {
            node = openList.pop();
            node.closed = true;

            if (node.isEqual(endNode)) {
                const step = returnLocalPath ? 1 : this.grid.step;
                return backtrace(endNode, step);
            }

            this._identifySuccessors(node);
        }

        return [];
    }

    _identifySuccessors(node) {
        const heuristic = this.heuristic,
            openList = this.openList,
            endX = this.endNode.x,
            endY = this.endNode.y;
        let neighbors, neighbor,
            jumpPoint, i, l,
            x = node.x, y = node.y,
            jx, jy, dx, dy, d, ng, jumpNode,
            abs = Math.abs, max = Math.max;

        neighbors = this._findNeighbors(node);
        for(i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];
            jumpPoint = this._jump(neighbor[0], neighbor[1], x, y);
            if (jumpPoint) {

                jx = jumpPoint[0];
                jy = jumpPoint[1];
                jumpNode = this._getNodeAt(jx, jy);

                if (jumpNode.closed) {
                    continue;
                }

                // include distance, as parent may not be immediately adjacent:
                d = octile(abs(jx - x), abs(jy - y));
                ng = node.g + d; // next `g` value

                if (!jumpNode.opened || ng < jumpNode.g) {
                    jumpNode.g = ng;
                    jumpNode.h = jumpNode.h || heuristic(abs(jx - endX), abs(jy - endY));
                    jumpNode.f = jumpNode.g + jumpNode.h;
                    jumpNode.parent = node;

                    if (!jumpNode.opened) {
                        openList.push(jumpNode);
                        jumpNode.opened = true;
                    } else {
                        openList.updateItem(jumpNode);
                    }
                }
            }
        }
    };

    _findNeighbors(node) {
        const parent = node.parent,
            x = node.x, y = node.y;
        let px, py, nx, ny, dx, dy,
            neighbors = [], neighborNodes, neighborNode, i, l;

        // directed pruning: can ignore most neighbors, unless forced.
        if (parent) {
            px = parent.x;
            py = parent.y;
            // get the normalized direction of travel
            dx = (x - px) / Math.max(Math.abs(x - px), 1);
            dy = (y - py) / Math.max(Math.abs(y - py), 1);

            if (dx !== 0) {
                if (this._isWalkableAt(x, y - 1)) {
                    neighbors.push([x, y - 1]);
                }
                if (this._isWalkableAt(x, y + 1)) {
                    neighbors.push([x, y + 1]);
                }
                if (this._isWalkableAt(x + dx, y)) {
                    neighbors.push([x + dx, y]);
                }
            }
            else if (dy !== 0) {
                if (this._isWalkableAt(x - 1, y)) {
                    neighbors.push([x - 1, y]);
                }
                if (this._isWalkableAt(x + 1, y)) {
                    neighbors.push([x + 1, y]);
                }
                if (this._isWalkableAt(x, y + dy)) {
                    neighbors.push([x, y + dy]);
                }
            }
        }
        // return all neighbors
        else {
            neighborNodes = this._getNeighbors(node);
            for (i = 0, l = neighborNodes.length; i < l; ++i) {
                neighborNode = neighborNodes[i];
                neighbors.push([neighborNode.x, neighborNode.y]);
            }
        }

        return neighbors;
    };

    _jump(x, y, px, py) {
        const dx = x - px, dy = y - py;

        if (!this._isWalkableAt(x, y)) {
            return null;
        }

        if (this._getNodeAt(x, y).isEqual(this.endNode)) {
            return [x, y];
        }

        if (dx !== 0) {
            if ((this._isWalkableAt(x, y - 1) && !this._isWalkableAt(x - dx, y - 1)) ||
                (this._isWalkableAt(x, y + 1) && !this._isWalkableAt(x - dx, y + 1))) {
                return [x, y];
            }
        }
        else if (dy !== 0) {
            if ((this._isWalkableAt(x - 1, y) && !this._isWalkableAt(x - 1, y - dy)) ||
                (this._isWalkableAt(x + 1, y) && !this._isWalkableAt(x + 1, y - dy))) {
                return [x, y];
            }
            //When moving vertically, must check for horizontal jump points
            if (this._jump(x + 1, y, x, y) || this._jump(x - 1, y, x, y)) {
                return [x, y];
            }
        }
        else {
            throw new Error("Only horizontal and vertical movements are allowed");
        }

        return this._jump(x + dx, y + dy, x, y);
    }

    _getNodeAt(x, y) {
        const hash = x + ';' + y;
        let node = this.nodesHash.item(hash);
        if (node === undefined) {
            const walkable = this.grid.getBinary(x, y) === 0;
            node = new GridNode(x, y, walkable);
            this.nodesHash.set(hash, node);
        }
        return node;
    }

    _getNeighbors(node) {
        const x = node.x, y = node.y, neighbors = [];

        // up
        if (this._isWalkableAt(x, y - 1)) {
            const n = this._getNodeAt(x, y - 1);
            neighbors.push(n);
        }
        // right
        if (this._isWalkableAt(x + 1, y)) {
            const n = this._getNodeAt(x + 1, y);
            neighbors.push(n);
        }
        // down
        if (this._isWalkableAt(x, y + 1)) {
            const n = this._getNodeAt(x, y + 1);
            neighbors.push(n);
        }
        // left
        if (this._isWalkableAt(x - 1, y)) {
            const n = this._getNodeAt(x - 1, y);
            neighbors.push(n);
        }

        return neighbors;
    }

    _isWalkableAt(x, y) {
        return this._isCoordinateOnGrid(x, y) && this._getNodeAt(x, y).walkable;
    }

    _isCoordinateOnGrid(x, y) {
        return (x >= 0 && x < this.grid._width) && (y >= 0 && y < this.grid._height);
    }
}

const backtrace = function(node, step) {
    let path = [{ x: node.x * step, y: node.y * step }];
    while (node.parent) {
        node = node.parent;
        path.push({ x: node.x * step, y: node.y * step });
    }
    return path.reverse();
}

const octile = function(dx, dy) {
    const F = Math.SQRT2 - 1;
    return (dx < dy) ? F * dx + dy : F * dy + dx;
}

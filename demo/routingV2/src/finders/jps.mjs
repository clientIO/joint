import BinaryHeap from '../structures/BinaryHeap.mjs';
import GridNode from '../models/GridNode.mjs';
import PathPoint from '../models/PathPoint.mjs';

export class JumpPointFinder {

    constructor({
        grid,
        heuristic = (dx, dy) => dx + dy,
    } = {}) {
        this.grid = grid;

        this.heuristic = heuristic;
        this.endNode = null;
        this.openList = null;
    }

    findPath(start, end, vertices = []) {
        const { step } = this.grid;

        // snapVertices(vertices, start, end, step, linkView);

        this.nodes = [];
        const openList = this.openList = new BinaryHeap((a, b) => a.f - b.f);

        let from, to, prevHead, path = [], found;
        for (let i = 0; i <= vertices.length; i++) {
            found = false;

            from = to ? [to] : start;
            to = vertices[i] || end;

            // add all possible starting points
            from.forEach(point => {
                const fromNode = this._getNodeAt(
                    Math.floor(point.x / step),
                    Math.floor(point.y / step)
                );

                if (fromNode) {
                    fromNode.g = 0;
                    fromNode.f = 0;
                    fromNode.opened = true;

                    openList.push(fromNode);
                }
            });

            // close previous direction to prevent retracing
            if (prevHead) {
                const direction = getDirection(path[path.length - 2], path[path.length - 1]);
                this._getNodeAt(prevHead.x + direction.x, prevHead.y + direction.y).close();
            }

            const endNode = this.endNode = this._getNodeAt(
                Math.floor(to.x / step),
                Math.floor(to.y / step)
            );

            let node;
            while (!openList.empty()) {
                node = openList.pop();
                node.closed = true;

                if (node.isEqual(endNode.x, endNode.y)) {
                    // store previous end node to prevent retracing
                    prevHead = endNode;

                    let segment = backtrace(node);
                    segment = toVectors(segment);
                    segment = removeElbows.call(this, segment);
                    segment = scale(segment, step);

                    // adjust only first/last/only segment
                    // else it's mid segment - no need to adjust anything
                    if (i === 0 && i !== vertices.length) {
                        // first of 2+ segments
                        // segment = adjust(segment, { start });
                    } else if (i !== 0 && i === vertices.length) {
                        // last of 2+ segments
                        // segment = adjust(segment, { end });
                    } else if (i === 0 && i === vertices.length) {
                        // only segment
                        // segment = adjust(segment, { start, end });
                    }

                    path.push(...segment);
                    found = true;
                    this.nodes = [];
                    this.openList.clear();
                    break;
                }

                this._identifySuccessors(node);
            }

            if (!found) {
                // todo: build orthogonal path segment
                // orthogonal.mjs/insideElement()
            }

            if (i === vertices.length) {
                break;
            }
        }

        return path;
    }

    _identifySuccessors(node, ignoreNode) {
        const heuristic = this.heuristic,
            openList = this.openList,
            endX = this.endNode.x,
            endY = this.endNode.y;
        let neighbors, neighbor,
            jumpPoint, i, l,
            x = node.x, y = node.y,
            jx, jy, d, ng, jumpNode,
            abs = Math.abs;

        neighbors = this._findNeighbors(node, ignoreNode);
        for(i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];
            jumpPoint = this._jump(neighbor.x, neighbor.y, x, y);
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
                    if (isBend(node, jumpNode)) {
                        jumpNode.h += 1;
                    }
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
        let px, py, dx, dy,
            neighbors = [];

        // directed pruning: can ignore most neighbors, unless forced.
        if (parent) {
            px = parent.x;
            py = parent.y;
            // get the normalized direction of travel
            dx = (x - px) / Math.max(Math.abs(x - px), 1);
            dy = (y - py) / Math.max(Math.abs(y - py), 1);

            if (dx !== 0) {
                neighbors.push(this._getNodeAt(x, y - 1));
                neighbors.push(this._getNodeAt(x, y + 1));
                neighbors.push(this._getNodeAt(x + dx, y));
            } else if (dy !== 0) {
                neighbors.push(this._getNodeAt(x - 1, y));
                neighbors.push(this._getNodeAt(x + 1, y));
                neighbors.push(this._getNodeAt(x, y + dy));
            }
        }
        // return all neighbors
        else {
            neighbors = this._getNeighbors(node);
        }

        return neighbors.filter(neighbor => neighbor && neighbor.walkable);
    };

    _jump(x, y, px, py) {
        const dx = x - px, dy = y - py;

        if (!this._isFree(x, y)) {
            return null;
        }

        if (this._getNodeAt(x, y).isEqual(this.endNode.x, this.endNode.y)) {
            return [x, y];
        }

        if (dx !== 0) {
            if ((this._isFree(x, y - 1) && !this._isFree(x - dx, y - 1)) ||
                (this._isFree(x, y + 1) && !this._isFree(x - dx, y + 1))) {
                return [x, y];
            }
        }
        else if (dy !== 0) {
            if ((this._isFree(x - 1, y) && !this._isFree(x - 1, y - dy)) ||
                (this._isFree(x + 1, y) && !this._isFree(x + 1, y - dy))) {
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
        let node = this.nodes[y * this.grid._width + x];
        if (!node) {
            this.nodes[y * this.grid._width + x] = node = new GridNode(x, y, this.grid.isFree(x, y));
        }
        return node;
    }

    _isFree(x, y) {
        return this._getNodeAt(x, y).walkable;
    }

    _getNeighbors(node) {
        const { x, y } = node, neighbors = [
            this._getNodeAt(x, y - 1),  // up
            this._getNodeAt(x + 1, y),  // right
            this._getNodeAt(x, y + 1),  // bottom
            this._getNodeAt(x - 1, y)   // left
        ];

        return neighbors;
    }
}

const backtrace = function(node) {
    let path = [{ x: node.x, y: node.y }];
    while (node.parent) {
        node = node.parent;
        path.push({ x: node.x, y: node.y });
    }

    return path.reverse();
}

const toVectors = function(path) {
    if (!path || path.length === 0) {
        return [];
    }

    const conv = [];
    path.forEach((point, index) => {
        const prev = path[index - 1], next = path[index + 1];

        let bearing = null, length = 0;
        if (next) {
            // not last
            bearing = getBearing(point, next);
            length = Math.abs(next.x - point.x) + Math.abs(next.y - point.y);
        } else if (prev) {
            // last
            bearing = getBearing(prev, point);
        }

        conv.push(new PathPoint(point.x, point.y, bearing, length));
    });

    return conv;
}

const removeElbows = function(path) {
    let i = 0;
    while (i < path.length - 1) {
        const current = path[i];
        const next = path[i + 1];
        const tested = path[i + 2];

        if (tested === undefined) {
            break;
        }

        if (next.bearing === current.bearing) {
            current.length += next.length;
            path.splice(i + 1, 1);
            i = 0;
        } else if (tested.bearing === current.bearing) {
            const v1 = current.clone();
            const v2 = next.clone();
            const v3 = tested.clone();

            v1.length += tested.length;
            switch (tested.bearing) {
                case 'N':
                    v2.y -= tested.length;
                    v3.y -= tested.length;
                    break
                case 'E':
                    v2.x += tested.length;
                    v3.x += tested.length;
                    break;
                case 'S':
                    v2.y += tested.length;
                    v3.y += tested.length;
                    break;
                case 'W':
                    v2.x -= tested.length;
                    v3.x -= tested.length;
                    break;
            }

            if (pathClear([v1.x, v1.y, v2.x, v2.y, v3.x, v3.y], this)) {
                path.splice(i, 3, v1, v2);
            }

            i++;
        } else {
            i++;
        }
    }

    return path;

    function pathClear(s, pathfinder) {
        let obstructed;
        for (let i = 0; i < s.length; i += 2) {
            const vertical = s[i] === s[i + 2];
            const bounds = vertical ? [s[i + 1], s[i + 3]] : [s[i], s[i + 2]];
            bounds.sort((a, b) => { return a - b });

            for (let j = bounds[0]; j <= bounds[1]; j++) {
                if (pathfinder._isFree(vertical ? s[i] : j , vertical ? j : s[i + 1])) {
                    continue;
                }

                obstructed = true;
                break;
            }

            if (obstructed) {
                break;
            }
        }

        return !obstructed;
    }
}

const scale = function(path, step) {
    return path.map(vector => vector.scale(step));
}

const adjust = function(path, { start, end } = {}) {
    if (path.length === 0 || (!start && !end)) {
        return path;
    }

    if (start) {
        // adjust start segment to original start point coordinates
        const p0 = path[0];
        let p1 = path[1];
        if (!p1) {
            p1 = p0;
        }

        const startAxis = p0.x === p1.x ? 'x': 'y';
        const startVal = p0[startAxis];
        let si = 0, sv = path[si];
        while (sv && sv[startAxis] === startVal) {
            path[si][startAxis] = start[startAxis];
            si += 1;
            sv = path[si];
        }

        if (startAxis === 'x') {
            path[0].y = start.y;
        } else {
            path[0].x = start.x;
        }
    }

    if (end) {
        // adjust end segment to original end point coordinates
        const pLast = path[path.length - 1];
        let pPrev = path[path.length - 2];
        if (!pPrev) {
            pPrev = pLast;
        }
        const endAxis = pLast.x === pPrev.x ? 'x' : 'y';
        const endVal = pLast[endAxis];
        let ei = path.length - 1, ev = path[ei];
        while (ev && ev[endAxis] === endVal) {
            path[ei][endAxis] = end[endAxis];
            ei -= 1;
            ev = path[ei];
        }

        if (endAxis === 'x') {
            path[path.length - 1].y = end.y;
        } else {
            path[path.length - 1].x = end.x;
        }
    }

    // if there's only start and end, and they do not align at this point
    // add additional vertex to make the path look properly
    if (start && (path[0].x !== start.x || path[0].y !== start.y)) {
        path.unshift(start);
    }

    return path;
}

const octile = function(dx, dy) {
    const F = Math.SQRT2 - 1;
    return (dx < dy) ? F * dx + dy : F * dy + dx;
}

const isBend = function(node, jumpNode) {
    return node.parent &&
        ((node.parent.x === node.x && node.x !== jumpNode.x) ||
        (node.parent.y === node.y && node.y !== jumpNode.y));
}

const Bearings = { N: 'N', E: 'E', S: 'S', W: 'W' };
const getBearing = (p1, p2) => {
    if (p1.x === p2.x) return (p1.y > p2.y) ? Bearings.N : Bearings.S;
    if (p1.y === p2.y) return (p1.x > p2.x) ? Bearings.W : Bearings.E;
    return null;
}
const CardinalDirections = {
    N: { x: 0, y: 1 },
    E: { x: -1, y: 0 },
    S: { x: 0, y: -1 },
    W: { x: 1, y: 0 }
};
const getDirection = (p1, p2) => {
    return CardinalDirections[getBearing(p1, p2)] || { x: 0, y: 0 };
}

const snapVertices = function(vertices = [], start, end, step, linkView) {
    vertices.forEach((v, i) => {
        if (i === 0) {
            v.x = v.x === start.x ? v.x = start.x : v.x;
            v.y = v.y === start.y ? v.y = start.y : v.y;
        } else if (i === vertices.length) {
            v.x = v.x === end.x ? v.x = end.x : v.x;
            v.y = v.y === end.y ? v.y = end.y : v.y;
        } else {
            v.x = Math.floor(v.x / step) * step;
            v.y = Math.floor(v.y / step) * step;
        }

        vertices[i] = v;
    });

    linkView.model.vertices(vertices);
}

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
        this.startNode = null;
        this.endNode = null;
        this.openList = null;
    }

    findPath(start, end, vertices = [], linkView) {
        const { step } = this.grid;

        snapVertices(vertices, start, end, step, linkView);

        this.nodes = [];
        const openList = this.openList = new BinaryHeap((a, b) => a.f - b.f);

        let from, to, path = [], found;
        for (let i = 0; i <= vertices.length; i++) {
            found = false;
            from = to || start;
            to = vertices[i] || end;

            const sx = Math.floor(from.x / step),
                sy = Math.floor(from.y / step),
                ex = Math.floor(to.x / step),
                ey = Math.floor(to.y / step);

            const startNode = this.startNode = this._getNodeAt(sx, sy);
            this.endNode = this._getNodeAt(ex, ey);

            startNode.g = 0;
            startNode.f = 0;

            openList.push(startNode);
            startNode.opened = true;

            let node;
            while (!openList.empty()) {
                node = openList.pop();
                node.closed = true;

                if (node.isEqual(ex, ey)) {
                    // TODO: operations POC
                    let segment = backtrace(node);
                    segment = toVectors(segment);
                    segment = removeElbows(segment, this.grid);
                    segment = scale(segment, step);

                    // adjust only first/last/only segment
                    // else it's mid segment - no need to adjust anything
                    if (i === 0 && i !== vertices.length) {
                        // first of 2+ segments
                        segment = adjust(segment, { start });
                    } else if (i !== 0 && i === vertices.length) {
                        // last of 2+ segments
                        segment = adjust(segment, { end });
                    } else if (i === 0 && i === vertices.length) {
                        // only segment
                        segment = adjust(segment, { start, end });
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

    _identifySuccessors(node) {
        const heuristic = this.heuristic,
            openList = this.openList,
            endX = this.endNode.x,
            endY = this.endNode.y;
        let neighbors, neighbor,
            jumpPoint, i, l,
            x = node.x, y = node.y,
            jx, jy, d, ng, jumpNode,
            abs = Math.abs;

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
            x = node.x, y = node.y,
            grid = this.grid;
        let px, py, dx, dy,
            neighbors = [], neighborNodes, neighborNode, i, l;

        // directed pruning: can ignore most neighbors, unless forced.
        if (parent) {
            px = parent.x;
            py = parent.y;
            // get the normalized direction of travel
            dx = (x - px) / Math.max(Math.abs(x - px), 1);
            dy = (y - py) / Math.max(Math.abs(y - py), 1);

            if (dx !== 0) {
                if (grid.isFree(x, y - 1)) {
                    neighbors.push([x, y - 1]);
                }
                if (grid.isFree(x, y + 1)) {
                    neighbors.push([x, y + 1]);
                }
                if (grid.isFree(x + dx, y)) {
                    neighbors.push([x + dx, y]);
                }
            }
            else if (dy !== 0) {
                if (grid.isFree(x - 1, y)) {
                    neighbors.push([x - 1, y]);
                }
                if (grid.isFree(x + 1, y)) {
                    neighbors.push([x + 1, y]);
                }
                if (grid.isFree(x, y + dy)) {
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
        const dx = x - px, dy = y - py, grid = this.grid;

        if (!grid.isFree(x, y)) {
            return null;
        }

        if (this._getNodeAt(x, y).isEqual(this.endNode.x, this.endNode.y)) {
            return [x, y];
        }

        if (dx !== 0) {
            if ((grid.isFree(x, y - 1) && !grid.isFree(x - dx, y - 1)) ||
                (grid.isFree(x, y + 1) && !grid.isFree(x - dx, y + 1))) {
                return [x, y];
            }
        }
        else if (dy !== 0) {
            if ((grid.isFree(x - 1, y) && !grid.isFree(x - 1, y - dy)) ||
                (grid.isFree(x + 1, y) && !grid.isFree(x + 1, y - dy))) {
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
        let col = this.nodes[x];
        if (!col) {
            this.nodes[x] = col = [];
        }

        let node = col[y];
        if (!node) {
            this.nodes[x][y] = node = new GridNode(x, y, this.grid.isFree(x, y));
        }
        return node;
    }

    _getNeighbors(node) {
        const x = node.x, y = node.y, neighbors = [], grid = this.grid;

        // up
        if (grid.isFree(x, y - 1)) {
            const n = this._getNodeAt(x, y - 1);
            neighbors.push(n);
        }
        // right
        if (grid.isFree(x + 1, y)) {
            const n = this._getNodeAt(x + 1, y);
            neighbors.push(n);
        }
        // down
        if (grid.isFree(x, y + 1)) {
            const n = this._getNodeAt(x, y + 1);
            neighbors.push(n);
        }
        // left
        if (grid.isFree(x - 1, y)) {
            const n = this._getNodeAt(x - 1, y);
            neighbors.push(n);
        }

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

// const simplify = function(path) {
//     let i = 0;
//     // leave last point untouched // todo: double same dir at end?
//     while (i < path.length - 2) {
//         const point = path[i];
//         if (path[i + 1] && path[i + 1].bearing === point.bearing) {
//             path.splice(i, 2, point);
//         } else {
//             i++;
//         }
//     }
//
//     return removeElbows(path);
// }

const removeElbows = function(path, grid) {
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

            if (pathClear([v1.x, v1.y, v2.x, v2.y, v3.x, v3.y], grid)) {
                path.splice(i, 3, v1, v2);
            }

            i++;
        } else {
            i++;
        }
    }

    return path;

    function pathClear(s, grid) {
        let obstructed;
        for (let i = 0; i < s.length; i += 2) {
            const vertical = s[i] === s[i + 2];
            const bounds = vertical ? [s[i + 1], s[i + 3]] : [s[i], s[i + 2]];
            bounds.sort((a, b) => { return a - b });

            for (let j = bounds[0]; j <= bounds[1]; j++) {
                if (grid.getBinary(
                    vertical ? s[i] : j ,
                    vertical ? j : s[i + 1]
                ) === 1) {
                    obstructed = true;
                    break;
                }
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

const Bearings = { N: 'N', E: 'E', S: 'S', W: 'W' }
const getBearing = (p1, p2) => {
    if (p1.x === p2.x) return (p1.y > p2.y) ? Bearings.N : Bearings.S;
    if (p1.y === p2.y) return (p1.x > p2.x) ? Bearings.W : Bearings.E;
    return null;
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

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
        this.nodes = [];
        this.openList = new BinaryHeap((a, b) => a.f - b.f);
    }

    findPath(startPoints, endPoints, vertices = []) {
        const { openList, nodes } = this;
        const { step } = this.grid;

        const startDirs = Object.keys(startPoints);
        const endDirs = Object.keys(endPoints);

        let fromPoints, toPoints, segments = [], lastSegment = null;
        for (let i = 0; i <= vertices.length; i++) {
            fromPoints = toPoints || Object.values(startPoints);
            toPoints = vertices[i] ? [vertices[i]] : Object.values(endPoints);

            const fromNodes = fromPoints.map(from => this._getNodeAt(from.x, from.y));

            let minCost = Infinity, segment;
            toPoints.forEach((to, tIndex) => {
                // get node of current target
                const endNode = this.endNode = this._getNodeAt(to.x, to.y);
                if (!endNode || !endNode.walkable) {
                    // end point unreachable
                    // todo: handle added vertex being out of grid bounds
                    return;
                }

                // reset and open start nodes
                fromNodes.forEach((node, sIndex) => {
                    if (node && node.walkable) {
                        node.g = 0;
                        node.f = 0;
                        node.opened = true;
                        node.closed = false;

                        if (i === 0) {
                            node.startDir = startDirs[sIndex];
                        } else if (lastSegment) {
                            node.startDir = BearingDirection[lastSegment[lastSegment.length - 1].bearing];
                        }

                        // close neighbor node in the source direction
                        const { x: dx, y: dy } = CardinalDirections[DirectionBearing[node.startDir]];
                        this._getNodeAt(node.x + dx, node.y + dy).close();

                        openList.push(node);
                    }
                });

                // no source nodes available for pathfinding
                if (openList.empty()) {
                    return;
                }

                // close previous direction to prevent retracing
                if (lastSegment && lastSegment.length > 1) {
                    const [p1, p2] = lastSegment.slice(lastSegment.length - 2, lastSegment.length);
                    const direction = getDirection(p1, p2);
                    this._getNodeAt(p2.x + direction.x, p2.y + direction.y).close();
                }

                if (i === vertices.length - 1) {
                    endNode.endDir = endDirs[tIndex];
                }

                // main pathfinding loop
                let node;
                while (!openList.empty()) {
                    node = openList.pop();
                    node.closed = true;

                    // partial path already longer than previously found path, early exit
                    if (node.g >= minCost) {
                        nodes.length = 0;
                        openList.clear();
                        break;
                    }

                    // reached target node
                    if (node.isEqual(endNode.x, endNode.y)) {
                        minCost = endNode.g;
                        segment = toVectors(backtrace(node));

                        // cleanup
                        nodes.length = 0;
                        openList.clear();
                        break;
                    }

                    // add new jump point nodes to openList
                    this._identifySuccessors(node);
                }
            });

            if (segment) {
                // store previous end node, used to prevent retracing
                lastSegment = segment;

                // shortest segment found, store
                segments.push(segment);
            } else {
                // todo: build orthogonal path segment
                // currently it will just draw straight line
                // orthogonal.mjs/insideElement()
            }

            // last segment found
            if (i === vertices.length) {
                break;
            }
        }

        return segments.reduce((acc, segment, index) => {
            // const paperStart = startPoints[startGridPoints.findIndex(point => {
            //     const p = segments[0][0];
            //     return p && point.x === p.x && p.y === point.y;
            // })];
            //
            // const paperEnd = endPoints[endGridPoints.findIndex(point => {
            //     const p = lastSegment[lastSegment.length - 1];
            //     return p && point.x === p.x && p.y === point.y;
            // })];
            // todo: fix start/end point adjustment
            // let path = scale(segment, step);
            // // adjust only first/last/only segment
            // // else it's mid segment - no need to adjust anything
            // if (index === 0 && index !== segments.length) {
            //     // first of 2+ segments
            //     // adjust(path, { start: paperStart });
            // } else if (index !== 0 && index === segments.length) {
            //     // last of 2+ segments
            //     // adjust(path, { end: paperEnd });
            // } else if (index === 0 && index === segments.length) {
            //     // only segment
            //     // adjust(path, { start: paperStart, end: paperEnd });
            // }

            acc = acc.concat(scale(segment, step));
            return acc;
        }, []);
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
            jumpPoint = this._jump(neighbor.x, neighbor.y, x, y);
            if (jumpPoint) {

                jx = jumpPoint[0];
                jy = jumpPoint[1];
                jumpNode = this._getNodeAt(jx, jy);

                let prev = node.parent;
                if (!prev) {
                    const dx = node.startDir === 'left' ? -1 : node.startDir === 'right' ? 1 : 0;
                    const dy = node.startDir === 'top' ? -1 : node.startDir === 'bottom' ? 1 : 0;

                    prev = { x: node.x + dx, y: node.y + dy };
                }
                let penalty = isBend(prev, node, jumpNode) * 1;

                if (jumpNode.closed) {
                    continue;
                }

                // include distance, as parent may not be immediately adjacent:
                d = octile(abs(jx - x), abs(jy - y));
                ng = node.g + d + penalty; // next `g` value

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

        // node is obstructed
        if (!this._isFree(x, y)) {
            return null;
        }

        // node is the end node
        if (this._getNodeAt(x, y).isEqual(this.endNode.x, this.endNode.y)) {
            return [x, y];
        }

        if (dx !== 0) {
            // HORIZONTAL MOVEMENT
            // up free AND previous up not free
            // OR down free and previous down not free
            if ((this._isFree(x, y - 1) && !this._isFree(x - dx, y - 1)) ||
                (this._isFree(x, y + 1) && !this._isFree(x - dx, y + 1))) {
                // exit if found a turn - horizontal to vertical
                return [x, y];
            }

            if ((x + dx - this.endNode.x) === 0) {
                return [x, y];
            }

            if (!this._isFree(x + dx, y)) {
                return [x, y];
            }
        } else if (dy !== 0) {
            // VERTICAL MOVEMENT
            // left free AND previous left not free
            // OR right free and previous right not free
            if ((this._isFree(x - 1, y) && !this._isFree(x - 1, y - dy)) ||
                (this._isFree(x + 1, y) && !this._isFree(x + 1, y - dy))) {
                // exit if found a turn - vertical to horizontal
                return [x, y];
            }
            // When moving vertically, must check for horizontal jump points
            // todo: reduce redundant jump points
            if (this._jump(x + 1, y, x, y) || this._jump(x - 1, y, x, y)) {
                return [x, y];
            }

            if ((y + dy - this.endNode.y) === 0) {
                return [x, y];
            }

            if (!this._isFree(x, y + dy)) {
                return [x, y];
            }
        } else {
            throw new Error("Only horizontal and vertical movements are allowed");
        }

        return this._jump(x + dx, y + dy, x, y);
    }

    _getNodeAt(x, y) {
        if (!this.grid.inBounds(x, y)) {
            return null;
        }

        let node = this.nodes[y * this.grid._width + x];
        if (!node) {
            this.nodes[y * this.grid._width + x] = node = new GridNode(x, y, this.grid.isFree(x, y));
        }
        return node;
    }

    _isFree(x, y) {
        const node = this._getNodeAt(x, y);
        return node && node.walkable;
    }

    _getNeighbors(node) {
        const { x, y } = node;

        return [
            this._getNodeAt(x, y - 1),  // up
            this._getNodeAt(x + 1, y),  // right
            this._getNodeAt(x, y + 1),  // bottom
            this._getNodeAt(x - 1, y)   // left
        ].filter(node => node);
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

const isBend = function(prev, node, next) {
    return (prev.x === node.x && node.x !== next.x) || (prev.y === node.y && node.y !== next.y);
}

const Bearings = { N: 'N', E: 'E', S: 'S', W: 'W' };
const BearingDirection = { N: 'top', E: 'right', S: 'bottom', W: 'left' };
const DirectionBearing = { top: 'N', right: 'E', bottom: 'S', left: 'W' };
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

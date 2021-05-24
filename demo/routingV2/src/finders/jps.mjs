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
        this.openList = new BinaryHeap((a, b) => a.f - b.f);

        // todo: move to Grid?
        // nodes are kept in quadrants, with absolute coordinates for each quadrant
        this.nodes = [new Map(), new Map(), new Map(), new Map()];
    }

    findPath(startPoints, endPoints, vertices = []) {
        const { openList, nodes } = this;
        const { step } = this.grid;

        const startDirs = Object.keys(startPoints);
        const endDirs = Object.keys(endPoints);

        const startGridPoints = Object.values(startPoints).map(point => pointToLocalGrid(point.coordinates, this.grid.step));
        const endGridPoints = Object.values(endPoints).map(point => pointToLocalGrid(point.coordinates, this.grid.step));
        const gridVertices = vertices.map(vertex => pointToLocalGrid(vertex, this.grid.step));

        // used to adjust path as the last operation
        let startPoint, endPoint;

        let fromPoints, toPoints, segments = [], previousSegment = null;
        for (let i = 0; i <= gridVertices.length; i++) {
            fromPoints = toPoints || startGridPoints;
            toPoints = gridVertices[i] ? [gridVertices[i]] : endGridPoints;

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
                            node.g = node.f = startPoints[node.startDir].offset;
                        } else {
                            node.startDir = BearingDirection[previousSegment[previousSegment.length - 1].bearing];
                        }

                        // close neighbor node in the source direction
                        const { x: dx, y: dy } = CardinalDirections[DirectionBearing[node.startDir]];
                        const tailNode = this._getNodeAt(node.x + dx, node.y + dy);

                        if (tailNode) {
                            node.parent = tailNode;
                            tailNode.close();
                        }

                        openList.push(node);
                    }
                });

                // no source nodes available for pathfinding
                if (openList.empty()) {
                    return;
                }

                // close previous direction to prevent retracing
                if (previousSegment && previousSegment.length > 1) {
                    const [p1, p2] = previousSegment.slice(previousSegment.length - 2, previousSegment.length);
                    const direction = getDirection(p1, p2);
                    this._getNodeAt(p2.x + direction.x, p2.y + direction.y).close();
                }

                if (i === gridVertices.length) {
                    endNode.endDir = endDirs[tIndex];
                    endNode.endPoint = endPoints[endNode.endDir];
                }

                // main pathfinding loop
                let node;
                while (!openList.empty()) {
                    node = openList.pop();
                    node.closed = true;

                    // todo: left to consider - slightly speeds up consecutive searches, but may not find a bit longer,
                    // todo: but nicer visually path
                    // partial path already longer than previously found path, early exit
                    // if (node.g >= minCost) {
                    //     nodes.length = 0;
                    //     openList.clear();
                    //     break;
                    // }

                    // reached target node
                    if (node.isEqual(endNode.x, endNode.y)) {
                        if (node.g < minCost) {
                            minCost = endNode.g;
                            segment = toVectors(backtrace(node));

                            // store start point for later adjustments
                            if (i === 0) {
                                startPoint = startPoints[endNode.getRoot().startDir];
                            }

                            // store for later adjustments as nodes get cleared
                            if (i === gridVertices.length) {
                                endPoint = endPoints[endNode.endDir];
                            }
                        }

                        // cleanup
                        nodes.forEach(quadrant => quadrant.clear());
                        openList.clear();
                        break;
                    }

                    // add new jump point nodes to openList
                    this._identifySuccessors(node);
                }
            });

            if (segment) {
                // shortest segment found, store
                previousSegment = segment;
                segments.push(segment);
            } else {
                // todo: build orthogonal path segment
                // currently it will just draw straight line
                // orthogonal.mjs/insideElement()
            }

            // last segment found
            if (i === gridVertices.length) {
                break;
            }
        }

        return segments.reduce((acc, segment, index) => {
            const partial = scale(segment, step);
            // // adjust only first/last/only segment
            // // else it's mid segment - no need to adjust anything
            if (index === 0 && index !== segments.length) {
                // first of 2+ segments
                // adjust(partial, { start: startPoint });
            } else if (index !== 0 && index === segments.length) {
                // last of 2+ segments
                // adjust(partial, { end: endPoint });
            } else if (index === 0 && index === segments.length) {
                // only segment
                // adjust(partial, { start: startPoint, end: endPoint });
            }

            acc = acc.concat(partial);
            return acc;
        }, []);
    }

    _identifySuccessors(node) {
        const heuristic = this.heuristic,
            openList = this.openList,
            endNode = this.endNode,
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

                if (jumpNode.closed) {
                    continue;
                }

                // include distance, penalties and target point offset
                d = cost(jx, jy, x, y, node, jumpNode, endNode);
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
                this._addWhenFree(x, y - 1, neighbors);
                this._addWhenFree(x, y + 1, neighbors);
                this._addWhenFree(x + dx, y, neighbors);
            } else if (dy !== 0) {
                this._addWhenFree(x - 1, y, neighbors);
                this._addWhenFree(x + 1, y, neighbors);
                this._addWhenFree(x, y + dy, neighbors);
            }
        } else {
            // add all free neighbors
            this._addWhenFree(x, y - 1, neighbors);
            this._addWhenFree(x, y + 1, neighbors);
            this._addWhenFree(x - 1, y, neighbors);
            this._addWhenFree(x + 1, y, neighbors);
        }
        return neighbors;
    };
    // x,y - checked neighbour, px,py - current node
    _jump(x, y, px, py) {
        const dx = x - px, dy = y - py;

        // node is obstructed
        if (!this._isFree(x, y)) {
            return null;
        }

        // node is the end node
        if (x === this.endNode.x && y === this.endNode.y) {
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

            if (x === this.endNode.x - dx) {
                return [x + dx, y];
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

            if (y === this.endNode.y - dy) {
                return [x, y + dy];
            }

            if (!this._isFree(x, y + dy)) {
                return [x, y];
            }
        } else {
            throw new Error("Only horizontal and vertical movements are allowed");
        }

        return this._jump(x + dx, y + dy, x, y);
    }

    _addWhenFree(x, y, collection) {
        const node = this._getNodeAt(x, y);
        if (node.walkable) {
            collection.push(node);
        }
    }

    _getNodeAt(x, y) {
        // todo: quadrants OR merge data with Grid - cleanup!
        // negative coordinates may duplicate (i.e. 100,-1 is the same as -100,1 and same for 0,0 for width 100 etc.)
        let node = this.nodes[((x < 0) << 0) + ((y < 0) << 1)].get(y * this.grid._width + x);
        if (!node) {
            // cache node
            node = new GridNode(x, y, this.grid.v2traversable(x, y));
            this.nodes[((x < 0) << 0) + ((y < 0) << 1)].set(y * this.grid._width + x, node);
        }
        return node;
    }

    _isFree(x, y) {
        const node = this._getNodeAt(x, y);
        return node && node.walkable;
    }

    _getNeighbors(node) {
        const x = node.x, y = node.y, neighbors = [];

        // up
        if (this._isFree(x, y - 1)) {
            neighbors.push([x, y - 1]);
        }
        // right
        if (this._isFree(x + 1, y)) {
            neighbors.push([x + 1, y]);
        }
        // down
        if (this._isFree(x, y + 1)) {
            neighbors.push([x, y + 1]);
        }
        // left
        if (this._isFree(x - 1, y)) {
            neighbors.push([x - 1, y]);
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

const cost = function(jx, jy, x, y, node, jumpNode, endNode) {
    let prev = node.parent;
    if (!prev) {
        const dx = node.startDir === 'left' ? -1 : node.startDir === 'right' ? 1 : 0;
        const dy = node.startDir === 'top' ? 1 : node.startDir === 'bottom' ? -1 : 0;

        prev = { x: node.x + dx, y: node.y + dy };
    }
    // bend penalty
    let addedCost = isBend(prev, node, jumpNode) * 1;

    // end point offset
    if (jumpNode.isEqual(endNode.x, endNode.y) && endNode.endPoint) {
        addedCost += endNode.endPoint.offset;

        const { x: dx, y: dy } = CardinalDirections[DirectionBearing[endNode.endDir]];
        addedCost += isBend(node, jumpNode, { x: jx + dx, y: jy + dy }) * 1;
    }

    return Math.abs(jx - x) + Math.abs(jy - y) + addedCost;
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

const pointToLocalGrid = function (point, step) {
    return {
        x: Math.floor(point.x / step),
        y: Math.floor(point.y / step)
    }
}

import BinaryHeap from '../structures/BinaryHeap.mjs';
import GridNode from '../models/GridNode.mjs';
import { quadrant } from '../models/Grid.mjs';

export class JumpPointFinder {

    constructor({
        grid,
        heuristic = (dx, dy) => dx + dy,
    } = {}) {
        this.linkView = null;

        this.grid = grid;
        this.heuristic = heuristic;

        this.startNode = null;
        this.endNode = null;
        this.minCost = Infinity;
        this.openList = new BinaryHeap((a, b) => a.f - b.f);

        // nodes are kept in quadrants, with absolute coordinates for each quadrant
        this.nodes = [new Map(), new Map(), new Map(), new Map()];
    }

    findPath(sourcePoints, targetPoints, vertices = [], linkView, opt = {}) {
        this.linkView = linkView;
        this.opt = opt;

        const { openList, nodes } = this;
        const { step } = this.grid;

        const startPoints = sourcePoints.map(start => Object.assign(start, pointToLocalGrid(start.paperPoint, this.grid.step)));
        const endPoints = targetPoints.map(end => Object.assign(end, pointToLocalGrid(end.paperPoint, this.grid.step)));
        const waypoints = vertices.map(vertex => pointToLocalGrid(vertex, this.grid.step));

        // used to adjust path as the last operation
        let from, to, segments = [], prevEndDir = null, startPaperPoint, endPaperPoint, retryLastSegment = false;
        for (let i = 0; i < waypoints.length + 1; i++) {
            // don't reassign tested points when retrying segment pathfinding
            if (!retryLastSegment) {
                from = to || startPoints;
                to = waypoints[i] ? [waypoints[i]] : endPoints;
            }

            let minCost = Infinity, segment;
            to.forEach(toPoint => {
                // get node of current target
                const endNode = this.endNode = this._getNodeAt(toPoint.x, toPoint.y);
                if (!endNode || !endNode.walkable) {
                    // todo: end point unreachable, handle added vertex being out of grid bounds
                    return;
                }

                // store paper coordinate space point for later adjustment
                endNode.paperPoint = toPoint.paperPoint || waypoints[i - 1];
                endNode.offset = toPoint.offset || 0;

                // store outboundDir to support final bend penalty calculation
                if (i === waypoints.length) {
                    endNode.outboundDir = toPoint.dir;

                    // if traversable, close neighbor node in the target direction
                    const opposite = getOppositeCardinal(toPoint.dir);
                    // const opposite = toPoint.dir;
                    const targetRetraceNode = this._getNodeAt(endNode.x + opposite.x, endNode.y + opposite.y);

                    if (targetRetraceNode) {
                        targetRetraceNode.close();
                    }
                }

                // add and open traversable start nodes
                from.forEach(fromPoint => {
                    const node = this._getNodeAt(fromPoint.x, fromPoint.y);

                    if (node && node.walkable) {
                        node.g = node.f = i === 0 ? fromPoint.offset : 0;
                        node.opened = true;
                        node.closed = false;

                        // store paper coordinate space point for later adjustment
                        node.paperPoint = fromPoint.paperPoint;

                        // store the direction from which this node is visited
                        const inboundDir = fromPoint.dir || prevEndDir;
                        node.inboundDir = inboundDir;

                        // if traversable, close neighbor node in the source direction
                        const sourceRetraceNode = this._getNodeAt(node.x + inboundDir.x, node.y + inboundDir.y);

                        if (sourceRetraceNode) {
                            sourceRetraceNode.close();
                        }

                        openList.push(node);
                    }
                });

                // no source nodes available for pathfinding
                if (openList.empty()) {
                    return;
                }

                // main pathfinding loop
                let node;
                while (!openList.empty()) {
                    node = openList.pop();
                    node.closed = true;

                    // reached target node
                    if (node.isEqual(endNode)) {
                        if (node.g < minCost) {
                            if (i === 0) {
                                startPaperPoint = endNode.getRoot().paperPoint;
                            }

                            endPaperPoint = endNode.paperPoint;

                            minCost = endNode.g;
                            segment = backtrace(endNode);
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
                segments.push(segment);

                // prevent retracing by closing immediate neighbour in the inbound direction of end node
                const [p1, p2] = segment.slice(-2);
                if (p1 && p2) {
                    const bearing = getBearing(p1, p2);
                    const dir = prevEndDir = CardinalDirections[bearing];

                    // for middle segments, inboundDir at this stage will be null, so it has to be updated
                    this.endNode.inboundDir = dir;

                    // close previous direction to prevent retracing
                    const waypointRetraceNode = this._getNodeAt(p2.x + dir.x, p2.y + dir.y);
                    if (waypointRetraceNode) {
                        waypointRetraceNode.close();
                    }
                }
            } else if (!retryLastSegment) {
                // segment doesn't exist and it's not a retry loop
                // use existing JPS logic but with virtually empty Grid

                // allow for a single retry
                retryLastSegment = true;
                // ignore all obstacles on the Grid
                this.grid.ignoreObstacles = true;

                // cleanup
                nodes.forEach(quadrant => quadrant.clear());
                openList.clear();

                // enter this loop again
                i -= 1;
                // skip any further loop logic
                continue;
            }

            retryLastSegment = false;
            this.grid.ignoreObstacles = false;

            // last segment found
            if (i === waypoints.length) {
                break;
            }
        }

        const scaled = segments.map(segment => scale(segment, step));
        return adjust(scaled, startPaperPoint, endPaperPoint);
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
                d = cost(jx, jy, x, y, node, jumpNode, endNode, this.opt.bendCost);
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
                this._addWhenWalkable(x, y - 1, neighbors);
                this._addWhenWalkable(x, y + 1, neighbors);
                this._addWhenWalkable(x + dx, y, neighbors);
            } else if (dy !== 0) {
                this._addWhenWalkable(x - 1, y, neighbors);
                this._addWhenWalkable(x + 1, y, neighbors);
                this._addWhenWalkable(x, y + dy, neighbors);
            }
        } else {
            // add all free neighbors
            this._addWhenWalkable(x, y - 1, neighbors);
            this._addWhenWalkable(x, y + 1, neighbors);
            this._addWhenWalkable(x - 1, y, neighbors);
            this._addWhenWalkable(x + 1, y, neighbors);
        }
        return neighbors;
    };
    // x,y - checked neighbour, px,py - current node
    _jump(x, y, px, py) {
        const dx = x - px, dy = y - py;

        // node is obstructed
        if (!this._isWalkable(x, y)) {
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

            if ((this._isWalkable(x, y - 1) && !this._isWalkable(x - dx, y - 1)) ||
                (this._isWalkable(x, y + 1) && !this._isWalkable(x - dx, y + 1))) {
                // exit if found a turn - horizontal to vertical
                return [x, y];
            }

            if (x === this.endNode.x - dx) {
                return [x + dx, y];
            }

            if (!this._isWalkable(x + dx, y)) {
                return [x, y];
            }
        } else if (dy !== 0) {
            // VERTICAL MOVEMENT
            // left free AND previous left not free
            // OR right free and previous right not free
            if ((this._isWalkable(x - 1, y) && !this._isWalkable(x - 1, y - dy)) ||
                (this._isWalkable(x + 1, y) && !this._isWalkable(x + 1, y - dy))) {
                // exit if found a turn - vertical to horizontal
                return [x, y];
            }

            if (y === this.endNode.y - dy) {
                return [x, y + dy];
            }

            if (!this._isWalkable(x, y + dy)) {
                return [x, y];
            }
        } else {
            throw new Error("Only horizontal and vertical movements are allowed");
        }

        return this._jump(x + dx, y + dy, x, y);
    }

    _addWhenWalkable(x, y, collection) {
        const node = this._getNodeAt(x, y);
        if (node.walkable) {
            collection.push(node);
        }
    }

    _getNodeAt(x, y) {
        const index = Math.abs(y) * this.grid.opt.quadrantSize + Math.abs(x);
        let node = this.nodes[quadrant(x, y)].get(index);
        if (!node) {
            // create a node
            node = new GridNode(x, y, this.grid.traversable(x, y, this.linkView));
            // cache node in a proper quadrant
            this.nodes[quadrant(x, y)].set(index, node);
        }
        return node;
    }

    _isWalkable(x, y) {
        const node = this._getNodeAt(x, y);
        return node && node.walkable;
    }

    _getNeighbors(node) {
        const x = node.x, y = node.y, neighbors = [];

        // up
        if (this._isWalkable(x, y - 1)) {
            neighbors.push([x, y - 1]);
        }
        // right
        if (this._isWalkable(x + 1, y)) {
            neighbors.push([x + 1, y]);
        }
        // down
        if (this._isWalkable(x, y + 1)) {
            neighbors.push([x, y + 1]);
        }
        // left
        if (this._isWalkable(x - 1, y)) {
            neighbors.push([x - 1, y]);
        }

        return neighbors;
    }
}

const backtrace = function(node) {
    let path = [node];
    while (node.parent) {
        node = node.parent;
        path.push(node);
    }

    return path.reverse();
}

// const removeElbows = function(path) {
//     let i = 0;
//     while (i < path.length - 1) {
//         const current = path[i];
//         const next = path[i + 1];
//         const tested = path[i + 2];
//
//         if (tested === undefined) {
//             break;
//         }
//
//         if (next.bearing === current.bearing) {
//             current.length += next.length;
//             path.splice(i + 1, 1);
//             i = 0;
//         } else if (tested.bearing === current.bearing) {
//             const v1 = current.clone();
//             const v2 = next.clone();
//             const v3 = tested.clone();
//
//             v1.length += tested.length;
//             switch (tested.bearing) {
//                 case 'N':
//                     v2.y -= tested.length;
//                     v3.y -= tested.length;
//                     break
//                 case 'E':
//                     v2.x += tested.length;
//                     v3.x += tested.length;
//                     break;
//                 case 'S':
//                     v2.y += tested.length;
//                     v3.y += tested.length;
//                     break;
//                 case 'W':
//                     v2.x -= tested.length;
//                     v3.x -= tested.length;
//                     break;
//             }
//
//             if (pathClear([v1.x, v1.y, v2.x, v2.y, v3.x, v3.y], this)) {
//                 path.splice(i, 3, v1, v2);
//             }
//
//             i++;
//         } else {
//             i++;
//         }
//     }
//
//     return path;
//
//     function pathClear(s, pathfinder) {
//         let obstructed;
//         for (let i = 0; i < s.length; i += 2) {
//             const vertical = s[i] === s[i + 2];
//             const bounds = vertical ? [s[i + 1], s[i + 3]] : [s[i], s[i + 2]];
//             bounds.sort((a, b) => { return a - b });
//
//             for (let j = bounds[0]; j <= bounds[1]; j++) {
//                 if (pathfinder._isWalkable(vertical ? s[i] : j , vertical ? j : s[i + 1])) {
//                     continue;
//                 }
//
//                 obstructed = true;
//                 break;
//             }
//
//             if (obstructed) {
//                 break;
//             }
//         }
//
//         return !obstructed;
//     }
// }

const scale = function(path, step) {
    return path.map(point => point.getScaledCoordinates(step));
}

const adjust = function(segments, start, end) {
    return segments.reduce((acc, segment, index) => {
        const isFirstSegment = index === 0;
        const isLastSegment = index === segments.length - 1;

        if (isFirstSegment && start) {
            // adjust start segment to original start point coordinates
            const p0 = segment[0];
            let p1 = segment[1];
            if (!p1) {
                p1 = p0;
            }

            const startAxis = p0.x === p1.x ? 'x': 'y';
            const startVal = p0[startAxis];
            let si = 0, sv = segment[si];
            while (sv && sv[startAxis] === startVal) {
                segment[si][startAxis] = start[startAxis];
                si += 1;
                sv = segment[si];
            }

            if (startAxis === 'x') {
                segment[0].y = start.y;
            } else {
                segment[0].x = start.x;
            }
        }

        if (isLastSegment && end) {
            // adjust end segment to original end point coordinates
            const pLast = segment[segment.length - 1];
            let pPrev = segment[segment.length - 2];
            if (!pPrev) {
                pPrev = pLast;
            }
            const endAxis = pLast.x === pPrev.x ? 'x' : 'y';
            const endVal = pLast[endAxis];

            const isLine = segment.filter(point => point[endAxis] === endVal).length === segment.length;
            if (isLine && !isFirstSegment) {
                segment.push(Object.assign({}, pLast, { [endAxis]: end[endAxis] }));
            } else {
                let ei = segment.length - 1, ev = segment[ei];
                while (ev && ev[endAxis] === endVal) {
                    segment[ei][endAxis] = end[endAxis];
                    ei -= 1;
                    ev = segment[ei];
                }

                if (endAxis === 'x') {
                    segment[segment.length - 1].y = end.y;
                } else {
                    segment[segment.length - 1].x = end.x;
                }
            }
        }

        acc.push(...segment);
        return acc;
    }, []);
}

const cost = function(jx, jy, x, y, node, jumpNode, endNode, bendCost) {
    let prev = node.parent;
    if (!prev) {
        const { x: dx, y: dy } = node.inboundDir;
        prev = { x: node.x + dx, y: node.y + dy };
    }
    // bend penalty
    let addedCost = isBend(prev, node, jumpNode) * bendCost;

    if (jumpNode.isEqual(endNode)) {
        // end point offset from center cost
        addedCost += endNode.offset;

        if (endNode.outboundDir) {
            // end point final bend cost
            addedCost += isBend(node, jumpNode, { x: jx + endNode.outboundDir.x, y: jy + endNode.outboundDir.y }) * endNode.offset;
        }
    }

    return Math.abs(jx - x) + Math.abs(jy - y) + addedCost;
}

const isBend = function(prev, node, next) {
    return (prev.x === node.x && node.x !== next.x) || (prev.y === node.y && node.y !== next.y);
}

export const CardinalDirections = {
    N: { x: 0, y: 1 },
    E: { x: -1, y: 0 },
    S: { x: 0, y: -1 },
    W: { x: 1, y: 0 }
};

const Bearings = { N: 'N', E: 'E', S: 'S', W: 'W' };

const getOppositeCardinal = (dir) => {
    return {
        x: dir.x === -1 ? 1 : dir.x === 1 ? -1 : 0,
        y: dir.y === -1 ? 1 : dir.y === 1 ? -1 : 0
    }
}

const getBearing = (p1, p2) => {
    if (p1.x === p2.x) return (p1.y > p2.y) ? Bearings.N : Bearings.S;
    if (p1.y === p2.y) return (p1.x > p2.x) ? Bearings.W : Bearings.E;
    // TODO: else throw?
}

const pointToLocalGrid = function (point, step) {
    return {
        x: Math.floor(point.x / step),
        y: Math.floor(point.y / step)
    }
}

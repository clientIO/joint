/*eslint-env es6 */
export default class GridNode {
    constructor(x, y, walkable) {
        this.x = x;
        this.y = y;
        this.opened = false;
        this.closed = false;
        this.walkable = walkable === undefined ? true : walkable;

        // cost from start point to GridNode
        this.g = null;
        // heuristic cost from GridNode to end point
        this.h = null;
        // sum of cost from start to GridNode and heuristic cost
        this.f = null;

        // parent node used to traceback the path
        this.parent = null;

        // every endpoint of a path segment (first and last point in a segment)
        // stores information the direction from which this node is visited (first point)
        // or direction to which it's pointing (last point).
        // this is used for retracing and final adjustment purposes
        this.inboundDir = null;
        this.outboundDir = null;

        // offset from source/end Cell center to the start/end point
        // used for calculating additional cost for different start/end points choices
        this.offset = 0;

        // paper coordinate space point if this node is either start or end node
        this.paperPoint = null;
    }

    isEqual(node) {
        return this.x === node.x && this.y === node.y;
    }

    close() {
        this.walkable = false;
        this.closed = true;
        this.opened = true;
    }

    getRoot() {
        let node = this;
        while (node.parent) {
            node = node.parent;
        }
        return node;
    }

    getScaledCoordinates(size = 1) {
        return {
            x: this.x * size,
            y: this.y * size,
        };
    }
}

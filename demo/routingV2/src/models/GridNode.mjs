export default class GridNode {
    constructor(x, y, walkable) {
        this.x = x;
        this.y = y;

        this.g = null;  // cost from start point to GridNode
        this.h = null;  // heuristic cost from GridNode to end point
        this.f = null;  // sum of cost from start to GridNode and heuristic cost

        this.walkable = walkable === undefined ? true : walkable;
        this.opened = false;
        this.closed = false;
    }

    isEqual(x, y) {
        return this.x === x && this.y === y;
    }

    close() {
        this.walkable = false;
        this.closed = true;
        this.opened = true;
    }
}

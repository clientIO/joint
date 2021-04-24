export default class GridNode {
    constructor(x, y, walkable) {
        this.x = x;
        this.y = y;

        this.g = null;
        this.f = null;

        this.walkable = walkable === undefined ? true : walkable;
        this.opened = false;
        this.closed = false;
    }

    linkObstacle(i) {
        if (this.obstacles === null) {
            this.obstacles = {};
        }
        this.obstacles[i] = true;
        this.walkable = false;
    }

    unlinkObstacle(i) {
        delete this.obstacles[i];
        if (Object.keys(this.obstacles).length === 0) {
            this.walkable = true;
        }
    }

    isWalkable() {
        return this.walkable;
    }

    isEqual(node) {
        return node instanceof GridNode && this.x === node.x && this.y === node.y;
    }
}

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

    isEqual(x, y) {
        return this.x === x && this.y === y;
    }
}

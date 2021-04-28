export default class PathPoint {
    constructor(x, y, bearing, length) {
        this.x = x;
        this.y = y;
        this.bearing = bearing;
        this.length = length;
    }

    extend(p) {
        this.length += p.length;
        return this;
    }

    scale(size = 1) {
        this.x *= size;
        this.y *= size;
        this.length *= size;
        return this;
    }

    clone() {
        const { x, y, bearing, length } = this;
        return new PathPoint(x, y, bearing, length);
    }
}

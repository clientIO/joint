import { Rect } from './rect.mjs';
import { Point } from './point.mjs';
import { types } from './types.mjs';
import { toRad } from './geometry.helpers.mjs';
import { toPlainMatrix } from './matrix.helpers.mjs';

const {
    sqrt,
    round,
    pow,
    cos,
    sin
} = Math;

export const Ellipse = function(c, a, b) {

    if (!(this instanceof Ellipse)) {
        return new Ellipse(c, a, b);
    }

    if (c instanceof Ellipse) {
        return new Ellipse(new Point(c.x, c.y), c.a, c.b);
    }

    c = new Point(c);
    this.x = c.x;
    this.y = c.y;
    this.a = a;
    this.b = b;
};

Ellipse.fromRect = function(rect) {

    rect = new Rect(rect);
    return new Ellipse(rect.center(), rect.width / 2, rect.height / 2);
};

Ellipse.prototype = {

    type: types.Ellipse,

    // Returns the bounding box of the transformed ellipse.
    // `transformation` is an angle (the ellipse is rotated around its center),
    // or a matrix (an object with `a`, `b`, `c`, `d`, `e`, `f`; the fields missing in it
    // are the ones of the identity matrix).
    bbox: function(transformation) {

        const { x, y, a: rx, b: ry } = this;

        if (Object(transformation) !== transformation) {
            // `transformation` is not a matrix: it is an angle, or there is none
            if (!transformation) return new Rect(x - rx, y - ry, 2 * rx, 2 * ry);
            // the ellipse rotated around its center
            const theta = toRad(transformation);
            const cosTheta = cos(theta);
            const sinTheta = sin(theta);
            const halfWidth = sqrt((rx * cosTheta) * (rx * cosTheta) + (ry * sinTheta) * (ry * sinTheta));
            const halfHeight = sqrt((rx * sinTheta) * (rx * sinTheta) + (ry * cosTheta) * (ry * cosTheta));
            return new Rect(x - halfWidth, y - halfHeight, 2 * halfWidth, 2 * halfHeight);
        }

        // a matrix: the transformed ellipse is an ellipse too, possibly a rotated one
        const { a, b, c, d, e, f } = toPlainMatrix(transformation);
        const halfWidth = sqrt((a * rx) * (a * rx) + (c * ry) * (c * ry));
        const halfHeight = sqrt((b * rx) * (b * rx) + (d * ry) * (d * ry));
        return new Rect(a * x + c * y + e - halfWidth, b * x + d * y + f - halfHeight, 2 * halfWidth, 2 * halfHeight);
    },

    /**
     * @returns {g.Point}
     */
    center: function() {

        return new Point(this.x, this.y);
    },

    clone: function() {

        return new Ellipse(this);
    },

    /**
     * @param {g.Point} p
     * @returns {boolean}
     */
    containsPoint: function(p) {

        return this.normalizedDistance(p) <= 1;
    },

    equals: function(ellipse) {

        return !!ellipse &&
            ellipse.x === this.x &&
            ellipse.y === this.y &&
            ellipse.a === this.a &&
            ellipse.b === this.b;
    },

    // inflate by dx and dy
    // @param dx {delta_x} representing additional size to x
    // @param dy {delta_y} representing additional size to y -
    // dy param is not required -> in that case y is sized by dx
    inflate: function(dx, dy) {
        if (dx === undefined) {
            dx = 0;
        }

        if (dy === undefined) {
            dy = dx;
        }

        this.a += 2 * dx;
        this.b += 2 * dy;

        return this;
    },

    intersectionWithLine: function(line) {

        const { start, end } = line;
        const startX = start.x;
        const startY = start.y;
        const endX = end.x;
        const endY = end.y;
        const rx = this.a;
        const ry = this.b;
        const dirX = endX - startX;
        const dirY = endY - startY;
        const diffX = startX - this.x;
        const diffY = startY - this.y;
        const mDirX = dirX / (rx * rx);
        const mDirY = dirY / (ry * ry);
        const mDiffX = diffX / (rx * rx);
        const mDiffY = diffY / (ry * ry);

        const a = dirX * mDirX + dirY * mDirY;
        const b = dirX * mDiffX + dirY * mDiffY;
        const c = (diffX * mDiffX + diffY * mDiffY) - 1.0;
        const d = b * b - a * c;

        if (d < 0) return null;

        if (d > 0) {
            const root = sqrt(d);
            const ta = (-b - root) / a;
            const tb = (-b + root) / a;
            const isTaOnLine = (0 <= ta && ta <= 1);
            const isTbOnLine = (0 <= tb && tb <= 1);
            if (!isTaOnLine && !isTbOnLine) return null;

            const intersections = [];
            if (isTaOnLine) intersections.push(new Point((1 - ta) * startX + ta * endX, (1 - ta) * startY + ta * endY));
            if (isTbOnLine) intersections.push(new Point((1 - tb) * startX + tb * endX, (1 - tb) * startY + tb * endY));
            return intersections;
        }

        const t = -b / a;
        if (0 <= t && t <= 1) {
            return [new Point((1 - t) * startX + t * endX, (1 - t) * startY + t * endY)];
        }

        return null;
    },

    // Find point on me where line from my center to
    // point p intersects my boundary.
    // @param {number} angle If angle is specified, intersection with rotated ellipse is computed.
    intersectionWithLineFromCenterToPoint: function(p, angle) {

        p = new Point(p);

        if (angle) p.rotate(new Point(this.x, this.y), angle);

        var dx = p.x - this.x;
        var dy = p.y - this.y;
        var result;

        if (dx === 0) {
            result = this.bbox().pointNearestToPoint(p);
            if (angle) return result.rotate(new Point(this.x, this.y), -angle);
            return result;
        }

        var m = dy / dx;
        var mSquared = m * m;
        var aSquared = this.a * this.a;
        var bSquared = this.b * this.b;

        var x = sqrt(1 / ((1 / aSquared) + (mSquared / bSquared)));
        x = dx < 0 ? -x : x;

        var y = m * x;
        result = new Point(this.x + x, this.y + y);

        if (angle) return result.rotate(new Point(this.x, this.y), -angle);
        return result;
    },

    /**
     * @param {g.Point} point
     * @returns {number} result < 1 - inside ellipse, result == 1 - on ellipse boundary, result > 1 - outside
     */
    normalizedDistance: function(point) {

        var x0 = point.x;
        var y0 = point.y;
        var a = this.a;
        var b = this.b;
        var x = this.x;
        var y = this.y;

        return ((x0 - x) * (x0 - x)) / (a * a) + ((y0 - y) * (y0 - y)) / (b * b);
    },

    round: function(precision) {

        let f = 1; // case 0
        if (precision) {
            switch (precision) {
                case 1: f = 10; break;
                case 2: f = 100; break;
                case 3: f = 1000; break;
                default: f = pow(10, precision); break;
            }
        }

        this.x = round(this.x * f) / f;
        this.y = round(this.y * f) / f;
        this.a = round(this.a * f) / f;
        this.b = round(this.b * f) / f;
        return this;
    },

    /** Compute angle between tangent and x axis
     * @param {g.Point} p Point of tangency, it has to be on ellipse boundaries.
     * @returns {number} angle between tangent and x axis
     */
    tangentTheta: function(p) {

        var refPointDelta = 30;
        var x0 = p.x;
        var y0 = p.y;
        var a = this.a;
        var b = this.b;
        var center = this.bbox().center();
        var m = center.x;
        var n = center.y;

        var q1 = x0 > center.x + a / 2;
        var q3 = x0 < center.x - a / 2;

        var y, x;
        if (q1 || q3) {
            y = x0 > center.x ? y0 - refPointDelta : y0 + refPointDelta;
            x = (a * a / (x0 - m)) - (a * a * (y0 - n) * (y - n)) / (b * b * (x0 - m)) + m;

        } else {
            x = y0 > center.y ? x0 + refPointDelta : x0 - refPointDelta;
            y = (b * b / (y0 - n)) - (b * b * (x0 - m) * (x - m)) / (a * a * (y0 - n)) + n;
        }

        return (new Point(x, y)).theta(p);

    },

    toString: function() {

        return (new Point(this.x, this.y)).toString() + ' ' + this.a + ' ' + this.b;
    }
};

// For backwards compatibility:
export const ellipse = Ellipse;

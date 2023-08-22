import { Rect } from './rect.mjs';
import { Point } from './point.mjs';
import { types } from './types.mjs';

const {
    sqrt,
    round,
    pow
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

    bbox: function() {

        return new Rect(this.x - this.a, this.y - this.b, 2 * this.a, 2 * this.b);
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

        var intersections = [];
        var a1 = line.start;
        var a2 = line.end;
        var rx = this.a;
        var ry = this.b;
        var dir = line.vector();
        var diff = a1.difference(new Point(this));
        var mDir = new Point(dir.x / (rx * rx), dir.y / (ry * ry));
        var mDiff = new Point(diff.x / (rx * rx), diff.y / (ry * ry));

        var a = dir.dot(mDir);
        var b = dir.dot(mDiff);
        var c = diff.dot(mDiff) - 1.0;
        var d = b * b - a * c;

        if (d < 0) {
            return null;
        } else if (d > 0) {
            var root = sqrt(d);
            var ta = (-b - root) / a;
            var tb = (-b + root) / a;

            if ((ta < 0 || 1 < ta) && (tb < 0 || 1 < tb)) {
                // if ((ta < 0 && tb < 0) || (ta > 1 && tb > 1)) outside else inside
                return null;
            } else {
                if (0 <= ta && ta <= 1) intersections.push(a1.lerp(a2, ta));
                if (0 <= tb && tb <= 1) intersections.push(a1.lerp(a2, tb));
            }
        } else {
            var t = -b / a;
            if (0 <= t && t <= 1) {
                intersections.push(a1.lerp(a2, t));
            } else {
                // outside
                return null;
            }
        }

        return intersections;
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

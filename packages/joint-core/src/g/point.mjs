/*
    Point is the most basic object consisting of x/y coordinate.

    Possible instantiations are:
    * `Point(10, 20)`
    * `new Point(10, 20)`
    * `Point('10 20')`
    * `Point(Point(10, 20))`
*/
import { normalizeAngle, random, snapToGrid, toDeg, toRad } from './geometry.helpers.mjs';
import { bearing } from './line.bearing.mjs';
import { squaredLength } from './line.squaredLength.mjs';
import { length } from './line.length.mjs';
import { types } from './types.mjs';

const {
    abs,
    cos,
    sin,
    sqrt,
    min,
    max,
    atan2,
    round,
    pow,
    PI
} = Math;

export const Point = function(x, y) {

    if (!(this instanceof Point)) {
        return new Point(x, y);
    }

    if (typeof x === 'string') {
        var xy = x.split(x.indexOf('@') === -1 ? ' ' : '@');
        x = parseFloat(xy[0]);
        y = parseFloat(xy[1]);

    } else if (Object(x) === x) {
        y = x.y;
        x = x.x;
    }

    this.x = x === undefined ? 0 : x;
    this.y = y === undefined ? 0 : y;
};

// Alternative constructor, from polar coordinates.
// @param {number} Distance.
// @param {number} Angle in radians.
// @param {point} [optional] Origin.
Point.fromPolar = function(distance, angle, origin) {

    origin = new Point(origin);
    var x = abs(distance * cos(angle));
    var y = abs(distance * sin(angle));
    var deg = normalizeAngle(toDeg(angle));

    if (deg < 90) {
        y = -y;

    } else if (deg < 180) {
        x = -x;
        y = -y;

    } else if (deg < 270) {
        x = -x;
    }

    return new Point(origin.x + x, origin.y + y);
};

// Create a point with random coordinates that fall into the range `[x1, x2]` and `[y1, y2]`.
Point.random = function(x1, x2, y1, y2) {

    return new Point(random(x1, x2), random(y1, y2));
};

Point.prototype = {

    type: types.Point,

    chooseClosest: function(points) {

        var n = points.length;
        if (n === 1) return new Point(points[0]);
        var closest = null;
        var minSqrDistance = Infinity;
        for (var i = 0; i < n; i++) {
            var p = new Point(points[i]);
            var sqrDistance = this.squaredDistance(p);
            if (sqrDistance < minSqrDistance) {
                closest = p;
                minSqrDistance = sqrDistance;
            }
        }
        return closest;
    },

    // If point lies outside rectangle `r`, return the nearest point on the boundary of rect `r`,
    // otherwise return point itself.
    // (see Squeak Smalltalk, Point>>adhereTo:)
    adhereToRect: function(r) {

        if (r.containsPoint(this)) {
            return this;
        }

        this.x = min(max(this.x, r.x), r.x + r.width);
        this.y = min(max(this.y, r.y), r.y + r.height);
        return this;
    },

    // Compute the angle between vector from me to p1 and the vector from me to p2.
    // ordering of points p1 and p2 is important!
    // theta function's angle convention:
    // returns angles between 0 and 180 when the angle is counterclockwise
    // returns angles between 180 and 360 to convert clockwise angles into counterclockwise ones
    // returns NaN if any of the points p1, p2 is coincident with this point
    angleBetween: function(p1, p2) {

        var angleBetween = (this.equals(p1) || this.equals(p2)) ? NaN : (this.theta(p2) - this.theta(p1));

        if (angleBetween < 0) {
            angleBetween += 360; // correction to keep angleBetween between 0 and 360
        }

        return angleBetween;
    },

    // Return the bearing between me and the given point.
    bearing: function(point) {
        return bearing(this, point);
    },

    // Returns change in angle from my previous position (-dx, -dy) to my new position
    // relative to ref point.
    changeInAngle: function(dx, dy, ref) {

        // Revert the translation and measure the change in angle around x-axis.
        return this.clone().offset(-dx, -dy).theta(ref) - this.theta(ref);
    },

    clone: function() {

        return new Point(this);
    },

    // Returns the cross product of this point relative to two other points
    // this point is the common point
    // point p1 lies on the first vector, point p2 lies on the second vector
    // watch out for the ordering of points p1 and p2!
    // positive result indicates a clockwise ("right") turn from first to second vector
    // negative result indicates a counterclockwise ("left") turn from first to second vector
    // zero indicates that the first and second vector are collinear
    // note that the above directions are reversed from the usual answer on the Internet
    // that is because we are in a left-handed coord system (because the y-axis points downward)
    cross: function(p1, p2) {

        return (p1 && p2) ? (((p2.x - this.x) * (p1.y - this.y)) - ((p2.y - this.y) * (p1.x - this.x))) : NaN;
    },

    difference: function(dx, dy) {

        if ((Object(dx) === dx)) {
            dy = dx.y;
            dx = dx.x;
        }

        return new Point(this.x - (dx || 0), this.y - (dy || 0));
    },

    // Returns distance between me and point `p`.
    distance: function(p) {
        return length(this, p);
    },

    // Returns the dot product of this point with given other point
    dot: function(p) {

        return p ? (this.x * p.x + this.y * p.y) : NaN;
    },

    equals: function(p) {

        return !!p &&
            this.x === p.x &&
            this.y === p.y;
    },

    // Linear interpolation
    lerp: function(p, t) {

        var x = this.x;
        var y = this.y;
        return new Point((1 - t) * x + t * p.x, (1 - t) * y + t * p.y);
    },

    magnitude: function() {

        return sqrt((this.x * this.x) + (this.y * this.y)) || 0.01;
    },

    // Returns a manhattan (taxi-cab) distance between me and point `p`.
    manhattanDistance: function(p) {

        return abs(p.x - this.x) + abs(p.y - this.y);
    },

    // Move point on line starting from ref ending at me by
    // distance distance.
    move: function(ref, distance) {

        var theta = toRad((new Point(ref)).theta(this));
        var offset = this.offset(cos(theta) * distance, -sin(theta) * distance);
        return offset;
    },

    // Scales x and y such that the distance between the point and the origin (0,0) is equal to the given length.
    normalize: function(length) {

        var scale = (length || 1) / this.magnitude();
        return this.scale(scale, scale);
    },

    // Offset me by the specified amount.
    offset: function(dx, dy) {

        if ((Object(dx) === dx)) {
            dy = dx.y;
            dx = dx.x;
        }

        this.x += dx || 0;
        this.y += dy || 0;
        return this;
    },

    // Returns a point that is the reflection of me with
    // the center of inversion in ref point.
    reflection: function(ref) {

        return (new Point(ref)).move(this, this.distance(ref));
    },

    // Rotate point by angle around origin.
    // Angle is flipped because this is a left-handed coord system (y-axis points downward).
    rotate: function(origin, angle) {

        if (angle === 0) return this;

        origin = origin || new Point(0, 0);

        angle = toRad(normalizeAngle(-angle));
        var cosAngle = cos(angle);
        var sinAngle = sin(angle);

        var x = (cosAngle * (this.x - origin.x)) - (sinAngle * (this.y - origin.y)) + origin.x;
        var y = (sinAngle * (this.x - origin.x)) + (cosAngle * (this.y - origin.y)) + origin.y;

        this.x = x;
        this.y = y;
        return this;
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
        return this;
    },

    // Scale point with origin.
    scale: function(sx, sy, origin) {

        origin = (origin && new Point(origin)) || new Point(0, 0);
        this.x = origin.x + sx * (this.x - origin.x);
        this.y = origin.y + sy * (this.y - origin.y);
        return this;
    },

    snapToGrid: function(gx, gy) {

        this.x = snapToGrid(this.x, gx);
        this.y = snapToGrid(this.y, gy || gx);
        return this;
    },

    squaredDistance: function(p) {
        return squaredLength(this, p);
    },

    // Compute the angle between me and `p` and the x axis.
    // (cartesian-to-polar coordinates conversion)
    // Return theta angle in degrees.
    theta: function(p) {

        p = new Point(p);

        // Invert the y-axis.
        var y = -(p.y - this.y);
        var x = p.x - this.x;
        var rad = atan2(y, x); // defined for all 0 corner cases

        // Correction for III. and IV. quadrant.
        if (rad < 0) {
            rad = 2 * PI + rad;
        }

        return 180 * rad / PI;
    },

    toJSON: function() {

        return { x: this.x, y: this.y };
    },

    // Converts rectangular to polar coordinates.
    // An origin can be specified, otherwise it's 0@0.
    toPolar: function(o) {

        o = (o && new Point(o)) || new Point(0, 0);
        var x = this.x;
        var y = this.y;
        this.x = sqrt((x - o.x) * (x - o.x) + (y - o.y) * (y - o.y)); // r
        this.y = toRad(o.theta(new Point(x, y)));
        return this;
    },

    toString: function() {

        return this.x + '@' + this.y;
    },

    serialize: function() {

        return this.x + ',' + this.y;
    },

    update: function(x, y) {

        if ((Object(x) === x)) {
            y = x.y;
            x = x.x;
        }

        this.x = x || 0;
        this.y = y || 0;
        return this;
    },

    // Compute the angle between the vector from 0,0 to me and the vector from 0,0 to p.
    // Returns NaN if p is at 0,0.
    vectorAngle: function(p) {

        var zero = new Point(0, 0);
        return zero.angleBetween(this, p);
    }
};

Point.prototype.translate = Point.prototype.offset;

// For backwards compatibility:
export const point = Point;

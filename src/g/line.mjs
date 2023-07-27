import { Point } from './point.mjs';
import { Rect } from './rect.mjs';
import { bearing } from './line.bearing.mjs';
import { squaredLength } from './line.squaredLength.mjs';
import { length } from './line.length.mjs';
import { types } from './types.mjs';

const {
    max,
    min
} = Math;

export const Line = function(p1, p2) {

    if (!(this instanceof Line)) {
        return new Line(p1, p2);
    }

    if (p1 instanceof Line) {
        return new Line(p1.start, p1.end);
    }

    this.start = new Point(p1);
    this.end = new Point(p2);
};

Line.prototype = {

    type: types.Line,

    // @returns the angle of incline of the line.
    angle: function() {

        var horizontalPoint = new Point(this.start.x + 1, this.start.y);
        return this.start.angleBetween(this.end, horizontalPoint);
    },

    bbox: function() {

        var left = min(this.start.x, this.end.x);
        var top = min(this.start.y, this.end.y);
        var right = max(this.start.x, this.end.x);
        var bottom = max(this.start.y, this.end.y);

        return new Rect(left, top, (right - left), (bottom - top));
    },

    // @return the bearing (cardinal direction) of the line. For example N, W, or SE.
    // @returns {String} One of the following bearings : NE, E, SE, S, SW, W, NW, N.
    bearing: function() {
        return bearing(this.start, this.end);
    },

    clone: function() {

        return new Line(this.start, this.end);
    },

    // @return {point} the closest point on the line to point `p`
    closestPoint: function(p) {

        return this.pointAt(this.closestPointNormalizedLength(p));
    },

    closestPointLength: function(p) {

        return this.closestPointNormalizedLength(p) * this.length();
    },

    // @return {number} the normalized length of the closest point on the line to point `p`
    closestPointNormalizedLength: function(p) {

        var product = this.vector().dot((new Line(this.start, p)).vector());
        var cpNormalizedLength = min(1, max(0, product / this.squaredLength()));

        // cpNormalizedLength returns `NaN` if this line has zero length
        // we can work with that - if `NaN`, return 0
        if (cpNormalizedLength !== cpNormalizedLength) return 0; // condition evaluates to `true` if and only if cpNormalizedLength is `NaN`
        // (`NaN` is the only value that is not equal to itself)

        return cpNormalizedLength;
    },

    closestPointTangent: function(p) {

        return this.tangentAt(this.closestPointNormalizedLength(p));
    },

    // Returns `true` if the point lies on the line.
    containsPoint: function(p) {

        var start = this.start;
        var end = this.end;

        if (start.cross(p, end) !== 0) return false;
        // else: cross product of 0 indicates that this line and the vector to `p` are collinear

        var length = this.length();
        if ((new Line(start, p)).length() > length) return false;
        if ((new Line(p, end)).length() > length) return false;
        // else: `p` lies between start and end of the line

        return true;
    },

    // Divides the line into two at requested `ratio` between 0 and 1.
    divideAt: function(ratio) {

        var dividerPoint = this.pointAt(ratio);

        // return array with two lines
        return [
            new Line(this.start, dividerPoint),
            new Line(dividerPoint, this.end)
        ];
    },

    // Divides the line into two at requested `length`.
    divideAtLength: function(length) {

        var dividerPoint = this.pointAtLength(length);

        // return array with two new lines
        return [
            new Line(this.start, dividerPoint),
            new Line(dividerPoint, this.end)
        ];
    },

    equals: function(l) {

        return !!l &&
            this.start.x === l.start.x &&
            this.start.y === l.start.y &&
            this.end.x === l.end.x &&
            this.end.y === l.end.y;
    },

    // @return {point} Point where I'm intersecting a line.
    // @return [point] Points where I'm intersecting a rectangle.
    // @see Squeak Smalltalk, LineSegment>>intersectionWith:
    intersect: function(shape, opt) {

        if (shape && shape.intersectionWithLine) {
            var intersection = shape.intersectionWithLine(this, opt);

            // Backwards compatibility
            if (intersection && (shape instanceof Line)) {
                intersection = intersection[0];
            }

            return intersection;
        }

        return null;
    },

    intersectionWithLine: function(line) {

        var pt1Dir = new Point(this.end.x - this.start.x, this.end.y - this.start.y);
        var pt2Dir = new Point(line.end.x - line.start.x, line.end.y - line.start.y);
        var det = (pt1Dir.x * pt2Dir.y) - (pt1Dir.y * pt2Dir.x);
        var deltaPt = new Point(line.start.x - this.start.x, line.start.y - this.start.y);
        var alpha = (deltaPt.x * pt2Dir.y) - (deltaPt.y * pt2Dir.x);
        var beta = (deltaPt.x * pt1Dir.y) - (deltaPt.y * pt1Dir.x);

        if (det === 0 || alpha * det < 0 || beta * det < 0) {
            // No intersection found.
            return null;
        }

        if (det > 0) {
            if (alpha > det || beta > det) {
                return null;
            }

        } else {
            if (alpha < det || beta < det) {
                return null;
            }
        }

        return [new Point(
            this.start.x + (alpha * pt1Dir.x / det),
            this.start.y + (alpha * pt1Dir.y / det)
        )];
    },

    isDifferentiable: function() {

        return !this.start.equals(this.end);
    },

    // @return {double} length of the line
    length: function() {
        return length(this.start, this.end);
    },

    // @return {point} my midpoint
    midpoint: function() {

        return new Point(
            (this.start.x + this.end.x) / 2,
            (this.start.y + this.end.y) / 2
        );
    },

    parallel: function(distance) {
        const l = this.clone();
        if (!this.isDifferentiable()) return l;
        const { start, end } = l;
        const eRef = start.clone().rotate(end, 270);
        const sRef = end.clone().rotate(start, 90);
        start.move(sRef, distance);
        end.move(eRef, distance);
        return l;
    },

    // @return {point} my point at 't' <0,1>
    pointAt: function(t) {

        var start = this.start;
        var end = this.end;

        if (t <= 0) return start.clone();
        if (t >= 1) return end.clone();

        return start.lerp(end, t);
    },

    pointAtLength: function(length) {

        var start = this.start;
        var end = this.end;

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        var lineLength = this.length();
        if (length >= lineLength) return (fromStart ? end.clone() : start.clone());

        return this.pointAt((fromStart ? (length) : (lineLength - length)) / lineLength);
    },

    // @return {number} the offset of the point `p` from the line. + if the point `p` is on the right side of the line, - if on the left and 0 if on the line.
    pointOffset: function(p) {

        // Find the sign of the determinant of vectors (start,end), where p is the query point.
        p = new Point(p);
        var start = this.start;
        var end = this.end;
        var determinant = ((end.x - start.x) * (p.y - start.y) - (end.y - start.y) * (p.x - start.x));

        return determinant / this.length();
    },

    rotate: function(origin, angle) {

        this.start.rotate(origin, angle);
        this.end.rotate(origin, angle);
        return this;
    },

    round: function(precision) {

        this.start.round(precision);
        this.end.round(precision);
        return this;
    },

    scale: function(sx, sy, origin) {

        this.start.scale(sx, sy, origin);
        this.end.scale(sx, sy, origin);
        return this;
    },

    // @return {number} scale the line so that it has the requested length
    setLength: function(length) {

        var currentLength = this.length();
        if (!currentLength) return this;

        var scaleFactor = length / currentLength;
        return this.scale(scaleFactor, scaleFactor, this.start);
    },

    // @return {integer} length without sqrt
    // @note for applications where the exact length is not necessary (e.g. compare only)
    squaredLength: function() {
        return squaredLength(this.start, this.end);
    },

    tangentAt: function(t) {

        if (!this.isDifferentiable()) return null;

        var start = this.start;
        var end = this.end;

        var tangentStart = this.pointAt(t); // constrains `t` between 0 and 1

        var tangentLine = new Line(start, end);
        tangentLine.translate(tangentStart.x - start.x, tangentStart.y - start.y); // move so that tangent line starts at the point requested

        return tangentLine;
    },

    tangentAtLength: function(length) {

        if (!this.isDifferentiable()) return null;

        var start = this.start;
        var end = this.end;

        var tangentStart = this.pointAtLength(length);

        var tangentLine = new Line(start, end);
        tangentLine.translate(tangentStart.x - start.x, tangentStart.y - start.y); // move so that tangent line starts at the point requested

        return tangentLine;
    },

    toString: function() {

        return this.start.toString() + ' ' + this.end.toString();
    },

    serialize: function() {

        return this.start.serialize() + ' ' + this.end.serialize();
    },

    translate: function(tx, ty) {

        this.start.translate(tx, ty);
        this.end.translate(tx, ty);
        return this;
    },

    // @return vector {point} of the line
    vector: function() {

        return new Point(this.end.x - this.start.x, this.end.y - this.start.y);
    }
};

// For backwards compatibility:
Line.prototype.intersection = Line.prototype.intersect;


// For backwards compatibility:
export const line = Line;

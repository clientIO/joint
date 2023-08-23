import { Rect } from './rect.mjs';
import { Point } from './point.mjs';
import { Line } from './line.mjs';
import { types } from './types.mjs';
import { clonePoints, parsePoints, convexHull } from './points.mjs';


export const Polyline = function(points) {

    if (!(this instanceof Polyline)) {
        return new Polyline(points);
    }

    if (typeof points === 'string') {
        return new Polyline.parse(points);
    }

    this.points = (Array.isArray(points) ? points.map(Point) : []);
};

Polyline.parse = function(svgString) {
    return new Polyline(parsePoints(svgString));
};

Polyline.fromRect = function(rect) {
    return new Polyline([
        rect.topLeft(),
        rect.topRight(),
        rect.bottomRight(),
        rect.bottomLeft(),
        rect.topLeft(),
    ]);
};

Polyline.prototype = {

    type: types.Polyline,

    bbox: function() {

        var x1 = Infinity;
        var x2 = -Infinity;
        var y1 = Infinity;
        var y2 = -Infinity;

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty

        for (var i = 0; i < numPoints; i++) {

            var point = points[i];
            var x = point.x;
            var y = point.y;

            if (x < x1) x1 = x;
            if (x > x2) x2 = x;
            if (y < y1) y1 = y;
            if (y > y2) y2 = y;
        }

        return new Rect(x1, y1, x2 - x1, y2 - y1);
    },

    clone: function() {
        return new Polyline(clonePoints(this.points));
    },

    closestPoint: function(p) {

        var cpLength = this.closestPointLength(p);

        return this.pointAtLength(cpLength);
    },

    closestPointLength: function(p) {

        var points = this.lengthPoints();
        var numPoints = points.length;
        if (numPoints === 0) return 0; // if points array is empty
        if (numPoints === 1) return 0; // if there is only one point

        var cpLength;
        var minSqrDistance = Infinity;
        var length = 0;
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {

            var line = new Line(points[i], points[i + 1]);
            var lineLength = line.length();

            var cpNormalizedLength = line.closestPointNormalizedLength(p);
            var cp = line.pointAt(cpNormalizedLength);

            var sqrDistance = cp.squaredDistance(p);
            if (sqrDistance < minSqrDistance) {
                minSqrDistance = sqrDistance;
                cpLength = length + (cpNormalizedLength * lineLength);
            }

            length += lineLength;
        }

        return cpLength;
    },

    closestPointNormalizedLength: function(p) {

        var cpLength = this.closestPointLength(p);
        if (cpLength === 0) return 0; // shortcut

        var length = this.length();
        if (length === 0) return 0; // prevents division by zero

        return cpLength / length;
    },

    closestPointTangent: function(p) {

        var cpLength = this.closestPointLength(p);

        return this.tangentAtLength(cpLength);
    },

    // Returns `true` if the area surrounded by the polyline contains the point `p`.
    // Implements the even-odd SVG algorithm (self-intersections are "outside").
    // (Uses horizontal rays to the right of `p` to look for intersections.)
    // Closes open polylines (always imagines a final closing segment).
    containsPoint: function(p) {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return false; // shortcut (this polyline has no points)

        var x = p.x;
        var y = p.y;

        // initialize a final closing segment by creating one from last-first points on polyline
        var startIndex = numPoints - 1; // start of current polyline segment
        var endIndex = 0; // end of current polyline segment
        var numIntersections = 0;
        var segment = new Line();
        var ray = new Line();
        var rayEnd = new Point();
        for (; endIndex < numPoints; endIndex++) {
            var start = points[startIndex];
            var end = points[endIndex];
            if (p.equals(start)) return true; // shortcut (`p` is a point on polyline)
            // current polyline segment
            segment.start = start;
            segment.end = end;
            if (segment.containsPoint(p)) return true; // shortcut (`p` lies on a polyline segment)

            // do we have an intersection?
            if (((y <= start.y) && (y > end.y)) || ((y > start.y) && (y <= end.y))) {
                // this conditional branch IS NOT entered when `segment` is collinear/coincident with `ray`
                // (when `y === start.y === end.y`)
                // this conditional branch IS entered when `segment` touches `ray` at only one point
                // (e.g. when `y === start.y !== end.y`)
                // since this branch is entered again for the following segment, the two touches cancel out

                var xDifference = (((start.x - x) > (end.x - x)) ? (start.x - x) : (end.x - x));
                if (xDifference >= 0) {
                    // segment lies at least partially to the right of `p`
                    rayEnd.x = x + xDifference;
                    rayEnd.y = y; // right
                    ray.start = p;
                    ray.end = rayEnd;
                    if (segment.intersect(ray)) {
                        // an intersection was detected to the right of `p`
                        numIntersections++;
                    }
                } // else: `segment` lies completely to the left of `p` (i.e. no intersection to the right)
            }

            // move to check the next polyline segment
            startIndex = endIndex;
        }

        // returns `true` for odd numbers of intersections (even-odd algorithm)
        return ((numIntersections % 2) === 1);
    },

    close: function() {
        const { start, end, points } = this;
        if (start && end && !start.equals(end)) {
            points.push(start.clone());
        }
        return this;
    },

    lengthPoints: function() {
        return this.points;
    },

    convexHull: function() {
        return new Polyline(convexHull(this.points));
    },

    // Checks whether two polylines are exactly the same.
    // If `p` is undefined or null, returns false.
    equals: function(p) {

        if (!p) return false;

        var points = this.points;
        var otherPoints = p.points;

        var numPoints = points.length;
        if (otherPoints.length !== numPoints) return false; // if the two polylines have different number of points, they cannot be equal

        for (var i = 0; i < numPoints; i++) {

            var point = points[i];
            var otherPoint = p.points[i];

            // as soon as an inequality is found in points, return false
            if (!point.equals(otherPoint)) return false;
        }

        // if no inequality found in points, return true
        return true;
    },

    intersectionWithLine: function(l) {
        var line = new Line(l);
        var intersections = [];
        var points = this.lengthPoints();
        var l2 = new Line();
        for (var i = 0, n = points.length - 1; i < n; i++) {
            l2.start = points[i];
            l2.end = points[i + 1];
            var int = line.intersectionWithLine(l2);
            if (int) intersections.push(int[0]);
        }
        return (intersections.length > 0) ? intersections : null;
    },

    isDifferentiable: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return false;

        var line = new Line();
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {
            line.start = points[i];
            line.end = points[i + 1];
            // as soon as a differentiable line is found between two points, return true
            if (line.isDifferentiable()) return true;
        }

        // if no differentiable line is found between pairs of points, return false
        return false;
    },

    length: function() {

        var points = this.lengthPoints();
        var numPoints = points.length;
        if (numPoints === 0) return 0; // if points array is empty

        var length = 0;
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {
            length += points[i].distance(points[i + 1]);
        }

        return length;
    },

    pointAt: function(ratio) {

        var points = this.lengthPoints();
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty
        if (numPoints === 1) return points[0].clone(); // if there is only one point

        if (ratio <= 0) return points[0].clone();
        if (ratio >= 1) return points[numPoints - 1].clone();

        var polylineLength = this.length();
        var length = polylineLength * ratio;

        return this.pointAtLength(length);
    },

    pointAtLength: function(length) {

        var points = this.lengthPoints();
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty
        if (numPoints === 1) return points[0].clone(); // if there is only one point

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        var l = 0;
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {
            var index = (fromStart ? i : (n - 1 - i));

            var a = points[index];
            var b = points[index + 1];
            var line = new Line(a, b);
            var d = a.distance(b);

            if (length <= (l + d)) {
                return line.pointAtLength((fromStart ? 1 : -1) * (length - l));
            }

            l += d;
        }

        // if length requested is higher than the length of the polyline, return last endpoint
        var lastPoint = (fromStart ? points[numPoints - 1] : points[0]);
        return lastPoint.clone();
    },

    round: function(precision) {

        var points = this.points;
        var numPoints = points.length;

        for (var i = 0; i < numPoints; i++) {
            points[i].round(precision);
        }

        return this;
    },

    scale: function(sx, sy, origin) {

        var points = this.points;
        var numPoints = points.length;

        for (var i = 0; i < numPoints; i++) {
            points[i].scale(sx, sy, origin);
        }

        return this;
    },

    simplify: function(opt = {}) {

        const points = this.points;
        if (points.length < 3) return this; // we need at least 3 points

        // TODO: we may also accept startIndex and endIndex to specify where to start and end simplification

        // Due to the nature of the algorithm, we do not use 0 as the default value for `threshold`
        // because of the rounding errors that can occur when comparing distances.
        const threshold = opt.threshold || 1e-10; // = max distance of middle point from chord to be simplified

        // start at the beginning of the polyline and go forward
        let currentIndex = 0;
        // we need at least one intermediate point (3 points) in every iteration
        // as soon as that stops being true, we know we reached the end of the polyline
        while (points[currentIndex + 2]) {
            const firstIndex = currentIndex;
            const middleIndex = (currentIndex + 1);
            const lastIndex = (currentIndex + 2);

            const firstPoint = points[firstIndex];
            const middlePoint = points[middleIndex];
            const lastPoint = points[lastIndex];

            const chord = new Line(firstPoint, lastPoint); // = connection between first and last point
            const closestPoint = chord.closestPoint(middlePoint); // = closest point on chord from middle point
            const closestPointDistance = closestPoint.distance(middlePoint);
            if (closestPointDistance <= threshold) {
                // middle point is close enough to the chord = simplify
                // 1) remove middle point:
                points.splice(middleIndex, 1);
                // 2) in next iteration, investigate the newly-created triplet of points
                //    - do not change `currentIndex`
                //    = (first point stays, point after removed point becomes middle point)
            } else {
                // middle point is far from the chord
                // 1) preserve middle point
                // 2) in next iteration, move `currentIndex` by one step:
                currentIndex += 1;
                //    = (point after first point becomes first point)
            }
        }

        // `points` array was modified in-place
        return this;
    },

    tangentAt: function(ratio) {

        var points = this.lengthPoints();
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty
        if (numPoints === 1) return null; // if there is only one point

        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;

        var polylineLength = this.length();
        var length = polylineLength * ratio;

        return this.tangentAtLength(length);
    },

    tangentAtLength: function(length) {

        var points = this.lengthPoints();
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty
        if (numPoints === 1) return null; // if there is only one point

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        var lastValidLine; // differentiable (with a tangent)
        var l = 0; // length so far
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {
            var index = (fromStart ? i : (n - 1 - i));

            var a = points[index];
            var b = points[index + 1];
            var line = new Line(a, b);
            var d = a.distance(b);

            if (line.isDifferentiable()) { // has a tangent line (line length is not 0)
                if (length <= (l + d)) {
                    return line.tangentAtLength((fromStart ? 1 : -1) * (length - l));
                }

                lastValidLine = line;
            }

            l += d;
        }

        // if length requested is higher than the length of the polyline, return last valid endpoint
        if (lastValidLine) {
            var ratio = (fromStart ? 1 : 0);
            return lastValidLine.tangentAt(ratio);
        }

        // if no valid line, return null
        return null;
    },

    toString: function() {

        return this.points + '';
    },

    translate: function(tx, ty) {

        var points = this.points;
        var numPoints = points.length;

        for (var i = 0; i < numPoints; i++) {
            points[i].translate(tx, ty);
        }

        return this;
    },

    // Return svgString that can be used to recreate this line.
    serialize: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return ''; // if points array is empty

        var output = '';
        for (var i = 0; i < numPoints; i++) {

            var point = points[i];
            output += point.x + ',' + point.y + ' ';
        }

        return output.trim();
    }
};

Object.defineProperty(Polyline.prototype, 'start', {
    // Getter for the first point of the polyline.

    configurable: true,

    enumerable: true,

    get: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty

        return this.points[0];
    },
});

Object.defineProperty(Polyline.prototype, 'end', {
    // Getter for the last point of the polyline.

    configurable: true,

    enumerable: true,

    get: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty

        return this.points[numPoints - 1];
    },
});

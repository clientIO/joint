import { Point } from './point.mjs';
import { Rect } from './rect.mjs';
import { Line } from './line.mjs';
import { Polyline } from './polyline.mjs';
import { types } from './types.mjs';

const {
    abs,
    sqrt,
    min,
    max,
    pow
} = Math;

export const Curve = function(p1, p2, p3, p4) {

    if (!(this instanceof Curve)) {
        return new Curve(p1, p2, p3, p4);
    }

    if (p1 instanceof Curve) {
        return new Curve(p1.start, p1.controlPoint1, p1.controlPoint2, p1.end);
    }

    this.start = new Point(p1);
    this.controlPoint1 = new Point(p2);
    this.controlPoint2 = new Point(p3);
    this.end = new Point(p4);
};

// Curve passing through points.
// Ported from C# implementation by Oleg V. Polikarpotchkin and Peter Lee (http://www.codeproject.com/KB/graphics/BezierSpline.aspx).
// @param {array} points Array of points through which the smooth line will go.
// @return {array} curves.
Curve.throughPoints = (function() {

    // Get open-ended Bezier Spline Control Points.
    // @param knots Input Knot Bezier spline points (At least two points!).
    // @param firstControlPoints Output First Control points. Array of knots.length - 1 length.
    // @param secondControlPoints Output Second Control points. Array of knots.length - 1 length.
    function getCurveControlPoints(knots) {

        var firstControlPoints = [];
        var secondControlPoints = [];
        var n = knots.length - 1;
        var i;

        // Special case: Bezier curve should be a straight line.
        if (n == 1) {
            // 3P1 = 2P0 + P3
            firstControlPoints[0] = new Point(
                (2 * knots[0].x + knots[1].x) / 3,
                (2 * knots[0].y + knots[1].y) / 3
            );

            // P2 = 2P1 – P0
            secondControlPoints[0] = new Point(
                2 * firstControlPoints[0].x - knots[0].x,
                2 * firstControlPoints[0].y - knots[0].y
            );

            return [firstControlPoints, secondControlPoints];
        }

        // Calculate first Bezier control points.
        // Right hand side vector.
        var rhs = [];

        // Set right hand side X values.
        for (i = 1; i < n - 1; i++) {
            rhs[i] = 4 * knots[i].x + 2 * knots[i + 1].x;
        }

        rhs[0] = knots[0].x + 2 * knots[1].x;
        rhs[n - 1] = (8 * knots[n - 1].x + knots[n].x) / 2.0;

        // Get first control points X-values.
        var x = getFirstControlPoints(rhs);

        // Set right hand side Y values.
        for (i = 1; i < n - 1; ++i) {
            rhs[i] = 4 * knots[i].y + 2 * knots[i + 1].y;
        }

        rhs[0] = knots[0].y + 2 * knots[1].y;
        rhs[n - 1] = (8 * knots[n - 1].y + knots[n].y) / 2.0;

        // Get first control points Y-values.
        var y = getFirstControlPoints(rhs);

        // Fill output arrays.
        for (i = 0; i < n; i++) {
            // First control point.
            firstControlPoints.push(new Point(x[i], y[i]));

            // Second control point.
            if (i < n - 1) {
                secondControlPoints.push(new Point(
                    2 * knots [i + 1].x - x[i + 1],
                    2 * knots[i + 1].y - y[i + 1]
                ));

            } else {
                secondControlPoints.push(new Point(
                    (knots[n].x + x[n - 1]) / 2,
                    (knots[n].y + y[n - 1]) / 2
                ));
            }
        }

        return [firstControlPoints, secondControlPoints];
    }

    // Solves a tridiagonal system for one of coordinates (x or y) of first Bezier control points.
    // @param rhs Right hand side vector.
    // @return Solution vector.
    function getFirstControlPoints(rhs) {

        var n = rhs.length;
        // `x` is a solution vector.
        var x = [];
        var tmp = [];
        var b = 2.0;

        x[0] = rhs[0] / b;

        // Decomposition and forward substitution.
        for (var i = 1; i < n; i++) {
            tmp[i] = 1 / b;
            b = (i < n - 1 ? 4.0 : 3.5) - tmp[i];
            x[i] = (rhs[i] - x[i - 1]) / b;
        }

        for (i = 1; i < n; i++) {
            // Backsubstitution.
            x[n - i - 1] -= tmp[n - i] * x[n - i];
        }

        return x;
    }

    return function(points) {

        if (!points || (Array.isArray(points) && points.length < 2)) {
            throw new Error('At least 2 points are required');
        }

        var controlPoints = getCurveControlPoints(points);

        var curves = [];
        var n = controlPoints[0].length;
        for (var i = 0; i < n; i++) {

            var controlPoint1 = new Point(controlPoints[0][i].x, controlPoints[0][i].y);
            var controlPoint2 = new Point(controlPoints[1][i].x, controlPoints[1][i].y);

            curves.push(new Curve(points[i], controlPoint1, controlPoint2, points[i + 1]));
        }

        return curves;
    };
})();

Curve.prototype = {

    type: types.Curve,

    // Returns a bbox that tightly envelops the curve.
    bbox: function() {

        var start = this.start;
        var controlPoint1 = this.controlPoint1;
        var controlPoint2 = this.controlPoint2;
        var end = this.end;

        var x0 = start.x;
        var y0 = start.y;
        var x1 = controlPoint1.x;
        var y1 = controlPoint1.y;
        var x2 = controlPoint2.x;
        var y2 = controlPoint2.y;
        var x3 = end.x;
        var y3 = end.y;

        var points = new Array(); // local extremes
        var tvalues = new Array(); // t values of local extremes
        var bounds = [new Array(), new Array()];

        var a, b, c, t;
        var t1, t2;
        var b2ac, sqrtb2ac;

        for (var i = 0; i < 2; ++i) {

            if (i === 0) {
                b = 6 * x0 - 12 * x1 + 6 * x2;
                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * x0;

            } else {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }

            if (abs(a) < 1e-12) { // Numerical robustness
                if (abs(b) < 1e-12) { // Numerical robustness
                    continue;
                }

                t = -c / b;
                if ((0 < t) && (t < 1)) tvalues.push(t);

                continue;
            }

            b2ac = b * b - 4 * c * a;
            sqrtb2ac = sqrt(b2ac);

            if (b2ac < 0) continue;

            t1 = (-b + sqrtb2ac) / (2 * a);
            if ((0 < t1) && (t1 < 1)) tvalues.push(t1);

            t2 = (-b - sqrtb2ac) / (2 * a);
            if ((0 < t2) && (t2 < 1)) tvalues.push(t2);
        }

        var j = tvalues.length;
        var jlen = j;
        var mt;
        var x, y;

        while (j--) {
            t = tvalues[j];
            mt = 1 - t;

            x = (mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) + (t * t * t * x3);
            bounds[0][j] = x;

            y = (mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) + (t * t * t * y3);
            bounds[1][j] = y;

            points[j] = { X: x, Y: y };
        }

        tvalues[jlen] = 0;
        tvalues[jlen + 1] = 1;

        points[jlen] = { X: x0, Y: y0 };
        points[jlen + 1] = { X: x3, Y: y3 };

        bounds[0][jlen] = x0;
        bounds[1][jlen] = y0;

        bounds[0][jlen + 1] = x3;
        bounds[1][jlen + 1] = y3;

        tvalues.length = jlen + 2;
        bounds[0].length = jlen + 2;
        bounds[1].length = jlen + 2;
        points.length = jlen + 2;

        var left = min.apply(null, bounds[0]);
        var top = min.apply(null, bounds[1]);
        var right = max.apply(null, bounds[0]);
        var bottom = max.apply(null, bounds[1]);

        return new Rect(left, top, (right - left), (bottom - top));
    },

    clone: function() {

        return new Curve(this.start, this.controlPoint1, this.controlPoint2, this.end);
    },

    // Returns the point on the curve closest to point `p`
    closestPoint: function(p, opt) {

        return this.pointAtT(this.closestPointT(p, opt));
    },

    closestPointLength: function(p, opt) {

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var subdivisions = (opt.subdivisions === undefined) ? this.getSubdivisions({ precision: precision }) : opt.subdivisions;
        var localOpt = { precision: precision, subdivisions: subdivisions };

        return this.lengthAtT(this.closestPointT(p, localOpt), localOpt);
    },

    closestPointNormalizedLength: function(p, opt) {

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var subdivisions = (opt.subdivisions === undefined) ? this.getSubdivisions({ precision: precision }) : opt.subdivisions;
        var localOpt = { precision: precision, subdivisions: subdivisions };

        var cpLength = this.closestPointLength(p, localOpt);
        if (!cpLength) return 0;

        var length = this.length(localOpt);
        if (length === 0) return 0;

        return cpLength / length;
    },

    // Returns `t` of the point on the curve closest to point `p`
    closestPointT: function(p, opt) {

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var subdivisions = (opt.subdivisions === undefined) ? this.getSubdivisions({ precision: precision }) : opt.subdivisions;
        // does not use localOpt

        // identify the subdivision that contains the point:
        var investigatedSubdivision;
        var investigatedSubdivisionStartT; // assume that subdivisions are evenly spaced
        var investigatedSubdivisionEndT;
        var distFromStart; // distance of point from start of baseline
        var distFromEnd; // distance of point from end of baseline
        var chordLength; // distance between start and end of the subdivision
        var minSumDist; // lowest observed sum of the two distances
        var n = subdivisions.length;
        var subdivisionSize = (n ? (1 / n) : 0);
        for (var i = 0; i < n; i++) {

            var currentSubdivision = subdivisions[i];

            var startDist = currentSubdivision.start.distance(p);
            var endDist = currentSubdivision.end.distance(p);
            var sumDist = startDist + endDist;

            // check that the point is closest to current subdivision and not any other
            if (!minSumDist || (sumDist < minSumDist)) {
                investigatedSubdivision = currentSubdivision;

                investigatedSubdivisionStartT = i * subdivisionSize;
                investigatedSubdivisionEndT = (i + 1) * subdivisionSize;

                distFromStart = startDist;
                distFromEnd = endDist;

                chordLength = currentSubdivision.start.distance(currentSubdivision.end);

                minSumDist = sumDist;
            }
        }

        var precisionRatio = pow(10, -precision);

        // recursively divide investigated subdivision:
        // until distance between baselinePoint and closest path endpoint is within 10^(-precision)
        // then return the closest endpoint of that final subdivision
        while (true) {

            // check if we have reached at least one required observed precision
            // - calculated as: the difference in distances from point to start and end divided by the distance
            // - note that this function is not monotonic = it doesn't converge stably but has "teeth"
            // - the function decreases while one of the endpoints is fixed but "jumps" whenever we switch
            // - this criterion works well for points lying far away from the curve
            var startPrecisionRatio = (distFromStart ? (abs(distFromStart - distFromEnd) / distFromStart) : 0);
            var endPrecisionRatio = (distFromEnd ? (abs(distFromStart - distFromEnd) / distFromEnd) : 0);
            var hasRequiredPrecision = ((startPrecisionRatio < precisionRatio) || (endPrecisionRatio < precisionRatio));

            // check if we have reached at least one required minimal distance
            // - calculated as: the subdivision chord length multiplied by precisionRatio
            // - calculation is relative so it will work for arbitrarily large/small curves and their subdivisions
            // - this is a backup criterion that works well for points lying "almost at" the curve
            var hasMinimalStartDistance = (distFromStart ? (distFromStart < (chordLength * precisionRatio)) : true);
            var hasMinimalEndDistance = (distFromEnd ? (distFromEnd < (chordLength * precisionRatio)) : true);
            var hasMinimalDistance = (hasMinimalStartDistance || hasMinimalEndDistance);

            // do we stop now?
            if (hasRequiredPrecision || hasMinimalDistance) {
                return ((distFromStart <= distFromEnd) ? investigatedSubdivisionStartT : investigatedSubdivisionEndT);
            }

            // otherwise, set up for next iteration
            var divided = investigatedSubdivision.divide(0.5);
            subdivisionSize /= 2;

            var startDist1 = divided[0].start.distance(p);
            var endDist1 = divided[0].end.distance(p);
            var sumDist1 = startDist1 + endDist1;

            var startDist2 = divided[1].start.distance(p);
            var endDist2 = divided[1].end.distance(p);
            var sumDist2 = startDist2 + endDist2;

            if (sumDist1 <= sumDist2) {
                investigatedSubdivision = divided[0];

                investigatedSubdivisionEndT -= subdivisionSize; // subdivisionSize was already halved

                distFromStart = startDist1;
                distFromEnd = endDist1;

            } else {
                investigatedSubdivision = divided[1];

                investigatedSubdivisionStartT += subdivisionSize; // subdivisionSize was already halved

                distFromStart = startDist2;
                distFromEnd = endDist2;
            }
        }
    },

    closestPointTangent: function(p, opt) {

        return this.tangentAtT(this.closestPointT(p, opt));
    },

    // Returns `true` if the area surrounded by the curve contains the point `p`.
    // Implements the even-odd algorithm (self-intersections are "outside").
    // Closes open curves (always imagines a closing segment).
    // Precision may be adjusted by passing an `opt` object.
    containsPoint: function(p, opt) {

        var polyline = this.toPolyline(opt);
        return polyline.containsPoint(p);
    },

    // Divides the curve into two at requested `ratio` between 0 and 1 with precision better than `opt.precision`; optionally using `opt.subdivisions` provided.
    // For a function that uses `t`, use Curve.divideAtT().
    divideAt: function(ratio, opt) {

        if (ratio <= 0) return this.divideAtT(0);
        if (ratio >= 1) return this.divideAtT(1);

        var t = this.tAt(ratio, opt);

        return this.divideAtT(t);
    },

    // Divides the curve into two at requested `length` with precision better than requested `opt.precision`; optionally using `opt.subdivisions` provided.
    divideAtLength: function(length, opt) {

        var t = this.tAtLength(length, opt);

        return this.divideAtT(t);
    },

    // Divides the curve into two at point defined by `t` between 0 and 1.
    // Using de Casteljau's algorithm (http://math.stackexchange.com/a/317867).
    // Additional resource: https://pomax.github.io/bezierinfo/#decasteljau
    divideAtT: function(t) {

        var start = this.start;
        var controlPoint1 = this.controlPoint1;
        var controlPoint2 = this.controlPoint2;
        var end = this.end;

        // shortcuts for `t` values that are out of range
        if (t <= 0) {
            return [
                new Curve(start, start, start, start),
                new Curve(start, controlPoint1, controlPoint2, end)
            ];
        }

        if (t >= 1) {
            return [
                new Curve(start, controlPoint1, controlPoint2, end),
                new Curve(end, end, end, end)
            ];
        }

        var dividerPoints = this.getSkeletonPoints(t);

        var startControl1 = dividerPoints.startControlPoint1;
        var startControl2 = dividerPoints.startControlPoint2;
        var divider = dividerPoints.divider;
        var dividerControl1 = dividerPoints.dividerControlPoint1;
        var dividerControl2 = dividerPoints.dividerControlPoint2;

        // return array with two new curves
        return [
            new Curve(start, startControl1, startControl2, divider),
            new Curve(divider, dividerControl1, dividerControl2, end)
        ];
    },

    // Returns the distance between the curve's start and end points.
    endpointDistance: function() {

        return this.start.distance(this.end);
    },

    // Checks whether two curves are exactly the same.
    equals: function(c) {

        return !!c &&
            this.start.x === c.start.x &&
            this.start.y === c.start.y &&
            this.controlPoint1.x === c.controlPoint1.x &&
            this.controlPoint1.y === c.controlPoint1.y &&
            this.controlPoint2.x === c.controlPoint2.x &&
            this.controlPoint2.y === c.controlPoint2.y &&
            this.end.x === c.end.x &&
            this.end.y === c.end.y;
    },

    // Returns five helper points necessary for curve division.
    getSkeletonPoints: function(t) {

        var start = this.start;
        var control1 = this.controlPoint1;
        var control2 = this.controlPoint2;
        var end = this.end;

        // shortcuts for `t` values that are out of range
        if (t <= 0) {
            return {
                startControlPoint1: start.clone(),
                startControlPoint2: start.clone(),
                divider: start.clone(),
                dividerControlPoint1: control1.clone(),
                dividerControlPoint2: control2.clone()
            };
        }

        if (t >= 1) {
            return {
                startControlPoint1: control1.clone(),
                startControlPoint2: control2.clone(),
                divider: end.clone(),
                dividerControlPoint1: end.clone(),
                dividerControlPoint2: end.clone()
            };
        }

        var midpoint1 = (new Line(start, control1)).pointAt(t);
        var midpoint2 = (new Line(control1, control2)).pointAt(t);
        var midpoint3 = (new Line(control2, end)).pointAt(t);

        var subControl1 = (new Line(midpoint1, midpoint2)).pointAt(t);
        var subControl2 = (new Line(midpoint2, midpoint3)).pointAt(t);

        var divider = (new Line(subControl1, subControl2)).pointAt(t);

        var output = {
            startControlPoint1: midpoint1,
            startControlPoint2: subControl1,
            divider: divider,
            dividerControlPoint1: subControl2,
            dividerControlPoint2: midpoint3
        };

        return output;
    },

    // Returns a list of curves whose flattened length is better than `opt.precision`.
    // That is, observed difference in length between recursions is less than 10^(-3) = 0.001 = 0.1%
    // (Observed difference is not real precision, but close enough as long as special cases are covered)
    // As a rule of thumb, increasing `precision` by 1 requires 2 more iterations (= levels of division operations)
    // - Precision 0 (endpointDistance) - 0 iterations => total of 2^0 - 1 = 0 operations (1 subdivision)
    // - Precision 1 (<10% error) - 2 iterations => total of 2^2 - 1 = 3 operations (4 subdivisions)
    // - Precision 2 (<1% error) - 4 iterations => total of 2^4 - 1 = 15 operations requires 4 division operations on all elements (15 operations total) (16 subdivisions)
    // - Precision 3 (<0.1% error) - 6 iterations => total of 2^6 - 1 = 63 operations - acceptable when drawing (64 subdivisions)
    // - Precision 4 (<0.01% error) - 8 iterations => total of 2^8 - 1 = 255 operations - high resolution, can be used to interpolate `t` (256 subdivisions)
    // (Variation of 1 recursion worse or better is possible depending on the curve, doubling/halving the number of operations accordingly)
    getSubdivisions: function(opt) {

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        // not using opt.subdivisions
        // not using localOpt

        var start = this.start;
        var control1 = this.controlPoint1;
        var control2 = this.controlPoint2;
        var end = this.end;

        var subdivisions = [new Curve(start, control1, control2, end)];
        if (precision === 0) return subdivisions;

        // special case #1: point-like curves
        // - no need to calculate subdivisions, they would all be identical
        var isPoint = !this.isDifferentiable();
        if (isPoint) return subdivisions;

        var previousLength = this.endpointDistance();

        var precisionRatio = pow(10, -precision);

        // special case #2: sine-like curves may have the same observed length in iteration 0 and 1 - skip iteration 1
        // - not a problem for further iterations because cubic curves cannot have more than two local extrema
        // - (i.e. cubic curves cannot intersect the baseline more than once)
        // - therefore starting from iteration = 2 ensures that subsequent iterations do not produce sampling with equal length
        // - (unless it's a straight-line curve, see below)
        var minIterations = 2; // = 2*1

        // special case #3: straight-line curves have the same observed length in all iterations
        // - this causes observed precision ratio to always be 0 (= lower than `precisionRatio`, which is our exit condition)
        // - we enforce the expected number of iterations = 2 * precision
        var isLine = ((control1.cross(start, end) === 0) && (control2.cross(start, end) === 0));
        if (isLine) {
            minIterations = (2 * precision);
        }

        // recursively divide curve at `t = 0.5`
        // until we reach `minIterations`
        // and until the difference between observed length at subsequent iterations is lower than `precision`
        var iteration = 0;
        while (true) {
            iteration += 1;

            // divide all subdivisions
            var newSubdivisions = [];
            var numSubdivisions = subdivisions.length;
            for (var i = 0; i < numSubdivisions; i++) {

                var currentSubdivision = subdivisions[i];
                var divided = currentSubdivision.divide(0.5); // dividing at t = 0.5 (not at middle length!)
                newSubdivisions.push(divided[0], divided[1]);
            }

            // measure new length
            var length = 0;
            var numNewSubdivisions = newSubdivisions.length;
            for (var j = 0; j < numNewSubdivisions; j++) {

                var currentNewSubdivision = newSubdivisions[j];
                length += currentNewSubdivision.endpointDistance();
            }

            // check if we have reached minimum number of iterations
            if (iteration >= minIterations) {

                // check if we have reached required observed precision
                var observedPrecisionRatio = ((length !== 0) ? ((length - previousLength) / length) : 0);
                if (observedPrecisionRatio < precisionRatio) {
                    return newSubdivisions;
                }
            }

            // otherwise, set up for next iteration
            subdivisions = newSubdivisions;
            previousLength = length;
        }
    },

    isDifferentiable: function() {

        var start = this.start;
        var control1 = this.controlPoint1;
        var control2 = this.controlPoint2;
        var end = this.end;

        return !(start.equals(control1) && control1.equals(control2) && control2.equals(end));
    },

    // Returns flattened length of the curve with precision better than `opt.precision`; or using `opt.subdivisions` provided.
    length: function(opt) {

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision; // opt.precision only used in getSubdivisions() call
        var subdivisions = (opt.subdivisions === undefined) ? this.getSubdivisions({ precision: precision }) : opt.subdivisions;
        // not using localOpt

        var length = 0;
        var n = subdivisions.length;
        for (var i = 0; i < n; i++) {

            var currentSubdivision = subdivisions[i];
            length += currentSubdivision.endpointDistance();
        }

        return length;
    },

    // Returns distance along the curve up to `t` with precision better than requested `opt.precision`. (Not using `opt.subdivisions`.)
    lengthAtT: function(t, opt) {

        if (t <= 0) return 0;

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        // not using opt.subdivisions
        // not using localOpt

        var subCurve = this.divide(t)[0];
        var subCurveLength = subCurve.length({ precision: precision });

        return subCurveLength;
    },

    // Returns point at requested `ratio` between 0 and 1 with precision better than `opt.precision`; optionally using `opt.subdivisions` provided.
    // Mirrors Line.pointAt() function.
    // For a function that tracks `t`, use Curve.pointAtT().
    pointAt: function(ratio, opt) {

        if (ratio <= 0) return this.start.clone();
        if (ratio >= 1) return this.end.clone();

        var t = this.tAt(ratio, opt);

        return this.pointAtT(t);
    },

    // Returns point at requested `length` with precision better than requested `opt.precision`; optionally using `opt.subdivisions` provided.
    pointAtLength: function(length, opt) {

        var t = this.tAtLength(length, opt);

        return this.pointAtT(t);
    },

    // Returns the point at provided `t` between 0 and 1.
    // `t` does not track distance along curve as it does in Line objects.
    // Non-linear relationship, speeds up and slows down as curve warps!
    // For linear length-based solution, use Curve.pointAt().
    pointAtT: function(t) {

        if (t <= 0) return this.start.clone();
        if (t >= 1) return this.end.clone();

        return this.getSkeletonPoints(t).divider;
    },

    // Default precision
    PRECISION: 3,

    round: function(precision) {

        this.start.round(precision);
        this.controlPoint1.round(precision);
        this.controlPoint2.round(precision);
        this.end.round(precision);
        return this;
    },

    scale: function(sx, sy, origin) {

        this.start.scale(sx, sy, origin);
        this.controlPoint1.scale(sx, sy, origin);
        this.controlPoint2.scale(sx, sy, origin);
        this.end.scale(sx, sy, origin);
        return this;
    },

    // Returns a tangent line at requested `ratio` with precision better than requested `opt.precision`; or using `opt.subdivisions` provided.
    tangentAt: function(ratio, opt) {

        if (!this.isDifferentiable()) return null;

        if (ratio < 0) ratio = 0;
        else if (ratio > 1) ratio = 1;

        var t = this.tAt(ratio, opt);

        return this.tangentAtT(t);
    },

    // Returns a tangent line at requested `length` with precision better than requested `opt.precision`; or using `opt.subdivisions` provided.
    tangentAtLength: function(length, opt) {

        if (!this.isDifferentiable()) return null;

        var t = this.tAtLength(length, opt);

        return this.tangentAtT(t);
    },

    // Returns a tangent line at requested `t`.
    tangentAtT: function(t) {

        if (!this.isDifferentiable()) return null;

        if (t < 0) t = 0;
        else if (t > 1) t = 1;

        var skeletonPoints = this.getSkeletonPoints(t);

        var p1 = skeletonPoints.startControlPoint2;
        var p2 = skeletonPoints.dividerControlPoint1;

        var tangentStart = skeletonPoints.divider;

        var tangentLine = new Line(p1, p2);
        tangentLine.translate(tangentStart.x - p1.x, tangentStart.y - p1.y); // move so that tangent line starts at the point requested

        return tangentLine;
    },

    // Returns `t` at requested `ratio` with precision better than requested `opt.precision`; optionally using `opt.subdivisions` provided.
    tAt: function(ratio, opt) {

        if (ratio <= 0) return 0;
        if (ratio >= 1) return 1;

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var subdivisions = (opt.subdivisions === undefined) ? this.getSubdivisions({ precision: precision }) : opt.subdivisions;
        var localOpt = { precision: precision, subdivisions: subdivisions };

        var curveLength = this.length(localOpt);
        var length = curveLength * ratio;

        return this.tAtLength(length, localOpt);
    },

    // Returns `t` at requested `length` with precision better than requested `opt.precision`; optionally using `opt.subdivisions` provided.
    // Uses `precision` to approximate length within `precision` (always underestimates)
    // Then uses a binary search to find the `t` of a subdivision endpoint that is close (within `precision`) to the `length`, if the curve was as long as approximated
    // As a rule of thumb, increasing `precision` by 1 causes the algorithm to go 2^(precision - 1) deeper
    // - Precision 0 (chooses one of the two endpoints) - 0 levels
    // - Precision 1 (chooses one of 5 points, <10% error) - 1 level
    // - Precision 2 (<1% error) - 3 levels
    // - Precision 3 (<0.1% error) - 7 levels
    // - Precision 4 (<0.01% error) - 15 levels
    tAtLength: function(length, opt) {

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var subdivisions = (opt.subdivisions === undefined) ? this.getSubdivisions({ precision: precision }) : opt.subdivisions;
        var localOpt = { precision: precision, subdivisions: subdivisions };

        // identify the subdivision that contains the point at requested `length`:
        var investigatedSubdivision;
        var investigatedSubdivisionStartT; // assume that subdivisions are evenly spaced
        var investigatedSubdivisionEndT;
        //var baseline; // straightened version of subdivision to investigate
        //var baselinePoint; // point on the baseline that is the requested distance away from start
        var baselinePointDistFromStart; // distance of baselinePoint from start of baseline
        var baselinePointDistFromEnd; // distance of baselinePoint from end of baseline
        var l = 0; // length so far
        var n = subdivisions.length;
        var subdivisionSize = 1 / n;
        for (var i = 0; i < n; i++) {
            var index = (fromStart ? i : (n - 1 - i));

            var currentSubdivision = subdivisions[i];
            var d = currentSubdivision.endpointDistance(); // length of current subdivision

            if (length <= (l + d)) {
                investigatedSubdivision = currentSubdivision;

                investigatedSubdivisionStartT = index * subdivisionSize;
                investigatedSubdivisionEndT = (index + 1) * subdivisionSize;

                baselinePointDistFromStart = (fromStart ? (length - l) : ((d + l) - length));
                baselinePointDistFromEnd = (fromStart ? ((d + l) - length) : (length - l));

                break;
            }

            l += d;
        }

        if (!investigatedSubdivision) return (fromStart ? 1 : 0); // length requested is out of range - return maximum t
        // note that precision affects what length is recorded
        // (imprecise measurements underestimate length by up to 10^(-precision) of the precise length)
        // e.g. at precision 1, the length may be underestimated by up to 10% and cause this function to return 1

        var curveLength = this.length(localOpt);

        var precisionRatio = pow(10, -precision);

        // recursively divide investigated subdivision:
        // until distance between baselinePoint and closest path endpoint is within 10^(-precision)
        // then return the closest endpoint of that final subdivision
        while (true) {

            // check if we have reached required observed precision
            var observedPrecisionRatio;

            observedPrecisionRatio = ((curveLength !== 0) ? (baselinePointDistFromStart / curveLength) : 0);
            if (observedPrecisionRatio < precisionRatio) return investigatedSubdivisionStartT;
            observedPrecisionRatio = ((curveLength !== 0) ? (baselinePointDistFromEnd / curveLength) : 0);
            if (observedPrecisionRatio < precisionRatio) return investigatedSubdivisionEndT;

            // otherwise, set up for next iteration
            var newBaselinePointDistFromStart;
            var newBaselinePointDistFromEnd;

            var divided = investigatedSubdivision.divide(0.5);
            subdivisionSize /= 2;

            var baseline1Length = divided[0].endpointDistance();
            var baseline2Length = divided[1].endpointDistance();

            if (baselinePointDistFromStart <= baseline1Length) { // point at requested length is inside divided[0]
                investigatedSubdivision = divided[0];

                investigatedSubdivisionEndT -= subdivisionSize; // sudivisionSize was already halved

                newBaselinePointDistFromStart = baselinePointDistFromStart;
                newBaselinePointDistFromEnd = baseline1Length - newBaselinePointDistFromStart;

            } else { // point at requested length is inside divided[1]
                investigatedSubdivision = divided[1];

                investigatedSubdivisionStartT += subdivisionSize; // subdivisionSize was already halved

                newBaselinePointDistFromStart = baselinePointDistFromStart - baseline1Length;
                newBaselinePointDistFromEnd = baseline2Length - newBaselinePointDistFromStart;
            }

            baselinePointDistFromStart = newBaselinePointDistFromStart;
            baselinePointDistFromEnd = newBaselinePointDistFromEnd;
        }
    },

    // Returns an array of points that represents the curve when flattened, up to `opt.precision`; or using `opt.subdivisions` provided.
    // Flattened length is no more than 10^(-precision) away from real curve length.
    toPoints: function(opt) {

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision; // opt.precision only used in getSubdivisions() call
        var subdivisions = (opt.subdivisions === undefined) ? this.getSubdivisions({ precision: precision }) : opt.subdivisions;
        // not using localOpt

        var points = [subdivisions[0].start.clone()];
        var n = subdivisions.length;
        for (var i = 0; i < n; i++) {

            var currentSubdivision = subdivisions[i];
            points.push(currentSubdivision.end.clone());
        }

        return points;
    },

    // Returns a polyline that represents the curve when flattened, up to `opt.precision`; or using `opt.subdivisions` provided.
    // Flattened length is no more than 10^(-precision) away from real curve length.
    toPolyline: function(opt) {

        return new Polyline(this.toPoints(opt));
    },

    toString: function() {

        return this.start + ' ' + this.controlPoint1 + ' ' + this.controlPoint2 + ' ' + this.end;
    },

    translate: function(tx, ty) {

        this.start.translate(tx, ty);
        this.controlPoint1.translate(tx, ty);
        this.controlPoint2.translate(tx, ty);
        this.end.translate(tx, ty);
        return this;
    }
};

Curve.prototype.divide = Curve.prototype.divideAtT;

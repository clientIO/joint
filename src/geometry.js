
//      Geometry library.

var g = (function() {

    var g = {};

    // Declare shorthands to the most used math functions.
    var math = Math;
    var abs = math.abs;
    var cos = math.cos;
    var sin = math.sin;
    var sqrt = math.sqrt;
    var mmin = math.min;
    var mmax = math.max;
    var atan2 = math.atan2;
    var round = math.round;
    var floor = math.floor;
    var PI = math.PI;
    var random = math.random;
    var pow = math.pow;

    g.bezier = {

        // Cubic Bezier curve path through points.
        // Ported from C# implementation by Oleg V. Polikarpotchkin and Peter Lee (http://www.codeproject.com/KB/graphics/BezierSpline.aspx).
        // @param {array} points Array of points through which the smooth line will go.
        // @return {array} SVG Path commands as an array
        curveThroughPoints: function(points) {

            var controlPoints = this.getCurveControlPoints(points);
            var path = ['M', points[0].x, points[0].y];

            for (var i = 0; i < controlPoints[0].length; i++) {
                path.push('C', controlPoints[0][i].x, controlPoints[0][i].y, controlPoints[1][i].x, controlPoints[1][i].y, points[i + 1].x, points[i + 1].y);
            }

            return path;
        },

        // Get open-ended Bezier Spline Control Points.
        // @param knots Input Knot Bezier spline points (At least two points!).
        // @param firstControlPoints Output First Control points. Array of knots.length - 1 length.
        // @param secondControlPoints Output Second Control points. Array of knots.length - 1 length.
        getCurveControlPoints: function(knots) {

            var firstControlPoints = [];
            var secondControlPoints = [];
            var n = knots.length - 1;
            var i;

            // Special case: Bezier curve should be a straight line.
            if (n == 1) {
                // 3P1 = 2P0 + P3
                firstControlPoints[0] = Point((2 * knots[0].x + knots[1].x) / 3,
                                              (2 * knots[0].y + knots[1].y) / 3);
                // P2 = 2P1 – P0
                secondControlPoints[0] = Point(2 * firstControlPoints[0].x - knots[0].x,
                                               2 * firstControlPoints[0].y - knots[0].y);
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
            var x = this.getFirstControlPoints(rhs);

            // Set right hand side Y values.
            for (i = 1; i < n - 1; ++i) {
                rhs[i] = 4 * knots[i].y + 2 * knots[i + 1].y;
            }
            rhs[0] = knots[0].y + 2 * knots[1].y;
            rhs[n - 1] = (8 * knots[n - 1].y + knots[n].y) / 2.0;
            // Get first control points Y-values.
            var y = this.getFirstControlPoints(rhs);

            // Fill output arrays.
            for (i = 0; i < n; i++) {
                // First control point.
                firstControlPoints.push(Point(x[i], y[i]));
                // Second control point.
                if (i < n - 1) {
                    secondControlPoints.push(Point(2 * knots [i + 1].x - x[i + 1],
                                                   2 * knots[i + 1].y - y[i + 1]));
                } else {
                    secondControlPoints.push(Point((knots[n].x + x[n - 1]) / 2,
                                                   (knots[n].y + y[n - 1]) / 2));
                }
            }
            return [firstControlPoints, secondControlPoints];
        },

        // Divide a Bezier curve into two at point defined by value 't' <0,1>.
        // Using deCasteljau algorithm. http://math.stackexchange.com/a/317867
        // @param control points (start, control start, control end, end)
        // @return a function accepts t and returns 2 curves each defined by 4 control points.
        getCurveDivider: function(p0, p1, p2, p3) {

            return function divideCurve(t) {

                var l = Line(p0, p1).pointAt(t);
                var m = Line(p1, p2).pointAt(t);
                var n = Line(p2, p3).pointAt(t);
                var p = Line(l, m).pointAt(t);
                var q = Line(m, n).pointAt(t);
                var r = Line(p, q).pointAt(t);
                return [{ p0: p0, p1: l, p2: p, p3: r }, { p0: r, p1: q, p2: n, p3: p3 }];
            };
        },

        // Solves a tridiagonal system for one of coordinates (x or y) of first Bezier control points.
        // @param rhs Right hand side vector.
        // @return Solution vector.
        getFirstControlPoints: function(rhs) {

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
        },

        // Solves an inversion problem -- Given the (x, y) coordinates of a point which lies on
        // a parametric curve x = x(t)/w(t), y = y(t)/w(t), ﬁnd the parameter value t
        // which corresponds to that point.
        // @param control points (start, control start, control end, end)
        // @return a function accepts a point and returns t.
        getInversionSolver: function(p0, p1, p2, p3) {

            var pts = arguments;
            function l(i, j) {
                // calculates a determinant 3x3
                // [p.x  p.y  1]
                // [pi.x pi.y 1]
                // [pj.x pj.y 1]
                var pi = pts[i];
                var pj = pts[j];
                return function(p) {
                    var w = (i % 3 ? 3 : 1) * (j % 3 ? 3 : 1);
                    var lij = p.x * (pi.y - pj.y) + p.y * (pj.x - pi.x) + pi.x * pj.y - pi.y * pj.x;
                    return w * lij;
                };
            }
            return function solveInversion(p) {
                var ct = 3 * l(2, 3)(p1);
                var c1 = l(1, 3)(p0) / ct;
                var c2 = -l(2, 3)(p0) / ct;
                var la = c1 * l(3, 1)(p) + c2 * (l(3, 0)(p) + l(2, 1)(p)) + l(2, 0)(p);
                var lb = c1 * l(3, 0)(p) + c2 * l(2, 0)(p) + l(1, 0)(p);
                return lb / (lb - la);
            };
        }
    };

    var Curve = g.Curve = function(p1, p2, p3, p4) {

        if (!(this instanceof Curve)) {
            return new Curve(p1, p2, p3, p4);
        }

        if (p1 instanceof Curve) {
            return Curve(p1.start, p1.controlPoint1, p1.controlPoint2, p1.end);
        }

        this.start = Point(p1);
        this.controlPoint1 = Point(p2);
        this.controlPoint2 = Point(p3);
        this.end = Point(p4);
    };

    Curve.prototype = {

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

            var left = mmin.apply(null, bounds[0]);
            var top = mmin.apply(null, bounds[1]);
            var right = mmax.apply(null, bounds[0]);
            var bottom = mmax.apply(null, bounds[1]);

            return Rect(left, top, (right - left), (bottom - top));
        },

        clone: function() {

            return Curve(this.start, this.controlPoint1, this.controlPoint2, this.end);
        },

        // Divides the curve into two at point defined by `t` between 0 and 1.
        // Using de Casteljau's algorithm (http://math.stackexchange.com/a/317867).
        // Additional resource: https://pomax.github.io/bezierinfo/#decasteljau
        divide: function(t) {

            var start = this.start;
            var end = this.end;

            // shortcuts for `t` values that are out of range
            if (t <= 0) return [Curve(start, start, start, start), this.clone()];
            else if (t >= 1) return [this.clone(), Curve(end, end, end, end)];

            var dividerPoints = this.getSkeletonPoints(t);

            var startControl1 = dividerPoints.startControlPoint1;
            var startControl2 = dividerPoints.startControlPoint2;
            var divider = dividerPoints.divider;
            var dividerControl1 = dividerPoints.dividerControlPoint1;
            var dividerControl2 = dividerPoints.dividerControlPoint2;

            // return array with two new curves
            return [Curve(start, startControl1, startControl2, divider), Curve(divider, dividerControl1, dividerControl2, end)];
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

            } else if (t >= 1) {
                return {
                    startControlPoint1: control1.clone(),
                    startControlPoint2: control2.clone(),
                    divider: end.clone(),
                    dividerControlPoint1: end.clone(),
                    dividerControlPoint2: end.clone()
                };
            }

            var midpoint1 = Line(start, control1).pointAt(t);
            var midpoint2 = Line(control1, control2).pointAt(t);
            var midpoint3 = Line(control2, end).pointAt(t);

            var subControl1 = Line(midpoint1, midpoint2).pointAt(t);
            var subControl2 = Line(midpoint2, midpoint3).pointAt(t);

            var divider = Line(subControl1, subControl2).pointAt(t);

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
        // (That is why skipping iteration 1 is important)
        // As a rule of thumb, increasing `precision` by 1 requires two more division operations
        // - Precision 0 (endpointDistance) - total of 2^0 - 1 = 0 operations (1 subdivision)
        // - Precision 1 (<10% error) - total of 2^2 - 1 = 3 operations (4 subdivisions)
        // - Precision 2 (<1% error) - total of 2^4 - 1 = 15 operations requires 4 division operations on all elements (15 operations total) (16 subdivisions)
        // - Precision 3 (<0.1% error) - total of 2^6 - 1 = 63 operations - acceptable when drawing (64 subdivisions)
        // - Precision 4 (<0.01% error) - total of 2^8 - 1 = 255 operations - high resolution, can be used to interpolate `t` (256 subdivisions)
        // (Variation of 1 recursion worse or better is possible depending on the curve, doubling/halving the number of operations accordingly)
        getSubdivisions: function(opt) {

            var iteration = 0;

            var subdivisions = [this.clone()];
            var previousLength = this.endpointDistance();

            opt = opt || {};
            var precision = opt.precision;
            if (precision === 0) return subdivisions;
            precision = precision || this.PRECISION; // assign PRECISION if precision undefined
            // not using opt.subdivisions

            var precisionRatio = pow(10, -precision);
            while (true) {
                iteration += 1;

                var currentSubdivision;

                // divide all subdivisions
                var newSubdivisions = [];
                var ii = subdivisions.length;
                for (var i = 0; i < ii; i++) {

                    currentSubdivision = subdivisions[i];
                    var divided = currentSubdivision.divide(0.5);
                    newSubdivisions.push(divided[0], divided[1]);
                }

                subdivisions = newSubdivisions;
                var length = 0;

                // measure new length
                var jj = subdivisions.length;
                for (var j = 0; j < jj; j++) {

                    currentSubdivision = subdivisions[j];
                    length += currentSubdivision.endpointDistance();
                }

                // check if we have reached required observed precision
                // sine-like curves may have the same observed length in iteration 0 and 1 - skip iteration 1
                // not a problem for further iterations because cubic curves cannot have more than two local extrema
                // (i.e. cubic curves cannot intersect the baseline more than once)
                // therefore two subsequent iterations cannot produce sampling with equal length
                var observedPrecisionRatio = (length - previousLength) / length;
                if (iteration > 1 && observedPrecisionRatio < precisionRatio) {
                    return subdivisions;
                }

                // otherwise, set up for next iteration
                previousLength = length;
            }
        },

        // Returns flattened length of the curve with precision better than `opt.precision`; or using `opt.subdivisions` provided.
        length: function(opt) {

            opt = opt || {};
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION; // assign PRECISION if precision undefined
            var subdivisions = opt.subdivisions || this.getSubdivisions({ precision: precision });

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
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION; // assign PRECISION if precision undefined
            // not using subdivisions - it is a different curve

            var subCurve = this.divide(t)[0];
            var subCurveLength = subCurve.length({ precision: precision });

            return subCurveLength;
        },

        // Returns point at requested `ratio` between 0 and 1 with precision better than `opt.precision`; optionally using `opt.subdivisions` provided.
        // Mirrors Line.pointAt() function.
        // For a function that tracks `t`, use Curve.pointAtT().
        pointAt: function(ratio, opt) {

            if (ratio <= 0) return this.start.clone();
            else if (ratio >= 1) return this.end.clone();

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

            if (t <= 0) return this.start;
            else if (t >= 1) return this.end;

            return this.getSkeletonPoints(t).divider;
        },

        // Default precision
        PRECISION: 2,

        scale: function(sx, sy, origin) {

            this.start.scale(sx, sy, origin);
            this.controlPoint1.scale(sx, sy, origin);
            this.controlPoint2.scale(sx, sy, origin);
            this.end.scale(sx, sy, origin);
            return this;
        },

        // Returns a tangent line at requested `ratio` with precision better than requested `opt.precision`; or using `opt.subdivisions` provided.
        tangentAt: function(ratio, opt) {

            if (ratio < 0) ratio = 0;
            else if (ratio > 1) ratio = 1;

            var t = this.tAt(ratio, opt);

            return this.tangentAtT(t);
        },

        // Returns a tangent line at requested `length` with precision better than requested `opt.precision`; or using `opt.subdivisions` provided.
        tangentAtLength: function(length, opt) {

            var t = this.tAtLength(length, opt);

            return this.tangentAtT(t);
        },

        // Returns a tangent line at requested `t`.
        tangentAtT: function(t) {

            if (t < 0) t = 0;
            else if (t > 1) t = 1;

            var skeletonPoints = this.getSkeletonPoints(t);

            var p1 = skeletonPoints.startControlPoint2;
            var p2 = skeletonPoints.dividerControlPoint1;

            if (p1.equals(p2)) return null; // if start and end are the same, we cannot know what the slope is (curve is a point)

            var tangentStart = skeletonPoints.divider;

            var tangentLine = Line(p1, p2);
            tangentLine.translate(tangentStart.x - p1.x, tangentStart.y - p1.y); // move so that tangent line starts at the point requested

            return tangentLine;
        },

        // Returns `t` at requested `ratio` with precision better than requested `opt.precision`; optionally using `opt.subdivisions` provided.
        tAt: function(ratio, opt) {

            if (ratio <= 0) return 0;
            else if (ratio >= 1) return 1;

            opt = opt || {};
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION;
            var subdivisions = opt.subdivisions || this.getSubdivisions({ precision: precision });

            var curveLength = this.length({ subdivisions: subdivisions });
            var length = curveLength * ratio;

            return this.tAtLength(length, { precision: precision, subdivisions: subdivisions });
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
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION; // assign PRECISION if precision undefined
            var subdivisions = opt.subdivisions || this.getSubdivisions({ precision: precision });

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
            for (var i = (fromStart ? (0) : (n - 1)); (fromStart ? (i < n) : (i >= 0)); (fromStart ? (i++) : (i--))) {

                var currentSubdivision = subdivisions[i];
                var d = currentSubdivision.endpointDistance();

                if (length <= (l + d)) {
                    investigatedSubdivision = currentSubdivision;

                    investigatedSubdivisionStartT = i * subdivisionSize;
                    investigatedSubdivisionEndT = (i + 1) * subdivisionSize;

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

            var curveLength = this.length({ subdivisions: subdivisions });

            // recursively divide investigated subdivision:
            // until distance between baselinePoint and closest path endpoint is within 10^(-precision)
            // then return the closest endpoint of that final subdivision
            var precisionRatio = pow(10, -precision);
            while (true) {

                // check if we have reached required observed precision
                var observedPrecisionRatio;

                observedPrecisionRatio = baselinePointDistFromStart / curveLength;
                if (observedPrecisionRatio < precisionRatio) return investigatedSubdivisionStartT;
                observedPrecisionRatio = baselinePointDistFromEnd / curveLength;
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

        // Returns `t` at given point `p`
        tAtPoint: function(p, opt) {

            opt = opt || {};
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION; // assign PRECISION if precision undefined
            var subdivisions = opt.subdivisions || this.getSubdivisions({ precision: precision });

            // identify the subdivision that contains the point:
            var investigatedSubdivision;
            var investigatedSubdivisionStartT; // assume that subdivisions are evenly spaced
            var investigatedSubdivisionEndT;
            var distFromStart; // distance of point from start of baseline
            var distFromEnd; // distance of point from end of baseline
            var minSumDist; // lowest observed sum of the two distances
            var n = subdivisions.length;
            var subdivisionSize = 1 / n;
            for (var i = 0; i < n; i++) {

                var currentSubdivision = subdivisions[i];
                var d = currentSubdivision.endpointDistance();

                var startDist = currentSubdivision.start.distance(p);
                var endDist = currentSubdivision.end.distance(p);
                var sumDist = startDist + endDist;

                // check that the point is close enough to either one of the endpoints to possibly lie on the curve
                // and check that the point is closest to current subdivision and not any other
                if (((startDist <= d) || (endDist <= d)) && (!minSumDist || (sumDist < minSumDist))) {
                    investigatedSubdivision = currentSubdivision;

                    investigatedSubdivisionStartT = i * subdivisionSize;
                    investigatedSubdivisionEndT = (i + 1) * subdivisionSize;

                    distFromStart = startDist;
                    distFromEnd = endDist;

                    minSumDist = sumDist;
                }
            }

            if (!investigatedSubdivision) return null; // the point is not close to the line

            var curveLength = this.length({ subdivisions: subdivisions });

            // recursively divide investigated subdivision:
            // until distance between baselinePoint and closest path endpoint is within 10^(-precision)
            // then return the closest endpoint of that final subdivision
            var precisionRatio = pow(10, -precision);
            while (true) {

                // check if we have reached required observed precision
                var observedPrecisionRatio;

                observedPrecisionRatio = distFromStart / curveLength;
                if (observedPrecisionRatio < precisionRatio) return investigatedSubdivisionStartT;
                observedPrecisionRatio = distFromEnd / curveLength;
                if (observedPrecisionRatio < precisionRatio) return investigatedSubdivisionEndT;

                // otherwise, set up for next iteration
                var divided = investigatedSubdivision.divide(0.5);
                subdivisionSize /= 2;

                var baseline1Length = divided[0].endpointDistance();
                var startDist1 = divided[0].start.distance(p);
                var endDist1 = divided[0].end.distance(p);
                var sumDist1 = null;

                if ((startDist1 <= baseline1Length) || (endDist1 <= baseline1Length)) {
                    sumDist1 = startDist1 + endDist1;
                }

                var baseline2Length = divided[1].endpointDistance();
                var startDist2 = divided[1].start.distance(p);
                var endDist2 = divided[1].end.distance(p);
                var sumDist2 = null;

                if ((startDist2 <= baseline2Length) || (endDist2 <= baseline2Length)) {
                    sumDist2 = startDist2 + endDist2;
                }

                if (!sumDist1 && !sumDist2) {
                    return null; // the point is not at all close to the subdivision
                }

                if ((sumDist1 && !sumDist2) || (sumDist1 && (sumDist1 <= sumDist2))) {
                    investigatedSubdivision = divided[0];

                    investigatedSubdivisionEndT -= subdivisionSize; // subdivisionSize was already halved

                    distFromStart = startDist1;
                    distFromEnd = endDist1;
                }

                if ((sumDist2 && !sumDist1) || (sumDist2 && (sumDist2 < sumDist1))) {
                    investigatedSubdivision = divided[1];

                    investigatedSubdivisionStartT += subdivisionSize; // subbdivisionSize was already halved

                    distFromStart = startDist2;
                    distFromEnd = endDist2;
                }
            }
        },

        translate: function(tx, ty) {

            this.start.offset(tx, ty);
            this.controlPoint1.offset(tx, ty);
            this.controlPoint2.offset(tx, ty);
            this.end.offset(tx, ty);
            return this;
        },

        // Returns a path
        toPath: function() {

            return Path(this.toPathData());
        },

        // Returns path data
        toPathData: function() {

            var start = this.start;
            var c1 = this.controlPoint1;
            var c2 = this.controlPoint2;
            var end = this.end;

            return 'M ' + start.x + ' ' + start.y + ' C ' + c1.x + ' ' + c1.y + ' ' + c2.x + ' ' + c2.y + ' ' + end.x + ' ' + end.y;
        },

        // Returns an array of points that represents the curve when flattened, up to `opt.precision`; or using `opt.subdivisions` provided.
        // Flattened length is no more than 10^(-precision) away from real curve length.
        toPoints: function(opt) {

            opt = opt || {};
            var precision = opt.precision; // this.getSubdivisions() can take care of undefined/null precision
            var subdivisions = opt.subdivisions || this.getSubdivisions({ precision: precision });

            var points = [subdivisions[0].start];
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

            return Polyline(this.toPoints(opt));
        },

        toString: function() {

            return 'C' + ' ' + this.start + ' ' + this.controlPoint1 + ' ' + this.controlPoint2 + ' ' + this.end;
        }
    };

    var Ellipse = g.Ellipse = function(c, a, b) {

        if (!(this instanceof Ellipse)) {
            return new Ellipse(c, a, b);
        }

        if (c instanceof Ellipse) {
            return new Ellipse(Point(c), c.a, c.b);
        }

        c = Point(c);
        this.x = c.x;
        this.y = c.y;
        this.a = a;
        this.b = b;
    };

    g.Ellipse.fromRect = function(rect) {

        rect = Rect(rect);
        return Ellipse(rect.center(), rect.width / 2, rect.height / 2);
    };

    g.Ellipse.prototype = {

        bbox: function() {

            return Rect(this.x - this.a, this.y - this.b, 2 * this.a, 2 * this.b);
        },

        clone: function() {

            return Ellipse(this);
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

            return ((x0 - x) * (x0 - x)) / (a * a ) + ((y0 - y) * (y0 - y)) / (b * b);
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


        /**
         * @param {g.Point} p
         * @returns {boolean}
         */
        containsPoint: function(p) {

            return this.normalizedDistance(p) <= 1;
        },

        /**
         * @returns {g.Point}
         */
        center: function() {

            return Point(this.x, this.y);
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
                y = ( b * b / (y0 - n)) - (b * b * (x0 - m) * (x - m)) / (a * a * (y0 - n)) + n;
            }

            return g.point(x, y).theta(p);

        },

        equals: function(ellipse) {

            return !!ellipse &&
                    ellipse.x === this.x &&
                    ellipse.y === this.y &&
                    ellipse.a === this.a &&
                    ellipse.b === this.b;
        },

        // Find point on me where line from my center to
        // point p intersects my boundary.
        // @param {number} angle If angle is specified, intersection with rotated ellipse is computed.
        intersectionWithLineFromCenterToPoint: function(p, angle) {

            p = Point(p);
            if (angle) p.rotate(Point(this.x, this.y), angle);
            var dx = p.x - this.x;
            var dy = p.y - this.y;
            var result;
            if (dx === 0) {
                result = this.bbox().pointNearestToPoint(p);
                if (angle) return result.rotate(Point(this.x, this.y), -angle);
                return result;
            }
            var m = dy / dx;
            var mSquared = m * m;
            var aSquared = this.a * this.a;
            var bSquared = this.b * this.b;
            var x = sqrt(1 / ((1 / aSquared) + (mSquared / bSquared)));

            x = dx < 0 ? -x : x;
            var y = m * x;
            result = Point(this.x + x, this.y + y);
            if (angle) return result.rotate(Point(this.x, this.y), -angle);
            return result;
        },

        toString: function() {

            return Point(this.x, this.y).toString() + ' ' + this.a + ' ' + this.b;
        }
    };

    var Line = g.Line = function(p1, p2) {

        if (!(this instanceof Line)) {
            return new Line(p1, p2);
        }

        if (p1 instanceof Line) {
            return Line(p1.start, p1.end);
        }

        this.start = Point(p1);
        this.end = Point(p2);
    };

    g.Line.prototype = {

        bbox: function() {

            var left = mmin(this.start.x, this.end.x);
            var top = mmin(this.start.y, this.end.y);
            var right = mmax(this.start.x, this.end.x);
            var bottom = mmax(this.start.y, this.end.y);

            return Rect(left, top, (right - left), (bottom - top));
        },

        // @return the bearing (cardinal direction) of the line. For example N, W, or SE.
        // @returns {String} One of the following bearings : NE, E, SE, S, SW, W, NW, N.
        bearing: function() {

            var lat1 = toRad(this.start.y);
            var lat2 = toRad(this.end.y);
            var lon1 = this.start.x;
            var lon2 = this.end.x;
            var dLon = toRad(lon2 - lon1);
            var y = sin(dLon) * cos(lat2);
            var x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon);
            var brng = toDeg(atan2(y, x));

            var bearings = ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

            var index = brng - 22.5;
            if (index < 0)
                index += 360;
            index = parseInt(index / 45);

            return bearings[index];
        },

        clone: function() {

            return Line(this.start, this.end);
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
        intersect: function(l) {

            if (l instanceof Line) {
                // Passed in parameter is a line.

                var pt1Dir = Point(this.end.x - this.start.x, this.end.y - this.start.y);
                var pt2Dir = Point(l.end.x - l.start.x, l.end.y - l.start.y);
                var det = (pt1Dir.x * pt2Dir.y) - (pt1Dir.y * pt2Dir.x);
                var deltaPt = Point(l.start.x - this.start.x, l.start.y - this.start.y);
                var alpha = (deltaPt.x * pt2Dir.y) - (deltaPt.y * pt2Dir.x);
                var beta = (deltaPt.x * pt1Dir.y) - (deltaPt.y * pt1Dir.x);

                if (det === 0 ||
                    alpha * det < 0 ||
                    beta * det < 0) {
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
                return Point(
                    this.start.x + (alpha * pt1Dir.x / det),
                    this.start.y + (alpha * pt1Dir.y / det)
                );

            } else if (l instanceof Rect) {
                // Passed in parameter is a rectangle.

                var r = l;
                var rectLines = [ r.topLine(), r.rightLine(), r.bottomLine(), r.leftLine() ];
                var points = [];
                var dedupeArr = [];
                var pt, i;

                for (i = 0; i < rectLines.length; i ++) {
                    pt = this.intersect(rectLines[i]);
                    if (pt !== null && dedupeArr.indexOf(pt.toString()) < 0) {
                        points.push(pt);
                        dedupeArr.push(pt.toString());
                    }
                }

                return points.length > 0 ? points : null;
            }

            // Passed in parameter is neither a Line nor a Rectangle.
            return null;
        },

        // @return {double} length of the line
        length: function() {

            return sqrt(this.squaredLength());
        },

        // @return {point} my midpoint
        midpoint: function() {

            return Point(
                (this.start.x + this.end.x) / 2,
                (this.start.y + this.end.y) / 2
            );
        },

        // @return {point} my point at 't' <0,1>
        pointAt: function(t) {

            var start = this.start;
            var end = this.end;

            if (t <= 0) return start.clone();
            if (t >= 1) return end.clone();

            var x = (1 - t) * start.x + t * end.x;
            var y = (1 - t) * start.y + t * end.y;
            return Point(x, y);
        },

        pointAtLength: function(length) {

            var start = this.start;
            var end = this.end;

            fromStart = true;
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
            return ((this.end.x - this.start.x) * (p.y - this.start.y) - (this.end.y - this.start.y) * (p.x - this.start.x)) / 2;
        },

        scale: function(sx, sy, origin) {

            this.start.scale(sx, sy, origin);
            this.end.scale(sx, sy, origin);
            return this;
        },

        tangentAt: function(t) {

            var start = this.start;
            var end = this.end;

            if (start.equals(end)) return null; // if start and end are the same, we cannot know what the slope is (line is a point)

            var tangentStart = this.pointAt(t); // constrains `t` between 0 and 1

            var tangentLine = Line(start.clone(), end.clone());
            tangentLine.translate(tangentStart.x - start.x, tangentStart.y - start.y); // move so that tangent line starts at the point requested

            return tangentLine;
        },

        tangentAtLength: function(length) {

            var start = this.start;
            var end = this.end;

            if (start.equals(end)) return null; // if start and end are the same, we cannot know what the slope is (line is a point)

            var tangentStart = this.pointAtLength(length);

            var tangentLine = Line(start.clone(), end.clone());
            tangentLine.translate(tangentStart.x - start.x, tangentStart.y - start.y); // move so that tangent line starts at the point requested

            return tangentLine;
        },

        translate: function(tx, ty) {

            this.start.offset(tx, ty);
            this.end.offset(tx, ty);
            return this;
        },

        // @return vector {point} of the line
        vector: function() {

            return Point(this.end.x - this.start.x, this.end.y - this.start.y);
        },

        // @return {point} the closest point on the line to point `p`
        closestPoint: function(p) {

            return this.pointAt(this.closestPointNormalizedLength(p));
        },

        // @return {number} the normalized length of the closest point on the line to point `p`
        closestPointNormalizedLength: function(p) {

            var product = this.vector().dot(Line(this.start, p).vector());

            return Math.min(1, Math.max(0, product / this.squaredLength()));
        },

        // @return {integer} length without sqrt
        // @note for applications where the exact length is not necessary (e.g. compare only)
        squaredLength: function() {

            var x0 = this.start.x;
            var y0 = this.start.y;
            var x1 = this.end.x;
            var y1 = this.end.y;
            return (x0 -= x1) * x0 + (y0 -= y1) * y0;
        },

        toString: function() {

            return this.start.toString() + ' ' + this.end.toString();
        }
    };

    // For backwards compatibility:
    g.Line.prototype.intersection = g.Line.prototype.intersect;

    var Path = g.Path = function(pathSegments) {

        if (!(this instanceof Path)) {
            return new Path(pathSegments);
        }

        if (typeof pathSegments === 'string') {
            // create path segments:
            return Path.parse(pathSegments);
        }

        if (!pathSegments || !Array.isArray(pathSegments) || pathSegments.length === 0) {
            throw new Error('Invalid pathSegments (expects a non-empty array).')
        }

        if (pathSegments[0].type !== 'M' || !pathSegments[0].start.equals(Point(0,0))) {
            throw new Error('Invalid pathSegments (path must begin with a moveto segment starting at 0,0).')
        }

        this.pathSegments = pathSegments;
    };

    Path.parse = function(normalizedPathData) {

        var pathSegments = [];

        normalizedPathData = normalizedPathData || 'M 0 0'; // path data must start with M
        var pathSnippets = normalizedPathData.split(new RegExp(' (?=[a-zA-Z])'));

        var prevSegment;
        var subpathStartSegment; // last moveto segment

        for (var i = 0, n = pathSnippets.length; i < n; i++) {

            var currentSnippet = pathSnippets[i];

            var segCoords = currentSnippet.split(' '); // first element is segType
            var segType = segCoords.shift(); // after this, only coords left

            var currentSegment = Path.segments[segType].fromCoords(segCoords, prevSegment, subpathStartSegment);
            pathSegments.push(currentSegment);
            
            prevSegment = currentSegment;
            if (currentSegment.recordSubpathStartSegment) subpathStartSegment = currentSegment;
        }

        return new Path(pathSegments);
    };

    Path.prototype = {

        // Returns the bbox of the path.
        // If path has no segments, returns null.
        // If path has only invisible segments, returns bbox of the end point of last segment.
        bbox: function() {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return null; // if pathSegments is undefined or null

            var numSegments = pathSegments.length;
            if (numSegments === 0) return null; // if pathSegments is an empty array

            var bbox;
            var n = numSegments;
            for (var i = 0; i < n; i++) {

                var seg = pathSegments[i];

                if (!seg.invisible) {
                    var segBBox = seg.bbox();
                    bbox = bbox ? bbox.union(segBBox) : segBBox;
                }
            }

            if (bbox) return bbox;

            // if the path has only invisible elements, return end point of last segment
            var lastSegment = pathSegments[n - 1];
            return Rect(lastSegment.end.x, lastSegment.end.y, 0, 0);
        },

        // Returns a new path by serializing this path and then parsing it.
        clone: function() {

            return Path(this.serialize());
        },

        // Checks whether two paths are exactly the same.
        // If `p` is undefined or null, returns false.
        equals: function(p) {

            if (!p) return false;

            var pathSegments = this.pathSegments;
            if (!pathSegments || !p.pathSegments) return false; // if either pathSegments is undefined or null

            var numSegments = pathSegments.length;
            if (p.pathSegments && (p.pathSegments.length !== numSegments)) return false; // if the two paths have different number of segments, they cannot be equal

            // as soon as an inequality is found in pathSegments, return false
            var n = numSegments;
            for (var i = 0; i < n; i++) {

                var seg = pathSegments[i];
                var otherSeg = p.pathSegments[i];

                if ((seg.type !== otherSeg.type) || (!seg.equals(otherSeg))) return false;
            }

            // if no inequality found in pathSegments, return true
            return true;
        },

        // Returns an array of segment subdivisions, with precision better than requested `opt.precision`.
        getSegmentSubdivisions: function(opt) {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return []; // if pathSegments is undefined or null

            var segmentSubdivisions = [];
            var n = pathSegments.length;
            for (var i = 0; i < n; i++) {

                var seg = pathSegments[i];
                var subdivisions = seg.getSubdivisions(opt);
                segmentSubdivisions.push(subdivisions);
            }

            return segmentSubdivisions;
        },

        // Returns length of the path, with precision better than requested `opt.precision`; or using `opt.segmentSubdivisions` provided.
        // If path has no segments, returns 0.
        length: function(opt) {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return 0; // if pathSegments is undefined or null

            opt = opt || {};
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION;
            var segmentSubdivisions = opt.segmentSubdivisions || this.getSegmentSubdivisions({ precision: precision });

            var length = 0;
            var n = pathSegments.length;
            for (var i = 0; i < n; i++) {

                var seg = pathSegments[i];
                var subdivisions = segmentSubdivisions[i];
                length += seg.length({ subdivisions: subdivisions });
            }

            return length;
        },

        // Returns point at requested `ratio` between 0 and 1, with precision better than requested `opt.precision`; optionally using `opt.segmentSubdivisions` provided.
        pointAt: function(ratio, opt) {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return null; // if pathSegments is undefined or null

            if (ratio < 0) ratio = 0;
            else if (ratio > 1) ratio = 1;

            opt = opt || {};
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION;
            var segmentSubdivisions = opt.segmentSubdivisions || this.getSegmentSubdivisions({ precision: precision });

            var pathLength = this.length({ segmentSubdivisions: segmentSubdivisions });
            var length = pathLength * ratio;

            return this.pointAtLength(length, { precision: precision, segmentSubdivisions: segmentSubdivisions });
        },

        // Returns point at requested `length`, with precision better than requested `opt.precision`; optionally using `opt.segmentSubdivisions` provided.
        pointAtLength: function(length, opt) {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return null; // if pathSegments is undefined or null

            var fromStart = true;
            if (length < 0) {
                fromStart = false; // negative lengths mean start calculation from end point
                length = -length; // absolute value
            }

            opt = opt || {};
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION;
            var segmentSubdivisions = opt.segmentSubdivisions || this.getSegmentSubdivisions({ precision: precision });

            var lastVisibleSegment;
            var l = 0; // length so far
            var n = pathSegments.length;
            for (var i = (fromStart ? (0) : (n - 1)); (fromStart ? (i < n) : (i >= 0)); (fromStart ? (i++) : (i--))) {

                var seg = pathSegments[i];
                var subdivisions = segmentSubdivisions[i];
                var d = seg.length({ subdivisions: subdivisions });

                if (!seg.invisible) {
                    if (length <= (l + d)) {
                        return seg.pointAtLength(((fromStart ? 1 : -1) * (length - l)), { precision: precision, subdivisions: subdivisions });
                    }

                    lastVisibleSegment = seg;
                }

                l += d;
            }

            // if length requested is higher than the length of the path, return last visible segment endpoint
            if (lastVisibleSegment) return (fromStart ? lastVisibleSegment.end : lastVisibleSegment.start);

            // if no visible segment, return last segment end point (no matter if fromStart or no)
            var lastSegment = pathSegments[n - 1];
            return lastSegment.end.clone();
        },

        // Default precision
        PRECISION: 2,

        scale: function(sx, sy, origin) {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return this; // if pathSegments is undefined or null

            var n = pathSegments.length;
            for (var i = 0; i < n; i++) {

                var seg = pathSegments[i];
                seg.scale(sx, sy, origin);
            }

            return this;
        },

        // Returns tangent line at requested `ratio` between 0 and 1, with precision better than requested `opt.precision`; optionally using `opt.segmentSubdivisions` provided.
        tangentAt: function(ratio, opt) {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return null; // if pathSegments is undefined or null

            if (ratio < 0) ratio = 0;
            else if (ratio > 1) ratio = 1;

            opt = opt || {};
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION;
            var segmentSubdivisions = opt.segmentSubdivisions || this.getSegmentSubdivisions({ precision: precision });

            var pathLength = this.length({ segmentSubdivisions: segmentSubdivisions });
            var length = pathLength * ratio;

            return this.tangentAtLength(length, { precision: precision, segmentSubdivisions: segmentSubdivisions });
        },

        // Returns tangent line at requested `length`, with precision better than requested `opt.precision`; optionally using `opt.segmentSubdivisions` provided.
        tangentAtLength: function(length, opt) {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return null; // if pathSegments is undefined or null

            var fromStart = true;
            if (length < 0) {
                fromStart = false; // negative lengths mean start calculation from end point
                length = -length; // absolute value
            }

            opt = opt || {};
            var precision = opt.precision;
            if (precision !== 0) precision = precision || this.PRECISION;
            var segmentSubdivisions = opt.segmentSubdivisions || this.getSegmentSubdivisions({ precision: precision });

            var lastValidSegment; // visible AND differentiable (with a tangent)
            var l = 0; // length so far
            var n = pathSegments.length;
            for (var i = (fromStart ? (0) : (n - 1)); (fromStart ? (i < n) : (i >= 0)); (fromStart ? (i++) : (i--))) {

                var seg = pathSegments[i];
                var subdivisions = segmentSubdivisions[i];
                var d = seg.length({ subdivisions: subdivisions });

                if (!seg.invisible) {
                    var tangent = seg.tangentAtLength(((fromStart ? 1 : -1) * (length - l)), { precision: precision, subdivisions: subdivisions });

                    if (tangent) { // has a tangent (segment length is not 0)
                        if (length <= (l + d)) {
                            return tangent;
                        }

                        lastValidSegment = seg;
                    }
                }

                l += d;
            }

            // if length requested is higher than the length of the path, return tangent of endpoint of last valid segment
            if (lastValidSegment) {
                var ratio = (fromStart ? 1 : 0);
                return lastValidSegment.tangentAt(ratio);
            }

            // if no valid segment, return null
            return null;
        },

        translate: function(tx, ty) {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return this; // if pathSegments is undefined or null

            var n = pathSegments.length;
            for (var i = 0; i < n; i++) {

                var seg = pathSegments[i];
                seg.translate(tx, ty);
            }

            return this;
        },

        // Returns a string that can be used to reconstruct the path.
        serialize: function() {

            var pathSegments = this.pathSegments;
            if (!pathSegments) return ''; // if pathSegments is undefined or null

            var pathData = '';
            var n = pathSegments.length;
            for (var i = 0; i < n; i++) {

                var seg = pathSegments[i];

                pathData += seg.serialize() + ' ';
            }

            return pathData.trim();
        }
    };

    Path.prototype.toString = Path.prototype.serialize;

    var Lineto = function(p1, p2) {

        if (!(this instanceof Lineto)) {
            return new Lineto(p1, p2);
        }

        if (p1 instanceof Lineto) {
            return Lineto(p1.start, p1.end);
        }

        if (p1 instanceof Line) {
            return Lineto(p1.start, p1.end);
        }

        this.start = Point(p1);
        this.end = Point(p2);
    };

    Lineto.fromCoords = function(coords, prevSegment, subpathStartSegment) {

        if (coords.length !== 2) {
            throw new Error('Wrong number of coordinates provided (expects 2).');
        }

        if (!prevSegment) {
            throw new Error('No previous segment provided (path must start with a moveto segment).');
        }

        var p1 = Point(prevSegment.end);
        var p2 = Point(+coords[0], +coords[1]);

        return Lineto(p1, p2);
    };

    var linetoPrototype = {

        getSubdivisions: function() {

            return [];
        },

        type: 'L',

        serialize: function() {

            var end = this.end;
            return this.type + ' ' + end.x + ' ' + end.y;
        },

        toString: function() {

            return this.type + ' ' + this.start + ' ' + this.end;
        }
    };

    Lineto.prototype = extendObject(Object.create(Line.prototype), linetoPrototype);

    var Curveto = function(p1, p2, p3, p4) {

        if (!(this instanceof Curveto)) {
            return new Curveto(p1, p2, p3, p4);
        }

        if (p1 instanceof Curveto) {
            return Curveto(p1.start, p1.controlPoint1, p1.controlPoint2, p1.end);
        }

        if (p1 instanceof Curve) {
            return Curveto(p1.start, p1.controlPoint1, p1.controlPoint2, p1.end);
        }

        this.start = Point(p1);
        this.controlPoint1 = Point(p2);
        this.controlPoint2 = Point(p3);
        this.end = Point(p4);
    };

    Curveto.fromCoords = function(coords, prevSegment, subpathStartSegment) {

        if (coords.length !== 6) {
            throw new Error('Wrong number of coordinates provided (expects 6).');
        }

        if (!prevSegment) {
            throw new Error('No previous segment provided (path must start with a moveto segment).');
        }

        var p1 = Point(prevSegment.end);
        var p2 = Point(+coords[0], +coords[1]);
        var p3 = Point(+coords[2], +coords[3]);
        var p4 = Point(+coords[4], +coords[5]);

        return Curveto(p1, p2, p3, p4);
    };

    var curvetoPrototype = {

        type: 'C',

        serialize: function() {

            var c1 = this.controlPoint1;
            var c2 = this.controlPoint2;
            var end = this.end;
            return this.type + ' ' + c1.x + ' ' + c1.y + ' ' + c2.x + ' ' + c2.y + ' ' + end.x + ' ' + end.y;
        },

        toString: function() {

            return this.type + ' ' + this.start + ' ' + this.controlPoint1 + ' ' + this.controlPoint2 + ' ' + this.end;
        }
    };

    Curveto.prototype = extendObject(Object.create(Curve.prototype), curvetoPrototype);

    var Moveto = function(p1, p2) {

        if (!(this instanceof Moveto)) {
            return new Moveto(p1, p2);
        }

        if (p1 instanceof Moveto) {
            return Moveto(p1.start, p1.end);
        }

        if (p1 instanceof Line) {
            return Moveto(p1.start, p1.end);
        }

        this.start = Point(p1);
        this.end = Point(p2);
    };

    Moveto.fromCoords = function(coords, prevSegment, subpathStartSegment) {

        if (coords.length !== 2) {
            throw new Error('Wrong number of coordinates provided (expects 2).');
        }

        var p1 = prevSegment ? Point(prevSegment.end) : Point(0, 0);
        var p2 = Point(+coords[0], +coords[1]);

        return Moveto(p1, p2);
    };

    var movetoPrototype = {

        bbox: function() {

            return null;
        },

        getSubdivisions: function() {

            return [];
        },

        invisible: true,

        length: function() {

            return 0;
        },

        pointAt: function() {

            return this.end.clone();
        },

        pointAtLength: function() {

            return this.end.clone();
        },

        recordSubpathStartSegment: true,

        tangent: function() {

            return null;
        },

        type: 'M',

        serialize: function() {

            var end = this.end;
            return this.type + ' ' + end.x + ' ' + end.y;
        },

        toString: function() {

            return this.type + ' ' + this.start + ' ' + this.end;
        }
    };

    Moveto.prototype = extendObject(Object.create(Line.prototype), movetoPrototype);

    var Closepath = function(p1, p2) {

        if (!(this instanceof Closepath)) {
            return new Closepath(p1, p2);
        }

        if (p1 instanceof Closepath) {
            return Closepath(p1.start, p1.end);
        }

        if (p1 instanceof Line) {
            return Moveto(p1.start, p1.end);
        }

        this.start = Point(p1);
        this.end = Point(p2);
    };

    Closepath.fromCoords = function(coords, prevSegment, subpathStartSegment) {

        if (coords.length !== 0) {
            throw new Error('Wrong number of coordinates provided (expects 0).');
        }

        if (!prevSegment) {
            throw new Error('No previous segment provided (path must start with a moveto segment).');
        }

        if (!subpathStartSegment) {
            throw new Error('No subpath start segment provided (path must start with a moveto segment).');
        }

        var p1 = Point(prevSegment.end);
        var p2 = Point(subpathStartSegment.end);

        return Closepath(p1, p2);
    };

    var closepathPrototype = {

        getSubdivisions: function() {

            return [];
        },

        type: 'Z',

        serialize: function() {

            return this.type;
        },

        toString: function() {

            return this.type + ' ' + this.start + ' ' + this.end;
        }
    };

    Closepath.prototype = extendObject(Object.create(Line.prototype), closepathPrototype);

    Path.segments = {
        L: Lineto,
        C: Curveto,
        M: Moveto,
        Z: Closepath
    };

    /*
        Point is the most basic object consisting of x/y coordinate.

        Possible instantiations are:
        * `Point(10, 20)`
        * `new Point(10, 20)`
        * `Point('10 20')`
        * `Point(Point(10, 20))`
    */
    var Point = g.Point = function(x, y) {

        if (!(this instanceof Point)) {
            return new Point(x, y);
        }

        if (typeof x === 'string') {
            var xy = x.split(x.indexOf('@') === -1 ? ' ' : '@');
            x = parseInt(xy[0], 10);
            y = parseInt(xy[1], 10);
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
    g.Point.fromPolar = function(distance, angle, origin) {

        origin = (origin && Point(origin)) || Point(0, 0);
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

        return Point(origin.x + x, origin.y + y);
    };

    // Create a point with random coordinates that fall into the range `[x1, x2]` and `[y1, y2]`.
    g.Point.random = function(x1, x2, y1, y2) {

        return Point(floor(random() * (x2 - x1 + 1) + x1), floor(random() * (y2 - y1 + 1) + y1));
    };

    g.Point.prototype = {

        // If point lies outside rectangle `r`, return the nearest point on the boundary of rect `r`,
        // otherwise return point itself.
        // (see Squeak Smalltalk, Point>>adhereTo:)
        adhereToRect: function(r) {

            if (r.containsPoint(this)) {
                return this;
            }

            this.x = mmin(mmax(this.x, r.x), r.x + r.width);
            this.y = mmin(mmax(this.y, r.y), r.y + r.height);
            return this;
        },

        // Return the bearing between me and the given point.
        bearing: function(point) {

            return Line(this, point).bearing();
        },

        // Returns change in angle from my previous position (-dx, -dy) to my new position
        // relative to ref point.
        changeInAngle: function(dx, dy, ref) {

            // Revert the translation and measure the change in angle around x-axis.
            return Point(this).offset(-dx, -dy).theta(ref) - this.theta(ref);
        },

        clone: function() {

            return Point(this);
        },

        difference: function(dx, dy) {

            if ((Object(dx) === dx)) {
                dy = dx.y;
                dx = dx.x;
            }

            return Point(this.x - (dx || 0), this.y - (dy || 0));
        },

        // Returns distance between me and point `p`.
        distance: function(p) {

            return Line(this, p).length();
        },

        squaredDistance: function(p) {

            return Line(this, p).squaredLength();
        },

        equals: function(p) {

            return !!p && this.x === p.x && this.y === p.y;
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

            var theta = toRad(Point(ref).theta(this));
            return this.offset(cos(theta) * distance, -sin(theta) * distance);
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

            return Point(ref).move(this, this.distance(ref));
        },

        // Rotate point by angle around origin.
        rotate: function(origin, angle) {

            angle = (angle + 360) % 360;
            this.toPolar(origin);
            this.y += toRad(angle);
            var point = Point.fromPolar(this.x, this.y, origin);
            this.x = point.x;
            this.y = point.y;
            return this;
        },

        round: function(precision) {

            var f = pow(10, precision || 0);
            this.x = round(this.x * f) / f;
            this.y = round(this.y * f) / f;
            return this;
        },

        // Scale point with origin.
        scale: function(sx, sy, origin) {

            origin = (origin && Point(origin)) || Point(0, 0);
            this.x = origin.x + sx * (this.x - origin.x);
            this.y = origin.y + sy * (this.y - origin.y);
            return this;
        },

        snapToGrid: function(gx, gy) {

            this.x = snapToGrid(this.x, gx);
            this.y = snapToGrid(this.y, gy || gx);
            return this;
        },

        // Compute the angle between me and `p` and the x axis.
        // (cartesian-to-polar coordinates conversion)
        // Return theta angle in degrees.
        theta: function(p) {

            p = Point(p);
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

        // Compute the angle between the vector from 0,0 to me and the vector from 0,0 to p.
        // Returns NaN if p is at 0,0.
        vectorAngle: function(p) {
            
            var zero = Point(0,0);
            return zero.angleBetween(this, p);
        },

        toJSON: function() {

            return { x: this.x, y: this.y };
        },

        // Converts rectangular to polar coordinates.
        // An origin can be specified, otherwise it's 0@0.
        toPolar: function(o) {

            o = (o && Point(o)) || Point(0, 0);
            var x = this.x;
            var y = this.y;
            this.x = sqrt((x - o.x) * (x - o.x) + (y - o.y) * (y - o.y)); // r
            this.y = toRad(o.theta(Point(x, y)));
            return this;
        },

        toString: function() {

            return this.x + '@' + this.y;
        },

        update: function(x, y) {

            this.x = x || 0;
            this.y = y || 0;
            return this;
        },

        // Returns the dot product of this point with given other point
        dot: function(p) {

            return p ? (this.x * p.x + this.y * p.y) : NaN;
        },

        // Returns the cross product of this point relative to two other points
        // this point is the common point
        // point p1 lies on the first vector, point p2 lies on the second vector
        // watch out for the ordering of points p1 and p2!
        // positive result indicates a clockwise ("right") turn from first to second vector
        // negative result indicates a counterclockwise ("left") turn from first to second vector
        // note that the above directions are reversed from the usual answer on the Internet
        // that is because we are in a left-handed coord system (because the y-axis points downward)
        cross: function(p1, p2) {

            return (p1 && p2) ? (((p2.x - this.x) * (p1.y - this.y)) - ((p2.y - this.y) * (p1.x - this.x))) : NaN;
        }
    };

    var Rect = g.Rect = function(x, y, w, h) {

        if (!(this instanceof Rect)) {
            return new Rect(x, y, w, h);
        }

        if ((Object(x) === x)) {
            y = x.y;
            w = x.width;
            h = x.height;
            x = x.x;
        }

        this.x = x === undefined ? 0 : x;
        this.y = y === undefined ? 0 : y;
        this.width = w === undefined ? 0 : w;
        this.height = h === undefined ? 0 : h;
    };

    g.Rect.fromEllipse = function(e) {

        e = Ellipse(e);
        return Rect(e.x - e.a, e.y - e.b, 2 * e.a, 2 * e.b);
    };

    g.Rect.prototype = {

        // Find my bounding box when I'm rotated with the center of rotation in the center of me.
        // @return r {rectangle} representing a bounding box
        bbox: function(angle) {

            if (!angle) return this.clone();

            var theta = toRad(angle || 0);
            var st = abs(sin(theta));
            var ct = abs(cos(theta));
            var w = this.width * ct + this.height * st;
            var h = this.width * st + this.height * ct;
            return Rect(this.x + (this.width - w) / 2, this.y + (this.height - h) / 2, w, h);
        },

        bottomLeft: function() {

            return Point(this.x, this.y + this.height);
        },

        bottomLine: function() {

            return Line(this.bottomLeft(), this.corner());
        },

        bottomMiddle: function() {

            return Point(this.x + this.width / 2, this.y + this.height);
        },

        center: function() {

            return Point(this.x + this.width / 2, this.y + this.height / 2);
        },

        clone: function() {

            return Rect(this);
        },

        // @return {bool} true if point p is insight me
        containsPoint: function(p) {

            p = Point(p);
            return p.x >= this.x && p.x <= this.x + this.width && p.y >= this.y && p.y <= this.y + this.height;
        },

        // @return {bool} true if rectangle `r` is inside me.
        containsRect: function(r) {

            var r0 = Rect(this).normalize();
            var r1 = Rect(r).normalize();
            var w0 = r0.width;
            var h0 = r0.height;
            var w1 = r1.width;
            var h1 = r1.height;

            if (!w0 || !h0 || !w1 || !h1) {
                // At least one of the dimensions is 0
                return false;
            }

            var x0 = r0.x;
            var y0 = r0.y;
            var x1 = r1.x;
            var y1 = r1.y;

            w1 += x1;
            w0 += x0;
            h1 += y1;
            h0 += y0;

            return x0 <= x1 && w1 <= w0 && y0 <= y1 && h1 <= h0;
        },

        corner: function() {

            return Point(this.x + this.width, this.y + this.height);
        },

        // @return {boolean} true if rectangles are equal.
        equals: function(r) {

            var mr = Rect(this).normalize();
            var nr = Rect(r).normalize();
            return mr.x === nr.x && mr.y === nr.y && mr.width === nr.width && mr.height === nr.height;
        },

        // @return {rect} if rectangles intersect, {null} if not.
        intersect: function(r) {

            var myOrigin = this.origin();
            var myCorner = this.corner();
            var rOrigin = r.origin();
            var rCorner = r.corner();

            // No intersection found
            if (rCorner.x <= myOrigin.x ||
                rCorner.y <= myOrigin.y ||
                rOrigin.x >= myCorner.x ||
                rOrigin.y >= myCorner.y) return null;

            var x = Math.max(myOrigin.x, rOrigin.x);
            var y = Math.max(myOrigin.y, rOrigin.y);

            return Rect(x, y, Math.min(myCorner.x, rCorner.x) - x, Math.min(myCorner.y, rCorner.y) - y);
        },

        // Find point on my boundary where line starting
        // from my center ending in point p intersects me.
        // @param {number} angle If angle is specified, intersection with rotated rectangle is computed.
        intersectionWithLineFromCenterToPoint: function(p, angle) {

            p = Point(p);
            var center = Point(this.x + this.width / 2, this.y + this.height / 2);
            var result;
            if (angle) p.rotate(center, angle);

            // (clockwise, starting from the top side)
            var sides = [
                Line(this.origin(), this.topRight()),
                Line(this.topRight(), this.corner()),
                Line(this.corner(), this.bottomLeft()),
                Line(this.bottomLeft(), this.origin())
            ];
            var connector = Line(center, p);

            for (var i = sides.length - 1; i >= 0; --i) {
                var intersection = sides[i].intersection(connector);
                if (intersection !== null) {
                    result = intersection;
                    break;
                }
            }
            if (result && angle) result.rotate(center, -angle);
            return result;
        },

        leftLine: function() {

            return Line(this.origin(), this.bottomLeft());
        },

        leftMiddle: function() {

            return Point(this.x , this.y + this.height / 2);
        },

        // Move and expand me.
        // @param r {rectangle} representing deltas
        moveAndExpand: function(r) {

            this.x += r.x || 0;
            this.y += r.y || 0;
            this.width += r.width || 0;
            this.height += r.height || 0;
            return this;
        },

        // Offset me by the specified amount.
        offset: function(dx, dy) {
            return Point.prototype.offset.call(this, dx, dy);
        },

        // inflate by dx and dy, recompute origin [x, y]
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

            this.x -= dx;
            this.y -= dy;
            this.width += 2 * dx;
            this.height += 2 * dy;

            return this;
        },

        // Normalize the rectangle; i.e., make it so that it has a non-negative width and height.
        // If width < 0 the function swaps the left and right corners,
        // and it swaps the top and bottom corners if height < 0
        // like in http://qt-project.org/doc/qt-4.8/qrectf.html#normalized
        normalize: function() {

            var newx = this.x;
            var newy = this.y;
            var newwidth = this.width;
            var newheight = this.height;
            if (this.width < 0) {
                newx = this.x + this.width;
                newwidth = -this.width;
            }
            if (this.height < 0) {
                newy = this.y + this.height;
                newheight = -this.height;
            }
            this.x = newx;
            this.y = newy;
            this.width = newwidth;
            this.height = newheight;
            return this;
        },

        origin: function() {

            return Point(this.x, this.y);
        },

        // @return {point} a point on my boundary nearest to the given point.
        // @see Squeak Smalltalk, Rectangle>>pointNearestTo:
        pointNearestToPoint: function(point) {

            point = Point(point);
            if (this.containsPoint(point)) {
                var side = this.sideNearestToPoint(point);
                switch (side){
                    case 'right': return Point(this.x + this.width, point.y);
                    case 'left': return Point(this.x, point.y);
                    case 'bottom': return Point(point.x, this.y + this.height);
                    case 'top': return Point(point.x, this.y);
                }
            }
            return point.adhereToRect(this);
        },

        rightLine: function() {

            return Line(this.topRight(), this.corner());
        },

        rightMiddle: function() {

            return Point(this.x + this.width, this.y + this.height / 2);
        },

        round: function(precision) {

            var f = pow(10, precision || 0);
            this.x = round(this.x * f) / f;
            this.y = round(this.y * f) / f;
            this.width = round(this.width * f) / f;
            this.height = round(this.height * f) / f;
            return this;
        },

        // Scale rectangle with origin.
        scale: function(sx, sy, origin) {

            origin = this.origin().scale(sx, sy, origin);
            this.x = origin.x;
            this.y = origin.y;
            this.width *= sx;
            this.height *= sy;
            return this;
        },

        maxRectScaleToFit: function(rect, origin) {

            rect = g.Rect(rect);
            origin || (origin = rect.center());

            var sx1, sx2, sx3, sx4, sy1, sy2, sy3, sy4;
            var ox = origin.x;
            var oy = origin.y;

            // Here we find the maximal possible scale for all corner points (for x and y axis) of the rectangle,
            // so when the scale is applied the point is still inside the rectangle.

            sx1 = sx2 = sx3 = sx4 = sy1 = sy2 = sy3 = sy4 = Infinity;

            // Top Left
            var p1 = rect.origin();
            if (p1.x < ox) {
                sx1 = (this.x - ox) / (p1.x - ox);
            }
            if (p1.y < oy) {
                sy1 = (this.y - oy) / (p1.y - oy);
            }
            // Bottom Right
            var p2 = rect.corner();
            if (p2.x > ox) {
                sx2 = (this.x + this.width - ox) / (p2.x - ox);
            }
            if (p2.y > oy) {
                sy2 = (this.y + this.height - oy) / (p2.y - oy);
            }
            // Top Right
            var p3 = rect.topRight();
            if (p3.x > ox) {
                sx3 = (this.x + this.width - ox) / (p3.x - ox);
            }
            if (p3.y < oy) {
                sy3 = (this.y - oy) / (p3.y - oy);
            }
            // Bottom Left
            var p4 = rect.bottomLeft();
            if (p4.x < ox) {
                sx4 = (this.x - ox) / (p4.x - ox);
            }
            if (p4.y > oy) {
                sy4 = (this.y + this.height - oy) / (p4.y - oy);
            }

            return {
                sx: Math.min(sx1, sx2, sx3, sx4),
                sy: Math.min(sy1, sy2, sy3, sy4)
            };
        },

        maxRectUniformScaleToFit: function(rect, origin) {

            var scale = this.maxRectScaleToFit(rect, origin);
            return Math.min(scale.sx, scale.sy);
        },

        // @return {string} (left|right|top|bottom) side which is nearest to point
        // @see Squeak Smalltalk, Rectangle>>sideNearestTo:
        sideNearestToPoint: function(point) {

            point = Point(point);
            var distToLeft = point.x - this.x;
            var distToRight = (this.x + this.width) - point.x;
            var distToTop = point.y - this.y;
            var distToBottom = (this.y + this.height) - point.y;
            var closest = distToLeft;
            var side = 'left';

            if (distToRight < closest) {
                closest = distToRight;
                side = 'right';
            }
            if (distToTop < closest) {
                closest = distToTop;
                side = 'top';
            }
            if (distToBottom < closest) {
                closest = distToBottom;
                side = 'bottom';
            }
            return side;
        },

        snapToGrid: function(gx, gy) {

            var origin = this.origin().snapToGrid(gx, gy);
            var corner = this.corner().snapToGrid(gx, gy);
            this.x = origin.x;
            this.y = origin.y;
            this.width = corner.x - origin.x;
            this.height = corner.y - origin.y;
            return this;
        },

        topLine: function() {

            return Line(this.origin(), this.topRight());
        },

        topMiddle: function() {

            return Point(this.x + this.width / 2, this.y);
        },

        topRight: function() {

            return Point(this.x + this.width, this.y);
        },

        toJSON: function() {

            return { x: this.x, y: this.y, width: this.width, height: this.height };
        },

        toString: function() {

            return this.origin().toString() + ' ' + this.corner().toString();
        },

        // @return {rect} representing the union of both rectangles.
        union: function(rect) {

            rect = Rect(rect);
            var myOrigin = this.origin();
            var myCorner = this.corner();
            var rOrigin = rect.origin();
            var rCorner = rect.corner();

            var originX = Math.min(myOrigin.x, rOrigin.x);
            var originY = Math.min(myOrigin.y, rOrigin.y);
            var cornerX = Math.max(myCorner.x, rCorner.x);
            var cornerY = Math.max(myCorner.y, rCorner.y);

            return Rect(originX, originY, cornerX - originX, cornerY - originY);
        }
    };

    var Polyline = g.Polyline = function(points) {

        if (!(this instanceof Polyline)) {
            return new Polyline(points);
        }

        if (typeof points === 'string') {
            return new Polyline.parse(points);
        }

        this.points = (Array.isArray(points)) ? points.map(Point) : [];
    };

    Polyline.parse = function(svgString) {

        if (svgString === '') return Polyline([]);

        var coords = svgString.split(/\s|,/);

        var points = [];
        var n = coords.length;
        for (var i = 0; i < n; i += 2) {
            points.push({ x: +coords[i], y: +coords[i + 1] });
        }

        return Polyline(points);
    };

    Polyline.prototype = {

        bbox: function() {

            var x1 = Infinity;
            var x2 = -Infinity;
            var y1 = Infinity;
            var y2 = -Infinity;

            var points = this.points;
            if (!points) return null; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return null; // if points array is empty

            var n = numPoints;
            for (var i = 0; i < n; i++) {
                var point = points[i];
                var x = point.x;
                var y = point.y;

                if (x < x1) x1 = x;
                if (x > x2) x2 = x;
                if (y < y1) y1 = y;
                if (y > y2) y2 = y;
            }

            return Rect(x1, y1, x2 - x1, y2 - y1);
        },

        clone: function() {

            return new Polyline(this.points);
        },

        // Returns a convex-hull polyline from this polyline.
        // this function implements the Graham scan (https://en.wikipedia.org/wiki/Graham_scan)
        // output polyline starts at the first element of the original polyline that is on the hull
        // output polyline then continues clockwise from that point
        convexHull: function() {

            var i;
            var n;

            var points = this.points;
            if (!points) return Polyline([]); // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return Polyline([]); // if points array is empty

            // step 1: find the starting point - point with the lowest y (if equality, highest x)
            var startPoint;
            n = points.length;
            for (i = 0; i < n; i++) {
                if (startPoint === undefined) {
                    // if this is the first point we see, set it as start point
                    startPoint = points[i];
                } else if (points[i].y < startPoint.y) {
                    // start point should have lowest y from all points
                    startPoint = points[i];
                } else if ((points[i].y === startPoint.y) && (points[i].x > startPoint.x)) {
                    // if two points have the lowest y, choose the one that has highest x
                    // there are no points to the right of startPoint - no ambiguity about theta 0
                    // if there are several coincident start point candidates, first one is reported
                    startPoint = points[i];
                }
            }

            // step 2: sort the list of points
            // sorting by angle between line from startPoint to point and the x-axis (theta)
            
            // step 2a: create the point records = [point, originalIndex, angle]
            var sortedPointRecords = [];
            n = points.length;
            for (i = 0; i < n; i++) {
                var angle = startPoint.theta(points[i]);
                if (angle === 0) {
                    angle = 360; // give highest angle to start point
                    // the start point will end up at end of sorted list
                    // the start point will end up at beginning of hull points list
                }
                
                var entry = [points[i], i, angle];
                sortedPointRecords.push(entry);
            }

            // step 2b: sort the list in place
            sortedPointRecords.sort(function(record1, record2) {
                // returning a negative number here sorts record1 before record2
                // if first angle is smaller than second, first angle should come before second
                var sortOutput = record1[2] - record2[2];  // negative if first angle smaller
                if (sortOutput === 0) {
                    // if the two angles are equal, sort by originalIndex
                    sortOutput = record2[1] - record1[1]; // negative if first index larger
                    // coincident points will be sorted in reverse-numerical order
                    // so the coincident points with lower original index will be considered first
                }
                return sortOutput;
            });

            // step 2c: duplicate start record from the top of the stack to the bottom of the stack
            if (sortedPointRecords.length > 2) {
                var startPointRecord = sortedPointRecords[sortedPointRecords.length-1];
                sortedPointRecords.unshift(startPointRecord);
            }

            // step 3a: go through sorted points in order and find those with right turns
            // we want to get our results in clockwise order
            var insidePoints = {}; // dictionary of points with left turns - cannot be on the hull
            var hullPointRecords = []; // stack of records with right turns - hull point candidates

            var currentPointRecord;
            var currentPoint;
            var lastHullPointRecord;
            var lastHullPoint;
            var secondLastHullPointRecord;
            var secondLastHullPoint;
            while (sortedPointRecords.length !== 0) {
                currentPointRecord = sortedPointRecords.pop();
                currentPoint = currentPointRecord[0];

                // check if point has already been discarded
                // keys for insidePoints are stored in the form 'point.x@point.y@@originalIndex'
                if (insidePoints.hasOwnProperty(currentPointRecord[0] + '@@' + currentPointRecord[1])) {
                    // this point had an incorrect turn at some previous iteration of this loop
                    // this disqualifies it from possibly being on the hull
                    continue;
                }

                var correctTurnFound = false;
                while (!correctTurnFound) {
                    if (hullPointRecords.length < 2) {
                        // not enough points for comparison, just add current point
                        hullPointRecords.push(currentPointRecord);
                        correctTurnFound = true;
                    
                    } else {
                        lastHullPointRecord = hullPointRecords.pop();
                        lastHullPoint = lastHullPointRecord[0];
                        secondLastHullPointRecord = hullPointRecords.pop();
                        secondLastHullPoint = secondLastHullPointRecord[0];

                        var crossProduct = secondLastHullPoint.cross(lastHullPoint, currentPoint);

                        if (crossProduct < 0) {
                            // found a right turn
                            hullPointRecords.push(secondLastHullPointRecord);
                            hullPointRecords.push(lastHullPointRecord);
                            hullPointRecords.push(currentPointRecord);
                            correctTurnFound = true;

                        } else if (crossProduct === 0) {
                            // the three points are collinear
                            // three options:
                            // there may be a 180 or 0 degree angle at lastHullPoint
                            // or two of the three points are coincident
                            var THRESHOLD = 1e-10; // we have to take rounding errors into account
                            var angleBetween = lastHullPoint.angleBetween(secondLastHullPoint, currentPoint);
                            if (Math.abs(angleBetween - 180) < THRESHOLD) { // rouding around 180 to 180
                                // if the cross product is 0 because the angle is 180 degrees
                                // discard last hull point (add to insidePoints)
                                //insidePoints.unshift(lastHullPoint);
                                insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                                // reenter second-to-last hull point (will be last at next iter)
                                hullPointRecords.push(secondLastHullPointRecord);
                                // do not do anything with current point
                                // correct turn not found
                            
                            } else if (lastHullPoint.equals(currentPoint) || secondLastHullPoint.equals(lastHullPoint)) {
                                // if the cross product is 0 because two points are the same
                                // discard last hull point (add to insidePoints)
                                //insidePoints.unshift(lastHullPoint);
                                insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                                // reenter second-to-last hull point (will be last at next iter)
                                hullPointRecords.push(secondLastHullPointRecord);
                                // do not do anything with current point
                                // correct turn not found
                                                        
                            } else if (Math.abs(((angleBetween + 1) % 360) - 1) < THRESHOLD) { // rounding around 0 and 360 to 0
                                // if the cross product is 0 because the angle is 0 degrees
                                // remove last hull point from hull BUT do not discard it
                                // reenter second-to-last hull point (will be last at next iter)
                                hullPointRecords.push(secondLastHullPointRecord);
                                // put last hull point back into the sorted point records list
                                sortedPointRecords.push(lastHullPointRecord);
                                // we are switching the order of the 0deg and 180deg points
                                // correct turn not found
                            }

                        } else {
                            // found a left turn
                            // discard last hull point (add to insidePoints)
                            //insidePoints.unshift(lastHullPoint);
                            insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                            // reenter second-to-last hull point (will be last at next iter of loop)
                            hullPointRecords.push(secondLastHullPointRecord);
                            // do not do anything with current point
                            // correct turn not found
                        }
                    }
                }
            }
            // at this point, hullPointRecords contains the output points in clockwise order
            // the points start with lowest-y,highest-x startPoint, and end at the same point

            // step 3b: remove duplicated startPointRecord from the end of the array
            if (hullPointRecords.length > 2) {
                hullPointRecords.pop();
            }

            // step 4: find the lowest originalIndex record and put it at the beginning of hull
            var lowestHullIndex; // the lowest originalIndex on the hull
            var indexOfLowestHullIndexRecord = -1; // the index of the record with lowestHullIndex
            n = hullPointRecords.length;
            for (i = 0; i < n; i++) {
                var currentHullIndex = hullPointRecords[i][1];

                if (lowestHullIndex === undefined || currentHullIndex < lowestHullIndex) {
                    lowestHullIndex = currentHullIndex;
                    indexOfLowestHullIndexRecord = i;
                }
            }

            var hullPointRecordsReordered = [];
            if (indexOfLowestHullIndexRecord > 0) {
                var newFirstChunk = hullPointRecords.slice(indexOfLowestHullIndexRecord);
                var newSecondChunk = hullPointRecords.slice(0, indexOfLowestHullIndexRecord);
                hullPointRecordsReordered = newFirstChunk.concat(newSecondChunk);
            } else {
                hullPointRecordsReordered = hullPointRecords;
            }

            var hullPoints = [];
            n = hullPointRecordsReordered.length;
            for (i = 0; i < n; i++) {
                hullPoints.push(hullPointRecordsReordered[i][0]);
            }

            return Polyline(hullPoints);
        },

        // Checks whether two polylines are exactly the same.
        // If `p` is undefined or null, returns false.
        equals: function(p) {

            if (!p) return false;

            var points = this.points;
            if (!points || !p.points) return false; // if either points array is undefined or null

            var numPoints = points.length;
            if (p.points && (p.points.length !== numPoints)) return false; // if the two polylines have different number of points, they cannot be equal

            // as soon as an inequality is found in points, return false
            var n = numPoints;
            for (var i = 0; i < n; i++) {

                var point = points[i];
                var otherPoint = p.points[i];

                if (!point.equals(otherPoint)) return false;
            }

            // if no inequality found in points, return true
            return true;
        },

        length: function() {

            var points = this.points;
            if (!points) return 0; // if points array is undefined or null

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

            var points = this.points;
            if (!points) return null; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return null; // if points array is empty
            else if (numPoints === 1) return points[0]; // if there is only one point

            if (ratio <= 0) return points[0].clone();
            else if (ratio >= 1) return points[numPoints - 1].clone();

            var polylineLength = this.length();
            var length = polylineLength * ratio;

            return this.pointAtLength(length);
        },

        pointAtLength: function(length) {

            var points = this.points;
            if (!points) return null; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return null; // if points array is empty
            else if (numPoints === 1) return points[0]; // if there is only one point

            var fromStart = true;
            if (length < 0) {
                fromStart = false; // negative lengths mean start calculation from end point
                length = -length; // absolute value
            }

            var polylineLength = this.length();
            if (length > polylineLength) return (fromStart ? points[numPoints - 1].clone() : points[0].clone());

            var l = 0;
            var n = numPoints - 1;
            for (var i = (fromStart ? (0) : (n - 1)); (fromStart ? (i < n) : (i >= 0)); (fromStart ? (i++) : (i--))) {

                var a = points[i];
                var b = points[i + 1];
                var line = Line(a, b);
                var d = a.distance(b);

                if (length <= (l + d)) {
                    return line.pointAtLength((fromStart ? 1 : -1) * (length - l));
                }

                l += d;
            }

            // if length requested is higher than the length of the polyline, return endpoint
            return (fromStart ? points[numPoints - 1].clone() : points[0].clone());
        },

        scale: function(sx, sy, origin) {

            var points = this.points;
            if (!points) return this; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return this; // if points array is empty

            var n = numPoints;
            for (var i = 0; i < n; i++) {
                points[i].scale(sx, sy, origin);
            }

            return this;
        },

        tangentAt: function(ratio) {

            var points = this.points;
            if (!points) return null; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return null; // if points array is empty
            else if (numPoints === 1) return null; // if there is only one point

            if (ratio < 0) ratio = 0;
            else if (ratio > 1) ratio = 1;

            var polylineLength = this.length();
            var length = polylineLength * ratio;

            return this.tangentAtLength(length);
        },

        tangentAtLength: function(length) {

            var points = this.points;
            if (!points) return null; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return null; // if points array is empty
            else if (numPoints === 1) return null; // if there is only one point

            var fromStart = true;
            if (length < 0) {
                fromStart = false; // negative lengths mean start calculation from end point
                length = -length; // absolute value
            }

            var lastValidLine; // differentiable (with a tangent)
            var l = 0; // length so far
            var n = numPoints - 1;
            for (var i = (fromStart ? (0) : (n - 1)); (fromStart ? (i < n) : (i >= 0)); (fromStart ? (i++) : (i--))) {

                var a = points[i];
                var b = points[i + 1];
                var line = Line(a, b);
                var d = a.distance(b);

                var tangent = line.tangentAtLength((fromStart ? 1 : -1) * (length - l));

                if (tangent) { // has a tangent (line length is not 0)
                    if (length <= (l + d)) {
                        return tangent;
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

        translate: function(tx, ty) {

            var points = this.points;
            if (!points) return this; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return this; // if points array is empty

            var n = numPoints;
            for (var i = 0; i < n; i++) {
                points[i].offset(tx, ty);
            }

            return this;
        },

        closestPoint: function(p) {

            var length = this.closestPointLength(p);
            if (!length) return null;

            return this.pointAtLength(length);
        },

        closestPointLength: function(p) {

            var points = this.points;
            if (!points) return null; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return null; // if points array is empty

            var pointLength;
            var minSqrDistance = Infinity;
            var length = 0;
            var n = points.length - 1;
            for (var i = 0; i < n; i++) {

                var line = Line(points[i], points[i + 1]);
                var lineLength = line.length();

                var cpNormalizedLength = line.closestPointNormalizedLength(p);
                var cp = line.pointAt(cpNormalizedLength);

                var sqrDistance = cp.squaredDistance(p);
                if (sqrDistance < minSqrDistance) {
                    minSqrDistance = sqrDistance;
                    pointLength = length + cpNormalizedLength * lineLength;
                }

                length += lineLength;
            }

            return pointLength;
        },

        serialize: function() {

            var points = this.points;
            if (!points) return ''; // if points array is undefined or null

            var numPoints = points.length;
            if (numPoints === 0) return ''; // if points array is empty

            var output = '';
            var n = numPoints;
            for (var i = 0; i < n; i++) {
                var point = points[i];
                output += point.x + ',' + point.y + ' ';
            }

            return output.trim();
        },

        toString: function() {

            return this.points + '';
        }
    };


    g.scale = {

        // Return the `value` from the `domain` interval scaled to the `range` interval.
        linear: function(domain, range, value) {

            var domainSpan = domain[1] - domain[0];
            var rangeSpan = range[1] - range[0];
            return (((value - domain[0]) / domainSpan) * rangeSpan + range[0]) || 0;
        }
    };

    var normalizeAngle = g.normalizeAngle = function(angle) {

        return (angle % 360) + (angle < 0 ? 360 : 0);
    };

    var snapToGrid = g.snapToGrid = function(value, gridSize) {

        return gridSize * Math.round(value / gridSize);
    };

    var toDeg = g.toDeg = function(rad) {

        return (180 * rad / PI) % 360;
    };

    var toRad = g.toRad = function(deg, over360) {

        over360 = over360 || false;
        deg = over360 ? deg : (deg % 360);
        return deg * PI / 180;
    };

    // For backwards compatibility:
    g.ellipse = g.Ellipse;
    g.line = g.Line;
    g.point = g.Point;
    g.rect = g.Rect;

    function extendObject(obj, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) obj[key] = src[key];
        }
        return obj;
    }

    return g;

})();

import { Path } from './path.mjs';
import { Curve } from './curve.mjs';
import { Point } from './point.mjs';

export const bezier = {

    // Cubic Bezier curve path through points.
    // @deprecated
    // @param {array} points Array of points through which the smooth line will go.
    // @return {array} SVG Path commands as an array
    curveThroughPoints: function(points) {

        console.warn('deprecated');

        return new Path(Curve.throughPoints(points)).serialize();
    },

    // Get open-ended Bezier Spline Control Points.
    // @deprecated
    // @param knots Input Knot Bezier spline points (At least two points!).
    // @param firstControlPoints Output First Control points. Array of knots.length - 1 length.
    // @param secondControlPoints Output Second Control points. Array of knots.length - 1 length.
    getCurveControlPoints: function(knots) {

        console.warn('deprecated');

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
                    (knots[n].y + y[n - 1]) / 2)
                );
            }
        }

        return [firstControlPoints, secondControlPoints];
    },

    // Divide a Bezier curve into two at point defined by value 't' <0,1>.
    // Using deCasteljau algorithm. http://math.stackexchange.com/a/317867
    // @deprecated
    // @param control points (start, control start, control end, end)
    // @return a function that accepts t and returns 2 curves.
    getCurveDivider: function(p0, p1, p2, p3) {

        console.warn('deprecated');

        var curve = new Curve(p0, p1, p2, p3);

        return function divideCurve(t) {

            var divided = curve.divide(t);

            return [{
                p0: divided[0].start,
                p1: divided[0].controlPoint1,
                p2: divided[0].controlPoint2,
                p3: divided[0].end
            }, {
                p0: divided[1].start,
                p1: divided[1].controlPoint1,
                p2: divided[1].controlPoint2,
                p3: divided[1].end
            }];
        };
    },

    // Solves a tridiagonal system for one of coordinates (x or y) of first Bezier control points.
    // @deprecated
    // @param rhs Right hand side vector.
    // @return Solution vector.
    getFirstControlPoints: function(rhs) {

        console.warn('deprecated');

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
    // @deprecated
    // @param control points (start, control start, control end, end)
    // @return a function that accepts a point and returns t.
    getInversionSolver: function(p0, p1, p2, p3) {

        console.warn('deprecated');

        var curve = new Curve(p0, p1, p2, p3);

        return function solveInversion(p) {

            return curve.closestPointT(p);
        };
    }
};

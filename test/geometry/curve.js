'use strict';

QUnit.module('curve', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Curve object', function(assert) {

            var curve = g.Curve('10 10', '10 40', '50 40', '50 10');
            assert.ok(curve, 'returns instance of g.Curve');
            assert.notEqual(typeof curve.start, 'undefined', 'has "start" property');
            assert.notEqual(typeof curve.controlPoint1, 'undefined', 'has "controlPoint1" property');
            assert.notEqual(typeof curve.controlPoint2, 'undefined', 'has "controlPoint2" property');
            assert.notEqual(typeof curve.end, 'undefined', 'has "end" property');
            assert.equal(curve.start.x, 10, 'start.x is correct');
            assert.equal(curve.start.y, 10, 'start.y is correct');
            assert.equal(curve.controlPoint1.x, 10, 'controlPoint1.x is correct');
            assert.equal(curve.controlPoint1.y, 40, 'controlPoint1.y is correct');
            assert.equal(curve.controlPoint2.x, 50, 'controlPoint2.x is correct');
            assert.equal(curve.controlPoint2.y, 40, 'controlPoint2.y is correct');
            assert.equal(curve.end.x, 50, 'end.x is correct');
            assert.equal(curve.end.y, 10, 'end.y is correct');

            var curve2 = g.Curve(curve);
            assert.ok(curve2, 'returns instance of g.Curve');
            assert.notEqual(typeof curve2.start, 'undefined', 'has "start" property');
            assert.notEqual(typeof curve2.controlPoint1, 'undefined', 'has "controlPoint1" property');
            assert.notEqual(typeof curve2.controlPoint2, 'undefined', 'has "controlPoint2" property');
            assert.notEqual(typeof curve2.end, 'undefined', 'has "end" property');
            assert.notOk(curve === curve2);
            assert.equal(curve.toString(), curve2.toString());
            assert.ok(curve.equals(curve2));
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').bbox() instanceof g.Rect);
            });

            QUnit.test('returns tight bounding box of the curve', function(assert) {

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').bbox().toString(), '10@10 50@32.5');
            });
        });

        QUnit.module('clone()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('0 100', '50 200', '150 0', '200 100').clone() instanceof g.Curve);
            });

            QUnit.test('returns a clone', function(assert) {

                var c1 = g.Curve('0 100', '50 200', '150 0', '200 100');
                var c2 = c1.clone();
                assert.notOk(c1 === c2);
                assert.equal(c1.toString(), c2.toString());
                assert.ok(c1.equals(c2));
                assert.equal(c1.start.toString(), c2.start.toString());
                assert.equal(c1.controlPoint1.toString(), c2.controlPoint1.toString());
                assert.equal(c1.controlPoint2.toString(), c2.controlPoint2.toString());
                assert.equal(c1.end.toString(), c2.end.toString());
            });
        });

        QUnit.module('divide()', function() {

            QUnit.test('sanity', function(assert) {

                var curveDivide1 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(0.5); // normal
                assert.ok(Array.isArray(curveDivide1));
                assert.equal(curveDivide1.length, 2);
                assert.ok(curveDivide1[0] instanceof g.Curve);
                assert.ok(curveDivide1[1] instanceof g.Curve);

                var curveDivide2 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(0); // minimum
                assert.ok(Array.isArray(curveDivide2));
                assert.equal(curveDivide2.length, 2);
                assert.ok(curveDivide2[0] instanceof g.Curve);
                assert.ok(curveDivide2[1] instanceof g.Curve);

                var curveDivide3 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(-1); // too little
                assert.ok(Array.isArray(curveDivide3));
                assert.equal(curveDivide3.length, 2);
                assert.ok(curveDivide3[0] instanceof g.Curve);
                assert.ok(curveDivide3[1] instanceof g.Curve);

                var curveDivide4 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(1); // maximum
                assert.ok(Array.isArray(curveDivide4));
                assert.equal(curveDivide4.length, 2);
                assert.ok(curveDivide4[0] instanceof g.Curve);
                assert.ok(curveDivide4[1] instanceof g.Curve);

                var curveDivide5 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(10); // too much
                assert.ok(Array.isArray(curveDivide5));
                assert.equal(curveDivide5.length, 2);
                assert.ok(curveDivide5[0] instanceof g.Curve);
                assert.ok(curveDivide5[1] instanceof g.Curve);
            });

            QUnit.test('returns an array with two curves, divided at provided `t`', function(assert) {

                var curveDivide1 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(0.5);
                assert.equal(curveDivide1[0].toString(), 'C 0@100 25@150 62.5@125 100@100');
                assert.equal(curveDivide1[1].toString(), 'C 100@100 137.5@75 175@50 200@100');

                var curveDivide2 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(0);
                assert.equal(curveDivide2[0].toString(), 'C 0@100 0@100 0@100 0@100');
                assert.equal(curveDivide2[1].toString(), 'C 0@100 50@200 150@0 200@100');

                var curveDivide3 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(-1);
                assert.equal(curveDivide3[0].toString(), 'C 0@100 0@100 0@100 0@100');
                assert.equal(curveDivide3[1].toString(), 'C 0@100 50@200 150@0 200@100');

                var curveDivide4 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(1);
                assert.equal(curveDivide4[0].toString(), 'C 0@100 50@200 150@0 200@100');
                assert.equal(curveDivide4[1].toString(), 'C 200@100 200@100 200@100 200@100');

                var curveDivide5 = g.Curve('0 100', '50 200', '150 0', '200 100').divide(10);
                assert.equal(curveDivide5[0].toString(), 'C 0@100 50@200 150@0 200@100');
                assert.equal(curveDivide5[1].toString(), 'C 200@100 200@100 200@100 200@100');
            });
        });

        QUnit.module('endpointDistance()', function() {

            QUnit.test('sanity', function(assert) {

                assert.equal(typeof g.Curve('0 100', '50 200', '150 0', '200 100').endpointDistance(), 'number');
            });

            QUnit.test('returns distance between start and end', function(assert) {

                assert.equal(g.Curve('0 100', '50 200', '150 0', '200 100').endpointDistance(), 200);
            });
        });

        QUnit.module('equals()', function() {

            QUnit.test('sanity', function(assert) {

                var curve1 = g.Curve('0 100', '50 200', '150 0', '200 100');
                var curve2 = g.Curve('0 100', '50 200', '150 0', '200 100'); // same
                var curve3 = g.Curve('200 100', '150 0', '50 200', '0 100'); // reverse
                var curve4 = g.Curve('0 100', '0 100', '200 100', '200 100'); // different

                assert.equal(typeof curve1.equals(curve2), 'boolean');
                assert.equal(typeof curve1.equals(curve3), 'boolean');
                assert.equal(typeof curve1.equals(curve4), 'boolean');
                assert.equal(typeof curve1.equals(null), 'boolean');
                assert.equal(typeof curve1.equals(undefined), 'boolean');
            });

            QUnit.test('checks whether two curves are exactly the same', function(assert) {

                var curve1 = g.Curve('0 100', '50 200', '150 0', '200 100');
                var curve2 = g.Curve('0 100', '50 200', '150 0', '200 100');
                var curve3 = g.Curve('200 100', '150 0', '50 200', '0 100');
                var curve4 = g.Curve('0 100', '0 100', '200 100', '200 100');

                assert.equal(curve1.equals(curve2), true);
                assert.equal(curve1.equals(curve3), false);
                assert.equal(curve1.equals(curve4), false);
                assert.equal(curve1.equals(null), false);
                assert.equal(curve1.equals(undefined), false);
            });
        });

        QUnit.module('getSkeletonPoints()', function() {

            QUnit.test('sanity', function(assert) {

                var curveSkeletonPoints1 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(0.5); // normal
                assert.equal(typeof curveSkeletonPoints1, 'object');
                assert.ok(curveSkeletonPoints1.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints1.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints1.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints1.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints1.dividerControlPoint2 instanceof g.Point);

                var curveSkeletonPoints2 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(0); // minimum
                assert.equal(typeof curveSkeletonPoints2, 'object');
                assert.ok(curveSkeletonPoints2.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints2.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints2.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints2.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints2.dividerControlPoint2 instanceof g.Point);

                var curveSkeletonPoints3 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(-1); // too little
                assert.equal(typeof curveSkeletonPoints3, 'object');
                assert.ok(curveSkeletonPoints3.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints3.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints3.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints3.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints3.dividerControlPoint2 instanceof g.Point);

                var curveSkeletonPoints4 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(1); // maximum
                assert.equal(typeof curveSkeletonPoints4, 'object');
                assert.ok(curveSkeletonPoints4.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints4.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints4.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints4.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints4.dividerControlPoint2 instanceof g.Point);

                var curveSkeletonPoints5 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(10); // too much
                assert.equal(typeof curveSkeletonPoints5, 'object');
                assert.ok(curveSkeletonPoints5.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints5.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints5.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints5.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints5.dividerControlPoint2 instanceof g.Point);
            });

            QUnit.test('returns points necessary for division', function(assert) {

                var curveSkeletonPoints1 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(0.5);
                assert.equal(curveSkeletonPoints1.startControlPoint1.toString(), '25@150');
                assert.equal(curveSkeletonPoints1.startControlPoint2.toString(), '62.5@125');
                assert.equal(curveSkeletonPoints1.divider.toString(), '100@100');
                assert.equal(curveSkeletonPoints1.dividerControlPoint1.toString(), '137.5@75');
                assert.equal(curveSkeletonPoints1.dividerControlPoint2.toString(), '175@50');

                var curveSkeletonPoints2 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(0);
                assert.equal(curveSkeletonPoints2.startControlPoint1.toString(), '0@100');
                assert.equal(curveSkeletonPoints2.startControlPoint2.toString(), '0@100');
                assert.equal(curveSkeletonPoints2.divider.toString(), '0@100');
                assert.equal(curveSkeletonPoints2.dividerControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints2.dividerControlPoint2.toString(), '150@0');

                var curveSkeletonPoints3 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(-1);
                assert.equal(curveSkeletonPoints3.startControlPoint1.toString(), '0@100');
                assert.equal(curveSkeletonPoints3.startControlPoint2.toString(), '0@100');
                assert.equal(curveSkeletonPoints3.divider.toString(), '0@100');
                assert.equal(curveSkeletonPoints3.dividerControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints3.dividerControlPoint2.toString(), '150@0');

                var curveSkeletonPoints4 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(1);
                assert.equal(curveSkeletonPoints4.startControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints4.startControlPoint2.toString(), '150@0');
                assert.equal(curveSkeletonPoints4.divider.toString(), '200@100');
                assert.equal(curveSkeletonPoints4.dividerControlPoint1.toString(), '200@100');
                assert.equal(curveSkeletonPoints4.dividerControlPoint2.toString(), '200@100');

                var curveSkeletonPoints5 = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(10);
                assert.equal(curveSkeletonPoints5.startControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints5.startControlPoint2.toString(), '150@0');
                assert.equal(curveSkeletonPoints5.divider.toString(), '200@100');
                assert.equal(curveSkeletonPoints5.dividerControlPoint1.toString(), '200@100');
                assert.equal(curveSkeletonPoints5.dividerControlPoint2.toString(), '200@100');
            });
        });

        QUnit.module('getSubdivisions()', function() {

            QUnit.test('sanity', function(assert) {

                // TODO
            });

            QUnit.test('returns an array with curve subdivisions up to precision', function(assert) {

                // TODO
            });
        });

        QUnit.module('length()', function() {

            QUnit.test('sanity', function(assert) {

                // TODO
            });

            QUnit.test('returns the length of the curve up to precision', function(assert) {

                // TODO
            });
        });

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                // TODO
            });

            QUnit.test('returns a point at given length ratio up to precision', function(assert) {

                // TODO
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                // TODO
            });

            QUnit.test('returns a point at given length up to precision', function(assert) {

                // TODO
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0, g.Point('10 10')) instanceof g.Curve);

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1, g.Point('10 10')) instanceof g.Curve);

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0, g.Point('10 10')) instanceof g.Curve);

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1, g.Point('10 10')) instanceof g.Curve);

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10, g.Point('10 10')) instanceof g.Curve);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0).toString(), g.Curve('0 0', '0 0', '0 0', '0 0').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0, g.Point('0 0')).toString(), g.Curve('0 0', '0 0', '0 0', '0 0').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0, g.Point('10 10')).toString(), g.Curve('10 10', '10 10', '10 10', '10 10').toString());

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1).toString(), g.Curve('0 10', '0 40', '0 40', '0 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1, g.Point('0 0')).toString(), g.Curve('0 10', '0 40', '0 40', '0 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1, g.Point('10 10')).toString(), g.Curve('10 10', '10 40', '10 40', '10 10').toString());

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0).toString(), g.Curve('10 0', '10 0', '50 0', '50 0').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0, g.Point('0 0')).toString(), g.Curve('10 0', '10 0', '50 0', '50 0').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0, g.Point('10 10')).toString(), g.Curve('10 10', '10 10', '50 10', '50 10').toString());

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1).toString(), g.Curve('10 10', '10 40', '50 40', '50 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1, g.Point('0 0')).toString(), g.Curve('10 10', '10 40', '50 40', '50 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1, g.Point('10 10')).toString(), g.Curve('10 10', '10 40', '50 40', '50 10').toString());

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10).toString(), g.Curve('100 100', '100 400', '500 400', '500 100').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10, g.Point('0 0')).toString(), g.Curve('100 100', '100 400', '500 400', '500 100').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10, g.Point('10 10')).toString(), g.Curve('10 10', '10 310', '410 310', '410 10').toString());
            });
        });

        QUnit.module('tPoint()', function() {

            QUnit.test('sanity', function(assert) {

                // TODO
            });

            QUnit.test('returns a point at given `t` value', function(assert) {

                // TODO
            });
        });

        QUnit.module('translate()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').translate(0, 0) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').translate(0, 10) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').translate(10, 0) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').translate(10, 10) instanceof g.Curve);
            });

            QUnit.test('should return a translated version of self', function(assert) {

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').translate(0, 0).toString(), g.Curve('10 10', '10 40', '50 40', '50 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').translate(0, 10).toString(), g.Curve('10 20', '10 50', '50 50', '50 20').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').translate(10, 0).toString(), g.Curve('20 10', '20 40', '60 40', '60 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').translate(10, 10).toString(), g.Curve('20 20', '20 50', '60 50', '60 20').toString());
            });
        });

        QUnit.module('toPoints()', function() {

            QUnit.test('sanity', function(assert) {

                // TODO
            });

            QUnit.test('returns the curve as an array of points up to precision', function(assert) {

                // TODO
            });
        });

        QUnit.module('toPolyline()', function() {

            QUnit.test('sanity', function(assert) {

                // TODO
            });

            QUnit.test('returns the curve as a polyline up to precision', function(assert) {

                // TODO
            });
        });

        QUnit.module('toString()', function() {

        });
    });
});

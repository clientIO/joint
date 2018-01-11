'use strict';

QUnit.module('curve', function() {

    var $fixture = $('#qunit-fixture');

    var getSvg = function() {
        var svg = V('svg');
        svg.attr('width', 600);
        svg.attr('height', 800);
        $fixture.append(svg.node);

        return svg;
    };

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Curve object', function(assert) {

            var curve = new g.Curve();
            assert.ok(curve instanceof g.Curve, 'no arguments provided');

            var curve1 = new g.Curve('10 10', '10 40', '50 40', '50 10');
            assert.ok(curve1 instanceof g.Curve, 'returns instance of g.Curve');
            assert.notEqual(typeof curve1.start, 'undefined', 'has "start" property');
            assert.notEqual(typeof curve1.controlPoint1, 'undefined', 'has "controlPoint1" property');
            assert.notEqual(typeof curve1.controlPoint2, 'undefined', 'has "controlPoint2" property');
            assert.notEqual(typeof curve1.end, 'undefined', 'has "end" property');
            assert.equal(curve1.start.x, 10, 'start.x is correct');
            assert.equal(curve1.start.y, 10, 'start.y is correct');
            assert.equal(curve1.controlPoint1.x, 10, 'controlPoint1.x is correct');
            assert.equal(curve1.controlPoint1.y, 40, 'controlPoint1.y is correct');
            assert.equal(curve1.controlPoint2.x, 50, 'controlPoint2.x is correct');
            assert.equal(curve1.controlPoint2.y, 40, 'controlPoint2.y is correct');
            assert.equal(curve1.end.x, 50, 'end.x is correct');
            assert.equal(curve1.end.y, 10, 'end.y is correct');

            var curve2 = new g.Curve(curve1);
            assert.ok(curve2 instanceof g.Curve, 'returns instance of g.Curve');
            assert.notEqual(typeof curve2.start, 'undefined', 'has "start" property');
            assert.notEqual(typeof curve2.controlPoint1, 'undefined', 'has "controlPoint1" property');
            assert.notEqual(typeof curve2.controlPoint2, 'undefined', 'has "controlPoint2" property');
            assert.notEqual(typeof curve2.end, 'undefined', 'has "end" property');
            assert.notOk(curve1 === curve2);
            assert.equal(curve1.toString(), curve2.toString());
            assert.ok(curve1.equals(curve2));
        });
    });

    QUnit.module('throughPoints()', function() {

        QUnit.test('creates an array of Curve objects', function(assert) {

            var points;
            var curves;
            var path;

            var error;

            try {
                curves = g.Curve.throughPoints();
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when called with no arguments.');

            points = [new g.Point(100, 100)];
            try {
                curves = g.Curve.throughPoints(points);
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when called with one argument.');

            points = [new g.Point(100, 100), new g.Point(200, 200)];
            curves = g.Curve.throughPoints(points);
            path = new g.Path(curves);
            assert.ok(Array.isArray(curves), 'returns an array');
            assert.ok(curves[0] instanceof g.Curve, 'array elements are curves');
            assert.ok(path instanceof g.Path, 'can be used to create a path');
            assert.equal(path.serialize(), 'M 100 100 C 133.33333333333334 133.33333333333334 166.66666666666669 166.66666666666669 200 200', 'path has correct serialization');

            points = [new g.Point(0, 100), new g.Point(45.3125, 128.125), new g.Point(154.6875, 71.875), new g.Point(200, 100)];
            curves = g.Curve.throughPoints(points);
            path = new g.Path(curves);
            assert.ok(Array.isArray(curves), 'returns an array');
            assert.ok(curves[0] instanceof g.Curve, 'array elements are curves');
            assert.ok(path instanceof g.Path, 'can be used to create a path');
            assert.equal(path.serialize(), 'M 0 100 C 7.986111111111107 118.75 15.972222222222214 137.5 45.3125 128.125 C 74.65277777777779 118.75 125.34722222222223 81.25 154.6875 71.875 C 184.02777777777777 62.49999999999999 192.01388888888889 81.25 200 100', 'path has correct serialization');
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.ok(curve.bbox() instanceof g.Rect);
            });

            QUnit.test('returns tight bounding box of the curve', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.equal(curve.bbox().toString(), '10@10 50@32.5');
            });
        });

        QUnit.module('clone()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.ok(curve.clone() instanceof g.Curve);
            });

            QUnit.test('returns a clone', function(assert) {

                var curve1 = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var curve2 = curve1.clone();
                assert.notOk(curve1 === curve2);
                assert.equal(curve1.toString(), curve2.toString());
                assert.ok(curve1.equals(curve2));
                assert.equal(curve1.start.toString(), curve2.start.toString());
                assert.equal(curve1.controlPoint1.toString(), curve2.controlPoint1.toString());
                assert.equal(curve1.controlPoint2.toString(), curve2.controlPoint2.toString());
                assert.equal(curve1.end.toString(), curve2.end.toString());
            });
        });

        QUnit.module('closestPoint()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point = new g.Point(100, 100);
                assert.ok(curve.closestPoint(point) instanceof g.Point);
                assert.ok(curve.closestPoint(point, { precision: 0 }) instanceof g.Point);
                assert.ok(curve.closestPoint(point, { precision: 1 }) instanceof g.Point);
                assert.ok(curve.closestPoint(point, { precision: 2 }) instanceof g.Point);
                assert.ok(curve.closestPoint(point, { precision: 3 }) instanceof g.Point);
                assert.ok(curve.closestPoint(point, { precision: 4 }) instanceof g.Point);
                assert.ok(curve.closestPoint(point, { precision: 5 }) instanceof g.Point);
            });

            QUnit.test('returns point closest to a given point up to precision', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point;

                point = new g.Point(100, 100);
                assert.equal(curve.closestPoint(point).toString(), '100@100');
                assert.equal(curve.closestPoint(point, { precision: 0 }).toString(), '0@100');
                assert.equal(curve.closestPoint(point, { precision: 1 }).toString(), '100@100');
                assert.equal(curve.closestPoint(point, { precision: 2 }).toString(), '100@100');
                assert.equal(curve.closestPoint(point, { precision: 3 }).toString(), '100@100');
                assert.equal(curve.closestPoint(point, { precision: 4 }).toString(), '100@100');
                assert.equal(curve.closestPoint(point, { precision: 5 }).toString(), '100@100');

                point = new g.Point(125, 0);
                assert.equal(curve.closestPoint(point).toString(), '148.1719970703125@73.468017578125');
                assert.equal(curve.closestPoint(point, { precision: 0 }).toString(), '200@100');
                assert.equal(curve.closestPoint(point, { precision: 1 }).toString(), '154.6875@71.875');
                assert.equal(curve.closestPoint(point, { precision: 2 }).toString(), '141.5283203125@75.830078125');
                assert.equal(curve.closestPoint(point, { precision: 3 }).toString(), '148.1719970703125@73.468017578125');
                assert.equal(curve.closestPoint(point, { precision: 4 }).toString(), '148.1719970703125@73.468017578125');
                assert.equal(curve.closestPoint(point, { precision: 5 }).toString(), '147.76033237576485@73.59425574541092');
            });
        });

        QUnit.module('closestPointLength()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point = new g.Point(100, 100);
                assert.equal(typeof curve.closestPointLength(point), 'number');
                assert.equal(typeof curve.closestPointLength(point, { precision: 0 }), 'number');
                assert.equal(typeof curve.closestPointLength(point, { precision: 1 }), 'number');
                assert.equal(typeof curve.closestPointLength(point, { precision: 2 }), 'number');
                assert.equal(typeof curve.closestPointLength(point, { precision: 3 }), 'number');
                assert.equal(typeof curve.closestPointLength(point, { precision: 4 }), 'number');
                assert.equal(typeof curve.closestPointLength(point, { precision: 5 }), 'number');
            });

            QUnit.test('returns length closest to a given point up to precision', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point;

                point = new g.Point(100, 100);
                assert.equal(curve.closestPointLength(point), 119.83144621268787);
                assert.equal(curve.closestPointLength(point, { precision: 0 }), 0);
                assert.equal(curve.closestPointLength(point, { precision: 1 }), 118.71384231844745);
                assert.equal(curve.closestPointLength(point, { precision: 2 }), 119.56582529496731);
                assert.equal(curve.closestPointLength(point, { precision: 3 }), 119.83144621268787);
                assert.equal(curve.closestPointLength(point, { precision: 4 }), 119.8480263853086);
                assert.equal(curve.closestPointLength(point, { precision: 5 }), 119.84885532824434);

                point = new g.Point(125, 0);
                assert.equal(curve.closestPointLength(point), 174.99499668773748);
                assert.equal(curve.closestPointLength(point, { precision: 0 }), 200);
                assert.equal(curve.closestPointLength(point, { precision: 1 }), 178.91071717402883);
                assert.equal(curve.closestPointLength(point, { precision: 2 }), 167.4224378522156);
                assert.equal(curve.closestPointLength(point, { precision: 3 }), 174.99499668773748);
                assert.equal(curve.closestPointLength(point, { precision: 4 }), 175.0319261701376);
                assert.equal(curve.closestPointLength(point, { precision: 5 }), 174.60364946776332);
            });
        });

        QUnit.module('closestPointNormalizedLength()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point = new g.Point(100, 100);
                assert.equal(typeof curve.closestPointNormalizedLength(point), 'number');
                assert.equal(typeof curve.closestPointNormalizedLength(point, { precision: 0 }), 'number');
                assert.equal(typeof curve.closestPointNormalizedLength(point, { precision: 1 }), 'number');
                assert.equal(typeof curve.closestPointNormalizedLength(point, { precision: 2 }), 'number');
                assert.equal(typeof curve.closestPointNormalizedLength(point, { precision: 3 }), 'number');
                assert.equal(typeof curve.closestPointNormalizedLength(point, { precision: 4 }), 'number');
                assert.equal(typeof curve.closestPointNormalizedLength(point, { precision: 5 }), 'number');
            });

            QUnit.test('returns normalized length closest to a given point up to precision', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point;

                point = new g.Point(100, 100);
                assert.equal(curve.closestPointNormalizedLength(point), 0.5);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 0 }), 0);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 1 }), 0.5);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 2 }), 0.5);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 3 }), 0.5);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 4 }), 0.4999999999999999);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 5 }), 0.5000000000000001);

                point = new g.Point(125, 0);
                assert.equal(curve.closestPointNormalizedLength(point), 0.7301714291970585);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 0 }), 1);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 1 }), 0.7535377243291667);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 2 }), 0.7001266350112445);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 3 }), 0.7301714291970585);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 4 }), 0.7302244828271682);
                assert.equal(curve.closestPointNormalizedLength(point, { precision: 5 }), 0.7284326954544352);
            });
        });

        QUnit.module('closestPointT()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point = new g.Point(100, 100);
                assert.equal(typeof curve.closestPointT(point), 'number');
                assert.equal(typeof curve.closestPointT(point, { precision: 0 }), 'number');
                assert.equal(typeof curve.closestPointT(point, { precision: 1 }), 'number');
                assert.equal(typeof curve.closestPointT(point, { precision: 2 }), 'number');
                assert.equal(typeof curve.closestPointT(point, { precision: 3 }), 'number');
                assert.equal(typeof curve.closestPointT(point, { precision: 4 }), 'number');
                assert.equal(typeof curve.closestPointT(point, { precision: 5 }), 'number');
            });

            QUnit.test('returns t closest to a given point up to precision', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point;

                point = new g.Point(100, 100);
                assert.equal(curve.closestPointT(point), 0.5);
                assert.equal(curve.closestPointT(point, { precision: 0 }), 0);
                assert.equal(curve.closestPointT(point, { precision: 1 }), 0.5);
                assert.equal(curve.closestPointT(point, { precision: 2 }), 0.5);
                assert.equal(curve.closestPointT(point, { precision: 3 }), 0.5);
                assert.equal(curve.closestPointT(point, { precision: 4 }), 0.5);
                assert.equal(curve.closestPointT(point, { precision: 5 }), 0.5);

                point = new g.Point(125, 0);
                assert.equal(curve.closestPointT(point), 0.71875);
                assert.equal(curve.closestPointT(point, { precision: 0 }), 1);
                assert.equal(curve.closestPointT(point, { precision: 1 }), 0.75);
                assert.equal(curve.closestPointT(point, { precision: 2 }), 0.6875);
                assert.equal(curve.closestPointT(point, { precision: 3 }), 0.71875);
                assert.equal(curve.closestPointT(point, { precision: 4 }), 0.71875);
                assert.equal(curve.closestPointT(point, { precision: 5 }), 0.716796875);
            });

            QUnit.test('assert precision compared to pointAtT', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var t = 0.4;
                assert.ok(Math.abs(curve.closestPointT(curve.pointAtT(t), { precision: 0 }) - t) < Math.pow(10, -0));
                assert.ok(Math.abs(curve.closestPointT(curve.pointAtT(t), { precision: 1 }) - t) < Math.pow(10, -1));
                assert.ok(Math.abs(curve.closestPointT(curve.pointAtT(t), { precision: 2 }) - t) < Math.pow(10, -2));
                assert.ok(Math.abs(curve.closestPointT(curve.pointAtT(t), { precision: 3 }) - t) < Math.pow(10, -3));
                assert.ok(Math.abs(curve.closestPointT(curve.pointAtT(t), { precision: 4 }) - t) < Math.pow(10, -4));
                assert.ok(Math.abs(curve.closestPointT(curve.pointAtT(t), { precision: 5 }) - t) < Math.pow(10, -5));
            });
        });

        QUnit.module('closestPointTangent()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point = new g.Point(100, 100);
                assert.ok(curve.closestPointTangent(point) instanceof g.Line);
                assert.ok(curve.closestPointTangent(point, { precision: 0 }) instanceof g.Line);
                assert.ok(curve.closestPointTangent(point, { precision: 1 }) instanceof g.Line);
                assert.ok(curve.closestPointTangent(point, { precision: 2 }) instanceof g.Line);
                assert.ok(curve.closestPointTangent(point, { precision: 3 }) instanceof g.Line);
                assert.ok(curve.closestPointTangent(point, { precision: 4 }) instanceof g.Line);
                assert.ok(curve.closestPointTangent(point, { precision: 5 }) instanceof g.Line);
            });

            QUnit.test('returns tangent at point closest to a given point up to precision', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var point;

                point = new g.Point(100, 100);
                assert.equal(curve.closestPointTangent(point).toString(), '100@100 175@50');
                assert.equal(curve.closestPointTangent(point, { precision: 0 }).toString(), '0@100 50@200');
                assert.equal(curve.closestPointTangent(point, { precision: 1 }).toString(), '100@100 175@50');
                assert.equal(curve.closestPointTangent(point, { precision: 2 }).toString(), '100@100 175@50');
                assert.equal(curve.closestPointTangent(point, { precision: 3 }).toString(), '100@100 175@50');
                assert.equal(curve.closestPointTangent(point, { precision: 4 }).toString(), '100@100 175@50');
                assert.equal(curve.closestPointTangent(point, { precision: 5 }).toString(), '100@100 175@50');

                point = new g.Point(125, 0);
                assert.equal(curve.closestPointTangent(point).toString(), '148.1719970703125@73.468017578125 218.3868408203125@52.178955078125');
                assert.equal(curve.closestPointTangent(point, { precision: 0 }).toString(), '200@100 250@200');
                assert.equal(curve.closestPointTangent(point, { precision: 1 }).toString(), '154.6875@71.875 223.4375@59.375');
                assert.equal(curve.closestPointTangent(point, { precision: 2 }).toString(), '141.5283203125@75.830078125 213.0126953125@46.923828125');
                assert.equal(curve.closestPointTangent(point, { precision: 3 }).toString(), '148.1719970703125@73.468017578125 218.3868408203125@52.178955078125');
                assert.equal(curve.closestPointTangent(point, { precision: 4 }).toString(), '148.1719970703125@73.468017578125 218.3868408203125@52.178955078125');
                assert.equal(curve.closestPointTangent(point, { precision: 5 }).toString(), '147.76033237576485@73.59425574541092 218.06024387478828@51.794786751270294');
            });
        });

        QUnit.module('divide()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var curveDivide;

                curveDivide = curve.divide(0.5); // normal
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);

                curveDivide = curve.divide(0); // minimum
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);

                curveDivide = curve.divide(-1); // too little
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);

                curveDivide = curve.divide(1); // maximum
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);

                curveDivide = curve.divide(10); // too much
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);
            });

            QUnit.test('returns an array with two curves, divided at provided `t`', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var curveDivide;

                curveDivide = curve.divide(0.5);
                assert.equal(curveDivide[0].toString(), '0@100 25@150 62.5@125 100@100');
                assert.equal(curveDivide[1].toString(), '100@100 137.5@75 175@50 200@100');

                curveDivide = curve.divide(0);
                assert.equal(curveDivide[0].toString(), '0@100 0@100 0@100 0@100');
                assert.equal(curveDivide[1].toString(), '0@100 50@200 150@0 200@100');

                curveDivide = curve.divide(-1);
                assert.equal(curveDivide[0].toString(), '0@100 0@100 0@100 0@100');
                assert.equal(curveDivide[1].toString(), '0@100 50@200 150@0 200@100');

                curveDivide = curve.divide(1);
                assert.equal(curveDivide[0].toString(), '0@100 50@200 150@0 200@100');
                assert.equal(curveDivide[1].toString(), '200@100 200@100 200@100 200@100');

                curveDivide = curve.divide(10);
                assert.equal(curveDivide[0].toString(), '0@100 50@200 150@0 200@100');
                assert.equal(curveDivide[1].toString(), '200@100 200@100 200@100 200@100');
            });
        });

        QUnit.module('endpointDistance()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.equal(typeof curve.endpointDistance(), 'number');
            });

            QUnit.test('returns distance between start and end', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.equal(curve.endpointDistance(), 200);
            });
        });

        QUnit.module('equals()', function() {

            QUnit.test('sanity', function(assert) {

                var curve1 = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var curve2 = new g.Curve('0 100', '50 200', '150 0', '200 100'); // same
                var curve3 = new g.Curve('200 100', '150 0', '50 200', '0 100'); // reverse
                var curve4 = new g.Curve('0 100', '0 100', '200 100', '200 100'); // different

                assert.equal(typeof curve1.equals(curve2), 'boolean');
                assert.equal(typeof curve1.equals(curve3), 'boolean');
                assert.equal(typeof curve1.equals(curve4), 'boolean');
                assert.equal(typeof curve1.equals(null), 'boolean');
                assert.equal(typeof curve1.equals(undefined), 'boolean');
            });

            QUnit.test('checks whether two curves are exactly the same', function(assert) {

                var curve1 = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var curve2 = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var curve3 = new g.Curve('200 100', '150 0', '50 200', '0 100');
                var curve4 = new g.Curve('0 100', '0 100', '200 100', '200 100');

                assert.equal(curve1.equals(curve2), true);
                assert.equal(curve1.equals(curve3), false);
                assert.equal(curve1.equals(curve4), false);
                assert.equal(curve1.equals(null), false);
                assert.equal(curve1.equals(undefined), false);
            });
        });

        QUnit.module('getSkeletonPoints()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var curveSkeletonPoints;

                curveSkeletonPoints = curve.getSkeletonPoints(0.5); // normal
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);

                curveSkeletonPoints = curve.getSkeletonPoints(0); // minimum
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);

                curveSkeletonPoints = curve.getSkeletonPoints(-1); // too little
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);

                curveSkeletonPoints = curve.getSkeletonPoints(1); // maximum
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);

                curveSkeletonPoints = curve.getSkeletonPoints(10); // too much
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);
            });

            QUnit.test('returns points necessary for division', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                var curveSkeletonPoints;

                curveSkeletonPoints = curve.getSkeletonPoints(0.5);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '25@150');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '62.5@125');
                assert.equal(curveSkeletonPoints.divider.toString(), '100@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '137.5@75');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '175@50');

                curveSkeletonPoints = curve.getSkeletonPoints(0);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '0@100');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '0@100');
                assert.equal(curveSkeletonPoints.divider.toString(), '0@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '150@0');

                curveSkeletonPoints = curve.getSkeletonPoints(-1);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '0@100');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '0@100');
                assert.equal(curveSkeletonPoints.divider.toString(), '0@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '150@0');

                curveSkeletonPoints = curve.getSkeletonPoints(1);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '150@0');
                assert.equal(curveSkeletonPoints.divider.toString(), '200@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '200@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '200@100');

                curveSkeletonPoints = curve.getSkeletonPoints(10);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '150@0');
                assert.equal(curveSkeletonPoints.divider.toString(), '200@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '200@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '200@100');
            });
        });

        QUnit.module('getSubdivisions()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.equal(Array.isArray(curve.getSubdivisions()), true);
                assert.equal(Array.isArray(curve.getSubdivisions({ precision: 0 })), true);
                assert.equal(Array.isArray(curve.getSubdivisions({ precision: 1 })), true);
                assert.equal(Array.isArray(curve.getSubdivisions({ precision: 2 })), true);
                assert.equal(Array.isArray(curve.getSubdivisions({ precision: 3 })), true);
                assert.equal(Array.isArray(curve.getSubdivisions({ precision: 4 })), true);
                assert.equal(Array.isArray(curve.getSubdivisions({ precision: 5 })), true);
            });

            QUnit.test('returns an array with curve subdivisions up to precision', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.deepEqual(curve.getSubdivisions({ precision: 0 }), [
                    new g.Curve(new g.Point(0, 100), new g.Point(50, 200), new g.Point(150, 0), new g.Point(200, 100))
                ]);
                assert.deepEqual(curve.getSubdivisions({ precision: 1 }), [
                    new g.Curve(new g.Point(0, 100), new g.Point(6.25, 112.5), new g.Point(13.28125, 120.3125), new g.Point(20.8984375, 124.609375)),
                    new g.Curve(new g.Point(20.8984375, 124.609375), new g.Point(28.515625, 128.90625), new g.Point(36.71875, 129.6875), new g.Point(45.3125, 128.125)),
                    new g.Curve(new g.Point(45.3125, 128.125), new g.Point(53.90625, 126.5625), new g.Point(62.890625, 122.65625), new g.Point(72.0703125, 117.578125)),
                    new g.Curve(new g.Point(72.0703125, 117.578125), new g.Point(81.25, 112.5), new g.Point(90.625, 106.25), new g.Point(100, 100)),
                    new g.Curve(new g.Point(100, 100), new g.Point(109.375, 93.75), new g.Point(118.75, 87.5), new g.Point(127.9296875, 82.421875)),
                    new g.Curve(new g.Point(127.9296875, 82.421875), new g.Point(137.109375, 77.34375), new g.Point(146.09375, 73.4375), new g.Point(154.6875, 71.875)),
                    new g.Curve(new g.Point(154.6875, 71.875), new g.Point(163.28125, 70.3125), new g.Point(171.484375, 71.09375), new g.Point(179.1015625, 75.390625)),
                    new g.Curve(new g.Point(179.1015625, 75.390625), new g.Point(186.71875, 79.6875), new g.Point(193.75, 87.5), new g.Point(200, 100))
                ]);
                assert.deepEqual(curve.getSubdivisions({ precision: 2 }), [
                    new g.Curve(new g.Point(0, 100), new g.Point(3.125, 106.25), new g.Point(6.4453125, 111.328125), new g.Point(9.9365234375, 115.380859375)),
                    new g.Curve(new g.Point(9.9365234375, 115.380859375), new g.Point(13.427734375, 119.43359375), new g.Point(17.08984375, 122.4609375), new g.Point(20.8984375, 124.609375)),
                    new g.Curve(new g.Point(20.8984375, 124.609375), new g.Point(24.70703125, 126.7578125), new g.Point(28.662109375, 128.02734375), new g.Point(32.7392578125, 128.564453125)),
                    new g.Curve(new g.Point(32.7392578125, 128.564453125), new g.Point(36.81640625, 129.1015625), new g.Point(41.015625, 128.90625), new g.Point(45.3125, 128.125)),
                    new g.Curve(new g.Point(45.3125, 128.125), new g.Point(49.609375, 127.34375), new g.Point(54.00390625, 125.9765625), new g.Point(58.4716796875, 124.169921875)),
                    new g.Curve(new g.Point(58.4716796875, 124.169921875), new g.Point(62.939453125, 122.36328125), new g.Point(67.48046875, 120.1171875), new g.Point(72.0703125, 117.578125)),
                    new g.Curve(new g.Point(72.0703125, 117.578125), new g.Point(76.66015625, 115.0390625), new g.Point(81.298828125, 112.20703125), new g.Point(85.9619140625, 109.228515625)),
                    new g.Curve(new g.Point(85.9619140625, 109.228515625), new g.Point(90.625, 106.25), new g.Point(95.3125, 103.125), new g.Point(100, 100)),
                    new g.Curve(new g.Point(100, 100), new g.Point(104.6875, 96.875), new g.Point(109.375, 93.75), new g.Point(114.0380859375, 90.771484375)),
                    new g.Curve(new g.Point(114.0380859375, 90.771484375), new g.Point(118.701171875, 87.79296875), new g.Point(123.33984375, 84.9609375), new g.Point(127.9296875, 82.421875)),
                    new g.Curve(new g.Point(127.9296875, 82.421875), new g.Point(132.51953125, 79.8828125), new g.Point(137.060546875, 77.63671875), new g.Point(141.5283203125, 75.830078125)),
                    new g.Curve(new g.Point(141.5283203125, 75.830078125), new g.Point(145.99609375, 74.0234375), new g.Point(150.390625, 72.65625), new g.Point(154.6875, 71.875)),
                    new g.Curve(new g.Point(154.6875, 71.875), new g.Point(158.984375, 71.09375), new g.Point(163.18359375, 70.8984375), new g.Point(167.2607421875, 71.435546875)),
                    new g.Curve(new g.Point(167.2607421875, 71.435546875), new g.Point(171.337890625, 71.97265625), new g.Point(175.29296875, 73.2421875), new g.Point(179.1015625, 75.390625)),
                    new g.Curve(new g.Point(179.1015625, 75.390625), new g.Point(182.91015625, 77.5390625), new g.Point(186.572265625, 80.56640625), new g.Point(190.0634765625, 84.619140625)),
                    new g.Curve(new g.Point(190.0634765625, 84.619140625), new g.Point(193.5546875, 88.671875), new g.Point(196.875, 93.75), new g.Point(200, 100))
                ]);
            });
        });

        QUnit.module('isDifferentiable()', function() {

            QUnit.test('sanity', function(assert) {

                var curve;

                curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(typeof curve.isDifferentiable(), 'boolean');

                curve = new g.Curve('100 100', '100 100', '100 100', '100 0');
                assert.equal(typeof curve.isDifferentiable(), 'boolean');

                curve = new g.Curve('100 100', '100 100', '100 100', '100 100');
                assert.equal(typeof curve.isDifferentiable(), 'boolean');
            });

            QUnit.test('checks whether the curve is differentiable (can have tangents)', function(assert) {

                var curve;

                curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(curve.isDifferentiable(), true);

                curve = new g.Curve('100 100', '100 100', '100 100', '100 0');
                assert.equal(curve.isDifferentiable(), true);

                curve = new g.Curve('100 100', '100 100', '100 100', '100 100');
                assert.equal(curve.isDifferentiable(), false);
            });
        });

        QUnit.module('length()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(typeof curve.length(), 'number');
                assert.equal(typeof curve.length({ precision: 0 }), 'number');
                assert.equal(typeof curve.length({ precision: 1 }), 'number');
                assert.equal(typeof curve.length({ precision: 2 }), 'number');
                assert.equal(typeof curve.length({ precision: 3 }), 'number');
                assert.equal(typeof curve.length({ precision: 4 }), 'number');
                assert.equal(typeof curve.length({ precision: 5 }), 'number');
            });

            QUnit.test('returns the length of the curve up to precision', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(curve.length(), 399.96164987703463);
                assert.equal(curve.length({ precision: 0 }), 200);
                assert.equal(curve.length({ precision: 1 }), 390.1438222301384);
                assert.equal(curve.length({ precision: 2 }), 399.38625336882194);
                assert.equal(curve.length({ precision: 3 }), 399.96164987703463);
                assert.equal(curve.length({ precision: 4 }), 399.99041258236997);
                assert.equal(curve.length({ precision: 5 }), 399.9994007886072);
            });

            QUnit.test('compare to browser implementation', function(assert) {

                var svg = getSvg();

                var gCurve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                var gCurvePath = new g.Path(gCurve);
                var curvePath = V('path', { d: gCurvePath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(curvePath);

                assert.equal(Math.round(gCurve.length({ precision: 3 })), Math.round(curvePath.node.getTotalLength()));

                svg.remove();
            });
        });

        QUnit.module('lengthAtT()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                var t = 0.4;
                assert.equal(typeof curve.lengthAtT(t), 'number');
                assert.equal(typeof curve.lengthAtT(t, { precision: 0 }), 'number');
                assert.equal(typeof curve.lengthAtT(t, { precision: 1 }), 'number');
                assert.equal(typeof curve.lengthAtT(t, { precision: 2 }), 'number');
                assert.equal(typeof curve.lengthAtT(t, { precision: 3 }), 'number');
                assert.equal(typeof curve.lengthAtT(t, { precision: 4 }), 'number');
                assert.equal(typeof curve.lengthAtT(t, { precision: 5 }), 'number');

                assert.equal(typeof curve.lengthAtT(-1), 'number');

                assert.equal(typeof curve.lengthAtT(10), 'number');
                assert.equal(typeof curve.lengthAtT(10, { precision: 0 }), 'number');
                assert.equal(typeof curve.lengthAtT(10, { precision: 1 }), 'number');
                assert.equal(typeof curve.lengthAtT(10, { precision: 2 }), 'number');
                assert.equal(typeof curve.lengthAtT(10, { precision: 3 }), 'number');
                assert.equal(typeof curve.lengthAtT(10, { precision: 4 }), 'number');
                assert.equal(typeof curve.lengthAtT(10, { precision: 5 }), 'number');
            });

            QUnit.test('returns the length of the curve at given t up to precision', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                var t = 0.4;
                assert.equal(curve.lengthAtT(t), 169.56325023828208);
                assert.equal(curve.lengthAtT(t, { precision: 0 }), 160.28774126551286);
                assert.equal(curve.lengthAtT(t, { precision: 1 }), 169.01211016702965);
                assert.equal(curve.lengthAtT(t, { precision: 2 }), 169.4530058887065);
                assert.equal(curve.lengthAtT(t, { precision: 3 }), 169.56325023828208);
                assert.equal(curve.lengthAtT(t, { precision: 4 }), 169.597703116387);
                assert.equal(curve.lengthAtT(t, { precision: 5 }), 169.5998564446829);

                assert.equal(curve.lengthAtT(-1), 0);

                assert.equal(curve.lengthAtT(10), 399.96164987703463);
                assert.equal(curve.lengthAtT(10, { precision: 0 }), 200);
                assert.equal(curve.lengthAtT(10, { precision: 1 }), 390.1438222301384);
                assert.equal(curve.lengthAtT(10, { precision: 2 }), 399.38625336882194);
                assert.equal(curve.lengthAtT(10, { precision: 3 }), 399.96164987703463);
                assert.equal(curve.lengthAtT(10, { precision: 4 }), 399.99041258236997);
                assert.equal(curve.lengthAtT(10, { precision: 5 }), 399.9994007886072);
            });

            QUnit.test('compare to length', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(curve.lengthAtT(10), curve.length());
                assert.equal(curve.lengthAtT(10, { precision: 0 }), curve.length({ precision: 0 }));
                assert.equal(curve.lengthAtT(10, { precision: 1 }), curve.length({ precision: 1 }));
                assert.equal(curve.lengthAtT(10, { precision: 2 }), curve.length({ precision: 2 }));
                assert.equal(curve.lengthAtT(10, { precision: 3 }), curve.length({ precision: 3 }));
                assert.equal(curve.lengthAtT(10, { precision: 4 }), curve.length({ precision: 4 }));
                assert.equal(curve.lengthAtT(10, { precision: 5 }), curve.length({ precision: 5 }));
            });
        });

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                var ratio = 0.4;
                assert.ok(curve.pointAt(ratio) instanceof g.Point);
                assert.ok(curve.pointAt(ratio, { precision: 0 }) instanceof g.Point);
                assert.ok(curve.pointAt(ratio, { precision: 1 }) instanceof g.Point);
                assert.ok(curve.pointAt(ratio, { precision: 2 }) instanceof g.Point);
                assert.ok(curve.pointAt(ratio, { precision: 3 }) instanceof g.Point);
                assert.ok(curve.pointAt(ratio, { precision: 4 }) instanceof g.Point);
                assert.ok(curve.pointAt(ratio, { precision: 5 }) instanceof g.Point);

                assert.ok(curve.pointAt(-1) instanceof g.Point);
                assert.ok(curve.pointAt(10) instanceof g.Point);
            });

            QUnit.test('returns a point at given length ratio up to precision', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                var ratio = 0.4;
                assert.equal(curve.pointAt(ratio).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(curve.pointAt(ratio, { precision: 0 }).toString(), '0@0');
                assert.equal(curve.pointAt(ratio, { precision: 1 }).toString(), '100@150');
                assert.equal(curve.pointAt(ratio, { precision: 2 }).toString(), '63.28125@140.625');
                assert.equal(curve.pointAt(ratio, { precision: 3 }).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(curve.pointAt(ratio, { precision: 4 }).toString(), '61.775019159540534@139.80202674865723');
                assert.equal(curve.pointAt(ratio, { precision: 5 }).toString(), '61.775019159540534@139.80202674865723');

                assert.equal(curve.pointAt(-1).toString(), '0@0');
                assert.equal(curve.pointAt(10).toString(), '200@0');
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.ok(curve.pointAtLength(250) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 0 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 1 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 2 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 3 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 4 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 5 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(10000) instanceof g.Point);

                assert.ok(curve.pointAtLength(-250) instanceof g.Point);
                assert.ok(curve.pointAtLength(-250, { precision: 0 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(-250, { precision: 1 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(-250, { precision: 2 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(-250, { precision: 3 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(-250, { precision: 4 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(-250, { precision: 5 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(-10000) instanceof g.Point);
            });

            QUnit.test('returns a point at given length up to precision', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(curve.pointAtLength(250).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(curve.pointAtLength(250, { precision: 0 }).toString(), '200@0');
                assert.equal(curve.pointAtLength(250, { precision: 1 }).toString(), '168.75@112.5');
                assert.equal(curve.pointAtLength(250, { precision: 2 }).toString(), '145.34912109375@135.3515625');
                assert.equal(curve.pointAtLength(250, { precision: 3 }).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(curve.pointAtLength(250, { precision: 4 }).toString(), '146.66639678180218@134.4217300415039');
                assert.equal(curve.pointAtLength(250, { precision: 5 }).toString(), '146.65819215043712@134.42763034254313');
                assert.equal(curve.pointAtLength(10000).toString(), '200@0');

                assert.equal(curve.pointAtLength(-250).toString(), '53.59632968902588@134.6099853515625');
                assert.equal(curve.pointAtLength(-250, { precision: 0 }).toString(), '0@0');
                assert.equal(curve.pointAtLength(-250, { precision: 1 }).toString(), '31.25@112.5');
                assert.equal(curve.pointAtLength(-250, { precision: 2 }).toString(), '54.65087890625@135.3515625');
                assert.equal(curve.pointAtLength(-250, { precision: 3 }).toString(), '53.59632968902588@134.6099853515625');
                assert.equal(curve.pointAtLength(-250, { precision: 4 }).toString(), '53.33360321819782@134.4217300415039');
                assert.equal(curve.pointAtLength(-250, { precision: 5 }).toString(), '53.34180784956288@134.42763034254313');
                assert.equal(curve.pointAtLength(-10000).toString(), '0@0');
            });

            QUnit.test('compare to browser implementation', function(assert) {

                var p1;
                var x1;
                var y1;
                var p2;
                var x2;
                var y2;

                var svg = getSvg();

                var gCurve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                var gCurvePath = new g.Path(gCurve);
                var curvePath = V('path', { d: gCurvePath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(curvePath);

                p1 = gCurve.pointAtLength(250, { precision: 4 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = curvePath.node.getPointAtLength(250);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);
                assert.equal(x1 + '@' + y1, x2 + '@' + y2);

                /*p1 = gCurve.pointAtLength(-1, { precision: 1 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = curvePath.node.getPointAtLength(-1);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);
                assert.equal(x1 + '@' + y1, x2 + '@' + y2);*/

                p1 = gCurve.pointAtLength(10000, { precision: 1 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = curvePath.node.getPointAtLength(10000);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);
                assert.equal(x1 + '@' + y1, x2 + '@' + y2);

                svg.remove();
            });
        });

        QUnit.module('pointAtT()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.ok(curve.pointAtT(0.4) instanceof g.Point);

                assert.ok(curve.pointAtT(-1) instanceof g.Point);
                assert.ok(curve.pointAtT(10) instanceof g.Point);
            });

            QUnit.test('returns a point at given `t` value', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.equal(curve.pointAtT(0.4).toString(), '77.6@114.4');

                assert.equal(curve.pointAtT(-1).toString(), '0@100');
                assert.equal(curve.pointAtT(10).toString(), '200@100');
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.ok(curve.clone().scale(0, 0) instanceof g.Curve);
                assert.ok(curve.clone().scale(0, 0, new g.Point('0 0')) instanceof g.Curve);
                assert.ok(curve.clone().scale(0, 0, new g.Point('10 10')) instanceof g.Curve);

                assert.ok(curve.clone().scale(0, 1) instanceof g.Curve);
                assert.ok(curve.clone().scale(0, 1, new g.Point('0 0')) instanceof g.Curve);
                assert.ok(curve.clone().scale(0, 1, new g.Point('10 10')) instanceof g.Curve);

                assert.ok(curve.clone().scale(1, 0) instanceof g.Curve);
                assert.ok(curve.clone().scale(1, 0, new g.Point('0 0')) instanceof g.Curve);
                assert.ok(curve.clone().scale(1, 0, new g.Point('10 10')) instanceof g.Curve);

                assert.ok(curve.clone().scale(1, 1) instanceof g.Curve);
                assert.ok(curve.clone().scale(1, 1, new g.Point('0 0')) instanceof g.Curve);
                assert.ok(curve.clone().scale(1, 1, new g.Point('10 10')) instanceof g.Curve);

                assert.ok(curve.clone().scale(10, 10) instanceof g.Curve);
                assert.ok(curve.clone().scale(10, 10, new g.Point('0 0')) instanceof g.Curve);
                assert.ok(curve.clone().scale(10, 10, new g.Point('10 10')) instanceof g.Curve);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.equal(curve.clone().scale(0, 0).toString(), '0@0 0@0 0@0 0@0');
                assert.equal(curve.clone().scale(0, 0, new g.Point('0 0')).toString(), '0@0 0@0 0@0 0@0');
                assert.equal(curve.clone().scale(0, 0, new g.Point('10 10')).toString(), '10@10 10@10 10@10 10@10');

                assert.equal(curve.clone().scale(0, 1).toString(), '0@10 0@40 0@40 0@10');
                assert.equal(curve.clone().scale(0, 1, new g.Point('0 0')).toString(), '0@10 0@40 0@40 0@10');
                assert.equal(curve.clone().scale(0, 1, new g.Point('10 10')).toString(), '10@10 10@40 10@40 10@10');

                assert.equal(curve.clone().scale(1, 0).toString(), '10@0 10@0 50@0 50@0');
                assert.equal(curve.clone().scale(1, 0, new g.Point('0 0')).toString(), '10@0 10@0 50@0 50@0');
                assert.equal(curve.clone().scale(1, 0, new g.Point('10 10')).toString(), '10@10 10@10 50@10 50@10');

                assert.equal(curve.clone().scale(1, 1).toString(), '10@10 10@40 50@40 50@10');
                assert.equal(curve.clone().scale(1, 1, new g.Point('0 0')).toString(), '10@10 10@40 50@40 50@10');
                assert.equal(curve.clone().scale(1, 1, new g.Point('10 10')).toString(), '10@10 10@40 50@40 50@10');

                assert.equal(curve.clone().scale(10, 10).toString(), '100@100 100@400 500@400 500@100');
                assert.equal(curve.clone().scale(10, 10, new g.Point('0 0')).toString(), '100@100 100@400 500@400 500@100');
                assert.equal(curve.clone().scale(10, 10, new g.Point('10 10')).toString(), '10@10 10@310 410@310 410@10');
            });
        });

        QUnit.module('tangentAt()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.ok(curve.tangentAt(0.4) instanceof g.Line);

                assert.ok(curve.tangentAt(-1) instanceof g.Line);
                assert.ok(curve.tangentAt(10) instanceof g.Line);
            });

            QUnit.test('should return a line tangent to curve at given length ratio', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.equal(curve.tangentAt(0.4).toString(), '23.43069612979889@31.384544372558594 42.43918001651764@38.064231872558594');

                assert.equal(curve.tangentAt(-1).toString(), '10@10 10@40');
                assert.equal(curve.tangentAt(10).toString(), '50@10 50@-20');
            });
        });

        QUnit.module('tangentAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.ok(curve.tangentAtLength(40) instanceof g.Line);
                assert.ok(curve.tangentAtLength(10000) instanceof g.Line);

                assert.ok(curve.tangentAtLength(-40) instanceof g.Line);
                assert.ok(curve.tangentAtLength(-10000) instanceof g.Line);
            });

            QUnit.test('should return a line tangent to curve at given length', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.equal(curve.tangentAtLength(15).toString(), '14.055539965629578@24.251670837402344 26.723691821098328@42.415733337402344');
                assert.equal(curve.tangentAtLength(10000).toString(), '50@10 50@-20');

                assert.equal(curve.tangentAtLength(-15).toString(), '45.94446003437042@24.251670837402344 58.61261188983917@6.087608337402344');
                assert.equal(curve.tangentAtLength(-10000).toString(), '10@10 10@40');
            });
        });

        QUnit.module('tangentAtT()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.ok(curve.tangentAtT(0.4) instanceof g.Line);
                assert.ok(curve.tangentAtT(-1) instanceof g.Line);
                assert.ok(curve.tangentAtT(10) instanceof g.Line);
            });

            QUnit.test('should return a line tangent to curve at given t', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.equal(curve.tangentAtT(0.4).toString(), '24.08@31.6 43.28@37.60000000000001');
                assert.equal(curve.tangentAtT(-1).toString(), '10@10 10@40');
                assert.equal(curve.tangentAtT(10).toString(), '50@10 50@-20');
            });
        });

        QUnit.module('tAt()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                var ratio = 0.4;
                assert.equal(typeof curve.tAt(ratio), 'number');
                assert.equal(typeof curve.tAt(ratio, { precision: 0 }), 'number');
                assert.equal(typeof curve.tAt(ratio, { precision: 1 }), 'number');
                assert.equal(typeof curve.tAt(ratio, { precision: 2 }), 'number');
                assert.equal(typeof curve.tAt(ratio, { precision: 3 }), 'number');
                assert.equal(typeof curve.tAt(ratio, { precision: 4 }), 'number');
                assert.equal(typeof curve.tAt(ratio, { precision: 5 }), 'number');

                assert.equal(typeof curve.tAt(-1), 'number');
                assert.equal(typeof curve.tAt(10), 'number');
            });

            QUnit.test('returns t at given length ratio up to precision', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                var ratio = 0.4;
                assert.equal(curve.tAt(ratio), 0.369140625);
                assert.equal(curve.tAt(ratio, { precision: 0 }), 0);
                assert.equal(curve.tAt(ratio, { precision: 1 }), 0.5);
                assert.equal(curve.tAt(ratio, { precision: 2 }), 0.375);
                assert.equal(curve.tAt(ratio, { precision: 3 }), 0.369140625);
                assert.equal(curve.tAt(ratio, { precision: 4 }), 0.36962890625);
                assert.equal(curve.tAt(ratio, { precision: 5 }), 0.36962890625);

                assert.equal(curve.tAt(-1), 0);
                assert.equal(curve.tAt(10), 1);
            });
        });

        QUnit.module('tAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(typeof curve.tAtLength(250), 'number');
                assert.equal(typeof curve.tAtLength(250, { precision: 0 }), 'number');
                assert.equal(typeof curve.tAtLength(250, { precision: 1 }), 'number');
                assert.equal(typeof curve.tAtLength(250, { precision: 2 }), 'number');
                assert.equal(typeof curve.tAtLength(250, { precision: 3 }), 'number');
                assert.equal(typeof curve.tAtLength(250, { precision: 4 }), 'number');
                assert.equal(typeof curve.tAtLength(250, { precision: 5 }), 'number');
                assert.equal(typeof curve.tAtLength(10000), 'number');

                assert.equal(typeof curve.tAtLength(-250), 'number');
                assert.equal(typeof curve.tAtLength(-250, { precision: 0 }), 'number');
                assert.equal(typeof curve.tAtLength(-250, { precision: 1 }), 'number');
                assert.equal(typeof curve.tAtLength(-250, { precision: 2 }), 'number');
                assert.equal(typeof curve.tAtLength(-250, { precision: 3 }), 'number');
                assert.equal(typeof curve.tAtLength(-250, { precision: 4 }), 'number');
                assert.equal(typeof curve.tAtLength(-250, { precision: 5 }), 'number');
                assert.equal(typeof curve.tAtLength(-10000), 'number');
            });

            QUnit.test('returns t at given length up to precision', function(assert) {

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(curve.tAtLength(250), 0.66015625);
                assert.equal(curve.tAtLength(250, { precision: 0 }), 1);
                assert.equal(curve.tAtLength(250, { precision: 1 }), 0.75);
                assert.equal(curve.tAtLength(250, { precision: 2 }), 0.65625);
                assert.equal(curve.tAtLength(250, { precision: 3 }), 0.66015625);
                assert.equal(curve.tAtLength(250, { precision: 4 }), 0.6611328125);
                assert.equal(curve.tAtLength(250, { precision: 5 }), 0.661102294921875);
                assert.equal(curve.tAtLength(10000), 1);

                assert.equal(curve.tAtLength(-250), 0.33984375);
                assert.equal(curve.tAtLength(-250, { precision: 0 }), 0);
                assert.equal(curve.tAtLength(-250, { precision: 1 }), 0.25);
                assert.equal(curve.tAtLength(-250, { precision: 2 }), 0.34375);
                assert.equal(curve.tAtLength(-250, { precision: 3 }), 0.33984375);
                assert.equal(curve.tAtLength(-250, { precision: 4 }), 0.3388671875);
                assert.equal(curve.tAtLength(-250, { precision: 5 }), 0.338897705078125);
                assert.equal(curve.tAtLength(-10000), 0);
            });
        });

        QUnit.module('translate()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.ok(curve.clone().translate(0, 0) instanceof g.Curve);
                assert.ok(curve.clone().translate(0, 10) instanceof g.Curve);
                assert.ok(curve.clone().translate(10, 0) instanceof g.Curve);
                assert.ok(curve.clone().translate(10, 10) instanceof g.Curve);
            });

            QUnit.test('should return a translated version of self', function(assert) {

                var curve = new g.Curve('10 10', '10 40', '50 40', '50 10');
                assert.equal(curve.clone().translate(0, 0).toString(), '10@10 10@40 50@40 50@10');
                assert.equal(curve.clone().translate(0, 10).toString(), '10@20 10@50 50@50 50@20');
                assert.equal(curve.clone().translate(10, 0).toString(), '20@10 20@40 60@40 60@10');
                assert.equal(curve.clone().translate(10, 10).toString(), '20@20 20@50 60@50 60@20');
            });
        });

        QUnit.module('toPoints()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.equal(Array.isArray(curve.toPoints()), true);
                assert.equal(Array.isArray(curve.toPoints({ precision: 0 })), true);
                assert.equal(Array.isArray(curve.toPoints({ precision: 1 })), true);
                assert.equal(Array.isArray(curve.toPoints({ precision: 2 })), true);
                assert.equal(Array.isArray(curve.toPoints({ precision: 3 })), true);
                assert.equal(Array.isArray(curve.toPoints({ precision: 4 })), true);
                assert.equal(Array.isArray(curve.toPoints({ precision: 5 })), true);
            });

            QUnit.test('returns the curve as an array of points up to precision', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.deepEqual(curve.toPoints({ precision: 0 }), [
                    new g.Point(0, 100),
                    new g.Point(200, 100)
                ]);
                assert.deepEqual(curve.toPoints({ precision: 1 }), [
                    new g.Point(0, 100),
                    new g.Point(20.8984375, 124.609375),
                    new g.Point(45.3125, 128.125),
                    new g.Point(72.0703125, 117.578125),
                    new g.Point(100, 100),
                    new g.Point(127.9296875, 82.421875),
                    new g.Point(154.6875, 71.875),
                    new g.Point(179.1015625, 75.390625),
                    new g.Point(200, 100)
                ]);
                assert.deepEqual(curve.toPoints({ precision: 2 }), [
                    new g.Point(0, 100),
                    new g.Point(9.9365234375, 115.380859375),
                    new g.Point(20.8984375, 124.609375),
                    new g.Point(32.7392578125, 128.564453125),
                    new g.Point(45.3125, 128.125),
                    new g.Point(58.4716796875, 124.169921875),
                    new g.Point(72.0703125, 117.578125),
                    new g.Point(85.9619140625, 109.228515625),
                    new g.Point(100, 100),
                    new g.Point(114.0380859375, 90.771484375),
                    new g.Point(127.9296875, 82.421875),
                    new g.Point(141.5283203125, 75.830078125),
                    new g.Point(154.6875, 71.875),
                    new g.Point(167.2607421875, 71.435546875),
                    new g.Point(179.1015625, 75.390625),
                    new g.Point(190.0634765625, 84.619140625),
                    new g.Point(200, 100)
                ]);
            });
        });

        QUnit.module('toPolyline()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.ok(curve.toPolyline() instanceof g.Polyline);
                assert.ok(curve.toPolyline({ precision: 0 }) instanceof g.Polyline);
                assert.ok(curve.toPolyline({ precision: 1 }) instanceof g.Polyline);
                assert.ok(curve.toPolyline({ precision: 2 }) instanceof g.Polyline);
                assert.ok(curve.toPolyline({ precision: 3 }) instanceof g.Polyline);
                assert.ok(curve.toPolyline({ precision: 4 }) instanceof g.Polyline);
                assert.ok(curve.toPolyline({ precision: 5 }) instanceof g.Polyline);
            });

            QUnit.test('returns the curve as a polyline up to precision', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.deepEqual(curve.toPolyline({ precision: 0 }).serialize(), '0,100 200,100');
                assert.deepEqual(curve.toPolyline({ precision: 1 }).serialize(), '0,100 20.8984375,124.609375 45.3125,128.125 72.0703125,117.578125 100,100 127.9296875,82.421875 154.6875,71.875 179.1015625,75.390625 200,100');
                assert.deepEqual(curve.toPolyline({ precision: 2 }).serialize(), '0,100 9.9365234375,115.380859375 20.8984375,124.609375 32.7392578125,128.564453125 45.3125,128.125 58.4716796875,124.169921875 72.0703125,117.578125 85.9619140625,109.228515625 100,100 114.0380859375,90.771484375 127.9296875,82.421875 141.5283203125,75.830078125 154.6875,71.875 167.2607421875,71.435546875 179.1015625,75.390625 190.0634765625,84.619140625 200,100');
            });
        });

        QUnit.module('toString()', function(assert) {

            QUnit.test('sanity', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.equal(typeof curve.toString(), 'string');
            });

            QUnit.test('returns a string representation of the curve', function(assert) {

                var curve = new g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.equal(curve.toString(), '0@100 50@200 150@0 200@100');
            });
        });
    });
});

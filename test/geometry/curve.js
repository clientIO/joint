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

            var curve1 = g.Curve('10 10', '10 40', '50 40', '50 10');
            assert.ok(curve1, 'returns instance of g.Curve');
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

            var curve2 = g.Curve(curve1);
            assert.ok(curve2, 'returns instance of g.Curve');
            assert.notEqual(typeof curve2.start, 'undefined', 'has "start" property');
            assert.notEqual(typeof curve2.controlPoint1, 'undefined', 'has "controlPoint1" property');
            assert.notEqual(typeof curve2.controlPoint2, 'undefined', 'has "controlPoint2" property');
            assert.notEqual(typeof curve2.end, 'undefined', 'has "end" property');
            assert.notOk(curve1 === curve2);
            assert.equal(curve1.toString(), curve2.toString());
            assert.ok(curve1.equals(curve2));
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

                var curve1 = g.Curve('0 100', '50 200', '150 0', '200 100');
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

        QUnit.module('divide()', function() {

            QUnit.test('sanity', function(assert) {

                var curveDivide;

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(0.5); // normal
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(0); // minimum
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(-1); // too little
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(1); // maximum
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(10); // too much
                assert.ok(Array.isArray(curveDivide));
                assert.equal(curveDivide.length, 2);
                assert.ok(curveDivide[0] instanceof g.Curve);
                assert.ok(curveDivide[1] instanceof g.Curve);
            });

            QUnit.test('returns an array with two curves, divided at provided `t`', function(assert) {

                var curveDivide;

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(0.5);
                assert.equal(curveDivide[0].toString(), 'C 0@100 25@150 62.5@125 100@100');
                assert.equal(curveDivide[1].toString(), 'C 100@100 137.5@75 175@50 200@100');

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(0);
                assert.equal(curveDivide[0].toString(), 'C 0@100 0@100 0@100 0@100');
                assert.equal(curveDivide[1].toString(), 'C 0@100 50@200 150@0 200@100');

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(-1);
                assert.equal(curveDivide[0].toString(), 'C 0@100 0@100 0@100 0@100');
                assert.equal(curveDivide[1].toString(), 'C 0@100 50@200 150@0 200@100');

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(1);
                assert.equal(curveDivide[0].toString(), 'C 0@100 50@200 150@0 200@100');
                assert.equal(curveDivide[1].toString(), 'C 200@100 200@100 200@100 200@100');

                curveDivide = g.Curve('0 100', '50 200', '150 0', '200 100').divide(10);
                assert.equal(curveDivide[0].toString(), 'C 0@100 50@200 150@0 200@100');
                assert.equal(curveDivide[1].toString(), 'C 200@100 200@100 200@100 200@100');
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

                var curveSkeletonPoints;

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(0.5); // normal
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(0); // minimum
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(-1); // too little
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(1); // maximum
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(10); // too much
                assert.equal(typeof curveSkeletonPoints, 'object');
                assert.ok(curveSkeletonPoints.startControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.startControlPoint2 instanceof g.Point);
                assert.ok(curveSkeletonPoints.divider instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint1 instanceof g.Point);
                assert.ok(curveSkeletonPoints.dividerControlPoint2 instanceof g.Point);
            });

            QUnit.test('returns points necessary for division', function(assert) {

                var curveSkeletonPoints;

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(0.5);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '25@150');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '62.5@125');
                assert.equal(curveSkeletonPoints.divider.toString(), '100@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '137.5@75');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '175@50');

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(0);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '0@100');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '0@100');
                assert.equal(curveSkeletonPoints.divider.toString(), '0@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '150@0');

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(-1);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '0@100');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '0@100');
                assert.equal(curveSkeletonPoints.divider.toString(), '0@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '150@0');

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(1);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '150@0');
                assert.equal(curveSkeletonPoints.divider.toString(), '200@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '200@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '200@100');

                curveSkeletonPoints = g.Curve('0 100', '50 200', '150 0', '200 100').getSkeletonPoints(10);
                assert.equal(curveSkeletonPoints.startControlPoint1.toString(), '50@200');
                assert.equal(curveSkeletonPoints.startControlPoint2.toString(), '150@0');
                assert.equal(curveSkeletonPoints.divider.toString(), '200@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint1.toString(), '200@100');
                assert.equal(curveSkeletonPoints.dividerControlPoint2.toString(), '200@100');
            });
        });

        QUnit.module('getSubdivisions()', function() {

            QUnit.test('sanity', function(assert) {

                assert.equal(Array.isArray(g.Curve('0 100', '50 200', '150 0', '200 100').getSubdivisions()), true);
                assert.equal(Array.isArray(g.Curve('0 100', '50 200', '150 0', '200 100').getSubdivisions({ precision: 0 })), true);
                assert.equal(Array.isArray(g.Curve('0 100', '50 200', '150 0', '200 100').getSubdivisions({ precision: 1 })), true);
                assert.equal(Array.isArray(g.Curve('0 100', '50 200', '150 0', '200 100').getSubdivisions({ precision: 2 })), true);
            });

            QUnit.test('returns an array with curve subdivisions up to precision', function(assert) {

                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').getSubdivisions(), [
                    g.Curve(g.Point(0, 100), g.Point(3.125, 106.25), g.Point(6.4453125, 111.328125), g.Point(9.9365234375, 115.380859375)),
                    g.Curve(g.Point(9.9365234375, 115.380859375), g.Point(13.427734375, 119.43359375), g.Point(17.08984375, 122.4609375), g.Point(20.8984375, 124.609375)),
                    g.Curve(g.Point(20.8984375, 124.609375), g.Point(24.70703125, 126.7578125), g.Point(28.662109375, 128.02734375), g.Point(32.7392578125, 128.564453125)),
                    g.Curve(g.Point(32.7392578125, 128.564453125), g.Point(36.81640625, 129.1015625), g.Point(41.015625, 128.90625), g.Point(45.3125, 128.125)),
                    g.Curve(g.Point(45.3125, 128.125), g.Point(49.609375, 127.34375), g.Point(54.00390625, 125.9765625), g.Point(58.4716796875, 124.169921875)),
                    g.Curve(g.Point(58.4716796875, 124.169921875), g.Point(62.939453125, 122.36328125), g.Point(67.48046875, 120.1171875), g.Point(72.0703125, 117.578125)),
                    g.Curve(g.Point(72.0703125, 117.578125), g.Point(76.66015625, 115.0390625), g.Point(81.298828125, 112.20703125), g.Point(85.9619140625, 109.228515625)),
                    g.Curve(g.Point(85.9619140625, 109.228515625), g.Point(90.625, 106.25), g.Point(95.3125, 103.125), g.Point(100, 100)),
                    g.Curve(g.Point(100, 100), g.Point(104.6875, 96.875), g.Point(109.375, 93.75), g.Point(114.0380859375, 90.771484375)),
                    g.Curve(g.Point(114.0380859375, 90.771484375), g.Point(118.701171875, 87.79296875), g.Point(123.33984375, 84.9609375), g.Point(127.9296875, 82.421875)),
                    g.Curve(g.Point(127.9296875, 82.421875), g.Point(132.51953125, 79.8828125), g.Point(137.060546875, 77.63671875), g.Point(141.5283203125, 75.830078125)),
                    g.Curve(g.Point(141.5283203125, 75.830078125), g.Point(145.99609375, 74.0234375), g.Point(150.390625, 72.65625), g.Point(154.6875, 71.875)),
                    g.Curve(g.Point(154.6875, 71.875), g.Point(158.984375, 71.09375), g.Point(163.18359375, 70.8984375), g.Point(167.2607421875, 71.435546875)),
                    g.Curve(g.Point(167.2607421875, 71.435546875), g.Point(171.337890625, 71.97265625), g.Point(175.29296875, 73.2421875), g.Point(179.1015625, 75.390625)),
                    g.Curve(g.Point(179.1015625, 75.390625), g.Point(182.91015625, 77.5390625), g.Point(186.572265625, 80.56640625), g.Point(190.0634765625, 84.619140625)),
                    g.Curve(g.Point(190.0634765625, 84.619140625), g.Point(193.5546875, 88.671875), g.Point(196.875, 93.75), g.Point(200, 100))
                ]);
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').getSubdivisions({ precision: 0 }), [
                    g.Curve(g.Point(0, 100), g.Point(50, 200), g.Point(150, 0), g.Point(200, 100))
                ]);
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').getSubdivisions({ precision: 1 }), [
                    g.Curve(g.Point(0, 100), g.Point(6.25, 112.5), g.Point(13.28125, 120.3125), g.Point(20.8984375, 124.609375)),
                    g.Curve(g.Point(20.8984375, 124.609375), g.Point(28.515625, 128.90625), g.Point(36.71875, 129.6875), g.Point(45.3125, 128.125)),
                    g.Curve(g.Point(45.3125, 128.125), g.Point(53.90625, 126.5625), g.Point(62.890625, 122.65625), g.Point(72.0703125, 117.578125)),
                    g.Curve(g.Point(72.0703125, 117.578125), g.Point(81.25, 112.5), g.Point(90.625, 106.25), g.Point(100, 100)),
                    g.Curve(g.Point(100, 100), g.Point(109.375, 93.75), g.Point(118.75, 87.5), g.Point(127.9296875, 82.421875)),
                    g.Curve(g.Point(127.9296875, 82.421875), g.Point(137.109375, 77.34375), g.Point(146.09375, 73.4375), g.Point(154.6875, 71.875)),
                    g.Curve(g.Point(154.6875, 71.875), g.Point(163.28125, 70.3125), g.Point(171.484375, 71.09375), g.Point(179.1015625, 75.390625)),
                    g.Curve(g.Point(179.1015625, 75.390625), g.Point(186.71875, 79.6875), g.Point(193.75, 87.5), g.Point(200, 100))
                ]);
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').getSubdivisions({ precision: 2 }), [
                    g.Curve(g.Point(0, 100), g.Point(3.125, 106.25), g.Point(6.4453125, 111.328125), g.Point(9.9365234375, 115.380859375)),
                    g.Curve(g.Point(9.9365234375, 115.380859375), g.Point(13.427734375, 119.43359375), g.Point(17.08984375, 122.4609375), g.Point(20.8984375, 124.609375)),
                    g.Curve(g.Point(20.8984375, 124.609375), g.Point(24.70703125, 126.7578125), g.Point(28.662109375, 128.02734375), g.Point(32.7392578125, 128.564453125)),
                    g.Curve(g.Point(32.7392578125, 128.564453125), g.Point(36.81640625, 129.1015625), g.Point(41.015625, 128.90625), g.Point(45.3125, 128.125)),
                    g.Curve(g.Point(45.3125, 128.125), g.Point(49.609375, 127.34375), g.Point(54.00390625, 125.9765625), g.Point(58.4716796875, 124.169921875)),
                    g.Curve(g.Point(58.4716796875, 124.169921875), g.Point(62.939453125, 122.36328125), g.Point(67.48046875, 120.1171875), g.Point(72.0703125, 117.578125)),
                    g.Curve(g.Point(72.0703125, 117.578125), g.Point(76.66015625, 115.0390625), g.Point(81.298828125, 112.20703125), g.Point(85.9619140625, 109.228515625)),
                    g.Curve(g.Point(85.9619140625, 109.228515625), g.Point(90.625, 106.25), g.Point(95.3125, 103.125), g.Point(100, 100)),
                    g.Curve(g.Point(100, 100), g.Point(104.6875, 96.875), g.Point(109.375, 93.75), g.Point(114.0380859375, 90.771484375)),
                    g.Curve(g.Point(114.0380859375, 90.771484375), g.Point(118.701171875, 87.79296875), g.Point(123.33984375, 84.9609375), g.Point(127.9296875, 82.421875)),
                    g.Curve(g.Point(127.9296875, 82.421875), g.Point(132.51953125, 79.8828125), g.Point(137.060546875, 77.63671875), g.Point(141.5283203125, 75.830078125)),
                    g.Curve(g.Point(141.5283203125, 75.830078125), g.Point(145.99609375, 74.0234375), g.Point(150.390625, 72.65625), g.Point(154.6875, 71.875)),
                    g.Curve(g.Point(154.6875, 71.875), g.Point(158.984375, 71.09375), g.Point(163.18359375, 70.8984375), g.Point(167.2607421875, 71.435546875)),
                    g.Curve(g.Point(167.2607421875, 71.435546875), g.Point(171.337890625, 71.97265625), g.Point(175.29296875, 73.2421875), g.Point(179.1015625, 75.390625)),
                    g.Curve(g.Point(179.1015625, 75.390625), g.Point(182.91015625, 77.5390625), g.Point(186.572265625, 80.56640625), g.Point(190.0634765625, 84.619140625)),
                    g.Curve(g.Point(190.0634765625, 84.619140625), g.Point(193.5546875, 88.671875), g.Point(196.875, 93.75), g.Point(200, 100))
                ]);
            });
        });

        QUnit.module('length()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(typeof curve.length(), 'number');
                assert.equal(typeof curve.length({ precision: 0 }), 'number');
                assert.equal(typeof curve.length({ precision: 1 }), 'number');
                assert.equal(typeof curve.length({ precision: 2 }), 'number');
                assert.equal(typeof curve.length({ precision: 3 }), 'number');
                assert.equal(typeof curve.length({ precision: 4 }), 'number');
                assert.equal(typeof curve.length({ precision: 5 }), 'number');
            });

            QUnit.test('returns the length of the curve up to precision', function(assert) {

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(curve.length(), 399.38625336882194);
                assert.equal(curve.length({ precision: 0 }), 200);
                assert.equal(curve.length({ precision: 1 }), 390.1438222301384);
                assert.equal(curve.length({ precision: 2 }), 399.38625336882194);
                assert.equal(curve.length({ precision: 3 }), 399.96164987703463);
                assert.equal(curve.length({ precision: 4 }), 399.99041258236997);
                assert.equal(curve.length({ precision: 5 }), 399.9994007886072);
            });

            QUnit.test('compare to browser implementation', function(assert) {

                var svg = getSvg();

                var gCurve = g.Curve('0 0', '0 200', '200 200', '200 0');
                var curvePath = V('path', { d: gCurve.toPath().serialize(), stroke: 'green', fill: 'none' });
                svg.append(curvePath);

                assert.equal(Math.round(gCurve.length({ precision: 3 })), Math.round(curvePath.node.getTotalLength()));

                svg.remove();
            });
        });

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.ok(curve.pointAt(0.4) instanceof g.Point);
                assert.ok(curve.pointAt(0.4, { precision: 0 }) instanceof g.Point);
                assert.ok(curve.pointAt(0.4, { precision: 1 }) instanceof g.Point);
                assert.ok(curve.pointAt(0.4, { precision: 2 }) instanceof g.Point);
                assert.ok(curve.pointAt(0.4, { precision: 3 }) instanceof g.Point);
                assert.ok(curve.pointAt(0.4, { precision: 4 }) instanceof g.Point);
                assert.ok(curve.pointAt(0.4, { precision: 5 }) instanceof g.Point);
                assert.ok(curve.pointAt(-1) instanceof g.Point);
                assert.ok(curve.pointAt(10) instanceof g.Point);
            });

            QUnit.test('returns a point at given length ratio up to precision', function(assert) {

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(curve.pointAt(0.4).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(curve.pointAt(0.4, { precision: 0 }).toString(), '100@150');
                assert.equal(curve.pointAt(0.4, { precision: 1 }).toString(), '63.28125@140.625');
                assert.equal(curve.pointAt(0.4, { precision: 2 }).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(curve.pointAt(0.4, { precision: 3 }).toString(), '61.775019159540534@139.80202674865723');
                assert.equal(curve.pointAt(0.4, { precision: 4 }).toString(), '61.775019159540534@139.80202674865723');
                assert.equal(curve.pointAt(0.4, { precision: 5 }).toString(), '61.77288595901036@139.800833130721');
                assert.equal(curve.pointAt(-1).toString(), '0@0');
                assert.equal(curve.pointAt(10).toString(), '200@0');
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.ok(curve.pointAtLength(250) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 0 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 1 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 2 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 3 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 4 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(250, { precision: 5 }) instanceof g.Point);
                assert.ok(curve.pointAtLength(-1) instanceof g.Point);
                assert.ok(curve.pointAtLength(10000) instanceof g.Point);
            });

            QUnit.test('returns a point at given length up to precision', function(assert) {

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                assert.equal(curve.pointAtLength(250).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(curve.pointAtLength(250, { precision: 0 }).toString(), '168.75@112.5');
                assert.equal(curve.pointAtLength(250, { precision: 1 }).toString(), '145.34912109375@135.3515625');
                assert.equal(curve.pointAtLength(250, { precision: 2 }).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(curve.pointAtLength(250, { precision: 3 }).toString(), '146.66639678180218@134.4217300415039');
                assert.equal(curve.pointAtLength(250, { precision: 4 }).toString(), '146.65819215043712@134.42763034254313');
                assert.equal(curve.pointAtLength(250, { precision: 5 }).toString(), '146.65562812928542@134.42947395742522');
                assert.equal(curve.pointAtLength(-1).toString(), '0@0');
                assert.equal(curve.pointAtLength(10000).toString(), '200@0');
            });

            QUnit.test('compare to browser implementation', function(assert) {

                var gCurve;
                var curvePath;
                var p1;
                var x1;
                var y1;
                var p2;
                var x2;
                var y2;

                var svg = getSvg();

                gCurve = g.Curve('0 0', '0 200', '200 200', '200 0');
                curvePath = V('path', { d: gCurve.toPath().serialize(), stroke: 'green', fill: 'none' });
                svg.append(curvePath);

                p1 = gCurve.pointAtLength(250, { precision: 3 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = curvePath.node.getPointAtLength(250);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);

                assert.equal(x1 + '@' + y1, x2 + '@' + y2);

                // browser implementation is wrong
                /*gCurve = g.Curve('0 0', '0 200', '200 200', '200 0');
                curvePath = V('path', { d: gCurve.toPath().serialize(), stroke: 'green', fill: 'none' });
                svg.append(curvePath);

                p1 = gCurve.pointAtLength(-1, { precision: 1 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = curvePath.node.getPointAtLength(-1);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);

                assert.equal(x1 + '@' + y1, x2 + '@' + y2);*/

                gCurve = g.Curve('0 0', '0 200', '200 200', '200 0');
                curvePath = V('path', { d: gCurve.toPath().serialize(), stroke: 'green', fill: 'none' });
                svg.append(curvePath);

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

                var curve;

                curve = g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.ok(curve.tPoint(0.4) instanceof g.Point);
                assert.ok(curve.tPoint(-1) instanceof g.Point);
                assert.ok(curve.tPoint(10) instanceof g.Point);
            });

            QUnit.test('returns a point at given `t` value', function(assert) {

                var curve;

                curve = g.Curve('0 100', '50 200', '150 0', '200 100');
                assert.equal(curve.tPoint(0.4).toString(), '77.6@114.4');
                assert.equal(curve.tPoint(-1).toString(), '0@100');
                assert.equal(curve.tPoint(10).toString(), '200@100');
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

        QUnit.module('toPath()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('0 100', '50 200', '150 0', '200 100').toPath() instanceof g.Path);
            });

            QUnit.test('returns the curve as a path', function(assert) {

                assert.equal(g.Curve('0 100', '50 200', '150 0', '200 100').toPath().toString(), 'M 0 100 C 50 200 150 0 200 100');
            });
        });

        QUnit.module('toPathData()', function() {

            QUnit.test('sanity', function(assert) {

                assert.equal(typeof g.Curve('0 100', '50 200', '150 0', '200 100').toPathData(), 'string');
            });

            QUnit.test('returns the curve as path data', function(assert) {

                assert.equal(g.Curve('0 100', '50 200', '150 0', '200 100').toPath().toString(), 'M 0 100 C 50 200 150 0 200 100');
            });
        });

        QUnit.module('toPoints()', function() {

            QUnit.test('sanity', function(assert) {

                assert.equal(Array.isArray(g.Curve('0 100', '50 200', '150 0', '200 100').toPoints()), true);
                assert.equal(Array.isArray(g.Curve('0 100', '50 200', '150 0', '200 100').toPoints({ precision: 0 })), true);
                assert.equal(Array.isArray(g.Curve('0 100', '50 200', '150 0', '200 100').toPoints({ precision: 1 })), true);
                assert.equal(Array.isArray(g.Curve('0 100', '50 200', '150 0', '200 100').toPoints({ precision: 2 })), true);
            });

            QUnit.test('returns the curve as an array of points up to precision', function(assert) {

                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').toPoints(), [
                    g.Point(0, 100),
                    g.Point(9.9365234375, 115.380859375),
                    g.Point(20.8984375, 124.609375),
                    g.Point(32.7392578125, 128.564453125),
                    g.Point(45.3125, 128.125),
                    g.Point(58.4716796875, 124.169921875),
                    g.Point(72.0703125, 117.578125),
                    g.Point(85.9619140625, 109.228515625),
                    g.Point(100, 100),
                    g.Point(114.0380859375, 90.771484375),
                    g.Point(127.9296875, 82.421875),
                    g.Point(141.5283203125, 75.830078125),
                    g.Point(154.6875, 71.875),
                    g.Point(167.2607421875, 71.435546875),
                    g.Point(179.1015625, 75.390625),
                    g.Point(190.0634765625, 84.619140625),
                    g.Point(200, 100)
                ]);
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').toPoints({ precision: 0 }), [
                    g.Point(0, 100),
                    g.Point(200, 100)
                ]);
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').toPoints({ precision: 1 }), [
                    g.Point(0, 100),
                    g.Point(20.8984375, 124.609375),
                    g.Point(45.3125, 128.125),
                    g.Point(72.0703125, 117.578125),
                    g.Point(100, 100),
                    g.Point(127.9296875, 82.421875),
                    g.Point(154.6875, 71.875),
                    g.Point(179.1015625, 75.390625),
                    g.Point(200, 100)
                ]);
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').toPoints({ precision: 2 }), [
                    g.Point(0, 100),
                    g.Point(9.9365234375, 115.380859375),
                    g.Point(20.8984375, 124.609375),
                    g.Point(32.7392578125, 128.564453125),
                    g.Point(45.3125, 128.125),
                    g.Point(58.4716796875, 124.169921875),
                    g.Point(72.0703125, 117.578125),
                    g.Point(85.9619140625, 109.228515625),
                    g.Point(100, 100),
                    g.Point(114.0380859375, 90.771484375),
                    g.Point(127.9296875, 82.421875),
                    g.Point(141.5283203125, 75.830078125),
                    g.Point(154.6875, 71.875),
                    g.Point(167.2607421875, 71.435546875),
                    g.Point(179.1015625, 75.390625),
                    g.Point(190.0634765625, 84.619140625),
                    g.Point(200, 100)
                ]);
            });
        });

        QUnit.module('toPolyline()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('0 100', '50 200', '150 0', '200 100').toPolyline() instanceof g.Polyline);
                assert.ok(g.Curve('0 100', '50 200', '150 0', '200 100').toPolyline({ precision: 0 }) instanceof g.Polyline);
                assert.ok(g.Curve('0 100', '50 200', '150 0', '200 100').toPolyline({ precision: 1 }) instanceof g.Polyline);
                assert.ok(g.Curve('0 100', '50 200', '150 0', '200 100').toPolyline({ precision: 2 }) instanceof g.Polyline);
            });

            QUnit.test('returns the curve as a polyline up to precision', function(assert) {

                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').toPolyline().serialize(), '0,100 9.9365234375,115.380859375 20.8984375,124.609375 32.7392578125,128.564453125 45.3125,128.125 58.4716796875,124.169921875 72.0703125,117.578125 85.9619140625,109.228515625 100,100 114.0380859375,90.771484375 127.9296875,82.421875 141.5283203125,75.830078125 154.6875,71.875 167.2607421875,71.435546875 179.1015625,75.390625 190.0634765625,84.619140625 200,100');
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').toPolyline({ precision: 0 }).serialize(), '0,100 200,100');
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').toPolyline({ precision: 1 }).serialize(), '0,100 20.8984375,124.609375 45.3125,128.125 72.0703125,117.578125 100,100 127.9296875,82.421875 154.6875,71.875 179.1015625,75.390625 200,100');
                assert.deepEqual(g.Curve('0 100', '50 200', '150 0', '200 100').toPolyline({ precision: 2 }).serialize(), '0,100 9.9365234375,115.380859375 20.8984375,124.609375 32.7392578125,128.564453125 45.3125,128.125 58.4716796875,124.169921875 72.0703125,117.578125 85.9619140625,109.228515625 100,100 114.0380859375,90.771484375 127.9296875,82.421875 141.5283203125,75.830078125 154.6875,71.875 167.2607421875,71.435546875 179.1015625,75.390625 190.0634765625,84.619140625 200,100');
            });
        });

        QUnit.module('toString()', function() {

        });
    });
});

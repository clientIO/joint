'use strict';

QUnit.module('path', function(hooks) {

    var $fixture = $('#qunit-fixture');

    var getSvg = function() {
        var svg = V('svg');
        svg.attr('width', 600);
        svg.attr('height', 800);
        $fixture.append(svg.node);

        return svg;
    };

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Path object', function(assert) {

            var path;

            // no arguments
            path = g.Path();
            assert.ok(path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.equal(path.segments.length, 0);

            // invalid argument
            path = g.Path();
            assert.ok(path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.equal(path.segments.length, 0);

            // normalized path data string
            path = g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
            assert.ok(path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.Z);
            assert.equal(path.segments[0].end.toString(), g.Point(150, 100).toString());
            assert.equal(path.segments[1].start.toString(), g.Point(150, 100).toString());
            assert.equal(path.segments[1].end.toString(), g.Point(100, 100).toString());
            assert.equal(path.segments[2].start.toString(), g.Point(100, 100).toString());
            assert.equal(path.segments[2].controlPoint1.toString(), g.Point(100, 100).toString());
            assert.equal(path.segments[2].controlPoint2.toString(), g.Point(0, 150).toString());
            assert.equal(path.segments[2].end.toString(), g.Point(100, 200).toString());
            assert.equal(path.segments[3].start.toString(), g.Point(100, 200).toString());
            assert.equal(path.segments[3].end.toString(), g.Point(150, 100).toString());

            // path segments array
            path = g.Path([g.Path.createSegment('M', 150, 100), g.Path.createSegment('L', 100, 100), g.Path.createSegment('C', 100, 100, 0, 150, 100, 200), g.Path.createSegment('Z')]);
            assert.ok(path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.Z);
            assert.equal(path.segments[0].end.toString(), g.Point(150, 100).toString());
            assert.equal(path.segments[1].start.toString(), g.Point(150, 100).toString());
            assert.equal(path.segments[1].end.toString(), g.Point(100, 100).toString());
            assert.equal(path.segments[2].start.toString(), g.Point(100, 100).toString());
            assert.equal(path.segments[2].controlPoint1.toString(), g.Point(100, 100).toString());
            assert.equal(path.segments[2].controlPoint2.toString(), g.Point(0, 150).toString());
            assert.equal(path.segments[2].end.toString(), g.Point(100, 200).toString());
            assert.equal(path.segments[3].start.toString(), g.Point(100, 200).toString());
            assert.equal(path.segments[3].end.toString(), g.Point(150, 100).toString());
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').bbox() instanceof g.Rect);

                assert.ok(g.Path('M 150 100 M 100 200').bbox() instanceof g.Rect);

                var path = g.Path('M 0 0');
                path.segments = [];
                assert.equal(path.bbox(), null);
            });

            QUnit.test('returns tight bounding box of the path', function(assert) {

                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').bbox().toString(), '55.55555555555556@100 150@200');

                assert.equal(g.Path('M 150 100 M 100 200').bbox().toString(), '100@200 100@200');
            });
        });

        QUnit.module('clone()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').clone() instanceof g.Path);
            });

            QUnit.test('returns a clone', function(assert) {

                var path1 = g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                var path2 = path1.clone();
                assert.notOk(path1 === path2);
                assert.equal(path1.toString(), path2.toString());
                assert.ok(path1.equals(path2));
            });
        });

        QUnit.module('equals()', function() {

            QUnit.test('checks whether two paths are exactly the same', function(assert) {

                var path1;
                var path2;

                path1 = g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                path2 = g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path1.equals(path2), true);

                path1 = g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                path2 = g.Path('M 100 100');
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.segments = [];
                path2 = g.Path('M 0 0');
                path2.segments = [];
                assert.equal(path1.equals(path2), true);

                path1 = g.Path('M 100 100');
                path2 = g.Path('M 0 0');
                path2.segments = null;
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.segments = null;
                path2 = g.Path('M 100 100');
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.segments = null;
                path2 = g.Path('M 0 0');
                path2.segments = null;
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 100 100');
                path2 = g.Path('M 0 0');
                path2.segments = undefined;
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.segments = undefined;
                path2 = g.Path('M 100 100');
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.segments = undefined;
                path2 = g.Path('M 0 0');
                path2.segments = undefined;
                assert.equal(path1.equals(path2), false);
            });
        });

        QUnit.module('getSegmentSubdivisions()', function() {

            QUnit.test('sanity', function(assert) {

                assert.equal(Array.isArray(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions()), true);
                assert.equal(Array.isArray(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 0 })), true);
                assert.equal(Array.isArray(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 1 })), true);
                assert.equal(Array.isArray(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 2 })), true);
                assert.equal(Array.isArray(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 3 })), true);
                assert.equal(Array.isArray(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 4 })), true);
                assert.equal(Array.isArray(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 5 })), true);
            });

            QUnit.test('returns an array of segment subdivisions', function(assert) {

                assert.deepEqual(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 0 }), [
                    [],
                    [],
                    [
                        g.Curve(g.Point(0, 100), g.Point(50, 200), g.Point(150, 0), g.Point(200, 100))
                    ]
                ]);
                assert.deepEqual(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 1 }), [
                    [],
                    [],
                    [
                        g.Curve(g.Point(0, 100), g.Point(6.25, 112.5), g.Point(13.28125, 120.3125), g.Point(20.8984375, 124.609375)),
                        g.Curve(g.Point(20.8984375, 124.609375), g.Point(28.515625, 128.90625), g.Point(36.71875, 129.6875), g.Point(45.3125, 128.125)),
                        g.Curve(g.Point(45.3125, 128.125), g.Point(53.90625, 126.5625), g.Point(62.890625, 122.65625), g.Point(72.0703125, 117.578125)),
                        g.Curve(g.Point(72.0703125, 117.578125), g.Point(81.25, 112.5), g.Point(90.625, 106.25), g.Point(100, 100)),
                        g.Curve(g.Point(100, 100), g.Point(109.375, 93.75), g.Point(118.75, 87.5), g.Point(127.9296875, 82.421875)),
                        g.Curve(g.Point(127.9296875, 82.421875), g.Point(137.109375, 77.34375), g.Point(146.09375, 73.4375), g.Point(154.6875, 71.875)),
                        g.Curve(g.Point(154.6875, 71.875), g.Point(163.28125, 70.3125), g.Point(171.484375, 71.09375), g.Point(179.1015625, 75.390625)),
                        g.Curve(g.Point(179.1015625, 75.390625), g.Point(186.71875, 79.6875), g.Point(193.75, 87.5), g.Point(200, 100))
                    ]
                ]);
                assert.deepEqual(g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100').getSegmentSubdivisions({ precision: 2 }), [
                    [],
                    [],
                    [
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
                    ]
                ]);
            });
        });

        QUnit.module('length()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = g.Path('M 0 0');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = g.Path('M 0 0 M 100 0');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');
                assert.equal(typeof path.length({ precision: 1 }), 'number');
                assert.equal(typeof path.length({ precision: 2 }), 'number');
                assert.equal(typeof path.length({ precision: 3 }), 'number');
                assert.equal(typeof path.length({ precision: 4 }), 'number');
                assert.equal(typeof path.length({ precision: 5 }), 'number');

                path = g.Path('M 0 0 L 100 0');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = g.Path('M 0 0 L 100 0 Z');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = g.Path('M 0 0 Z');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');
            });

            QUnit.test('returns the length of the path up to precision', function(assert) {

                var path;

                path = g.Path('M 0 0');
                assert.equal(path.length(), 0);
                assert.equal(path.length({ precision: 0 }), 0);

                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.length(), 0);
                assert.equal(path.length({ precision: 0 }), 0);

                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.length(), 399.96164987703463);
                assert.equal(path.length({ precision: 0 }), 200);
                assert.equal(path.length({ precision: 1 }), 390.1438222301384);
                assert.equal(path.length({ precision: 2 }), 399.38625336882194);
                assert.equal(path.length({ precision: 3 }), 399.96164987703463);
                assert.equal(path.length({ precision: 4 }), 399.99041258236997);
                assert.equal(path.length({ precision: 5 }), 399.9994007886072);

                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.length(), 100);
                assert.equal(path.length({ precision: 0 }), 100);

                path = g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.length(), 200);
                assert.equal(path.length({ precision: 0 }), 200);

                path = g.Path('M 0 0 Z');
                assert.equal(path.length(), 0);
                assert.equal(path.length({ precision: 0 }), 0);
            });

            QUnit.test('compare to segment parent functions', function(assert) {

                var path;

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.length(), curve.length());

                var line = g.Line('0 0', '100 0');
                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.length(), line.length());
            });

            QUnit.test('compare to browser implementation', function(assert) {

                var svg = getSvg();

                var gPath = g.Path('M 0 0 C 0 200 200 200 200 0');
                var path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(path);

                assert.equal(Math.round(gPath.length({ precision: 3 })), Math.round(path.node.getTotalLength()));

                svg.remove();
            });
        });

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = g.Path('M 0 0');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = g.Path('M 0 0 M 100 0');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 1 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 2 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 3 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 4 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 5 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = g.Path('M 0 0 L 100 0');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = g.Path('M 0 0 L 100 0 Z');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = g.Path('M 0 0 Z');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);
            });

            QUnit.test('returns a point at given length ratio up to precision', function(assert) {

                var path;

                path = g.Path('M 0 0');
                assert.equal(path.pointAt(0.4).toString(), '0@0');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '0@0');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '0@0');

                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.pointAt(0.4).toString(), '100@0');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '100@0');

                assert.equal(path.pointAt(-1).toString(), '100@0');
                assert.equal(path.pointAt(10).toString(), '100@0');

                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAt(0.4).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAt(0.4, { precision: 1 }).toString(), '100@150');
                assert.equal(path.pointAt(0.4, { precision: 2 }).toString(), '63.28125@140.625');
                assert.equal(path.pointAt(0.4, { precision: 3 }).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(path.pointAt(0.4, { precision: 4 }).toString(), '61.775019159540534@139.80202674865723');
                assert.equal(path.pointAt(0.4, { precision: 5 }).toString(), '61.775019159540534@139.80202674865723');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '200@0');

                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAt(0.4).toString(), '40@0');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '40@0');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '100@0');

                path = g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.pointAt(0.6).toString(), '80@0');
                assert.equal(path.pointAt(0.6, { precision: 0 }).toString(), '80@0');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '0@0');

                path = g.Path('M 0 0 Z');
                assert.equal(path.pointAt(0.4).toString(), '0@0');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '0@0');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '0@0');
            });

            QUnit.test('compare to segment parent functions', function(assert) {

                var path;

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAt(0.4).toString(), curve.pointAt(0.4).toString());
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), curve.pointAt(0.4, { precision: 0 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 1 }).toString(), curve.pointAt(0.4, { precision: 1 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 2 }).toString(), curve.pointAt(0.4, { precision: 2 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 3 }).toString(), curve.pointAt(0.4, { precision: 3 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 4 }).toString(), curve.pointAt(0.4, { precision: 4 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 5 }).toString(), curve.pointAt(0.4, { precision: 5 }).toString());

                assert.equal(path.pointAt(-1).toString(), curve.pointAt(-1).toString());
                assert.equal(path.pointAt(10).toString(), curve.pointAt(10).toString());

                var line = g.Line('0 0', '100 0');
                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAt(0.4).toString(), line.pointAt(0.4).toString());
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), line.pointAt(0.4, { precision: 0 }).toString());

                assert.equal(path.pointAt(-1).toString(), line.pointAt(-1).toString());
                assert.equal(path.pointAt(10).toString(), line.pointAt(10).toString());
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path

                path = g.Path('M 0 0');
                assert.ok(path.pointAtLength(40) instanceof g.Point);
                assert.ok(path.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-40) instanceof g.Point);
                assert.ok(path.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = g.Path('M 0 0 M 100 0');
                assert.ok(path.pointAtLength(40) instanceof g.Point);
                assert.ok(path.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-40) instanceof g.Point);
                assert.ok(path.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.ok(path.pointAtLength(250) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 1 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 2 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 3 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 4 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 5 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-250) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 1 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 2 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 3 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 4 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 5 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = g.Path('M 0 0 L 100 0');
                assert.ok(path.pointAtLength(40) instanceof g.Point);
                assert.ok(path.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-40) instanceof g.Point);
                assert.ok(path.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = g.Path('M 0 0 L 100 0 Z');
                assert.ok(path.pointAtLength(150) instanceof g.Point);
                assert.ok(path.pointAtLength(150, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-150) instanceof g.Point);
                assert.ok(path.pointAtLength(-150, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = g.Path('M 0 0 Z');
                assert.ok(path.pointAtLength(40) instanceof g.Point);
                assert.ok(path.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-40) instanceof g.Point);
                assert.ok(path.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);
            });

            QUnit.test('returns a point at given length up to precision', function(assert) {

                var path;

                path = g.Path('M 0 0');
                assert.equal(path.pointAtLength(40).toString(), '0@0');
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');

                assert.equal(path.pointAtLength(-40).toString(), '0@0');
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');

                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.pointAtLength(40).toString(), '100@0');
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), '100@0');
                assert.equal(path.pointAtLength(10000).toString(), '100@0');

                assert.equal(path.pointAtLength(-40).toString(), '100@0');
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), '100@0');
                assert.equal(path.pointAtLength(-10000).toString(), '100@0');

                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAtLength(250).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(path.pointAtLength(250, { precision: 0 }).toString(), '200@0');
                assert.equal(path.pointAtLength(250, { precision: 1 }).toString(), '168.75@112.5');
                assert.equal(path.pointAtLength(250, { precision: 2 }).toString(), '145.34912109375@135.3515625');
                assert.equal(path.pointAtLength(250, { precision: 3 }).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(path.pointAtLength(250, { precision: 4 }).toString(), '146.66639678180218@134.4217300415039');
                assert.equal(path.pointAtLength(250, { precision: 5 }).toString(), '146.65819215043712@134.42763034254313');
                assert.equal(path.pointAtLength(10000).toString(), '200@0');

                assert.equal(path.pointAtLength(-250).toString(), '53.59632968902588@134.6099853515625');
                assert.equal(path.pointAtLength(-250, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(-250, { precision: 1 }).toString(), '31.25@112.5');
                assert.equal(path.pointAtLength(-250, { precision: 2 }).toString(), '54.65087890625@135.3515625');
                assert.equal(path.pointAtLength(-250, { precision: 3 }).toString(), '53.59632968902588@134.6099853515625');
                assert.equal(path.pointAtLength(-250, { precision: 4 }).toString(), '53.33360321819782@134.4217300415039');
                assert.equal(path.pointAtLength(-250, { precision: 5 }).toString(), '53.34180784956288@134.42763034254313');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');

                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAtLength(40).toString(), '40@0');
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), '40@0');
                assert.equal(path.pointAtLength(10000).toString(), '100@0');

                assert.equal(path.pointAtLength(-40).toString(), '60@0');
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), '60@0');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');

                path = g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.pointAtLength(150).toString(), '50@0');
                assert.equal(path.pointAtLength(150, { precision: 0 }).toString(), '50@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');

                assert.equal(path.pointAtLength(-150).toString(), '50@0');
                assert.equal(path.pointAtLength(-150, { precision: 0 }).toString(), '50@0');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');

                path = g.Path('M 0 0 Z');
                assert.equal(path.pointAtLength(40).toString(), '0@0');
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');

                assert.equal(path.pointAtLength(-40).toString(), '0@0');
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');
            });

            QUnit.test('compare to segment parent functions', function(assert) {

                var path;

                var curve = g.Curve('0 0', '0 200', '200 200', '200 0');
                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAtLength(250).toString(), curve.pointAtLength(250).toString());
                assert.equal(path.pointAtLength(250, { precision: 0 }).toString(), curve.pointAtLength(250, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 1 }).toString(), curve.pointAtLength(250, { precision: 1 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 2 }).toString(), curve.pointAtLength(250, { precision: 2 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 3 }).toString(), curve.pointAtLength(250, { precision: 3 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 4 }).toString(), curve.pointAtLength(250, { precision: 4 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 5 }).toString(), curve.pointAtLength(250, { precision: 5 }).toString());
                assert.equal(path.pointAtLength(10000).toString(), curve.pointAtLength(10000).toString());

                assert.equal(path.pointAtLength(-250).toString(), curve.pointAtLength(-250).toString());
                assert.equal(path.pointAtLength(-250, { precision: 0 }).toString(), curve.pointAtLength(-250, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 1 }).toString(), curve.pointAtLength(-250, { precision: 1 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 2 }).toString(), curve.pointAtLength(-250, { precision: 2 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 3 }).toString(), curve.pointAtLength(-250, { precision: 3 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 4 }).toString(), curve.pointAtLength(-250, { precision: 4 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 5 }).toString(), curve.pointAtLength(-250, { precision: 5 }).toString());
                assert.equal(path.pointAtLength(-10000).toString(), curve.pointAtLength(-10000).toString());

                var line = g.Line('0 0', '100 0');
                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAtLength(40).toString(), line.pointAtLength(40).toString());
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), line.pointAtLength(40, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(10000).toString(), line.pointAtLength(10000).toString());

                assert.equal(path.pointAtLength(-40).toString(), line.pointAtLength(-40).toString());
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), line.pointAtLength(-40, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(-10000).toString(), line.pointAtLength(-10000).toString());
            });

            QUnit.test('compare to browser implementation', function(assert) {

                var gPath;
                var path;
                var p1;
                var x1;
                var y1;
                var p2;
                var x2;
                var y2;

                var svg = getSvg();

                gPath = g.Path('M 0 0 C 0 200 200 200 200 0');
                path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(path);

                p1 = gPath.pointAtLength(250, { precision: 4 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = path.node.getPointAtLength(250);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);

                assert.equal(x1 + '@' + y1, x2 + '@' + y2);

                // browser implementation is wrong
                /*gPath = g.Path('M 0 0 C 0 200 200 200 200 0');
                path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(path);

                p1 = gPath.pointAtLength(-1, { precision: 1 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = path.node.getPointAtLength(-1);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);

                assert.equal(x1 + '@' + y1, x2 + '@' + y2);*/

                gPath = g.Path('M 0 0 C 0 200 200 200 200 0');
                path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(path);

                p1 = gPath.pointAtLength(10000, { precision: 1 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = path.node.getPointAtLength(10000);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);

                assert.equal(x1 + '@' + y1, x2 + '@' + y2);

                svg.remove();
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0, g.Point('0 0')) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0, g.Point('10 10')) instanceof g.Path);

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1, g.Point('0 0')) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1, g.Point('10 10')) instanceof g.Path);

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0, g.Point('0 0')) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0, g.Point('10 10')) instanceof g.Path);

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1, g.Point('0 0')) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1, g.Point('10 10')) instanceof g.Path);

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10, g.Point('0 0')) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10, g.Point('10 10')) instanceof g.Path);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0).toString(), g.Path('M 0 0 L 0 0 C 0 0 0 0 0 0 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0, g.Point('0 0')).toString(), g.Path('M 0 0 L 0 0 C 0 0 0 0 0 0 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0, g.Point('10 10')).toString(), g.Path('M 10 10 L 10 10 C 10 10 10 10 10 10 Z').toString());

                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1).toString(), g.Path('M 0 100 L 0 100 C 0 100 0 150 0 200 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1, g.Point('0 0')).toString(), g.Path('M 0 100 L 0 100 C 0 100 0 150 0 200 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1, g.Point('10 10')).toString(), g.Path('M 10 100 L 10 100 C 10 100 10 150 10 200 Z').toString());

                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0).toString(), g.Path('M 150 0 L 100 0 C 100 0 0 0 100 0 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0, g.Point('0 0')).toString(), g.Path('M 150 0 L 100 0 C 100 0 0 0 100 0 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0, g.Point('10 10')).toString(), g.Path('M 150 10 L 100 10 C 100 10 0 10 100 10 Z').toString());

                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1).toString(), g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1, g.Point('0 0')).toString(), g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1, g.Point('10 10')).toString(), g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').toString());

                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10).toString(), g.Path('M 1500 1000 L 1000 1000 C 1000 1000 0 1500 1000 2000 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10, g.Point('0 0')).toString(), g.Path('M 1500 1000 L 1000 1000 C 1000 1000 0 1500 1000 2000 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10, g.Point('10 10')).toString(), g.Path('M 1410 910 L 910 910 C 910 910 -90 1410 910 1910 Z').toString());
            });
        });

        QUnit.module('tangentAt()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.tangentAt(0.5), null);
                assert.equal(path.tangentAt(0.5, { precision: 0 }), null);

                assert.equal(path.tangentAt(-1), null);
                assert.equal(path.tangentAt(10), null);

                path = g.Path('M 0 0 L 0 0');
                assert.equal(path.tangentAt(0.5), null);
                assert.equal(path.tangentAt(0.5, { precision: 0 }), null);
                assert.equal(path.tangentAt(-1), null);
                assert.equal(path.tangentAt(10), null);

                path = g.Path('M 0 200 L 0 0 C 0 200 200 200 200 0 L 200 200 Z'); // segment length: 0 - 200 - 400 - 200 - 200
                // first lineto
                assert.ok(path.tangentAt(0.1) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 5 }) instanceof g.Line);

                // point of discontinuity
                assert.ok(path.tangentAt(0.2) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 5 }) instanceof g.Line);

                // curveto midpoint
                assert.ok(path.tangentAt(0.4) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 5 }) instanceof g.Line);

                // curveto
                assert.ok(path.tangentAt(0.5) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 5 }) instanceof g.Line);

                // closepath
                assert.ok(path.tangentAt(0.9) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 5 }) instanceof g.Line);

                assert.ok(path.tangentAt(-1) instanceof g.Line);
                assert.ok(path.tangentAt(10) instanceof g.Line);
            });

            QUnit.test('returns tangent to curve at given length ratio up to precision', function(assert) {

                var path;

                path = g.Path('M 0 200 L 0 0 C 0 200 200 200 200 0 L 200 200 Z'); // segment length: 0 - 200 - 400 - 200 - 200
                // first lineto
                assert.equal(path.tangentAt(0.1).toString(), '0@100.00383501229652 0@-99.99616498770348');
                assert.equal(path.tangentAt(0.1, { precision: 0 }).toString(), '0@120 0@-80');
                assert.equal(path.tangentAt(0.1, { precision: 1 }).toString(), '0@100.98561777698616 0@-99.01438222301384');
                assert.equal(path.tangentAt(0.1, { precision: 2 }).toString(), '0@100.06137466311782 0@-99.93862533688218');
                assert.equal(path.tangentAt(0.1, { precision: 3 }).toString(), '0@100.00383501229652 0@-99.99616498770348');
                assert.equal(path.tangentAt(0.1, { precision: 4 }).toString(), '0@100.000958741763 0@-99.999041258237');
                assert.equal(path.tangentAt(0.1, { precision: 5 }).toString(), '0@100.00005992113927 0@-99.99994007886073');

                // point of discontinuity
                assert.equal(path.tangentAt(0.2).toString(), '0@0.0076700245930396704 0@-199.99232997540696');
                assert.equal(path.tangentAt(0.2, { precision: 0 }).toString(), '0@40 0@-160');
                assert.equal(path.tangentAt(0.2, { precision: 1 }).toString(), '0@1.971235553972292 0@-198.0287644460277');
                assert.equal(path.tangentAt(0.2, { precision: 2 }).toString(), '0@0.1227493262356063 0@-199.8772506737644');
                assert.equal(path.tangentAt(0.2, { precision: 3 }).toString(), '0@0.0076700245930396704 0@-199.99232997540696');
                assert.equal(path.tangentAt(0.2, { precision: 4 }).toString(), '0@0.0019174835259718748 0@-199.99808251647403');
                assert.equal(path.tangentAt(0.2, { precision: 5 }).toString(), '0@0.0001198422785364528 0@-199.99988015772146');

                // curveto midpoint
                assert.equal(path.tangentAt(0.4).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 0 }).toString(), '0@0 0@200');
                assert.equal(path.tangentAt(0.4, { precision: 1 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 2 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 3 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 4 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 5 }).toString(), '100@150 200@150');

                // arbitrary curveto point
                assert.equal(path.tangentAt(0.5).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAt(0.5, { precision: 0 }).toString(), '200@0 200@-200');
                assert.equal(path.tangentAt(0.5, { precision: 1 }).toString(), '168.75@112.5 243.75@12.5');
                assert.equal(path.tangentAt(0.5, { precision: 2 }).toString(), '178.59649658203125@97.119140625 243.34259033203125@-21.630859375');
                assert.equal(path.tangentAt(0.5, { precision: 3 }).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAt(0.5, { precision: 4 }).toString(), '178.83307227748446@96.68337106704712 243.2886529888492@-22.55491018295288');
                assert.equal(path.tangentAt(0.5, { precision: 5 }).toString(), '178.82126877566407@96.70520201325417 243.29140345116684@-22.508665174245834');

                // closepath
                assert.equal(path.tangentAt(0.9).toString(), '99.99616498770342@200 -100.00383501229658@200');
                assert.equal(path.tangentAt(0.9, { precision: 0 }).toString(), '80@200 -120@200');
                assert.equal(path.tangentAt(0.9, { precision: 1 }).toString(), '99.01438222301387@200 -100.98561777698613@200');
                assert.equal(path.tangentAt(0.9, { precision: 2 }).toString(), '99.93862533688218@200 -100.06137466311782@200');
                assert.equal(path.tangentAt(0.9, { precision: 3 }).toString(), '99.99616498770342@200 -100.00383501229658@200');
                assert.equal(path.tangentAt(0.9, { precision: 4 }).toString(), '99.99904125823696@200 -100.00095874176304@200');
                assert.equal(path.tangentAt(0.9, { precision: 5 }).toString(), '99.99994007886073@200 -100.00005992113927@200');

                assert.equal(path.tangentAt(-1).toString(), g.Line('0 200', '0 0').toString());
                assert.equal(path.tangentAt(10).toString(), g.Line('0 200', '-200 200').toString());
            });
        });

        QUnit.module('tangentAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.tangentAtLength(40), null);
                assert.equal(path.tangentAtLength(40, { precision: 0 }), null);
                assert.equal(path.tangentAtLength(10000), null);

                assert.equal(path.tangentAtLength(-40), null);
                assert.equal(path.tangentAtLength(-40, { precision: 0 }), null);
                assert.equal(path.tangentAtLength(-10000), null);

                path = g.Path('M 0 0 L 0 0');
                assert.equal(path.tangentAtLength(10000), null);
                assert.equal(path.tangentAtLength(-10000), null);

                path = g.Path('M 0 200 L 0 0 C 0 200 200 200 200 0 L 200 200 Z'); // segment length: 0 - 200 - 400 - 200 - 200
                // first lineto
                assert.ok(path.tangentAtLength(100) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 5 }) instanceof g.Line);

                // point of discontinuity
                assert.ok(path.tangentAtLength(200) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 5 }) instanceof g.Line);

                // curveto midpoint
                assert.ok(path.tangentAtLength(400) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 5 }) instanceof g.Line);

                // arbitrary curveto point
                assert.ok(path.tangentAtLength(500) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 5 }) instanceof g.Line);

                // closepath
                assert.ok(path.tangentAtLength(900) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 5 }) instanceof g.Line);

                assert.ok(path.tangentAtLength(10000) instanceof g.Line);
                assert.ok(path.tangentAtLength(-10000) instanceof g.Line);

                // first lineto
                assert.ok(path.tangentAtLength(-900) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 5 }) instanceof g.Line);

                // point of discontinuity
                assert.ok(path.tangentAtLength(-800) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 5 }) instanceof g.Line);

                // curveto midpoint
                assert.ok(path.tangentAtLength(-600) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 5 }) instanceof g.Line);

                // arbitrary curveto point
                assert.ok(path.tangentAtLength(-500) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 5 }) instanceof g.Line);

                // closepath
                assert.ok(path.tangentAtLength(-100) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 5 }) instanceof g.Line);
            });

            QUnit.test('returns tangent to curve at given length up to precision', function(assert) {

                var path;

                path = g.Path('M 0 200 L 0 0 C 0 200 200 200 200 0 L 200 200 Z'); // segment length: 0 - 200 - 400 - 200 - 200
                // first lineto
                assert.equal(path.tangentAtLength(100).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 0 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 1 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 2 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 3 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 4 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 5 }).toString(), '0@100 0@-100');

                // point of discontinuity
                assert.equal(path.tangentAtLength(200).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 0 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 1 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 2 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 3 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 4 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 5 }).toString(), '0@0 0@-200');

                // curveto midpoint
                assert.equal(path.tangentAtLength(400).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 0 }).toString(), '200@0 200@-200');
                assert.equal(path.tangentAtLength(400, { precision: 1 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 2 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 3 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 4 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 5 }).toString(), '100@150 200@150');

                // arbitrary curveto point
                assert.equal(path.tangentAtLength(500).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAtLength(500, { precision: 0 }).toString(), '200@100 200@300');
                assert.equal(path.tangentAtLength(500, { precision: 1 }).toString(), '168.75@112.5 243.75@12.5');
                assert.equal(path.tangentAtLength(500, { precision: 2 }).toString(), '178.59649658203125@97.119140625 243.34259033203125@-21.630859375');
                assert.equal(path.tangentAtLength(500, { precision: 3 }).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAtLength(500, { precision: 4 }).toString(), '178.83307227748446@96.68337106704712 243.2886529888492@-22.55491018295288');
                assert.equal(path.tangentAtLength(500, { precision: 5 }).toString(), '178.82126877566407@96.70520201325417 243.29140345116684@-22.508665174245834');

                // closepath
                assert.equal(path.tangentAtLength(900).toString(), '99.96164987703469@200 -100.03835012296531@200');
                assert.equal(path.tangentAtLength(900, { precision: 0 }).toString(), '0@200 -200@200');
                assert.equal(path.tangentAtLength(900, { precision: 1 }).toString(), '90.14382223013841@200 -109.85617776986159@200');
                assert.equal(path.tangentAtLength(900, { precision: 2 }).toString(), '99.38625336882194@200 -100.61374663117806@200');
                assert.equal(path.tangentAtLength(900, { precision: 3 }).toString(), '99.96164987703469@200 -100.03835012296531@200');
                assert.equal(path.tangentAtLength(900, { precision: 4 }).toString(), '99.99041258237003@200 -100.00958741762997@200');
                assert.equal(path.tangentAtLength(900, { precision: 5 }).toString(), '99.9994007886072@200 -100.0005992113928@200');

                assert.equal(path.tangentAtLength(10000).toString(), '0@200 -200@200');
                assert.equal(path.tangentAtLength(-10000).toString(), '0@200 0@0');

                // first lineto
                assert.equal(path.tangentAtLength(-900).toString(), '0@100.03835012296531 0@-99.96164987703469');
                assert.equal(path.tangentAtLength(-900, { precision: 0 }).toString(), '0@200 0@0');
                assert.equal(path.tangentAtLength(-900, { precision: 1 }).toString(), '0@109.85617776986159 0@-90.14382223013841');
                assert.equal(path.tangentAtLength(-900, { precision: 2 }).toString(), '0@100.61374663117806 0@-99.38625336882194');
                assert.equal(path.tangentAtLength(-900, { precision: 3 }).toString(), '0@100.03835012296531 0@-99.96164987703469');
                assert.equal(path.tangentAtLength(-900, { precision: 4 }).toString(), '0@100.00958741762997 0@-99.99041258237003');
                assert.equal(path.tangentAtLength(-900, { precision: 5 }).toString(), '0@100.0005992113928 0@-99.9994007886072');

                // point of discontinuity
                assert.equal(path.tangentAtLength(-800).toString(), '0@0.03835012296531204 0@-199.9616498770347');
                assert.equal(path.tangentAtLength(-800, { precision: 0 }).toString(), '0@200 0@0');
                assert.equal(path.tangentAtLength(-800, { precision: 1 }).toString(), '0@9.856177769861574 0@-190.14382223013843');
                assert.equal(path.tangentAtLength(-800, { precision: 2 }).toString(), '0@0.6137466311780599 0@-199.38625336882194');
                assert.equal(path.tangentAtLength(-800, { precision: 3 }).toString(), '0@0.03835012296531204 0@-199.9616498770347');
                assert.equal(path.tangentAtLength(-800, { precision: 4 }).toString(), '0@0.00958741762997306 0@-199.99041258237003');
                assert.equal(path.tangentAtLength(-800, { precision: 5 }).toString(), '0@0.0005992113927959508 0@-199.9994007886072');

                // curveto midpoint
                assert.equal(path.tangentAtLength(-600).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 0 }).toString(), '0@0 0@200');
                assert.equal(path.tangentAtLength(-600, { precision: 1 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 2 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 3 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 4 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 5 }).toString(), '100@150 200@150');

                // arbitrary curveto point
                assert.equal(path.tangentAtLength(-500).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAtLength(-500, { precision: 0 }).toString(), '0@0 0@200');
                assert.equal(path.tangentAtLength(-500, { precision: 1 }).toString(), '168.75@112.5 243.75@12.5');
                assert.equal(path.tangentAtLength(-500, { precision: 2 }).toString(), '178.59649658203125@97.119140625 243.34259033203125@-21.630859375');
                assert.equal(path.tangentAtLength(-500, { precision: 3 }).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAtLength(-500, { precision: 4 }).toString(), '178.83307227748446@96.68337106704712 243.2886529888492@-22.55491018295288');
                assert.equal(path.tangentAtLength(-500, { precision: 5 }).toString(), '178.82126877566407@96.70520201325417 243.29140345116684@-22.508665174245834');

                // closepath
                assert.equal(path.tangentAtLength(-100).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 0 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 1 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 2 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 3 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 4 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 5 }).toString(), '100@200 -100@200');
            });
        });

        QUnit.module('translate()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(0, 0) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(0, 10) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(10, 0) instanceof g.Path);
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(10, 10) instanceof g.Path);
            });

            QUnit.test('should return a translated version of self', function(assert) {

                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(0, 0).toString(), g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(0, 10).toString(), g.Path('M 150 110 L 100 110 C 100 110 0 160 100 210 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(10, 0).toString(), g.Path('M 160 100 L 110 100 C 110 100 10 150 110 200 Z').toString());
                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(10, 10).toString(), g.Path('M 160 110 L 110 110 C 110 110 10 160 110 210 Z').toString());
            });
        });

        QUnit.module('serialize()', function(assert) {

            QUnit.test('sanity', function(assert) {

                assert.equal(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').serialize(), 'M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
            });
        });
    });
});

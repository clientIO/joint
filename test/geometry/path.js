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

            var error;

            // no arguments
            try {
                g.Path();
            } catch (e) {
                error = e;
            }

            assert.ok(typeof error !== 'undefined', 'Should throw an error when trying to construct a Path with no arguments.');

            // invalid argument
            try {
                g.Path(1);
            } catch (e) {
                error = e;
            }

            assert.ok(typeof error !== 'undefined', 'Should throw an error when trying to construct a Path with an invalid argument.');

            // empty array
            try {
                g.Path([]);
            } catch (e) {
                error = e;
            }

            assert.ok(typeof error !== 'undefined', 'Should throw an error when trying to construct a Path with an empty array.');

            // path segments array that does not start with a moveto segment
            try {
                g.Path([g.Path.segments.L('150 100', '100 100')]);
            } catch (e) {
                error = e;
            }

            assert.ok(typeof error !== 'undefined', 'Should throw an error when trying to construct a Path with invalid path segments array.');

            // path segments array that starts with a moveto segment that does not start at 0,0
            try {
                g.Path([g.Path.segments.M('150 100', '100 100')]);
            } catch (e) {
                error = e;
            }

            assert.ok(typeof error !== 'undefined', 'Should throw an error when trying to construct a Path with invalid path segments array.');

            var path;

            // empty string
            path = g.Path('');
            assert.ok(path, 'returns instance of g.Path');
            assert.ok(typeof path.pathSegments !== 'undefined', 'has "pathSegments" property');
            assert.equal(path.pathSegments.length, 1);
            assert.ok(path.pathSegments[0] instanceof g.Path.segments.M);
            assert.equal(path.pathSegments[0].start.toString(), g.Point(0, 0).toString());
            assert.equal(path.pathSegments[0].end.toString(), g.Point(0, 0).toString());

            // normalized path data string
            path = g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
            assert.ok(path, 'returns instance of g.Path');
            assert.ok(typeof path.pathSegments !== 'undefined', 'has "pathSegments" property');
            assert.equal(path.pathSegments.length, 4);
            assert.ok(path.pathSegments[0] instanceof g.Path.segments.M);
            assert.ok(path.pathSegments[1] instanceof g.Path.segments.L);
            assert.ok(path.pathSegments[2] instanceof g.Path.segments.C);
            assert.ok(path.pathSegments[3] instanceof g.Path.segments.Z);
            assert.equal(path.pathSegments[0].start.toString(), g.Point(0, 0).toString());
            assert.equal(path.pathSegments[0].end.toString(), g.Point(150, 100).toString());
            assert.equal(path.pathSegments[1].start.toString(), g.Point(150, 100).toString());
            assert.equal(path.pathSegments[1].end.toString(), g.Point(100, 100).toString());
            assert.equal(path.pathSegments[2].start.toString(), g.Point(100, 100).toString());
            assert.equal(path.pathSegments[2].controlPoint1.toString(), g.Point(100, 100).toString());
            assert.equal(path.pathSegments[2].controlPoint2.toString(), g.Point(0, 150).toString());
            assert.equal(path.pathSegments[2].end.toString(), g.Point(100, 200).toString());
            assert.equal(path.pathSegments[3].start.toString(), g.Point(100, 200).toString());
            assert.equal(path.pathSegments[3].end.toString(), g.Point(150, 100).toString());

            // path segments array
            path = g.Path([g.Path.segments.M('0 0', '150 100'), g.Path.segments.L('150 100', '100 100'), g.Path.segments.C('100 100', '100 100', '0 150', '100 200'), g.Path.segments.Z('100 200', '150 100')]);
            assert.ok(path, 'returns instance of g.Path');
            assert.ok(typeof path.pathSegments !== 'undefined', 'has "pathSegments" property');
            assert.equal(path.pathSegments.length, 4);
            assert.ok(path.pathSegments[0] instanceof g.Path.segments.M);
            assert.ok(path.pathSegments[1] instanceof g.Path.segments.L);
            assert.ok(path.pathSegments[2] instanceof g.Path.segments.C);
            assert.ok(path.pathSegments[3] instanceof g.Path.segments.Z);
            assert.equal(path.pathSegments[0].start.toString(), g.Point(0, 0).toString());
            assert.equal(path.pathSegments[0].end.toString(), g.Point(150, 100).toString());
            assert.equal(path.pathSegments[1].start.toString(), g.Point(150, 100).toString());
            assert.equal(path.pathSegments[1].end.toString(), g.Point(100, 100).toString());
            assert.equal(path.pathSegments[2].start.toString(), g.Point(100, 100).toString());
            assert.equal(path.pathSegments[2].controlPoint1.toString(), g.Point(100, 100).toString());
            assert.equal(path.pathSegments[2].controlPoint2.toString(), g.Point(0, 150).toString());
            assert.equal(path.pathSegments[2].end.toString(), g.Point(100, 200).toString());
            assert.equal(path.pathSegments[3].start.toString(), g.Point(100, 200).toString());
            assert.equal(path.pathSegments[3].end.toString(), g.Point(150, 100).toString());
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').bbox() instanceof g.Rect);

                assert.ok(g.Path('M 150 100 M 100 200').bbox() instanceof g.Rect);

                var path = g.Path('M 0 0');
                path.pathSegments = [];
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
                path1.pathSegments = [];
                path2 = g.Path('M 0 0');
                path2.pathSegments = [];
                assert.equal(path1.equals(path2), true);

                path1 = g.Path('M 100 100');
                path2 = g.Path('M 0 0');
                path2.pathSegments = null;
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.pathSegments = null;
                path2 = g.Path('M 100 100');
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.pathSegments = null;
                path2 = g.Path('M 0 0');
                path2.pathSegments = null;
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 100 100');
                path2 = g.Path('M 0 0');
                path2.pathSegments = undefined;
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.pathSegments = undefined;
                path2 = g.Path('M 100 100');
                assert.equal(path1.equals(path2), false);

                path1 = g.Path('M 0 0');
                path1.pathSegments = undefined;
                path2 = g.Path('M 0 0');
                path2.pathSegments = undefined;
                assert.equal(path1.equals(path2), false);
            });
        });

        QUnit.module('getSegmentSubdivisions()', function() {

            QUnit.test('sanity', function(assert) {

                // TODO
            });

            QUnit.test('returns an array of segment subdivisions', function(assert) {

                // TODO
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
                assert.equal(path.length(), 399.38625336882194);
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

                var seg;
                var path;

                seg = g.Path.segments.M('0 0', '100 0');
                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.length(), seg.length());

                seg = g.Path.segments.C('0 0', '0 200', '200 200', '200 0');
                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.length(), seg.length());

                seg = g.Path.segments.L('0 0', '100 0');
                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.length(), seg.length());
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
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '100@150');
                assert.equal(path.pointAt(0.4, { precision: 1 }).toString(), '63.28125@140.625');
                assert.equal(path.pointAt(0.4, { precision: 2 }).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(path.pointAt(0.4, { precision: 3 }).toString(), '61.775019159540534@139.80202674865723');
                assert.equal(path.pointAt(0.4, { precision: 4 }).toString(), '61.775019159540534@139.80202674865723');
                assert.equal(path.pointAt(0.4, { precision: 5 }).toString(), '61.77288595901036@139.800833130721');
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

                var seg;
                var path;

                seg = g.Path.segments.M('0 0', '100 0');
                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.pointAt(0.4).toString(), seg.pointAt(0.4).toString());
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), seg.pointAt(0.4, { precision: 0 }).toString());
                assert.equal(path.pointAt(-1).toString(), seg.pointAt(-1).toString());
                assert.equal(path.pointAt(10).toString(), seg.pointAt(10).toString());

                seg = g.Path.segments.C('0 0', '0 200', '200 200', '200 0');
                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAt(0.4).toString(), seg.pointAt(0.4).toString());
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), seg.pointAt(0.4, { precision: 0 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 1 }).toString(), seg.pointAt(0.4, { precision: 1 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 2 }).toString(), seg.pointAt(0.4, { precision: 2 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 3 }).toString(), seg.pointAt(0.4, { precision: 3 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 4 }).toString(), seg.pointAt(0.4, { precision: 4 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 5 }).toString(), seg.pointAt(0.4, { precision: 5 }).toString());
                assert.equal(path.pointAt(-1).toString(), seg.pointAt(-1).toString());
                assert.equal(path.pointAt(10).toString(), seg.pointAt(10).toString());

                seg = g.Path.segments.L('0 0', '100 0');
                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAt(0.4).toString(), seg.pointAt(0.4).toString());
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), seg.pointAt(0.4, { precision: 0 }).toString());
                assert.equal(path.pointAt(-1).toString(), seg.pointAt(-1).toString());
                assert.equal(path.pointAt(10).toString(), seg.pointAt(10).toString());
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path

                path = g.Path('M 0 0');
                assert.ok(path.pointAtLength(50) instanceof g.Point);
                assert.ok(path.pointAtLength(50, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-1) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                path = g.Path('M 0 0 M 100 0');
                assert.ok(path.pointAtLength(50) instanceof g.Point);
                assert.ok(path.pointAtLength(50, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-1) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.ok(path.pointAtLength(250) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 1 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 2 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 3 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 4 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 5 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-1) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                path = g.Path('M 0 0 L 100 0');
                assert.ok(path.pointAtLength(50) instanceof g.Point);
                assert.ok(path.pointAtLength(50, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-1) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                path = g.Path('M 0 0 L 100 0 Z');
                assert.ok(path.pointAtLength(50) instanceof g.Point);
                assert.ok(path.pointAtLength(50, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-1) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                path = g.Path('M 0 0 Z');
                assert.ok(path.pointAtLength(50) instanceof g.Point);
                assert.ok(path.pointAtLength(50, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-1) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);
            });

            QUnit.test('returns a point at given length up to precision', function(assert) {

                var path;

                path = g.Path('M 0 0');
                assert.equal(path.pointAtLength(50).toString(), '0@0');
                assert.equal(path.pointAtLength(50, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(-1).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');

                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.pointAtLength(50).toString(), '100@0');
                assert.equal(path.pointAtLength(50, { precision: 0 }).toString(), '100@0');
                assert.equal(path.pointAtLength(-1).toString(), '100@0');
                assert.equal(path.pointAtLength(10000).toString(), '100@0');

                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAtLength(250).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(path.pointAtLength(250, { precision: 0 }).toString(), '168.75@112.5');
                assert.equal(path.pointAtLength(250, { precision: 1 }).toString(), '145.34912109375@135.3515625');
                assert.equal(path.pointAtLength(250, { precision: 2 }).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(path.pointAtLength(250, { precision: 3 }).toString(), '146.66639678180218@134.4217300415039');
                assert.equal(path.pointAtLength(250, { precision: 4 }).toString(), '146.65819215043712@134.42763034254313');
                assert.equal(path.pointAtLength(250, { precision: 5 }).toString(), '146.65562812928542@134.42947395742522');
                assert.equal(path.pointAtLength(-1).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '200@0');

                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAtLength(50).toString(), '50@0');
                assert.equal(path.pointAtLength(50, { precision: 0 }).toString(), '50@0');
                assert.equal(path.pointAtLength(-1).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '100@0');

                path = g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.pointAtLength(150).toString(), '50@0');
                assert.equal(path.pointAtLength(150, { precision: 0 }).toString(), '50@0');
                assert.equal(path.pointAtLength(-1).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');

                path = g.Path('M 0 0 Z');
                assert.equal(path.pointAtLength(50).toString(), '0@0');
                assert.equal(path.pointAtLength(50, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(-1).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');
            });

            QUnit.test('compare to segment parent functions', function(assert) {

                var seg;
                var path;

                seg = g.Path.segments.M('0 0', '100 0');
                path = g.Path('M 0 0 M 100 0');
                assert.equal(path.pointAtLength(50).toString(), seg.pointAtLength(50).toString());
                assert.equal(path.pointAtLength(50, { precision: 0 }).toString(), seg.pointAtLength(50, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(-1).toString(), seg.pointAtLength(-1).toString());
                assert.equal(path.pointAtLength(10000).toString(), seg.pointAtLength(10000).toString());

                seg = g.Path.segments.C('0 0', '0 200', '200 200', '200 0');
                path = g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAtLength(250).toString(), seg.pointAtLength(250).toString());
                assert.equal(path.pointAtLength(250, { precision: 0 }).toString(), seg.pointAtLength(250, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 1 }).toString(), seg.pointAtLength(250, { precision: 1 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 2 }).toString(), seg.pointAtLength(250, { precision: 2 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 3 }).toString(), seg.pointAtLength(250, { precision: 3 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 4 }).toString(), seg.pointAtLength(250, { precision: 4 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 5 }).toString(), seg.pointAtLength(250, { precision: 5 }).toString());
                assert.equal(path.pointAtLength(-1).toString(), seg.pointAtLength(-1).toString());
                assert.equal(path.pointAtLength(10000).toString(), seg.pointAtLength(10000).toString());

                seg = g.Path.segments.L('0 0', '100 0');
                path = g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAtLength(50).toString(), seg.pointAtLength(50).toString());
                assert.equal(path.pointAtLength(50, { precision: 0 }).toString(), seg.pointAtLength(50, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(-1).toString(), seg.pointAtLength(-1).toString());
                assert.equal(path.pointAtLength(10000).toString(), seg.pointAtLength(10000).toString());
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

                p1 = gPath.pointAtLength(250, { precision: 3 });
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

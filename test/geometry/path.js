'use strict';

QUnit.module('path', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Path object', function(assert) {

            var path = g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
            assert.ok(path, 'returns instance of g.Path');
            assert.ok(typeof path.pathSegments !== 'undefined', 'has "pathSegments" property');
            assert.equals(path.pathSegments.length, 4);
            assert.ok(path.pathSegments[0] instanceof g.Path.segments.Moveto);
            assert.ok(path.pathSegments[1] instanceof g.Path.segments.Lineto);
            assert.ok(path.pathSegments[2] instanceof g.Path.segments.Curveto);
            assert.ok(path.pathSegments[3] instanceof g.Path.segments.Closepath);
            assert.ok(path.pathSegments[0].start.equals(g.Point(0, 0)));
            assert.ok(path.pathSegments[0].end.equals(g.Point(150, 100)));
            assert.ok(path.pathSegments[1].start.equals(g.Point(150, 100)));
            assert.ok(path.pathSegments[1].end.equals(g.Point(100, 100)));
            assert.ok(path.pathSegments[2].start.equals(g.Point(100, 100)));
            assert.ok(path.pathSegments[2].controlPoint1.equals(g.Point(100, 100)));
            assert.ok(path.pathSegments[2].controlPoint2.equals(g.Point(0, 150)));
            assert.ok(path.pathSegments[2].end.equals(g.Point(100, 200)));
            assert.ok(path.pathSegments[3].start.equals(g.Point(100, 200)));
            assert.ok(path.pathSegments[3].end.equals(g.Point(150, 100)));
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').bbox() instanceof g.Rect);
            });

            QUnit.test('should return the curve\'s bounding box', function(assert) {

                assert.equals(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').bbox().toString(), '55.55555555555556@100 150@200');
            });
        });

        QUnit.module('clone()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').clone() instanceof g.Path);
            });

            QUnit.test('returns a clone', function(assert) {

                var p1 = g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                var p2 = p1.clone();
                assert.notOk(p1 === p2);
                assert.equal(p1.toString(), p2.toString());
                assert.ok(p1.equals(p2));
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

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0).equals(g.Path('M 0 0 L 0 0 C 0 0 0 0 0 0 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0, g.Point('0 0')).equals(g.Path('M 0 0 L 0 0 C 0 0 0 0 0 0 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 0, g.Point('10 10')).equals(g.Path('M 0 0 L 0 0 C 0 0 0 0 0 0 Z')));

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1).equals(g.Path('M 0 100 L 0 100 C 0 100 0 150 0 200 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1, g.Point('0 0')).equals(g.Path('M 0 100 L 0 100 C 0 100 0 150 0 200 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(0, 1, g.Point('10 10')).equals(g.Path('M 0 100 L 0 100 C 0 100 0 150 0 200 Z')));

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0).equals(g.Path('M 150 0 L 100 0 C 100 0 0 0 100 0 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0, g.Point('0 0')).equals(g.Path('M 150 0 L 100 0 C 100 0 0 0 100 0 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 0, g.Point('10 10')).equals(g.Path('M 150 0 L 100 0 C 100 0 0 0 100 0 Z')));

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1).equals(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1, g.Point('0 0')).equals(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(1, 1, g.Point('10 10')).equals(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z')));

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10).equals(g.Path('M 1500 1000 L 1000 1000 C 1000 1000 0 1500 1000 2000 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10, g.Point('0 0')).equals(g.Path('M 1500 1000 L 1000 1000 C 1000 1000 0 1500 1000 2000 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').scale(10, 10, g.Point('10 10')).equals(g.Path('M 1410 910 L 910 910 C 910 910 -90 1410 910 1910 Z')));
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

                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(0, 0).equals(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(0, 10).equals(g.Path('M 150 110 L 100 110 C 100 110 0 160 100 210 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(10, 0).equals(g.Path('M 160 100 L 110 100 C 110 100 10 150 110 200 Z')));
                assert.ok(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').translate(10, 10).equals(g.Path('M 160 110 L 110 110 C 110 110 10 160 110 210 Z')));
            });
        });

        QUnit.module('getPathData()', function(assert) {

            assert.equals(g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z').getPathData(), 'M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
        });
    });
});

'use strict';

QUnit.module('polyline', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Polyline object', function(assert) {

            var polyline;

            polyline = g.Polyline();
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 0);

            polyline = g.Polyline([]);
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 0);

            polyline = g.Polyline([g.Point(1, 1), g.Point(2, 2)]);
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '1@1');
            assert.equal(polyline.points[1].toString(), '2@2');

            polyline = g.Polyline(['1 1', '2 2']);
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '1@1');
            assert.equal(polyline.points[1].toString(), '2@2');

            polyline = g.Polyline(['1@1', '2@2']);
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '1@1');
            assert.equal(polyline.points[1].toString(), '2@2');

            polyline = g.Polyline('1,1 2,2');
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '1@1');
            assert.equal(polyline.points[1].toString(), '2@2');

            polyline = g.Polyline('');
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 0);
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline(['10 10', '10 40', '50 40', '50 10']).bbox() instanceof g.Rect);

                assert.equal(g.Polyline([]).bbox(), null);
            });

            QUnit.test('returns tight bounding box of the curve', function(assert) {

                assert.equal(g.Polyline(['10 10', '10 40', '50 40', '50 10']).bbox().toString(), '10@10 50@40');
            });
        });

        QUnit.module('clone()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline(['10 10', '10 40', '50 40', '50 10']).clone() instanceof g.Polyline);
            });

            QUnit.test('returns a clone', function(assert) {

                var polyline1 = g.Polyline(['10 10', '10 40', '50 40', '50 10']);
                var polyline2 = polyline1.clone();
                assert.notOk(polyline1 === polyline2);
                assert.equal(polyline1.toString(), polyline2.toString());
                assert.ok(polyline1.equals(polyline2));
            });
        });

        QUnit.module('convexHull()', function(assert) {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline([]) instanceof g.Polyline);
                assert.ok(g.Polyline([g.Point(100,100), g.Point(200,200)]) instanceof g.Polyline);
            });

            QUnit.test('returns a convex hull', function(assert) {

                assert.equal(g.Polyline([]).convexHull().toString(), "");
                assert.equal(g.Polyline([g.Point(100, 100)]).convexHull().toString(), "100@100");
                assert.equal(g.Polyline([g.Point(100, 100), g.Point(200, 100)]).convexHull().toString(), "100@100,200@100");
                assert.equal(g.Polyline([g.Point(100, 100), g.Point(200, 100), g.Point(300, 100)]).convexHull().toString(), "100@100,300@100");
                assert.equal(g.Polyline([g.Point(200, 100), g.Point(100, 100), g.Point(300, 100)]).convexHull().toString(), "100@100,300@100");
                assert.equal(g.Polyline([g.Point(100, 100), g.Point(200, 100), g.Point(300, 100), g.Point(400, 100)]).convexHull().toString(), "100@100,400@100");
                assert.equal(g.Polyline([g.Point(200, 100), g.Point(100, 100), g.Point(300, 100), g.Point(400, 100)]).convexHull().toString(), "100@100,400@100");
                assert.equal(g.Polyline([g.Point(100, 100), g.Point(100, 500)]).convexHull().toString(), "100@100,100@500");
                assert.equal(g.Polyline([g.Point(100, 100), g.Point(100, 500), g.Point(500, 500)]).convexHull().toString(), "100@100,500@500,100@500");
                assert.equal(g.Polyline([g.Point(100, 100), g.Point(100, 500), g.Point(300, 300), g.Point(500, 500), g.Point(500, 100)]).convexHull().toString(), "100@100,500@100,500@500,100@500");
                assert.equal(g.Polyline([g.Point(100, 100), g.Point(200, 100), g.Point(300, 200), g.Point(300, 200), g.Point(300, 300)]).convexHull().toString(), "100@100,200@100,300@200,300@300");
                assert.equal(g.Polyline([g.Point(300, 200), g.Point(300, 200), g.Point(300, 300), g.Point(100, 100), g.Point(200, 100)]).convexHull().toString(), "300@200,300@300,100@100,200@100");
                assert.equal(g.Polyline([g.Point(480, 80), g.Point(520, 80), g.Point(520, 120), g.Point(480, 120), g.Point(380, 80), g.Point(420, 80), g.Point(420,120), g.Point(380, 120), g.Point(280, 80), g.Point(320, 80), g.Point(320,120), g.Point(280,120), g.Point(180, 80), g.Point(220, 80), g.Point(220, 120), g.Point(180, 120), g.Point(80, 80), g.Point(120, 80), g.Point(120, 120), g.Point(80, 120)]).convexHull().toString(), "520@80,520@120,80@120,80@80");
                assert.equal(g.Polyline([g.Point(180, 80), g.Point(220, 80), g.Point(220, 120), g.Point(180, 120), g.Point(180, 280), g.Point(220, 280), g.Point(220,320), g.Point(180, 320), g.Point(180, 380), g.Point(220, 380), g.Point(220,420), g.Point(180,420), g.Point(180, 180), g.Point(220, 180), g.Point(220, 220), g.Point(180, 220), g.Point(80, 380), g.Point(120, 380), g.Point(120, 420), g.Point(80, 420)]).convexHull().toString(), "180@80,220@80,220@420,80@420,80@380");
                assert.equal(g.Polyline([g.Point(80, 80), g.Point(120, 80), g.Point(120, 120), g.Point(80, 120), g.Point(180, 80), g.Point(220, 80), g.Point(220, 120), g.Point(180, 120), g.Point(180, 280), g.Point(220, 280), g.Point(220,320), g.Point(180, 320), g.Point(180, 380), g.Point(220, 380), g.Point(220, 420), g.Point(180, 420), g.Point(180, 180), g.Point(220, 180), g.Point(220, 220), g.Point(180, 220), g.Point(80, 380), g.Point(120, 380), g.Point(120, 420), g.Point(80, 420)]).convexHull().toString(), "80@80,220@80,220@420,80@420");
                assert.equal(g.Polyline([g.Point(280, 280), g.Point(320, 280), g.Point(320, 320), g.Point(280, 320), g.Point(180, 280), g.Point(220, 280), g.Point(220, 320), g.Point(180, 320), g.Point(80, 180), g.Point(120, 180), g.Point(120, 220), g.Point(80, 220), g.Point(180, 80), g.Point(220, 80), g.Point(220, 120), g.Point(180, 120), g.Point(280, 80), g.Point(320, 80), g.Point(320, 120), g.Point(280, 120), g.Point(80, 80), g.Point(120, 80), g.Point(120, 120), g.Point(80, 120), g.Point(380, 80), g.Point(420, 80), g.Point(420, 120), g.Point(380, 120)]).convexHull().toString(), "320@320,180@320,80@220,80@80,420@80,420@120");
            });
        });

        QUnit.module('equals()', function() {

            QUnit.test('checks whether two polylines are exactly the same', function(assert) {

                var polyline1;
                var polyline2;

                polyline1 = g.Polyline(['1 1', '2 2']);
                polyline2 = g.Polyline(['1 1', '2 2']);
                assert.equal(polyline1.equals(polyline2), true);

                polyline1 = g.Polyline(['1 1', '2 2']);
                polyline2 = g.Polyline(['1 1']);
                assert.equal(polyline1.equals(polyline2), false);

                polyline1 = g.Polyline([]);
                polyline2 = g.Polyline([]);
                assert.equal(polyline1.equals(polyline2), true);

                polyline1 = g.Polyline(['1 1']);
                polyline1.points = null;
                polyline2 = g.Polyline(['1 1']);
                assert.equal(polyline1.equals(polyline2), false);

                polyline1 = g.Polyline(['1 1']);
                polyline2 = g.Polyline(['1 1']);
                polyline2.points = null;
                assert.equal(polyline1.equals(polyline2), false);

                polyline1 = g.Polyline(['1 1']);
                polyline1.points = null;
                polyline2 = g.Polyline(['1 1']);
                polyline2.points = null;
                assert.equal(polyline1.equals(polyline2), false);

                polyline1 = g.Polyline(['1 1']);
                polyline1.points = undefined;
                polyline2 = g.Polyline(['1 1']);
                assert.equal(polyline1.equals(polyline2), false);

                polyline1 = g.Polyline(['1 1']);
                polyline2 = g.Polyline(['1 1']);
                polyline2.points = undefined;
                assert.equal(polyline1.equals(polyline2), false);

                polyline1 = g.Polyline(['1 1']);
                polyline1.points = undefined;
                polyline2 = g.Polyline(['1 1']);
                polyline2.points = undefined;
                assert.equal(polyline1.equals(polyline2), false);
            });
        });

        QUnit.module('length()', function() {

            QUnit.test('sanity', function(assert) {

                assert.equal(typeof g.Polyline(['1 0', '1 1', '2 1', '2 0', '1 0']).length(), 'number');
                assert.equal(typeof g.Polyline([]).length(), 'number');
            });

            QUnit.test('returns the length of the path up to precision', function(assert) {

                assert.equal(g.Polyline(['1 0', '1 1', '2 1', '2 0', '1 0']).length(), 4);
                assert.equal(g.Polyline([]).length(), 0);
            });
        });

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAt(0.4) instanceof g.Point);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAt(-1) instanceof g.Point);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAt(10) instanceof g.Point);

                assert.equal(g.Polyline([]).pointAt(0.4), null);
                assert.equal(g.Polyline([]).pointAt(-1), null);
                assert.equal(g.Polyline([]).pointAt(10), null);
            });

            QUnit.test('returns a point at given length ratio', function(assert) {

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAt(0.4).toString(), '16@10');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAt(-1).toString(), '10@0');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAt(10).toString(), '10@0');
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAtLength(14) instanceof g.Point);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAtLength(10000) instanceof g.Point);

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAtLength(-14) instanceof g.Point);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAtLength(-10000) instanceof g.Point);

                assert.equal(g.Polyline([]).pointAtLength(14), null);
                assert.equal(g.Polyline([]).pointAtLength(10000), null);

                assert.equal(g.Polyline([]).pointAtLength(-14), null);
                assert.equal(g.Polyline([]).pointAtLength(-10000), null);
            });

            QUnit.test('returns a point at given length', function(assert) {

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAtLength(14).toString(), '14@10');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAtLength(10000).toString(), '10@0');

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAtLength(-14).toString(), '20@4');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).pointAtLength(-10000).toString(), '10@0');
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).scale(10, 10) instanceof g.Polyline);
                assert.ok(g.Polyline('10,0 10,10 20,10 20,0 10,0').scale(10, 10) instanceof g.Polyline);
                assert.ok(g.Polyline([]).scale(10, 10) instanceof g.Polyline);

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).scale(10, 10, g.Point('10 10')) instanceof g.Polyline);
                assert.ok(g.Polyline('10,0 10,10 20,10 20,0 10,0').scale(10, 10, g.Point('10 10')) instanceof g.Polyline);
                assert.ok(g.Polyline([]).scale(10, 10, g.Point('10 10')) instanceof g.Polyline);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).scale(10, 10).serialize(), '100,0 100,100 200,100 200,0 100,0');
                assert.equal(g.Polyline('10,0 10,10 20,10 20,0 10,0').scale(10, 10).serialize(), '100,0 100,100 200,100 200,0 100,0');
                assert.equal(g.Polyline([]).scale(10, 10).serialize(), '');

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).scale(10, 10, g.Point('10 10')).serialize(), '10,-90 10,10 110,10 110,-90 10,-90');
                assert.equal(g.Polyline('10,0 10,10 20,10 20,0 10,0').scale(10, 10, g.Point('10 10')).serialize(), '10,-90 10,10 110,10 110,-90 10,-90');
                assert.equal(g.Polyline([]).scale(10, 10, g.Point('10 10')).serialize(), '');
            });
        });

        QUnit.module('tangentAt()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAt(0.4) instanceof g.Line);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAt(0.5) instanceof g.Line); // discontinuity
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAt(-1) instanceof g.Line);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAt(10) instanceof g.Line);

                assert.equal(g.Polyline([]).tangentAt(0.4), null);
                assert.equal(g.Polyline([]).tangentAt(0.5), null);
                assert.equal(g.Polyline([]).tangentAt(-1), null);
                assert.equal(g.Polyline([]).tangentAt(10), null);
            });

            QUnit.test('returns line tangent to point at given length ratio', function(assert) {

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAt(0.4).toString(), '16@10 26@10');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAt(0.5).toString(), '20@10 30@10'); // discontinuity
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAt(-1).toString(), '10@0 10@10');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAt(10).toString(), '10@0 0@0');
            });
        });

        QUnit.module('tangentAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(14) instanceof g.Line);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(20) instanceof g.Line);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(10000) instanceof g.Line);

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(-14) instanceof g.Line);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(-20) instanceof g.Line);
                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(-10000) instanceof g.Line);

                assert.equal(g.Polyline([]).tangentAtLength(14), null);
                assert.equal(g.Polyline([]).tangentAtLength(20), null);
                assert.equal(g.Polyline([]).tangentAtLength(10000), null);

                assert.equal(g.Polyline([]).tangentAtLength(-14), null);
                assert.equal(g.Polyline([]).tangentAtLength(-20), null);
                assert.equal(g.Polyline([]).tangentAtLength(-10000), null);
            });

            QUnit.test('returns line tangent at given length', function(assert) {

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(14).toString(), '14@10 24@10');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(20).toString(), '20@10 30@10');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(10000).toString(), '10@0 0@0');

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(-14).toString(), '20@4 20@-6');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(-20).toString(), '20@10 20@0');
                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).tangentAtLength(-10000).toString(), '10@0 10@10');
            });
        });

        QUnit.module('translate()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).translate(10, 10) instanceof g.Polyline);
                assert.ok(g.Polyline('10,0 10,10 20,10 20,0 10,0').translate(10, 10) instanceof g.Polyline);
                assert.ok(g.Polyline([]).translate(10, 10) instanceof g.Polyline);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                assert.equal(g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']).translate(10, 10).serialize(), '20,10 20,20 30,20 30,10 20,10');
                assert.equal(g.Polyline('10,0 10,10 20,10 20,0 10,0').translate(10, 10).serialize(), '20,10 20,20 30,20 30,10 20,10');
                assert.equal(g.Polyline([]).translate(10, 10).serialize(), '');
            });
        });
    });
});

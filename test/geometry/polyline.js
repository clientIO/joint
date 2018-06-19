'use strict';

QUnit.module('polyline', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Polyline object', function(assert) {

            var polyline;

            polyline = new g.Polyline();
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 0);

            polyline = new g.Polyline([]);
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 0);

            polyline = new g.Polyline([new g.Point(1, 1), new g.Point(2, 2)]);
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '1@1');
            assert.equal(polyline.points[1].toString(), '2@2');

            polyline = new g.Polyline(['1 1', '2 2']);
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '1@1');
            assert.equal(polyline.points[1].toString(), '2@2');

            polyline = new g.Polyline(['1@1', '2@2']);
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '1@1');
            assert.equal(polyline.points[1].toString(), '2@2');

            polyline = new g.Polyline('1,1 2,2');
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '1@1');
            assert.equal(polyline.points[1].toString(), '2@2');

            polyline = new g.Polyline('');
            assert.ok(polyline);
            assert.ok(polyline instanceof g.Polyline);
            assert.equal(Array.isArray(polyline.points), true);
            assert.equal(polyline.points.length, 0);
        });
    });

    QUnit.module('parse', function() {

        QUnit.test('creates a new Polyline object from string', function(assert) {

            var polyline;

            // empty string
            polyline = new g.Polyline('');
            assert.ok(polyline instanceof g.Polyline, 'returns instance of g.Polyline');
            assert.ok(typeof polyline.points !== 'undefined', 'has "points" property');
            assert.ok(Array.isArray(polyline.points));
            assert.equal(polyline.points.length, 0);

            // empty string with whitespaces
            polyline = new g.Polyline('  ');
            assert.equal(polyline.points.length, 0);

            // svg string
            polyline = new g.Polyline('10,10 20,20');
            assert.ok(polyline instanceof g.Polyline, 'returns instance of g.Polyline');
            assert.ok(typeof polyline.points !== 'undefined', 'has "points" property');
            assert.ok(Array.isArray(polyline.points));
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '10@10');
            assert.equal(polyline.points[1].toString(), '20@20');

            // no commas (single spaces)
            polyline = new g.Polyline('10 10 20 20');
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '10@10');
            assert.equal(polyline.points[1].toString(), '20@20');

            // spaces around
            polyline = new g.Polyline('  10,10 20,20  ');
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '10@10');
            assert.equal(polyline.points[1].toString(), '20@20');

            // multi spaces between
            polyline = new g.Polyline('10  10  20  20');
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '10@10');
            assert.equal(polyline.points[1].toString(), '20@20');

            // spaces and commas
            polyline = new g.Polyline('  10, 10 , 20 , 20  ');
            assert.equal(polyline.points.length, 2);
            assert.equal(polyline.points[0].toString(), '10@10');
            assert.equal(polyline.points[1].toString(), '20@20');
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline(['10 10', '10 40', '50 40', '50 10']);
                assert.ok(polyline.bbox() instanceof g.Rect);

                polyline = new g.Polyline();
                assert.equal(polyline.bbox(), null);
            });

            QUnit.test('returns tight bounding box of the polyline', function(assert) {

                var polyline = new g.Polyline(['10 10', '10 40', '50 40', '50 10']);
                assert.equal(polyline.bbox().toString(), '10@10 50@40');
            });
        });

        QUnit.module('clone()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline = new g.Polyline(['10 10', '10 40', '50 40', '50 10']);
                assert.ok(polyline.clone() instanceof g.Polyline);
            });

            QUnit.test('returns a clone', function(assert) {

                var polyline1 = new g.Polyline(['10 10', '10 40', '50 40', '50 10']);
                var polyline2 = polyline1.clone();
                assert.notOk(polyline1 === polyline2);
                assert.equal(polyline1.toString(), polyline2.toString());
                assert.ok(polyline1.equals(polyline2));
            });
        });

        QUnit.module('closestPoint()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;
                var point = new g.Point(150, 150);

                polyline = new g.Polyline();
                assert.equal(polyline.closestPoint(point), null);

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.ok(polyline.closestPoint(point) instanceof g.Point);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.ok(polyline.closestPoint(point) instanceof g.Point);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.ok(polyline.closestPoint(point) instanceof g.Point);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.ok(polyline.closestPoint(point) instanceof g.Point);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 110),
                    new g.Point(300, 100)
                ]);
                assert.ok(polyline.closestPoint(point) instanceof g.Point);
            });

            QUnit.test('returns point closest to a given point', function(assert) {

                var polyline;
                var point = new g.Point(150, 150);

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.closestPoint(point).toString(), '100@100');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.closestPoint(point).toString(), '100@100');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.equal(polyline.closestPoint(point).toString(), '150@100');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.closestPoint(point).toString(), '150@150');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 110),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.closestPoint(point).toString(), '154.45544554455446@105.44554455445544');
            });
        });

        QUnit.module('closestPointLength()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;
                var point = new g.Point(150, 150);

                polyline = new g.Polyline();
                assert.equal(typeof polyline.closestPointLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.equal(typeof polyline.closestPointLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.equal(typeof polyline.closestPointLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.equal(typeof polyline.closestPointLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.equal(typeof polyline.closestPointLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 110),
                    new g.Point(300, 100)
                ]);
                assert.equal(typeof polyline.closestPointLength(point), 'number');
            });

            QUnit.test('returns length closest to a given point', function(assert) {

                var polyline;
                var point = new g.Point(150, 150);

                polyline = new g.Polyline();
                assert.equal(polyline.closestPointLength(point), 0);

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.closestPointLength(point), 0);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.closestPointLength(point), 0);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.equal(polyline.closestPointLength(point), 50);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.closestPointLength(point), 70.71067811865476);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 110),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.closestPointLength(point), 54.7270454615494);
            });
        });

        QUnit.module('closestPointNormalizedLength()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;
                var point = new g.Point(150, 150);

                polyline = new g.Polyline();
                assert.equal(typeof polyline.closestPointNormalizedLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.equal(typeof polyline.closestPointNormalizedLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.equal(typeof polyline.closestPointNormalizedLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.equal(typeof polyline.closestPointNormalizedLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.equal(typeof polyline.closestPointNormalizedLength(point), 'number');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 110),
                    new g.Point(300, 100)
                ]);
                assert.equal(typeof polyline.closestPointNormalizedLength(point), 'number');
            });

            QUnit.test('returns normalized length closest to a given point', function(assert) {

                var polyline;
                var point = new g.Point(150, 150);

                polyline = new g.Polyline();
                assert.equal(polyline.closestPointNormalizedLength(point), 0);

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.closestPointNormalizedLength(point), 0);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.closestPointNormalizedLength(point), 0);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.equal(polyline.closestPointNormalizedLength(point), 0.5);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.closestPointNormalizedLength(point), 0.25);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 110),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.closestPointNormalizedLength(point), 0.2722772277227723);
            });
        });

        QUnit.module('closestPointTangent()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;
                var point = new g.Point(150, 150);

                polyline = new g.Polyline();
                assert.equal(polyline.closestPointTangent(point), null);

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.closestPointTangent(point), null);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.closestPointTangent(point), null);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.ok(polyline.closestPointTangent(point) instanceof g.Line);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.ok(polyline.closestPointTangent(point) instanceof g.Line);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 110),
                    new g.Point(300, 100)
                ]);
                assert.ok(polyline.closestPointTangent(point) instanceof g.Line);
            });

            QUnit.test('returns tangent at point closest to a given point', function(assert) {

                var polyline;
                var point = new g.Point(150, 150);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.equal(polyline.closestPointTangent(point).toString(), '150@100 250@100');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.closestPointTangent(point).toString(), '150@150 250@250');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 110),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.closestPointTangent(point).toString(), '154.45544554455446@105.44554455445544 254.45544554455446@115.44554455445544');
            });
        });

        QUnit.module('convexHull()', function(assert) {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline();
                assert.ok(polyline instanceof g.Polyline);

                polyline = new g.Polyline([new g.Point(100,100), new g.Point(200,200)]);
                assert.ok(polyline instanceof g.Polyline);
            });

            QUnit.test('returns a convex hull', function(assert) {

                assert.equal((new g.Polyline()).convexHull().toString(), '');
                assert.equal((new g.Polyline([new g.Point(100, 100)])).convexHull().toString(), '100@100');
                assert.equal((new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ])).convexHull().toString(), '100@100,200@100');
                assert.equal((new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100),
                    new g.Point(300, 100)
                ])).convexHull().toString(), '100@100,300@100');
                assert.equal((new g.Polyline([
                    new g.Point(200, 100),
                    new g.Point(100, 100),
                    new g.Point(300, 100)
                ])).convexHull().toString(), '100@100,300@100');
                assert.equal((new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100),
                    new g.Point(300, 100),
                    new g.Point(400, 100)
                ])).convexHull().toString(), '100@100,400@100');
                assert.equal((new g.Polyline([
                    new g.Point(200, 100),
                    new g.Point(100, 100),
                    new g.Point(300, 100),
                    new g.Point(400, 100)
                ])).convexHull().toString(), '100@100,400@100');
                assert.equal((new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 500)
                ])).convexHull().toString(), '100@100,100@500');
                assert.equal((new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 500),
                    new g.Point(500, 500)
                ])).convexHull().toString(), '100@100,500@500,100@500');
                assert.equal((new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 500),
                    new g.Point(300, 300),
                    new g.Point(500, 500),
                    new g.Point(500, 100)
                ])).convexHull().toString(), '100@100,500@100,500@500,100@500');
                assert.equal((new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100),
                    new g.Point(300, 200),
                    new g.Point(300, 200),
                    new g.Point(300, 300)
                ])).convexHull().toString(), '100@100,200@100,300@200,300@300');
                assert.equal((new g.Polyline([
                    new g.Point(300, 200),
                    new g.Point(300, 200),
                    new g.Point(300, 300),
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ])).convexHull().toString(), '300@200,300@300,100@100,200@100');
                assert.equal((new g.Polyline([
                    new g.Point(480, 80),
                    new g.Point(520, 80),
                    new g.Point(520, 120),
                    new g.Point(480, 120),
                    new g.Point(380, 80),
                    new g.Point(420, 80),
                    new g.Point(420,120),
                    new g.Point(380, 120),
                    new g.Point(280, 80),
                    new g.Point(320, 80),
                    new g.Point(320,120),
                    new g.Point(280,120),
                    new g.Point(180, 80),
                    new g.Point(220, 80),
                    new g.Point(220, 120),
                    new g.Point(180, 120),
                    new g.Point(80, 80),
                    new g.Point(120, 80),
                    new g.Point(120, 120),
                    new g.Point(80, 120)
                ])).convexHull().toString(), '520@80,520@120,80@120,80@80');
                assert.equal((new g.Polyline([
                    new g.Point(180, 80),
                    new g.Point(220, 80),
                    new g.Point(220, 120),
                    new g.Point(180, 120),
                    new g.Point(180, 280),
                    new g.Point(220, 280),
                    new g.Point(220,320),
                    new g.Point(180, 320),
                    new g.Point(180, 380),
                    new g.Point(220, 380),
                    new g.Point(220,420),
                    new g.Point(180,420),
                    new g.Point(180, 180),
                    new g.Point(220, 180),
                    new g.Point(220, 220),
                    new g.Point(180, 220),
                    new g.Point(80, 380),
                    new g.Point(120, 380),
                    new g.Point(120, 420),
                    new g.Point(80, 420)
                ])).convexHull().toString(), '180@80,220@80,220@420,80@420,80@380');
                assert.equal((new g.Polyline([
                    new g.Point(80, 80),
                    new g.Point(120, 80),
                    new g.Point(120, 120),
                    new g.Point(80, 120),
                    new g.Point(180, 80),
                    new g.Point(220, 80),
                    new g.Point(220, 120),
                    new g.Point(180, 120),
                    new g.Point(180, 280),
                    new g.Point(220, 280),
                    new g.Point(220,320),
                    new g.Point(180, 320),
                    new g.Point(180, 380),
                    new g.Point(220, 380),
                    new g.Point(220, 420),
                    new g.Point(180, 420),
                    new g.Point(180, 180),
                    new g.Point(220, 180),
                    new g.Point(220, 220),
                    new g.Point(180, 220),
                    new g.Point(80, 380),
                    new g.Point(120, 380),
                    new g.Point(120, 420),
                    new g.Point(80, 420)
                ])).convexHull().toString(), '80@80,220@80,220@420,80@420');
                assert.equal((new g.Polyline([
                    new g.Point(280, 280),
                    new g.Point(320, 280),
                    new g.Point(320, 320),
                    new g.Point(280, 320),
                    new g.Point(180, 280),
                    new g.Point(220, 280),
                    new g.Point(220, 320),
                    new g.Point(180, 320),
                    new g.Point(80, 180),
                    new g.Point(120, 180),
                    new g.Point(120, 220),
                    new g.Point(80, 220),
                    new g.Point(180, 80),
                    new g.Point(220, 80),
                    new g.Point(220, 120),
                    new g.Point(180, 120),
                    new g.Point(280, 80),
                    new g.Point(320, 80),
                    new g.Point(320, 120),
                    new g.Point(280, 120),
                    new g.Point(80, 80),
                    new g.Point(120, 80),
                    new g.Point(120, 120),
                    new g.Point(80, 120),
                    new g.Point(380, 80),
                    new g.Point(420, 80),
                    new g.Point(420, 120),
                    new g.Point(380, 120)
                ])).convexHull().toString(), '320@320,180@320,80@220,80@80,420@80,420@120');
            });
        });

        QUnit.module('equals()', function() {

            QUnit.test('checks whether two polylines are exactly the same', function(assert) {

                var polyline1;
                var polyline2;

                polyline1 = new g.Polyline(['1 1', '2 2']);
                polyline2 = new g.Polyline(['1 1', '2 2']);
                assert.equal(polyline1.equals(polyline2), true);

                polyline1 = new g.Polyline(['1 1', '2 2']);
                polyline2 = new g.Polyline(['1 1']);
                assert.equal(polyline1.equals(polyline2), false);

                polyline1 = new g.Polyline();
                polyline2 = new g.Polyline();
                assert.equal(polyline1.equals(polyline2), true);

                polyline1 = new g.Polyline([]);
                polyline2 = new g.Polyline([]);
                assert.equal(polyline1.equals(polyline2), true);
            });
        });

        QUnit.module('isDifferentiable()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline();
                assert.equal(typeof polyline.isDifferentiable(), 'boolean');

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.equal(typeof polyline.isDifferentiable(), 'boolean');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.equal(typeof polyline.isDifferentiable(), 'boolean');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.equal(typeof polyline.isDifferentiable(), 'boolean');

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.equal(typeof polyline.isDifferentiable(), 'boolean');
            });

            QUnit.test('checks whether the polyline is differentiable (can have tangents)', function(assert) {

                var polyline;

                polyline = new g.Polyline();
                assert.equal(polyline.isDifferentiable(), false);

                polyline = new g.Polyline([
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.isDifferentiable(), false);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(100, 100),
                    new g.Point(100, 100)
                ]);
                assert.equal(polyline.isDifferentiable(), false);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 100)
                ]);
                assert.equal(polyline.isDifferentiable(), true);

                polyline = new g.Polyline([
                    new g.Point(100, 100),
                    new g.Point(200, 200),
                    new g.Point(300, 100)
                ]);
                assert.equal(polyline.isDifferentiable(), true);
            });
        });

        QUnit.module('length()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline(['1 0', '1 1', '2 1', '2 0', '1 0']);
                assert.equal(typeof polyline.length(), 'number');

                polyline = new g.Polyline();
                assert.equal(typeof polyline.length(), 'number');
            });

            QUnit.test('returns the length of the path up to precision', function(assert) {

                var polyline;

                polyline = new g.Polyline(['1 0', '1 1', '2 1', '2 0', '1 0']);
                assert.equal(polyline.length(), 4);

                polyline = new g.Polyline();
                assert.equal(polyline.length(), 0);
            });
        });

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']);
                assert.ok(polyline.pointAt(0.4) instanceof g.Point);
                assert.ok(polyline.pointAt(-1) instanceof g.Point);
                assert.ok(polyline.pointAt(10) instanceof g.Point);

                polyline = new g.Polyline();
                assert.equal(polyline.pointAt(0.4), null);
                assert.equal(polyline.pointAt(-1), null);
                assert.equal(polyline.pointAt(10), null);
            });

            QUnit.test('returns a point at given length ratio', function(assert) {

                var polyline = new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']);
                assert.equal(polyline.pointAt(0.4).toString(), '16@10');
                assert.equal(polyline.pointAt(-1).toString(), '10@0');
                assert.equal(polyline.pointAt(10).toString(), '10@0');
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']);
                assert.ok(polyline.pointAtLength(14) instanceof g.Point);
                assert.ok(polyline.pointAtLength(10000) instanceof g.Point);

                assert.ok(polyline.pointAtLength(-14) instanceof g.Point);
                assert.ok(polyline.pointAtLength(-10000) instanceof g.Point);

                polyline = new g.Polyline();
                assert.equal(polyline.pointAtLength(14), null);
                assert.equal(polyline.pointAtLength(10000), null);

                assert.equal(polyline.pointAtLength(-14), null);
                assert.equal(polyline.pointAtLength(-10000), null);
            });

            QUnit.test('returns a point at given length', function(assert) {

                var polyline = new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']);
                assert.equal(polyline.pointAtLength(14).toString(), '14@10');
                assert.equal(polyline.pointAtLength(10000).toString(), '10@0');

                assert.equal(polyline.pointAtLength(-14).toString(), '20@4');
                assert.equal(polyline.pointAtLength(-10000).toString(), '10@0');
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok((new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0'])).scale(10, 10) instanceof g.Polyline);
                assert.ok((new g.Polyline('10,0 10,10 20,10 20,0 10,0')).scale(10, 10) instanceof g.Polyline);
                assert.ok((new g.Polyline()).scale(10, 10) instanceof g.Polyline);

                assert.ok((new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0'])).scale(10, 10, new g.Point('10 10')) instanceof g.Polyline);
                assert.ok((new g.Polyline('10,0 10,10 20,10 20,0 10,0')).scale(10, 10, new g.Point('10 10')) instanceof g.Polyline);
                assert.ok((new g.Polyline()).scale(10, 10, new g.Point('10 10')) instanceof g.Polyline);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                assert.equal((new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0'])).scale(10, 10).serialize(), '100,0 100,100 200,100 200,0 100,0');
                assert.equal((new g.Polyline('10,0 10,10 20,10 20,0 10,0')).scale(10, 10).serialize(), '100,0 100,100 200,100 200,0 100,0');
                assert.equal((new g.Polyline()).scale(10, 10).serialize(), '');

                assert.equal((new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0'])).scale(10, 10, new g.Point('10 10')).serialize(), '10,-90 10,10 110,10 110,-90 10,-90');
                assert.equal((new g.Polyline('10,0 10,10 20,10 20,0 10,0')).scale(10, 10, new g.Point('10 10')).serialize(), '10,-90 10,10 110,10 110,-90 10,-90');
                assert.equal((new g.Polyline()).scale(10, 10, new g.Point('10 10')).serialize(), '');
            });
        });

        QUnit.module('tangentAt()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']);
                assert.ok(polyline.tangentAt(0.4) instanceof g.Line);
                assert.ok(polyline.tangentAt(0.5) instanceof g.Line); // discontinuity
                assert.ok(polyline.tangentAt(-1) instanceof g.Line);
                assert.ok(polyline.tangentAt(10) instanceof g.Line);

                polyline = new g.Polyline();
                assert.equal(polyline.tangentAt(0.4), null);
                assert.equal(polyline.tangentAt(0.5), null);
                assert.equal(polyline.tangentAt(-1), null);
                assert.equal(polyline.tangentAt(10), null);
            });

            QUnit.test('returns line tangent to point at given length ratio', function(assert) {

                var polyline = new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']);
                assert.equal(polyline.tangentAt(0.4).toString(), '16@10 26@10');
                assert.equal(polyline.tangentAt(0.5).toString(), '20@10 30@10'); // discontinuity
                assert.equal(polyline.tangentAt(-1).toString(), '10@0 10@10');
                assert.equal(polyline.tangentAt(10).toString(), '10@0 0@0');
            });
        });

        QUnit.module('tangentAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']);
                assert.ok(polyline.tangentAtLength(14) instanceof g.Line);
                assert.ok(polyline.tangentAtLength(20) instanceof g.Line);
                assert.ok(polyline.tangentAtLength(10000) instanceof g.Line);

                assert.ok(polyline.tangentAtLength(-14) instanceof g.Line);
                assert.ok(polyline.tangentAtLength(-20) instanceof g.Line);
                assert.ok(polyline.tangentAtLength(-10000) instanceof g.Line);

                polyline = new g.Polyline();
                assert.equal(polyline.tangentAtLength(14), null);
                assert.equal(polyline.tangentAtLength(20), null);
                assert.equal(polyline.tangentAtLength(10000), null);

                assert.equal(polyline.tangentAtLength(-14), null);
                assert.equal(polyline.tangentAtLength(-20), null);
                assert.equal(polyline.tangentAtLength(-10000), null);
            });

            QUnit.test('returns line tangent at given length', function(assert) {

                var polyline = new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0']);
                assert.equal(polyline.tangentAtLength(14).toString(), '14@10 24@10');
                assert.equal(polyline.tangentAtLength(20).toString(), '20@10 30@10');
                assert.equal(polyline.tangentAtLength(10000).toString(), '10@0 0@0');

                assert.equal(polyline.tangentAtLength(-14).toString(), '20@4 20@-6');
                assert.equal(polyline.tangentAtLength(-20).toString(), '20@10 20@0');
                assert.equal(polyline.tangentAtLength(-10000).toString(), '10@0 10@10');
            });
        });

        QUnit.module('translate()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok((new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0'])).translate(10, 10) instanceof g.Polyline);
                assert.ok((new g.Polyline('10,0 10,10 20,10 20,0 10,0')).translate(10, 10) instanceof g.Polyline);
                assert.ok((new g.Polyline()).translate(10, 10) instanceof g.Polyline);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                assert.equal((new g.Polyline(['10 0', '10 10', '20 10', '20 0', '10 0'])).translate(10, 10).serialize(), '20,10 20,20 30,20 30,10 20,10');
                assert.equal((new g.Polyline('10,0 10,10 20,10 20,0 10,0')).translate(10, 10).serialize(), '20,10 20,20 30,20 30,10 20,10');
                assert.equal((new g.Polyline()).translate(10, 10).serialize(), '');
            });
        });

        QUnit.module('serialize()', function(assert) {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline();
                assert.equal(typeof polyline.serialize(), 'string');

                polyline = new g.Polyline(['150 100', '100 100', '100 200']);
                assert.equal(typeof polyline.serialize(), 'string');
            });

            QUnit.test('returns an svg string representation of the path', function(assert) {

                var polyline;

                polyline = new g.Polyline();
                assert.equal(polyline.serialize(), '');

                polyline = new g.Polyline(['150 100', '100 100', '100 200']);
                assert.equal(polyline.serialize(), '150,100 100,100 100,200');
            });
        });

        QUnit.module('toString()', function(assert) {

            QUnit.test('sanity', function(assert) {

                var polyline;

                polyline = new g.Polyline();
                assert.equal(typeof polyline.toString(), 'string');

                polyline = new g.Polyline(['150 100', '100 100', '100 200']);
                assert.equal(typeof polyline.toString(), 'string');
            });

            QUnit.test('returns a string representation of the path', function(assert) {

                var polyline;

                polyline = new g.Polyline();
                assert.equal(polyline.toString(), '');

                polyline = new g.Polyline(['150 100', '100 100', '100 200']);
                assert.equal(polyline.toString(), '150@100,100@100,100@200');
            });
        });
    });
});

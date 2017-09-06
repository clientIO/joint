'use strict';

QUnit.module('point', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Point object', function(assert) {

            assert.ok(g.point() instanceof g.point);
            assert.ok(g.point(1, 2) instanceof g.point);
            assert.equal(g.point(1, 2).x, 1);
            assert.equal(g.point(1, 2).y, 2);
            assert.ok(g.point('1 2').equals(g.point(1, 2)));
            assert.ok(g.point({ x: 1, y: 2 }).equals(g.point(1, 2)));
            assert.ok(g.point(g.point(1, 2)).equals(g.point(1, 2)));
            // default values
            assert.equal(g.point(10).y, 0);
            assert.equal(g.point({ x: 10 }).y, 0);
        });
    });

    QUnit.module('fromPolar(distance, angle, origin)', function() {

    });

    QUnit.module('random(x1, x2, y1, y2)', function() {

    });

    QUnit.module('prototype', function() {

        QUnit.module('adhereToRect(rect)', function() {

        });

        QUnit.module('bearing(point)', function() {

        });

        QUnit.module('changeInAngle(dx, dy, ref)', function() {

        });

        QUnit.module('clone()', function() {

        });

        QUnit.module('difference(point)', function() {

            QUnit.test('returns a point with the correct coordinates', function(assert) {

                assert.equal(g.point(0,10).difference(4, 8).toString(), '-4@2');
                assert.equal(g.point(5,8).difference(g.point(5, 10)).toString(), '0@-2');
                assert.equal(g.point(4,2).difference(2).toString(), '2@2');
            });
        });

        QUnit.module('distance(point)', function() {

        });

        QUnit.module('equals(point)', function() {

        });

        QUnit.module('magnitude()', function() {

        });

        QUnit.module('manhattanDistance(point)', function() {

        });

        QUnit.module('move(ref, distance)', function() {

        });

        QUnit.module('normalize(length)', function() {

            QUnit.test('scales x and y such that the distance between the point and the origin (0,0) is equal to the given length', function(assert) {

                assert.equal(g.point(0, 10).normalize(20).toString(), '0@20');
                assert.equal(g.point(2, 0).normalize(4).toString(), '4@0');
            });
        });

        QUnit.module('offset(dx, dy)', function() {

            QUnit.test('changes the x and y values by adding the given dx and dy values respectively', function(assert) {

                var point = g.point(0, 0);
                point.offset(2, 3);
                assert.equal(point.toString(), '2@3');
                point.offset(-2, 4);
                assert.equal(point.toString(), '0@7');
                point.offset(2);
                assert.equal(point.toString(), '2@7');
                point.offset(g.point(5, 3));
                assert.equal(point.toString(), '7@10');
            });
        });

        QUnit.module('reflection(ref)', function() {

        });

        QUnit.module('rotate(origin, angle)', function() {

        });

        QUnit.module('round(precision)', function() {

            QUnit.test('rounds the x and y properties to the given precision', function(assert) {

                var point = g.point(17.231, 4.01);
                point.round(2);
                assert.equal(point.toString(), '17.23@4.01');
                point.round(0);
                assert.equal(point.toString(), '17@4');
            });
        });

        QUnit.module('scale(sx, sy, origin)', function() {

            QUnit.test('without origin', function(assert) {

                assert.equal(g.point(20, 30).scale(2, 3).toString(), g.point(40, 90).toString());
            });

            QUnit.test('with origin', function(assert) {

                assert.equal(g.point(20, 30).scale(2, 3, g.point(40, 45)).toString(), g.point(0, 0).toString());
            });
        });

        QUnit.module('snapToGrid(gx, gy)', function() {

        });

        QUnit.module('theta(p)', function() {

            QUnit.test('returns the angle between vector p0@p and the x-axis', function(assert) {

                var p0 = g.point(1, 1)

                assert.equal(p0.theta(p0), 0);
                assert.equal(p0.theta(g.point(2, 1)), 0);
                assert.equal(p0.theta(g.point(2, 0)), 45);
                assert.equal(p0.theta(g.point(1, 0)), 90);
                assert.equal(p0.theta(g.point(0, 0)), 135);
                assert.equal(p0.theta(g.point(0, 1)), 180);
                assert.equal(p0.theta(g.point(0, 2)), 225);
                assert.equal(p0.theta(g.point(1, 2)), 270);
                assert.equal(p0.theta(g.point(2, 2)), 315);
            });
        });

        QUnit.module('angleBetween(p1, p2)', function() {

            QUnit.test('returns the angle between vectors p0@p1 and p0@p2', function(assert) {

                var p0 = g.point(1, 2)
                var p1 = g.point(2, 4);
                var p2 = g.point(4, 3);

                var PRECISION = 10;

                assert.equal(p0.angleBetween(p0, p0).toString(), 'NaN');
                assert.equal(p0.angleBetween(p1, p0).toString(), 'NaN');
                assert.equal(p0.angleBetween(p0, p2).toString(), 'NaN');
                assert.equal(p0.angleBetween(p1, p2).toFixed(PRECISION), '45.0000000000');
                assert.equal(p0.angleBetween(p2, p1).toFixed(PRECISION), '315.0000000000');
            });
        });

        QUnit.module('vectorAngle(p)', function() {

            QUnit.test('returns the angle between vectors zero@p0 and zero@p', function(assert) {

                var p0 = g.point(1, 2);
                var p = g.point(3, 1)
                var zero = g.point(0, 0);

                var PRECISION = 10;

                assert.equal(zero.vectorAngle(zero).toString(), 'NaN')
                assert.equal(p0.vectorAngle(zero).toString(), 'NaN');
                assert.equal(p.vectorAngle(zero).toString(), 'NaN');
                assert.equal(zero.vectorAngle(p0).toString(), 'NaN');
                assert.equal(zero.vectorAngle(p).toString(), 'NaN');
                assert.equal(p0.vectorAngle(p).toFixed(PRECISION), '45.0000000000');
                assert.equal(p.vectorAngle(p0).toFixed(PRECISION), '315.0000000000');
            });
        });

        QUnit.module('toJSON()', function() {

            QUnit.test('returns an object with the point\'s coordinates', function(assert) {

                assert.deepEqual(g.point(20, 30).toJSON(), { x: 20, y: 30 });
            });
        });

        QUnit.module('toPolar(origin)', function() {

        });

        QUnit.module('toString()', function() {

            QUnit.test('returns string with values of x and y', function(assert) {

                var value = g.point(17, 20).toString();

                assert.equal(typeof value, 'string');
                assert.equal(value, '17@20');
            });
        });

        QUnit.module('update(x, y)', function() {

            QUnit.test('changes the values of x and y', function(assert) {

                var point = g.point(4, 17);
                point.update(16, 24);
                assert.equal(point.toString(), '16@24');
            });
        });

        QUnit.module('dot(p)', function() {

            QUnit.test('returns the dot product of p', function(assert) {

                var p1 = g.point(4, 17);
                var p2 = g.point(2, 10);

                assert.equal(p1.dot().toString(), 'NaN');
                assert.equal(p1.dot({}).toString(), 'NaN');
                assert.equal(p1.dot(p2), 178);
                assert.equal(p2.dot(p1), 178);
            });
        });

        QUnit.module('cross(p1, p2)', function() {

            QUnit.test('returns the left-handed cross product of vectors p0@p1 and p0@p2', function(assert) {

                var p0 = g.point(3, 15)
                var p1 = g.point(4, 17);
                var p2 = g.point(2, 10);

                assert.equal(p0.cross().toString(), 'NaN');
                assert.equal(p0.cross({}).toString(), 'NaN');
                assert.equal(p0.cross(p1).toString(), 'NaN');
                assert.equal(p0.cross(p1, p2), 3);
                assert.equal(p0.cross(p2, p1), -3);
            });
        });
    });
});

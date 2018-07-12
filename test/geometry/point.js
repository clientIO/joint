'use strict';

QUnit.module('point', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Point object', function(assert) {

            assert.ok(new g.Point() instanceof g.Point);
            assert.ok(new g.Point(1, 2) instanceof g.Point);
            assert.equal((new g.Point(1, 2)).x, 1);
            assert.equal((new g.Point(1, 2)).y, 2);
            assert.ok((new g.Point('1 2')).equals(new g.Point(1, 2)));
            assert.ok((new g.Point({ x: 1, y: 2 })).equals(new g.Point(1, 2)));
            assert.ok((new g.Point(new g.Point(1, 2))).equals(new g.Point(1, 2)));
            // default values
            assert.equal((new g.Point(10)).y, 0);
            assert.equal((new g.Point({ x: 10 })).y, 0);
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

                assert.equal((new g.Point(0,10)).difference(4, 8).toString(), '-4@2');
                assert.equal((new g.Point(5,8)).difference(new g.Point(5, 10)).toString(), '0@-2');
                assert.equal((new g.Point(4,2)).difference(2).toString(), '2@2');
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

                assert.equal((new g.Point(0, 10)).normalize(20).toString(), '0@20');
                assert.equal((new g.Point(2, 0)).normalize(4).toString(), '4@0');
            });
        });

        QUnit.module('offset(dx, dy)', function() {

            QUnit.test('changes the x and y values by adding the given dx and dy values respectively', function(assert) {

                var point = new g.Point(0, 0);
                point.offset(2, 3);
                assert.equal(point.toString(), '2@3');
                point.offset(-2, 4);
                assert.equal(point.toString(), '0@7');
                point.offset(2);
                assert.equal(point.toString(), '2@7');
                point.offset(new g.Point(5, 3));
                assert.equal(point.toString(), '7@10');
            });
        });

        QUnit.module('reflection(ref)', function() {

        });

        QUnit.module('rotate(origin, angle)', function() {

            QUnit.test('should return a rotated version of self', function(assert) {

                var point = new g.Point(5, 5);
                var angle;

                var nullPoint = null;
                var zeroPoint = new g.Point('0 0');
                var arbitraryPoint = new g.Point('14 6');

                angle = 0;
                assert.equal(point.clone().rotate(nullPoint, angle).round(3).toString(), '5@5');
                assert.equal(point.clone().rotate(zeroPoint, angle).round(3).toString(), '5@5');
                assert.equal(point.clone().rotate(point, angle).round(3).toString(), '5@5');
                assert.equal(point.clone().rotate(arbitraryPoint, angle).round(3).toString(), '5@5');

                angle = 154;
                assert.equal(point.clone().rotate(nullPoint, angle).round(3).toString(), '-2.302@-6.686');
                assert.equal(point.clone().rotate(zeroPoint, angle).round(3).toString(), '-2.302@-6.686');
                assert.equal(point.clone().rotate(point, angle).round(3).toString(), '5@5');
                assert.equal(point.clone().rotate(arbitraryPoint, angle).round(3).toString(), '21.651@10.844');
            });

            QUnit.test('assert rotation 0 = -360 = 360 = 1080', function(assert) {

                var point = new g.Point(5, 5);
                var angle1;
                var angle2;

                var nullPoint = null;
                var zeroPoint = new g.Point('0 0');
                var arbitraryPoint = new g.Point('14 6');

                angle1 = 0;
                angle2 = -360;
                assert.equal(point.clone().rotate(nullPoint, angle1).toString(), point.clone().rotate(nullPoint, angle2).toString());
                assert.equal(point.clone().rotate(zeroPoint, angle1).toString(), point.clone().rotate(zeroPoint, angle2).toString());
                assert.equal(point.clone().rotate(point, angle1).toString(), point.clone().rotate(point, angle2).toString());
                assert.equal(point.clone().rotate(arbitraryPoint, angle1).toString(), point.clone().rotate(arbitraryPoint, angle2).toString());

                angle1 = 0;
                angle2 = 360;
                assert.equal(point.clone().rotate(nullPoint, angle1).toString(), point.clone().rotate(nullPoint, angle2).toString());
                assert.equal(point.clone().rotate(zeroPoint, angle1).toString(), point.clone().rotate(zeroPoint, angle2).toString());
                assert.equal(point.clone().rotate(point, angle1).toString(), point.clone().rotate(point, angle2).toString());
                assert.equal(point.clone().rotate(arbitraryPoint, angle1).toString(), point.clone().rotate(arbitraryPoint, angle2).toString());

                angle1 = 0;
                angle2 = 1080;
                assert.equal(point.clone().rotate(nullPoint, angle1).toString(), point.clone().rotate(nullPoint, angle2).toString());
                assert.equal(point.clone().rotate(zeroPoint, angle1).toString(), point.clone().rotate(zeroPoint, angle2).toString());
                assert.equal(point.clone().rotate(point, angle1).toString(), point.clone().rotate(point, angle2).toString());
                assert.equal(point.clone().rotate(arbitraryPoint, angle1).toString(), point.clone().rotate(arbitraryPoint, angle2).toString());
            });
        });

        QUnit.module('round(precision)', function() {

            QUnit.test('rounds the x and y properties to the given precision', function(assert) {

                var point = new g.Point(17.231, 4.01);
                point.round(2);
                assert.equal(point.toString(), '17.23@4.01');
                point.round(0);
                assert.equal(point.toString(), '17@4');
            });
        });

        QUnit.module('scale(sx, sy, origin)', function() {

            QUnit.test('without origin', function(assert) {

                assert.equal((new g.Point(20, 30)).scale(2, 3).toString(), (new g.Point(40, 90)).toString());
            });

            QUnit.test('with origin', function(assert) {

                assert.equal((new g.Point(20, 30)).scale(2, 3, new g.Point(40, 45)).toString(), (new g.Point(0, 0)).toString());
            });
        });

        QUnit.module('translate(tx, ty)', function() {

            QUnit.test('sanity', function(assert) {

                var point = new g.Point('5 5');
                assert.ok(point.clone().translate(0, 0) instanceof g.Point);
                assert.ok(point.clone().translate(0, 10) instanceof g.Point);
                assert.ok(point.clone().translate(10, 0) instanceof g.Point);
                assert.ok(point.clone().translate(10, 10) instanceof g.Point);
            });

            QUnit.test('should return a translated version of self', function(assert) {

                var point = new g.Point('5 5');
                assert.equal(point.clone().translate(0, 0).toString(), '5@5');
                assert.equal(point.clone().translate(0, 10).toString(), '5@15');
                assert.equal(point.clone().translate(10, 0).toString(), '15@5');
                assert.equal(point.clone().translate(10, 10).toString(), '15@15');
            });
        });

        QUnit.module('snapToGrid(gx, gy)', function() {

        });

        QUnit.module('theta(p)', function() {

            QUnit.test('returns the angle between vector p0@p and the x-axis', function(assert) {

                var p0 = new g.Point(1, 1);

                assert.equal(p0.theta(p0), 0);
                assert.equal(p0.theta(new g.Point(2, 1)), 0);
                assert.equal(p0.theta(new g.Point(2, 0)), 45);
                assert.equal(p0.theta(new g.Point(1, 0)), 90);
                assert.equal(p0.theta(new g.Point(0, 0)), 135);
                assert.equal(p0.theta(new g.Point(0, 1)), 180);
                assert.equal(p0.theta(new g.Point(0, 2)), 225);
                assert.equal(p0.theta(new g.Point(1, 2)), 270);
                assert.equal(p0.theta(new g.Point(2, 2)), 315);
            });
        });

        QUnit.module('angleBetween(p1, p2)', function() {

            QUnit.test('returns the angle between vectors p0@p1 and p0@p2', function(assert) {

                var p0 = new g.Point(1, 2)
                var p1 = new g.Point(2, 4);
                var p2 = new g.Point(4, 3);

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

                var p0 = new g.Point(1, 2);
                var p = new g.Point(3, 1)
                var zero = new g.Point(0, 0);

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

                assert.deepEqual((new g.Point(20, 30)).toJSON(), { x: 20, y: 30 });
            });
        });

        QUnit.module('toPolar(origin)', function() {

        });

        QUnit.module('toString()', function() {

            QUnit.test('returns string with values of x and y', function(assert) {

                var value = (new g.Point(17, 20)).toString();

                assert.equal(typeof value, 'string');
                assert.equal(value, '17@20');
            });
        });

        QUnit.module('update(x, y)', function() {

            QUnit.test('changes the values of x and y', function(assert) {

                var point = new g.Point(4, 17);
                point.update(16, 24);
                assert.equal(point.toString(), '16@24');
            });
        });

        QUnit.module('dot(p)', function() {

            QUnit.test('returns the dot product of p', function(assert) {

                var p1 = new g.Point(4, 17);
                var p2 = new g.Point(2, 10);

                assert.equal(p1.dot().toString(), 'NaN');
                assert.equal(p1.dot({}).toString(), 'NaN');
                assert.equal(p1.dot(p2), 178);
                assert.equal(p2.dot(p1), 178);
            });
        });

        QUnit.module('cross(p1, p2)', function() {

            QUnit.test('returns the left-handed cross product of vectors p0@p1 and p0@p2', function(assert) {

                var p0 = new g.Point(3, 15)
                var p1 = new g.Point(4, 17);
                var p2 = new g.Point(2, 10);

                assert.equal(p0.cross().toString(), 'NaN');
                assert.equal(p0.cross({}).toString(), 'NaN');
                assert.equal(p0.cross(p1).toString(), 'NaN');
                assert.equal(p0.cross(p1, p2), 3);
                assert.equal(p0.cross(p2, p1), -3);
            });
        });

        QUnit.module('lerp(p, t)', function() {

            QUnit.test('returns the linear interpolation of vector p0@p1 at parameter t', function(assert) {

                var p0 = new g.Point(10, 20)
                var p1 = new g.Point(30, 40);

                assert.equal(p0.lerp(p1, 0).toString(), '10@20');
                assert.equal(p0.lerp(p1, 0.5).toString(), '20@30');
                assert.equal(p0.lerp(p1, 1).toString(), '30@40');
            });
        });
    });
});

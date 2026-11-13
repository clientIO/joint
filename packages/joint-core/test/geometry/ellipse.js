'use strict';

QUnit.module('ellipse', function() {

    var boundaryOnAngle = function(ellipse, angle) {
        var a = ellipse.a;
        var b = ellipse.b;

        var rad = angle * Math.PI / 180;

        return new g.Point(ellipse.x + a * Math.cos(rad), ellipse.y + b * Math.sin(rad)).round();
    };

    QUnit.test('validate helper boundaryOnAngle', function(assert) {

        var a = 150;
        var b = 50;
        var c = new g.Point(0, 0);
        var ellipse = new g.Ellipse(c, a, b);

        assert.propEqual(boundaryOnAngle(ellipse, 0), new g.Point(150, 0));
        assert.propEqual(boundaryOnAngle(ellipse, 90), new g.Point(0, 50));
        assert.propEqual(boundaryOnAngle(ellipse, 180), new g.Point(-150, 0));
        assert.propEqual(boundaryOnAngle(ellipse, 270), new g.Point(0, -50));
    });

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Ellipse object', function(assert) {

            assert.ok(new g.Ellipse() instanceof g.Ellipse);
            assert.ok(new g.Ellipse({ x: 1, y: 2 }, 3, 4) instanceof g.Ellipse);
            assert.equal((new g.Ellipse({ x: 1, y: 2 }, 3, 4)).x, 1);
            assert.equal((new g.Ellipse({ x: 1, y: 2 }, 3, 4)).y, 2);
            assert.equal((new g.Ellipse({ x: 1, y: 2 }, 3, 4)).a, 3);
            assert.equal((new g.Ellipse({ x: 1, y: 2 }, 3, 4)).b, 4);
            assert.ok((new g.Ellipse(new g.Ellipse({ x: 1, y: 2 }, 3, 4))).equals(new g.Ellipse({ x: 1, y: 2 }, 3, 4)));
            // default values
            assert.ok((new g.Ellipse()).equals(new g.Rect({ x: 0, y: 0 }, 0, 0)));
        });
    });

    QUnit.module('fromRect(rect)', function() {

        QUnit.test('creates a new Ellipse object', function(assert) {

            assert.ok(g.Ellipse.fromRect(new g.Rect()) instanceof g.Ellipse);
            var r = new g.Rect(100, 50, 150, 70);
            assert.ok(g.Rect.fromEllipse(g.Ellipse.fromRect(r)).equals(r));
        });
    });

    QUnit.module('tangentTheta', function(hooks) {

        var radiusTangentAngle = function(ellipse, angle) {

            var theta = ellipse.tangentTheta(boundaryOnAngle(ellipse, angle), angle);
            return Math.round((theta + angle) % 180);
        };

        QUnit.test('validate on circle', function(assert) {

            var a = 50;
            var b = 50;
            var c = new g.Point(0, 0);
            var ellipse = new g.Ellipse(c, a, b);

            for (var angle = 0; angle <= 360; angle += 10) {
                var tangentAngle = radiusTangentAngle(ellipse, angle);
                var tolerance = 2;
                assert.ok(tangentAngle - 90 < tolerance && tangentAngle - 90 > -tolerance, angle + 'deg, should be 90deg, actual: ' + tangentAngle);
            }
        });

        QUnit.test('validate helper boundaryOnAngle', function(assert) {

            function checkTangentThetaOnEllipse(ellipse, message) {

                assert.equal(ellipse.tangentTheta(boundaryOnAngle(ellipse, 0)), 270, '0 on ' + message);
                assert.equal(ellipse.tangentTheta(boundaryOnAngle(ellipse, 180)), 90, '180 on ' + message);
                assert.equal(ellipse.tangentTheta(boundaryOnAngle(ellipse, 90)), 180, '90 on ' + message);
                assert.equal(ellipse.tangentTheta(boundaryOnAngle(ellipse, 270)), 0, '270 on ' + message);

                for (var angle = 0; angle <= 360; angle += 5) {
                    var theta = ellipse.tangentTheta(boundaryOnAngle(ellipse, angle), angle);
                    assert.ok(theta >= 0, 'tangent theta is numeric on ' + message);
                }
            }

            checkTangentThetaOnEllipse(new g.Ellipse(new g.Point(11, 22), 50, 100), 'wide ellipse');
            checkTangentThetaOnEllipse(new g.Ellipse(new g.Point(11, 22), 100, 50), 'tall ellipse');
        });

    });

    QUnit.module('Where is point in space with ellipse', function(hooks) {

        QUnit.test('normalizedDistance', function(assert) {

            var tolerance = 0.009;
            var ellipse = new g.Ellipse(new g.Point(111, 111), 150, 150);

            var r1 = ellipse.normalizedDistance(ellipse.center());
            assert.ok(r1 < 1 && r1 >= 0);

            assert.ok(ellipse.normalizedDistance(ellipse.center().offset(500, 500)) > 1);

            for (var angle = 0; angle < 360; angle += 1) {

                var b = boundaryOnAngle(ellipse, angle);
                var x = ellipse.normalizedDistance(b);
                assert.ok(x - 1 < tolerance && x - 1 > -tolerance, 'point on angle: ' + angle + ' result:' + x);
            }
        });
    });

    QUnit.module('inflate()', function() {

        QUnit.test('inflate ellipse', function(assert) {

            var ellipse = new g.Ellipse({ x: 0, y: 0 }, 1, 1);
            assert.ok(ellipse.clone().inflate().equals(new g.Ellipse({ x: 0, y: 0 }, 1, 1)));
            assert.ok(ellipse.clone().inflate(2, 1).equals(new g.Ellipse({ x: 0, y: 0 }, 5, 3)));
            assert.ok(ellipse.clone().inflate(0, 1).equals(new g.Ellipse({ x: 0, y: 0 }, 1, 3)));
            assert.ok(ellipse.clone().inflate(2, 0).equals(new g.Ellipse({ x: 0, y: 0 }, 5, 1)));
            assert.ok(ellipse.clone().inflate(5).equals(new g.Ellipse({ x: 0, y: 0 }, 11, 11)));
            assert.ok(ellipse.clone().inflate(2).equals(
                g.Ellipse.fromRect(g.Rect.fromEllipse(new g.Ellipse({ x: 0, y: 0 }, 1, 1).inflate(2)))
            ));
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('returns the bounding box of the ellipse', function(assert) {

                assert.equal(new g.Ellipse(new g.Point(10, 20), 30, 40).bbox().toString(), '-20@-20 40@60');
            });

            QUnit.test('returns the bounding box of the ellipse rotated around its center by an angle', function(assert) {

                const ellipse = new g.Ellipse(new g.Point(10, 20), 30, 40);
                assert.ok(ellipse.bbox(90) instanceof g.Rect);
                assert.equal(ellipse.bbox(0).toString(), '-20@-20 40@60', 'no rotation');
                assert.equal(ellipse.bbox(90).round(6).toString(), '-30@-10 50@50', 'the width and the height are swapped');
                assert.equal(ellipse.bbox(180).round(6).toString(), '-20@-20 40@60');
                assert.equal(ellipse.bbox(-90).round(6).toString(), ellipse.bbox(90).round(6).toString());
                assert.equal(ellipse.bbox('90').round(6).toString(), ellipse.bbox(90).round(6).toString(), 'an angle given as a string');
                assert.equal(ellipse.toString(), '10@20 30 40', 'the ellipse is not changed');
                // a circle is the same for every angle
                assert.equal(new g.Ellipse(new g.Point(10, 20), 30, 30).bbox(33).round(6).toString(), '-20@-10 40@50');
                // the same as the bounding box of the rotated rectangle only for 0, 90, 180, ...
                assert.equal(ellipse.bbox(90).round(6).toString(), ellipse.bbox().bbox(90).round(6).toString());
            });

            QUnit.test('the bounding box of a rotated ellipse is tight', function(assert) {

                const ellipse = new g.Ellipse(new g.Point(10, 20), 30, 40);
                const center = ellipse.center();
                [30, 45, 123].forEach(function(angle) {
                    const points = [];
                    for (let i = 0; i < 3600; i++) {
                        const t = i * Math.PI / 1800;
                        points.push(new g.Point(10 + 30 * Math.cos(t), 20 + 40 * Math.sin(t)).rotate(center, angle));
                    }
                    const sampled = new g.Polyline(points).bbox();
                    const bbox = ellipse.bbox(angle);
                    assert.ok(Math.abs(bbox.x - sampled.x) < 1e-3, 'x, angle ' + angle);
                    assert.ok(Math.abs(bbox.y - sampled.y) < 1e-3, 'y, angle ' + angle);
                    assert.ok(Math.abs(bbox.width - sampled.width) < 1e-3, 'width, angle ' + angle);
                    assert.ok(Math.abs(bbox.height - sampled.height) < 1e-3, 'height, angle ' + angle);
                });
            });

            QUnit.test('returns the bounding box of the ellipse transformed by a matrix', function(assert) {

                const ellipse = new g.Ellipse(new g.Point(10, 20), 30, 40);
                const bbox = ellipse.bbox({ a: 1, b: 0, c: 0, d: 1, e: 5, f: 6 });
                assert.ok(bbox instanceof g.Rect);
                assert.equal(bbox.toString(), '-15@-14 45@66', 'translation');
                assert.equal(ellipse.toString(), '10@20 30 40', 'the ellipse is not changed');
                assert.equal(ellipse.bbox({ a: 2, b: 0, c: 0, d: 0.5, e: 0, f: 0 }).toString(), '-40@-10 80@30', 'scale');
                assert.equal(ellipse.bbox({ a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 }).toString(), '-60@-20 20@40', 'rotation by 90 degrees');
                assert.equal(ellipse.bbox({ e: 5, f: 6 }).toString(), '-15@-14 45@66', 'missing fields');
                assert.equal(ellipse.bbox({}).toString(), '-20@-20 40@60', 'no fields');
                // a circle rotated by 45 degrees is the same circle
                const { SQRT1_2 } = Math;
                assert.equal(new g.Ellipse(new g.Point(0, 0), 10, 10).bbox({ a: SQRT1_2, b: SQRT1_2, c: -SQRT1_2, d: SQRT1_2, e: 0, f: 0 }).round(6).toString(), '-10@-10 10@10');
            });

            QUnit.test('is tight: the transformed ellipse touches every side', function(assert) {

                const matrix = { a: 2, b: 0.5, c: -1, d: 3, e: 10, f: -20 };
                const ellipse = new g.Ellipse(new g.Point(10, 20), 30, 40);
                const bbox = ellipse.bbox(matrix);
                // the bounding box of points on the transformed ellipse
                const points = [];
                for (let i = 0; i < 3600; i++) {
                    const angle = i * Math.PI / 1800;
                    points.push(new g.Point(10 + 30 * Math.cos(angle), 20 + 40 * Math.sin(angle)).transform(matrix));
                }
                const sampled = new g.Polyline(points).bbox();
                assert.ok(Math.abs(bbox.x - sampled.x) < 1e-3);
                assert.ok(Math.abs(bbox.y - sampled.y) < 1e-3);
                assert.ok(Math.abs(bbox.width - sampled.width) < 1e-3);
                assert.ok(Math.abs(bbox.height - sampled.height) < 1e-3);
            });
        });

        QUnit.module('clone()', function() {
            // TODO: implement
        });

        QUnit.module('equals(ellipse)', function() {
            // TODO: implement
        });

        QUnit.module('intersectionWithLineFromCenterToPoint(point, angle)', function() {
            // TODO: implement
        });

        QUnit.module('round()', function() {

            QUnit.test('sanity', function(assert) {

                var ellipse = new g.Ellipse({ x: 11.123456789, y: 21.123456789 }, 31.123456789, 41.123456789);
                assert.ok(ellipse.clone().round() instanceof g.Ellipse);
                assert.ok(ellipse.clone().round(0) instanceof g.Ellipse);
                assert.ok(ellipse.clone().round(1) instanceof g.Ellipse);
                assert.ok(ellipse.clone().round(2) instanceof g.Ellipse);
                assert.ok(ellipse.clone().round(3) instanceof g.Ellipse);
                assert.ok(ellipse.clone().round(4) instanceof g.Ellipse);
                assert.ok(ellipse.clone().round(10) instanceof g.Ellipse);
                assert.ok(ellipse.clone().round(-1) instanceof g.Ellipse);
                assert.ok(ellipse.clone().round(-10) instanceof g.Ellipse);
            });

            QUnit.test('should return a rounded version of self', function(assert) {

                var ellipse = new g.Ellipse({ x: 11.123456789, y: 21.123456789 }, 31.123456789, 41.123456789);
                assert.equal(ellipse.clone().round().toString(), '11@21 31 41');
                assert.equal(ellipse.clone().round(0).toString(), '11@21 31 41');
                assert.equal(ellipse.clone().round(1).toString(), '11.1@21.1 31.1 41.1');
                assert.equal(ellipse.clone().round(2).toString(), '11.12@21.12 31.12 41.12');
                assert.equal(ellipse.clone().round(3).toString(), '11.123@21.123 31.123 41.123');
                assert.equal(ellipse.clone().round(4).toString(), '11.1235@21.1235 31.1235 41.1235');
                assert.equal(ellipse.clone().round(10).toString(), '11.123456789@21.123456789 31.123456789 41.123456789');
                assert.equal(ellipse.clone().round(-1).toString(), '10@20 30 40');
                assert.equal(ellipse.clone().round(-10).toString(), '0@0 0 0');
            });
        });

        QUnit.module('toString()', function() {
            // TODO: implement
        });
    });
});

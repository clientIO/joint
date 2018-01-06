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

        });

        QUnit.module('clone()', function() {

        });

        QUnit.module('equals(ellipse)', function() {

        });

        QUnit.module('intersectionWithLineFromCenterToPoint(point, angle)', function() {

        });

        QUnit.module('toString()', function() {

        });
    });
});

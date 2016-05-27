'use strict';

QUnit.module('ellipse', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Ellipse object', function(assert) {

            assert.ok(g.ellipse() instanceof g.ellipse);
            assert.ok(g.ellipse({ x: 1, y: 2 }, 3, 4) instanceof g.ellipse);
            assert.equal(g.ellipse({ x: 1, y: 2 }, 3, 4).x, 1);
            assert.equal(g.ellipse({ x: 1, y: 2 }, 3, 4).y, 2);
            assert.equal(g.ellipse({ x: 1, y: 2 }, 3, 4).a, 3);
            assert.equal(g.ellipse({ x: 1, y: 2 }, 3, 4).b, 4);
            assert.ok(g.ellipse(g.ellipse({ x: 1, y: 2 }, 3, 4)).equals(g.ellipse({ x: 1, y: 2 }, 3, 4)));
            // default values
            assert.ok(g.ellipse().equals(g.rect({ x: 0, y: 0 }, 0, 0)));
        });
    });

    QUnit.module('fromRect(rect)', function() {

        QUnit.test('creates a new Ellipse object', function(assert) {

            assert.ok(g.ellipse.fromRect(g.rect()) instanceof g.ellipse);
            var r = g.rect(100, 50, 150, 70);
            assert.ok(g.rect.fromEllipse(g.ellipse.fromRect(r)).equals(r));
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

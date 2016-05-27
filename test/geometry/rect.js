'use strict';

QUnit.module('rect', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Rect object', function(assert) {

            assert.ok(g.rect() instanceof g.rect);
            assert.ok(g.rect(1, 2, 3, 4) instanceof g.rect);
            assert.equal(g.rect(1, 2, 3, 4).x, 1);
            assert.equal(g.rect(1, 2, 3, 4).y, 2);
            assert.equal(g.rect(1, 2, 3, 4).width, 3);
            assert.equal(g.rect(1, 2, 3, 4).height, 4);
            assert.ok(g.rect({ x: 1, y: 2, width: 3, height: 4 }).equals(g.rect(1, 2, 3, 4)));
            assert.ok(g.rect(g.rect(1, 2, 3, 4)).equals(g.rect(1, 2, 3, 4)));
            // default values
            assert.ok(g.rect().equals(g.rect(0, 0, 0, 0)));
        });
    });

    QUnit.module('fromEllipse(ellipse)', function() {

        QUnit.test('creates a new Rect object', function(assert) {

            assert.ok(g.rect.fromEllipse(g.ellipse()) instanceof g.rect);
            var e = g.ellipse(g.point(100, 50), 150, 70);
            assert.ok(g.ellipse.fromRect(g.rect.fromEllipse(e)).equals(e));
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

        });

        QUnit.module('bottomLeft()', function() {

        });

        QUnit.module('bottomMiddle()', function() {

            QUnit.test('returns the bottom-middle point', function(assert) {

                assert.ok(g.rect(10, 20, 30, 40).bottomMiddle().equals(g.point(25, 60)));
            });
        });

        QUnit.module('center()', function() {

        });

        QUnit.module('clone()', function() {

        });

        QUnit.module('containsPoint(point)', function() {

        });

        QUnit.module('containsRect(rect)', function() {

            QUnit.test('returns TRUE when rect is completely inside the other rect', function(assert) {

                assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(20, 20, 200, 200)), 'not inside when surround');
                assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(40, 40, 100, 100)), 'not inside when overlap left and top');
                assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(60, 60, 100, 40)), 'not inside when overlap left');
                assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(60, 60, 100, 100)), 'not inside when overlap right and bottom');
                assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(60, 60, 40, 100)), 'not inside when overlap bottom');
                assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(75, 75, 0, 0)), 'not inside when argument rect has zero width/height');
                assert.notOk(g.rect(50, 50, 0, 0).containsRect(g.rect(50, 50, 0, 0)), 'not inside when both rects have zero width/height');
                assert.ok(g.rect(50, 50, 100, 100).containsRect(g.rect(60, 60, 80, 80)), 'inside');
                assert.ok(g.rect(50, 50, 100, 100).containsRect(g.rect(50, 50, 100, 100)), 'inside when equal');
            });
        });

        QUnit.module('corner()', function() {

        });

        QUnit.module('equals(rect)', function() {

            QUnit.test('returns TRUE when the rect equals the other rect', function(assert) {

                assert.ok(g.rect(20, 20, 100, 100).equals(g.rect(20, 20, 100, 100)), 'equal');
                assert.ok(g.rect(20, 20, 100, 100).equals(g.rect(120, 120, -100, -100)), 'equal when target not normalized');
                assert.ok(g.rect(120, 120, -100, -100).equals(g.rect(20, 20, 100, 100)), 'equal when source not normalized');
                assert.notOk(g.rect(20, 20, 100, 100).equals(g.rect(10, 10, 110, 110)), 'not equal');
            });
        });

        QUnit.module('intersect(rect)', function() {

            QUnit.test('returns TRUE when the rect intersects with the other rect', function(assert) {

                assert.ok(g.rect(20, 20, 100, 100).intersect(g.rect(40, 40, 20, 20)).equals(g.rect(40, 40, 20, 20)), 'inside');
                assert.ok(g.rect(20, 20, 100, 100).intersect(g.rect(0, 0, 100, 100)).equals(g.rect(20, 20, 80, 80)), 'overlap left and top');
                assert.ok(g.rect(20, 20, 100, 100).intersect(g.rect(40, 40, 100, 100)).equals(g.rect(40, 40, 80, 80)), 'overlap right and bottom');
                assert.equal(g.rect(20, 20, 100, 100).intersect(g.rect(140, 140, 20, 20)), null, 'no intersection');
            });
        });

        QUnit.module('intersect(rect)', function() {

        });

        QUnit.module('intersectionWithLineFromCenterToPoint(point, angle)', function() {

        });

        QUnit.module('leftMiddle()', function() {

            QUnit.test('returns the left-middle point', function(assert) {

                assert.ok(g.rect(10, 20, 30, 40).leftMiddle().equals(g.point(10, 40)));
            });
        });

        QUnit.module('moveAndExpand(rect)', function() {

        });

        QUnit.module('normalize()', function() {

        });

        QUnit.module('origin()', function() {

        });

        QUnit.module('pointNearestToPoint(point)', function() {

        });

        QUnit.module('rightMiddle()', function() {

            QUnit.test('returns the right-middle point', function(assert) {

                assert.ok(g.rect(10, 20, 30, 40).rightMiddle().equals(g.point(40, 40)));
            });
        });

        QUnit.module('round(precision)', function() {

        });

        QUnit.module('scale(sx, sy, origin)', function() {

            QUnit.test('correctly scales the rectangle', function(assert) {

                assert.equal(g.rect(20, 30, 40, 50).scale(2, 3).toString(), g.rect(40, 90, 80, 150).toString(), 'scale with no origin provided');
                assert.equal(g.rect(20, 30, 40, 50).scale(2, 3, g.point(20, 30)).toString(), g.rect(20, 30, 80, 150).toString(), 'scale with origin at rect origin');
            });
        });

        QUnit.module('sideNearestToPoint(point)', function() {

        });

        QUnit.module('snapToGrid(gx, gy)', function() {

        });

        QUnit.module('topMiddle()', function() {

            QUnit.test('returns the top-middle point', function(assert) {

                assert.ok(g.rect(10, 20, 30, 40).topMiddle().equals(g.point(25, 20)));
            });
        });

        QUnit.module('topRight()', function() {

        });

        QUnit.module('toJSON()', function() {

            QUnit.test('returns an object with the rectangle\'s coordinates and dimensions', function(assert) {

                assert.deepEqual(g.rect(20, 30, 40, 50).toJSON(), { x: 20, y: 30, width: 40, height: 50 });
            });
        });

        QUnit.module('toString()', function() {

        });

        QUnit.module('union(rect)', function() {

            QUnit.test('returns a new rect that represents the union of the two rects', function(assert) {

                assert.equal(g.rect(20, 20, 50, 50).union(g.rect(100, 100, 50, 50)).toString(), g.rect(20, 20, 130, 130).toString(), 'union of distant rectangles');
                assert.equal(g.rect(20, 20, 150, 150).union(g.rect(50, 50, 20, 20)).toString(), g.rect(20, 20, 150, 150).toString(), 'union of embedded rectangles');
                assert.equal(g.rect(20, 20, 150, 150).union(g.rect(50, 50, 200, 200)).toString(), g.rect(20, 20, 230, 230).toString(), 'union of intersecting rectangles');
            });
        });
    });
});

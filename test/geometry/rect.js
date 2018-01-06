'use strict';

QUnit.module('rect', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Rect object', function(assert) {

            assert.ok(new g.Rect() instanceof g.Rect);
            assert.ok(new g.Rect(1, 2, 3, 4) instanceof g.Rect);
            assert.equal((new g.Rect(1, 2, 3, 4)).x, 1);
            assert.equal((new g.Rect(1, 2, 3, 4)).y, 2);
            assert.equal((new g.Rect(1, 2, 3, 4)).width, 3);
            assert.equal((new g.Rect(1, 2, 3, 4)).height, 4);
            assert.ok((new g.Rect({ x: 1, y: 2, width: 3, height: 4 })).equals(new g.Rect(1, 2, 3, 4)));
            assert.ok((new g.Rect(new g.Rect(1, 2, 3, 4))).equals(new g.Rect(1, 2, 3, 4)));
            // default values
            assert.ok((new g.Rect()).equals(new g.Rect(0, 0, 0, 0)));
        });
    });

    QUnit.module('fromEllipse(ellipse)', function() {

        QUnit.test('creates a new Rect object', function(assert) {

            assert.ok(g.Rect.fromEllipse(new g.Ellipse()) instanceof g.Rect);
            var e = new g.Ellipse(new g.Point(100, 50), 150, 70);
            assert.ok(g.Ellipse.fromRect(g.Rect.fromEllipse(e)).equals(e));
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

        });

        QUnit.module('bottomLeft()', function() {

        });

        QUnit.module('bottomLine()', function() {

            QUnit.test('returns the bottom line', function(assert) {

                assert.ok((new g.Rect(10, 20, 30, 40)).bottomLine().equals(new g.Line('10 60', '40 60')));
            });
        });

        QUnit.module('bottomMiddle()', function() {

            QUnit.test('returns the bottom-middle point', function(assert) {

                assert.ok((new g.Rect(10, 20, 30, 40)).bottomMiddle().equals(new g.Point(25, 60)));
            });
        });

        QUnit.module('bottomRight()', function() {

        });

        QUnit.module('center()', function() {

        });

        QUnit.module('clone()', function() {

        });

        QUnit.module('containsPoint(point)', function() {

        });

        QUnit.module('containsRect(rect)', function() {

            QUnit.test('returns TRUE when rect is completely inside the other rect', function(assert) {

                assert.notOk((new g.Rect(50, 50, 100, 100)).containsRect(new g.Rect(20, 20, 200, 200)), 'not inside when surround');
                assert.notOk((new g.Rect(50, 50, 100, 100)).containsRect(new g.Rect(40, 40, 100, 100)), 'not inside when overlap left and top');
                assert.notOk((new g.Rect(50, 50, 100, 100)).containsRect(new g.Rect(60, 60, 100, 40)), 'not inside when overlap left');
                assert.notOk((new g.Rect(50, 50, 100, 100)).containsRect(new g.Rect(60, 60, 100, 100)), 'not inside when overlap right and bottom');
                assert.notOk((new g.Rect(50, 50, 100, 100)).containsRect(new g.Rect(60, 60, 40, 100)), 'not inside when overlap bottom');
                assert.notOk((new g.Rect(50, 50, 100, 100)).containsRect(new g.Rect(75, 75, 0, 0)), 'not inside when argument rect has zero width/height');
                assert.notOk((new g.Rect(50, 50, 0, 0)).containsRect(new g.Rect(50, 50, 0, 0)), 'not inside when both rects have zero width/height');
                assert.ok((new g.Rect(50, 50, 100, 100)).containsRect(new g.Rect(60, 60, 80, 80)), 'inside');
                assert.ok((new g.Rect(50, 50, 100, 100)).containsRect(new g.Rect(50, 50, 100, 100)), 'inside when equal');
            });
        });

        QUnit.module('corner()', function() {

        });

        QUnit.module('equals(rect)', function() {

            QUnit.test('returns TRUE when the rect equals the other rect', function(assert) {

                assert.ok((new g.Rect(20, 20, 100, 100)).equals(new g.Rect(20, 20, 100, 100)), 'equal');
                assert.ok((new g.Rect(20, 20, 100, 100)).equals(new g.Rect(120, 120, -100, -100)), 'equal when target not normalized');
                assert.ok((new g.Rect(120, 120, -100, -100)).equals(new g.Rect(20, 20, 100, 100)), 'equal when source not normalized');
                assert.notOk((new g.Rect(20, 20, 100, 100)).equals(new g.Rect(10, 10, 110, 110)), 'not equal');
            });
        });

        QUnit.module('intersect(rect)', function() {

            QUnit.test('returns TRUE when the rect intersects with the other rect', function(assert) {

                assert.ok((new g.Rect(20, 20, 100, 100)).intersect(new g.Rect(40, 40, 20, 20)).equals(new g.Rect(40, 40, 20, 20)), 'inside');
                assert.ok((new g.Rect(20, 20, 100, 100)).intersect(new g.Rect(0, 0, 100, 100)).equals(new g.Rect(20, 20, 80, 80)), 'overlap left and top');
                assert.ok((new g.Rect(20, 20, 100, 100)).intersect(new g.Rect(40, 40, 100, 100)).equals(new g.Rect(40, 40, 80, 80)), 'overlap right and bottom');
                assert.equal((new g.Rect(20, 20, 100, 100)).intersect(new g.Rect(140, 140, 20, 20)), null, 'no intersection');
            });
        });

        QUnit.module('inflate()', function() {

            QUnit.test('inflate rect', function(assert) {

                assert.ok((new g.Rect(0, 0, 1, 1)).inflate(1).equals(new g.Rect(-1, -1, 3, 3)));
                assert.ok((new g.Rect(0, 0, 1, 1)).inflate(2).equals(new g.Rect(-2, -2, 5, 5)));
                assert.ok((new g.Rect(5, 5, 10, 10)).inflate(5).equals(new g.Rect(0, 0, 20, 20)));
                assert.ok((new g.Rect(0, 0, 1, 1)).inflate(1, 2).equals(new g.Rect(-1, -2, 3, 5)));
                assert.ok((new g.Rect(5, 5, 10, 10)).inflate(5, 3).equals(new g.Rect(0, 2, 20, 16)));
                assert.ok((new g.Rect(0, 0, 1, 1)).inflate(1, 0).equals(new g.Rect(-1, 0, 3, 1)));
                assert.ok((new g.Rect(0, 0, 1, 1)).inflate().equals(new g.Rect(0, 0, 1, 1)));
                assert.ok((new g.Rect(0, 0, 1, 1)).inflate(0).equals(new g.Rect(0, 0, 1, 1).inflate()));
                assert.ok((new g.Rect(0, 0, 1, 1)).inflate(0, 1).equals(new g.Rect(0, -1, 1, 3)));
            });
        });

        QUnit.module('intersect(rect)', function() {

        });

        QUnit.module('intersectionWithLineFromCenterToPoint(point, angle)', function() {

        });

        QUnit.module('leftLine()', function() {

            QUnit.test('returns the left line', function(assert) {

                assert.ok((new g.Rect(10, 20, 30, 40)).leftLine().equals(new g.Line('10 20', '10 60')));
            });
        });

        QUnit.module('leftMiddle()', function() {

            QUnit.test('returns the left-middle point', function(assert) {

                assert.ok((new g.Rect(10, 20, 30, 40)).leftMiddle().equals(new g.Point(10, 40)));
            });
        });

        QUnit.module('moveAndExpand(rect)', function() {

        });

        QUnit.module('normalize()', function() {

        });

        QUnit.module('offset(dx, dy)', function() {

            QUnit.test('changes the x and y values by adding the given dx and dy values respectively', function(assert) {

                var rect = new g.Rect(0, 0, 20, 30);
                rect.offset(2, 3);
                assert.equal(rect.toString(), '2@3 22@33');
                rect.offset(-2, 4);
                assert.equal(rect.toString(), '0@7 20@37');
                rect.offset(2);
                assert.equal(rect.toString(), '2@7 22@37');
                rect.offset(new g.Rect(5, 3));
                assert.equal(rect.toString(), '7@10 27@40');
            });
        });

        QUnit.module('origin()', function() {

        });

        QUnit.module('pointNearestToPoint(point)', function() {

        });

        QUnit.module('rightLine()', function() {

            QUnit.test('returns the right line', function(assert) {

                assert.ok((new g.Rect(10, 20, 30, 40)).rightLine().equals(new g.Line('40 20', '40 60')));
            });
        });

        QUnit.module('rightMiddle()', function() {

            QUnit.test('returns the right-middle point', function(assert) {

                assert.ok((new g.Rect(10, 20, 30, 40)).rightMiddle().equals(new g.Point(40, 40)));
            });
        });

        QUnit.module('round(precision)', function() {

            QUnit.test('no precision', function(assert) {

                assert.deepEqual(
                    (new g.Rect(1, 2, 3, 4)).round().toJSON(),
                    (new g.Rect(1, 2, 3, 4)).toJSON()
                );
                assert.deepEqual(
                    (new g.Rect(1.1, 2.2, 3.3, 4.4)).round().toJSON(),
                    (new g.Rect(1, 2, 3, 4)).toJSON()
                );
            });

            QUnit.test('with precision', function(assert) {

                assert.deepEqual(
                    (new g.Rect(1, 2, 3, 4)).round(1).toJSON(),
                    (new g.Rect(1, 2, 3, 4)).toJSON()
                );
                assert.deepEqual(
                    (new g.Rect(1.11, 2.22, 3.33, 6.66)).round(1).toJSON(),
                    (new g.Rect(1.1, 2.2, 3.3, 6.7)).toJSON()
                );
                assert.deepEqual(
                    (new g.Rect(1, 2, 3, 4)).round(2).toJSON(),
                    (new g.Rect(1, 2, 3, 4)).toJSON()
                );
                assert.deepEqual(
                    (new g.Rect(1.111, 2.222, 3.333, 6.666)).round(2).toJSON(),
                    (new g.Rect(1.11, 2.22, 3.33, 6.67)).toJSON()
                );
            });

            QUnit.test('with negative precision', function(assert) {

                assert.deepEqual(
                    (new g.Rect(11, 22, 33, 66)).round(-1).toJSON(),
                    (new g.Rect(10, 20, 30, 70)).toJSON()
                );
                assert.deepEqual(
                    (new g.Rect(11.1,22.2,33.3,66.6)).round(-1).toJSON(),
                    (new g.Rect(10, 20, 30, 70)).toJSON()
                );
            });

        });

        QUnit.module('scale(sx, sy, origin)', function() {

            QUnit.test('correctly scales the rectangle', function(assert) {

                assert.equal((new g.Rect(20, 30, 40, 50)).scale(2, 3).toString(), (new g.Rect(40, 90, 80, 150)).toString(), 'scale with no origin provided');
                assert.equal((new g.Rect(20, 30, 40, 50)).scale(2, 3, (new g.Point(20, 30))).toString(), (new g.Rect(20, 30, 80, 150)).toString(), 'scale with origin at rect origin');
            });
        });

        QUnit.module('sideNearestToPoint(point)', function() {

        });

        QUnit.module('snapToGrid(gx, gy)', function() {

        });

        QUnit.module('topLeft()', function() {

        });

        QUnit.module('topLine()', function() {

            QUnit.test('returns the top line', function(assert) {

                assert.ok((new g.Rect(10, 20, 30, 40)).topLine().equals(new g.Line('10 20', '40 20')));
            });
        });

        QUnit.module('topMiddle()', function() {

            QUnit.test('returns the top-middle point', function(assert) {

                assert.ok((new g.Rect(10, 20, 30, 40)).topMiddle().equals(new g.Point(25, 20)));
            });
        });

        QUnit.module('topRight()', function() {

        });

        QUnit.module('toJSON()', function() {

            QUnit.test('returns an object with the rectangle\'s coordinates and dimensions', function(assert) {

                assert.deepEqual((new g.Rect(20, 30, 40, 50)).toJSON(), { x: 20, y: 30, width: 40, height: 50 });
            });
        });

        QUnit.module('toString()', function() {

        });

        QUnit.module('union(rect)', function() {

            QUnit.test('returns a new rect that represents the union of the two rects', function(assert) {

                assert.equal((new g.Rect(20, 20, 50, 50)).union(new g.Rect(100, 100, 50, 50)).toString(), (new g.Rect(20, 20, 130, 130)).toString(), 'union of distant rectangles');
                assert.equal((new g.Rect(20, 20, 150, 150)).union(new g.Rect(50, 50, 20, 20)).toString(), (new g.Rect(20, 20, 150, 150)).toString(), 'union of embedded rectangles');
                assert.equal((new g.Rect(20, 20, 150, 150)).union(new g.Rect(50, 50, 200, 200)).toString(), (new g.Rect(20, 20, 230, 230)).toString(), 'union of intersecting rectangles');
            });
        });
    });
});

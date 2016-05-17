QUnit.module('geometry', function() {

    QUnit.module('point', function() {

        QUnit.test('point()', function(assert) {

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

        QUnit.test('scale()', function(assert) {
            assert.equal(g.point(20, 30).scale(2, 3).toString(), g.point(40, 90).toString(), 'scale with no origin provided');
            assert.equal(g.point(20, 30).scale(2, 3, g.point(40, 45)).toString(), g.point(0, 0).toString(), 'scale with origin provided');
        });

        QUnit.test('toJSON()', function(assert) {
            assert.deepEqual(g.point(20, 30).toJSON(), { x: 20, y: 30 });
        });

    });

    QUnit.module('line', function() {

        QUnit.test('bearing()', function(assert) {

            assert.equal(g.line('0 0', '0 -10').bearing(), 'S', 'south bearing');
            assert.equal(g.line('0 0', '0 10').bearing(), 'N', 'north bearing');
            assert.equal(g.line('0 0', '10 10').bearing(), 'NE', 'north east bearing');
            assert.equal(g.line('0 0', '-10 10').bearing(), 'NW', 'north west bearing');
            assert.equal(g.line('0 0', '10 0').bearing(), 'E', 'east bearing');
            assert.equal(g.line('0 0', '-10 0').bearing(), 'W', 'west bearing');
            assert.equal(g.line('0 0', '-10 -10').bearing(), 'SW', 'south west bearing');
            assert.equal(g.line('0 0', '10 -10').bearing(), 'SE', 'south east bearing');
        });

    });

    QUnit.module('rect', function() {

        QUnit.test('rect()', function(assert) {

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

        QUnit.test('fromEllipse()', function(assert) {
            assert.ok(g.rect.fromEllipse(g.ellipse()) instanceof g.rect);
            var e = g.ellipse(g.point(100, 50), 150, 70);
            assert.ok(g.ellipse.fromRect(g.rect.fromEllipse(e)).equals(e));
        });

        QUnit.test('leftMiddle()', function(assert) {
            assert.ok(g.rect(10, 20, 30, 40).leftMiddle().equals(g.point(10, 40)));
        });

        QUnit.test('rightMiddle()', function(assert) {
            assert.ok(g.rect(10, 20, 30, 40).rightMiddle().equals(g.point(40, 40)));
        });

        QUnit.test('topMiddle()', function(assert) {
            assert.ok(g.rect(10, 20, 30, 40).topMiddle().equals(g.point(25, 20)));
        });

        QUnit.test('bottomMiddle()', function(assert) {
            assert.ok(g.rect(10, 20, 30, 40).bottomMiddle().equals(g.point(25, 60)));
        });

        QUnit.test('containsRect()', function(assert) {

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

        QUnit.test('equals()', function(assert) {

            assert.ok(g.rect(20, 20, 100, 100).equals(g.rect(20, 20, 100, 100)), 'equal');
            assert.ok(g.rect(20, 20, 100, 100).equals(g.rect(120, 120, -100, -100)), 'equal when target not normalized');
            assert.ok(g.rect(120, 120, -100, -100).equals(g.rect(20, 20, 100, 100)), 'equal when source not normalized');
            assert.notOk(g.rect(20, 20, 100, 100).equals(g.rect(10, 10, 110, 110)), 'not equal');
        });

        QUnit.test('intersect()', function(assert) {

            assert.ok(g.rect(20, 20, 100, 100).intersect(g.rect(40, 40, 20, 20)).equals(g.rect(40, 40, 20, 20)), 'inside');
            assert.ok(g.rect(20, 20, 100, 100).intersect(g.rect(0, 0, 100, 100)).equals(g.rect(20, 20, 80, 80)), 'overlap left and top');
            assert.ok(g.rect(20, 20, 100, 100).intersect(g.rect(40, 40, 100, 100)).equals(g.rect(40, 40, 80, 80)), 'overlap right and bottom');
            assert.equal(g.rect(20, 20, 100, 100).intersect(g.rect(140, 140, 20, 20)), null, 'no intersection');
        });

        QUnit.test('union()', function(assert) {

            assert.equal(g.rect(20, 20, 50, 50).union(g.rect(100, 100, 50, 50)).toString(), g.rect(20, 20, 130, 130).toString(), 'union of distant rectangles');
            assert.equal(g.rect(20, 20, 150, 150).union(g.rect(50, 50, 20, 20)).toString(), g.rect(20, 20, 150, 150).toString(), 'union of embedded rectangles');
            assert.equal(g.rect(20, 20, 150, 150).union(g.rect(50, 50, 200, 200)).toString(), g.rect(20, 20, 230, 230).toString(), 'union of intersecting rectangles');
        });

        QUnit.test('scale()', function(assert) {
            assert.equal(g.rect(20, 30, 40, 50).scale(2, 3).toString(), g.rect(40, 90, 80, 150).toString(), 'scale with no origin provided');
            assert.equal(g.rect(20, 30, 40, 50).scale(2, 3, g.point(20, 30)).toString(), g.rect(20, 30, 80, 150).toString(), 'scale with origin at rect origin');
        });

        QUnit.test('toJSON()', function(assert) {
            assert.deepEqual(g.rect(20, 30, 40, 50).toJSON(), { x: 20, y: 30, width: 40, height: 50 });
        });
    });

    QUnit.module('ellipse', function() {

        QUnit.test('ellipse()', function(assert) {

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

        QUnit.test('fromRect()', function(assert) {

            assert.ok(g.ellipse.fromRect(g.rect()) instanceof g.ellipse);
            var r = g.rect(100, 50, 150, 70);
            assert.ok(g.rect.fromEllipse(g.ellipse.fromRect(r)).equals(r));
        });

    });

    QUnit.test('scale()', function(assert) {

        assert.equal(g.scale.linear([.5, 1], [50, 150], .75), 100, 'linear scale up');
        assert.equal(g.scale.linear([50, 150], [.5, 1], 100), .75, 'linear scale down');
    });

});

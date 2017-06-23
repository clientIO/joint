'use strict';

QUnit.module('line', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Line object', function(assert) {

            var line = g.line(g.point(), g.point(3, 8));
            assert.ok(line, 'returns instance of g.line');
            assert.ok(typeof line.start !== 'undefined', 'has "start" property');
            assert.ok(typeof line.end !== 'undefined', 'has "end" property');
            assert.equal(line.start.x, 0, 'start.x is correct');
            assert.equal(line.start.y, 0, 'start.y is correct');
            assert.equal(line.end.x, 3, 'end.x is correct');
            assert.equal(line.end.y, 8, 'end.y is correct');
            assert.ok(g.line() instanceof g.line, 'no arguments provided');
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bearing()', function() {

            QUnit.test('should return the line\'s bearing', function(assert) {

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

        QUnit.module('clone()', function() {

            QUnit.test('returns a clone', function(assert) {

                var l1 = g.Line('1 2', '3 4');
                var l2 = l1.clone();
                assert.notOk(l1 === l2);
                assert.equal(l1.toString(), l2.toString());
            });
        });

        // Kept for backwards compatibility
        QUnit.module('intersection(line)', function() {

            QUnit.test('returns an intersection point for the line', function(assert) {

                var line1 = g.line('0 0', '8 0');
                var line2 = g.line('4 4', '4 -4');
                assert.equal(line1.intersection(line2).toString(), '4@0');
                var line3 = g.line('0 2', '2 8');
                assert.equal(line1.intersection(line3), null);
            });
        });

        QUnit.module('intersect(line)', function() {

            QUnit.test('returns an intersection point for the line', function(assert) {

                var line1 = g.line('2 4', '5 1');
                var line2 = g.line('2 1', '5 4');
                assert.equal(line1.intersection(line2).toString(), '3.5@2.5');
                var line3 = g.line('0 2', '2 8');
                assert.equal(line1.intersection(line3), null);
            });

            QUnit.test('returns the correct intersection points for lines in different directions', function(assert) {
                // The following test uses/assumes the lines of a rectangle and its diagonal for easy understanding.

                // diagonal in both directions
                var line1a = g.line('0 0', '10 10');
                var line1b = g.line('10 10', '0 0');
                // left line
                var line2a = g.line('0 0', '0 10');
                var line2b = g.line('0 10', '0 0');
                // top line
                var line3a = g.line('0 0', '10 0');
                var line3b = g.line('10 0', '0 0');
                // right line
                var line4a = g.line('10 0', '10 10');
                var line4b = g.line('10 10', '10 0');
                // bottom line
                var line5a = g.line('0 10', '10 10');
                var line5b = g.line('10 10', '0 10');

                // Test diagonal intersection in '->' direction with all the other lines ('->' direction)
                assert.equal(line1a.intersection(line2a).toString(), '0@0');
                assert.equal(line1a.intersection(line3a).toString(), '0@0');
                assert.equal(line1a.intersection(line4a).toString(), '10@10');
                assert.equal(line1a.intersection(line5a).toString(), '10@10');

                // Test diagonal intersection in '->' direction with all the other lines ('<-' direction)
                assert.equal(line1a.intersection(line2b).toString(), '0@0');
                assert.equal(line1a.intersection(line3b).toString(), '0@0');
                assert.equal(line1a.intersection(line4b).toString(), '10@10');
                assert.equal(line1a.intersection(line5b).toString(), '10@10');

                // Test diagonal intersection in '<-' direction with all the other lines ('->' direction)
                assert.equal(line1b.intersection(line2a).toString(), '0@0');
                assert.equal(line1b.intersection(line3a).toString(), '0@0');
                assert.equal(line1b.intersection(line4a).toString(), '10@10');
                assert.equal(line1b.intersection(line5a).toString(), '10@10');

                // Test diagonal intersection in '<-' direction with all the other lines ('<-' direction)
                assert.equal(line1b.intersection(line2b).toString(), '0@0');
                assert.equal(line1b.intersection(line3b).toString(), '0@0');
                assert.equal(line1b.intersection(line4b).toString(), '10@10');
                assert.equal(line1b.intersection(line5b).toString(), '10@10');

                // Test left line intersection in '->' direction with top line (both directions)
                assert.equal(line2a.intersection(line3a).toString(), '0@0');
                assert.equal(line2a.intersection(line3b).toString(), '0@0');

                // Test left line intersection in '<-' direction with top line (both directions)
                assert.equal(line2b.intersection(line3a).toString(), '0@0');
                assert.equal(line2b.intersection(line3b).toString(), '0@0');

            });
        });

        QUnit.module('intersect(rectangle)', function() {

            QUnit.test('returns null for a rectangle that does not intersect the line', function(assert) {

                assert.equal(g.line('0 0', '0 -10').intersect(g.rect(10, 20, 30, 40)), null, "no intersection point");
            });

            QUnit.test('returns an array of intersecting points with the rectangle', function(assert) {

                var rect = g.rect(-10, -20, 30, 40);
                var line1 = g.line('0 0', '20 0');
                assert.equal(line1.intersect(rect).length, 1, "one intersection point");
                assert.equal(line1.intersect(rect)[0].toString(), '20@0');

                var line2 = g.line('-20 0', '20 0');
                assert.equal(line2.intersect(rect).length, 2, "two intersection points");
                assert.equal(line2.intersect(rect)[0].toString(), '20@0');
                assert.equal(line2.intersect(rect)[1].toString(), '-10@0');

                var line3 = g.line('0 0', '5 5');
                rect = g.rect(0, 0, 5, 5);
                assert.equal(line3.intersect(rect).length, 2, "two intersection points");
                assert.equal(line3.intersect(rect)[0].toString(), '0@0');
                assert.equal(line3.intersect(rect)[1].toString(), '5@5');
            });
        });

        QUnit.module('vector()', function() {

            QUnit.test('returns the vector of the line', function(assert) {

                assert.ok(g.Line().vector() instanceof g.Point);
                assert.equal(g.Line('10 10', '20 30').vector().toString(), g.Point(10,20).toString());
                assert.equal(g.Line('20 30', '10 10').vector().toString(), g.Point(-10,-20).toString());
            });

        });

        QUnit.module('closestPointNormalizedLenght(p)', function() {

            QUnit.test('returns the normalized lentgh of the closest point', function(assert) {

                assert.equal(g.Line('10 0', '20 0').closestPointNormalizedLength(g.Point(15,0)), .5);
                assert.equal(g.Line('10 0', '20 0').closestPointNormalizedLength(g.Point(15,20)), .5);
                assert.equal(g.Line('10 0', '20 0').closestPointNormalizedLength(g.Point(15,-20)), .5);
                assert.equal(g.Line('10 0', '20 0').closestPointNormalizedLength(g.Point(20,10)), 1);
                assert.equal(g.Line('10 0', '20 0').closestPointNormalizedLength(g.Point(0,10)), 0);
                assert.equal(g.Line('10 0', '20 0').closestPointNormalizedLength(g.Point(30,10)), 1);
                assert.equal(g.Line('10 0', '20 0').closestPointNormalizedLength(g.Point(-10,10)), 0);
            });
        });

        QUnit.module('closestPoint(p)', function() {

            QUnit.test('returns the the closest point', function(assert) {

                assert.equal(g.Line('10 0', '20 0').closestPoint(g.Point(15,0)).toString(), g.Point(15,0).toString());
                assert.equal(g.Line('10 0', '20 0').closestPoint(g.Point(15,20)).toString(), g.Point(15,0).toString());
                assert.equal(g.Line('10 0', '20 0').closestPoint(g.Point(15,-20)).toString(), g.Point(15,0).toString());
                assert.equal(g.Line('10 0', '20 0').closestPoint(g.Point(20,10)).toString(), g.Point(20,0).toString());
                assert.equal(g.Line('10 0', '20 0').closestPoint(g.Point(0,10)).toString(), g.Point(10,0).toString());
                assert.equal(g.Line('10 0', '20 0').closestPoint(g.Point(30,10)).toString(), g.Point(20,0).toString());
                assert.equal(g.Line('10 0', '20 0').closestPoint(g.Point(-10,10)).toString(), g.Point(10,0).toString());
            });
        });

        QUnit.module('length()', function() {

        });

        QUnit.module('midpoint()', function() {

        });

        QUnit.module('pointAt(t)', function() {

        });

        QUnit.module('pointOffset(point)', function() {

        });

        QUnit.module('squaredLength()', function() {

        });

        QUnit.module('toString()', function() {

        });
    });
});

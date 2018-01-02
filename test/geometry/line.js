'use strict';

QUnit.module('line', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Line object', function(assert) {

            var line = new g.Line();
            assert.ok(line instanceof g.Line, 'no arguments provided');

            var line1 = new g.Line(new g.Point(), new g.Point(3, 8));
            assert.ok(line1 instanceof g.Line, 'returns instance of g.Line');
            assert.ok(typeof line1.start !== 'undefined', 'has "start" property');
            assert.ok(typeof line1.end !== 'undefined', 'has "end" property');
            assert.equal(line1.start.x, 0, 'start.x is correct');
            assert.equal(line1.start.y, 0, 'start.y is correct');
            assert.equal(line1.end.x, 3, 'end.x is correct');
            assert.equal(line1.end.y, 8, 'end.y is correct');

            var line2 = new g.Line(line1);
            assert.ok(line2 instanceof g.Line, 'returns instance of g.Line');
            assert.ok(typeof line2.start !== 'undefined', 'has "start" property');
            assert.ok(typeof line2.end !== 'undefined', 'has "end" property');
            assert.notOk(line1 === line2);
            assert.equal(line1.toString(), line2.toString());
            assert.ok(line1.equals(line2));
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Line('0 0', '0 0').bbox() instanceof g.Rect);

                assert.ok(g.Line('0 0', '10 0').bbox() instanceof g.Rect);
                assert.ok(g.Line('0 0', '0 10').bbox() instanceof g.Rect);
                assert.ok(g.Line('0 0', '10 10').bbox() instanceof g.Rect);

                assert.ok(g.Line('0 0', '-10 0').bbox() instanceof g.Rect);
                assert.ok(g.Line('0 0', '0 -10').bbox() instanceof g.Rect);
                assert.ok(g.Line('0 0', '-10 -10').bbox() instanceof g.Rect);
            });

            QUnit.test('should return the line\'s bounding box', function(assert) {

                assert.equal(g.Line('0 0', '0 0').bbox().toString(), g.Rect(0, 0, 0, 0).toString());

                assert.equal(g.Line('0 0', '10 0').bbox().toString(), g.Rect(0, 0, 10, 0).toString());
                assert.equal(g.Line('0 0', '0 10').bbox().toString(), g.Rect(0, 0, 0, 10).toString());
                assert.equal(g.Line('0 0', '10 10').bbox().toString(), g.Rect(0, 0, 10, 10).toString());

                assert.equal(g.Line('0 0', '-10 0').bbox().toString(), g.Rect(-10, 0, 10, 0).toString());
                assert.equal(g.Line('0 0', '0 -10').bbox().toString(), g.Rect(0, -10, 0, 10).toString());
                assert.equal(g.Line('0 0', '-10 -10').bbox().toString(), g.Rect(-10, -10, 10, 10).toString());
            });
        });

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

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Line('1 2', '3 4').clone() instanceof g.Line);
            });

            QUnit.test('returns a clone', function(assert) {

                var l1 = g.Line('1 2', '3 4');
                var l2 = l1.clone();
                assert.notOk(l1 === l2);
                assert.equal(l1.toString(), l2.toString());
                assert.ok(l1.equals(l2));
            });
        });

        QUnit.module('equals()', function() {

            QUnit.test('checks whether two lines are exactly the same', function(assert) {

                var p1;
                var p2;

                p1 = g.Line('100@100', '200@200');
                p2 = g.Line('100@100', '200@200');
                assert.equal(p1.equals(p2), true);

                p1 = g.Line('100@100', '200@200');
                p2 = g.Line('100@100', '100@200');
                assert.equal(p1.equals(p2), false);

                p1 = g.Line('100@100', '200@200');
                p2 = g.Line('200@200', '100@100');
                assert.equal(p1.equals(p2), false);
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

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                var line = g.Line('0 0', '100 0');
                assert.ok(line.pointAt(0.4) instanceof g.Point);
                assert.ok(line.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(line.pointAt(-1) instanceof g.Point);
                assert.ok(line.pointAt(10) instanceof g.Point);
            });

            QUnit.test('returns a point at given length ratio', function(assert) {

                var line = g.Line('0 0', '100 0');
                assert.equal(line.pointAt(0.4).toString(), '40@0');
                assert.equal(line.pointAt(0.4, { precision: 0 }).toString(), '40@0');

                assert.equal(line.pointAt(-1).toString(), '0@0');
                assert.equal(line.pointAt(10).toString(), '100@0');
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var line = g.Line('0 0', '100 0');
                assert.ok(line.pointAtLength(40) instanceof g.Point);
                assert.ok(line.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(line.pointAtLength(10000) instanceof g.Point);

                assert.ok(line.pointAtLength(-40) instanceof g.Point);
                assert.ok(line.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(line.pointAtLength(-10000) instanceof g.Point);
            });

            QUnit.test('returns a point at given length', function(assert) {

                var line = g.Line('0 0', '100 0');
                assert.equal(line.pointAtLength(40).toString(), '40@0');
                assert.equal(line.pointAtLength(40, { precision: 0 }).toString(), '40@0');
                assert.equal(line.pointAtLength(10000).toString(), '100@0');

                assert.equal(line.pointAtLength(-40).toString(), '60@0');
                assert.equal(line.pointAtLength(-40, { precision: 0 }).toString(), '60@0');
                assert.equal(line.pointAtLength(-10000).toString(), '0@0');
            });
        });

        QUnit.module('rotate()', function() {

            QUnit.test('sanity', function(assert) {

                var line = new g.Line('5 5', '20 20');
                var angle;

                var nullPoint = null;
                var zeroPoint = new g.Point('0 0');
                var startPoint = line.start;
                var arbitraryPoint = new g.Point('14 6');

                angle = 0;
                assert.ok(line.clone().rotate(nullPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(zeroPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(startPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(arbitraryPoint, angle) instanceof g.Line);

                angle = 154;
                assert.ok(line.clone().rotate(nullPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(zeroPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(startPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(arbitraryPoint, angle) instanceof g.Line);

                angle = 360;
                assert.ok(line.clone().rotate(nullPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(zeroPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(startPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(arbitraryPoint, angle) instanceof g.Line);

                angle = 1080;
                assert.ok(line.clone().rotate(nullPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(zeroPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(startPoint, angle) instanceof g.Line);
                assert.ok(line.clone().rotate(arbitraryPoint, angle) instanceof g.Line);
            });

            QUnit.test('should return a rotated version of self', function(assert) {

                var line = new g.Line('5 5', '20 20');
                var angle;

                var nullPoint = null;
                var zeroPoint = new g.Point('0 0');
                var startPoint = line.start;
                var arbitraryPoint = new g.Point('14 6');

                angle = 0;
                assert.equal(line.clone().rotate(nullPoint, angle).toString(), '5@5.000000000000001 20@20.000000000000004');
                assert.equal(line.clone().rotate(zeroPoint, angle).toString(), '5@5.000000000000001 20@20.000000000000004');
                assert.equal(line.clone().rotate(startPoint, angle).toString(), '5@5 20@20.000000000000004');
                assert.equal(line.clone().rotate(arbitraryPoint, angle).toString(), '5@5.000000000000001 19.999999999999996@20');

                angle = 154;
                assert.equal(line.clone().rotate(nullPoint, angle).toString(), '-2.30211449755045@-6.6858259654412215 -9.2084579902018@-26.743303861764886');
                assert.equal(line.clone().rotate(zeroPoint, angle).toString(), '-2.30211449755045@-6.6858259654412215 -9.2084579902018@-26.743303861764886');
                assert.equal(line.clone().rotate(startPoint, angle).toString(), '5@5 -1.9063434926513505@-15.057477896323665');
                assert.equal(line.clone().rotate(arbitraryPoint, angle).toString(), '21.650775269903427@10.844134367400862 14.744431777252077@-9.213343528922803');
            });

            QUnit.test('assert rotation 0 = 360 = 1080', function(assert) {

                var line = new g.Line('5 5', '20 20');
                var angle1;
                var angle2;

                var nullPoint = null;
                var zeroPoint = new g.Point('0 0');
                var startPoint = line.start;
                var arbitraryPoint = new g.Point('14 6');

                angle1 = 0;
                angle2 = 360;
                assert.equal(line.clone().rotate(nullPoint, angle1).toString(), line.clone().rotate(nullPoint, angle2).toString());
                assert.equal(line.clone().rotate(zeroPoint, angle1).toString(), line.clone().rotate(zeroPoint, angle2).toString());
                assert.equal(line.clone().rotate(startPoint, angle1).toString(), line.clone().rotate(startPoint, angle2).toString());
                assert.equal(line.clone().rotate(arbitraryPoint, angle1).toString(), line.clone().rotate(arbitraryPoint, angle2).toString());

                angle1 = 0;
                angle2 = 1080;
                assert.equal(line.clone().rotate(nullPoint, angle1).toString(), line.clone().rotate(nullPoint, angle2).toString());
                assert.equal(line.clone().rotate(zeroPoint, angle1).toString(), line.clone().rotate(zeroPoint, angle2).toString());
                assert.equal(line.clone().rotate(startPoint, angle1).toString(), line.clone().rotate(startPoint, angle2).toString());
                assert.equal(line.clone().rotate(arbitraryPoint, angle1).toString(), line.clone().rotate(arbitraryPoint, angle2).toString());
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                var line = new g.Line('5 5', '20 20');
                assert.ok(line.clone().scale(0, 0) instanceof g.Line);
                assert.ok(line.clone().scale(0, 0, g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(0, 0, g.Point('10 10')) instanceof g.Line);

                assert.ok(line.clone().scale(0, 1) instanceof g.Line);
                assert.ok(line.clone().scale(0, 1, g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(0, 1, g.Point('10 10')) instanceof g.Line);

                assert.ok(line.clone().scale(1, 0) instanceof g.Line);
                assert.ok(line.clone().scale(1, 0, g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(1, 0, g.Point('10 10')) instanceof g.Line);

                assert.ok(line.clone().scale(1, 1) instanceof g.Line);
                assert.ok(line.clone().scale(1, 1, g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(1, 1, g.Point('10 10')) instanceof g.Line);

                assert.ok(line.clone().scale(10, 10) instanceof g.Line);
                assert.ok(line.clone().scale(10, 10, g.Point('0 0')) instanceof g.Line);
                assert.ok(g.Line('5 5', '20 20').scale(10, 10, g.Point('10 10')) instanceof g.Line);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                var line = new g.Line('5 5', '20 20');
                assert.equal(line.clone().scale(0, 0).toString(), g.Line('0 0', '0 0').toString());
                assert.equal(line.clone().scale(0, 0, g.Point('0 0')).toString(), g.Line('0 0', '0 0').toString());
                assert.equal(line.clone().scale(0, 0, g.Point('10 10')).toString(), g.Line('10 10', '10 10').toString());

                assert.equal(line.clone().scale(0, 1).toString(), g.Line('0 5', '0 20').toString());
                assert.equal(line.clone().scale(0, 1, g.Point('0 0')).toString(), g.Line('0 5', '0 20').toString());
                assert.equal(line.clone().scale(0, 1, g.Point('10 10')).toString(), g.Line('10 5', '10 20').toString());

                assert.equal(line.clone().scale(1, 0).toString(), g.Line('5 0', '20 0').toString());
                assert.equal(line.clone().scale(1, 0, g.Point('0 0')).toString(), g.Line('5 0', '20 0').toString());
                assert.equal(line.clone().scale(1, 0, g.Point('10 10')).toString(), g.Line('5 10', '20 10').toString());

                assert.equal(line.clone().scale(1, 1).toString(), g.Line('5 5', '20 20').toString());
                assert.equal(line.clone().scale(1, 1, g.Point('0 0')).toString(), g.Line('5 5', '20 20').toString());
                assert.equal(line.clone().scale(1, 1, g.Point('10 10')).toString(), g.Line('5 5', '20 20').toString());

                assert.equal(line.clone().scale(10, 10).toString(), g.Line('50 50', '200 200').toString());
                assert.equal(line.clone().scale(10, 10, g.Point('0 0')).toString(), g.Line('50 50', '200 200').toString());
                assert.equal(line.clone().scale(10, 10, g.Point('10 10')).toString(), g.Line('-40 -40', '110 110').toString());
            });
        });

        QUnit.module('tangentAt()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Line('10 10', '20 20').tangentAt(0.4) instanceof g.Line);

                assert.ok(g.Line('10 10', '20 20').tangentAt(-1) instanceof g.Line);
                assert.ok(g.Line('10 10', '20 20').tangentAt(10) instanceof g.Line);

                assert.equal(g.Line('10 10', '10 10').tangentAt(0.4), null);
            });

            QUnit.test('should return a line tangent to line at given length ratio', function(assert) {

                assert.equal(g.Line('10 10', '20 20').tangentAt(0.4).toString(), g.Line('14 14', '24 24').toString());

                assert.equal(g.Line('10 10', '20 20').tangentAt(-1).toString(), g.Line('10 10', '20 20').toString());
                assert.equal(g.Line('10 10', '20 20').tangentAt(10).toString(), g.Line('20 20', '30 30').toString());
            });
        });

        QUnit.module('tangentAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Line('10 10', '20 20').tangentAtLength(4) instanceof g.Line);
                assert.ok(g.Line('10 10', '20 20').tangentAtLength(10000) instanceof g.Line);

                assert.ok(g.Line('10 10', '20 20').tangentAtLength(-4) instanceof g.Line);
                assert.ok(g.Line('10 10', '20 20').tangentAtLength(-10000) instanceof g.Line);

                assert.equal(g.Line('10 10', '10 10').tangentAtLength(), null);
            });

            QUnit.test('should return a line tangent to line at given length', function(assert) {

                assert.equal(g.Line('10 10', '20 20').tangentAtLength(4).toString(), g.Line(g.Point(12.82842712474619, 12.82842712474619), g.Point(22.82842712474619, 22.82842712474619)).toString());
                assert.equal(g.Line('10 10', '20 20').tangentAtLength(10000).toString(), g.Line('20 20', '30 30').toString());

                assert.equal(g.Line('10 10', '20 20').tangentAtLength(-4).toString(), g.Line(g.Point(17.17157287525381, 17.17157287525381), g.Point(27.17157287525381, 27.17157287525381)).toString());
                assert.equal(g.Line('10 10', '20 20').tangentAtLength(-10000).toString(), g.Line('10 10', '20 20').toString());
            });
        });

        QUnit.module('translate()', function() {

            QUnit.test('sanity', function(assert) {

                var line = new g.Line('5 5', '20 20');
                assert.ok(line.clone().translate(0, 0) instanceof g.Line);
                assert.ok(line.clone().translate(0, 10) instanceof g.Line);
                assert.ok(line.clone().translate(10, 0) instanceof g.Line);
                assert.ok(line.clone().translate(10, 10) instanceof g.Line);
            });

            QUnit.test('should return a translated version of self', function(assert) {

                var line = new g.Line('5 5', '20 20');
                assert.equal(line.clone().translate(0, 0).toString(), '5@5 20@20');
                assert.equal(line.clone().translate(0, 10).toString(), '5@15 20@30');
                assert.equal(line.clone().translate(10, 0).toString(), '15@5 30@20');
                assert.equal(line.clone().translate(10, 10).toString(), '15@15 30@30');
            });
        });

        QUnit.module('vector()', function() {

            QUnit.test('returns the vector of the line', function(assert) {

                assert.ok(g.Line().vector() instanceof g.Point);
                assert.equal(g.Line('10 10', '20 30').vector().toString(), g.Point(10,20).toString());
                assert.equal(g.Line('20 30', '10 10').vector().toString(), g.Point(-10,-20).toString());
            });

        });

        QUnit.module('closestPointNormalizedLength(p)', function() {

            QUnit.test('returns the normalized length of the closest point', function(assert) {

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

        QUnit.module('pointOffset(point)', function() {

        });

        QUnit.module('squaredLength()', function() {

        });

        QUnit.module('toString()', function() {

        });
    });
});

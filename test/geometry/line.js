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

                assert.ok((new g.Line('0 0', '0 0')).bbox() instanceof g.Rect);

                assert.ok((new g.Line('0 0', '10 0')).bbox() instanceof g.Rect);
                assert.ok((new g.Line('0 0', '0 10')).bbox() instanceof g.Rect);
                assert.ok((new g.Line('0 0', '10 10')).bbox() instanceof g.Rect);

                assert.ok((new g.Line('0 0', '-10 0')).bbox() instanceof g.Rect);
                assert.ok((new g.Line('0 0', '0 -10')).bbox() instanceof g.Rect);
                assert.ok((new g.Line('0 0', '-10 -10')).bbox() instanceof g.Rect);
            });

            QUnit.test('should return the line\'s bounding box', function(assert) {

                assert.equal((new g.Line('0 0', '0 0')).bbox().toString(), (new g.Rect(0, 0, 0, 0)).toString());

                assert.equal((new g.Line('0 0', '10 0')).bbox().toString(), (new g.Rect(0, 0, 10, 0)).toString());
                assert.equal((new g.Line('0 0', '0 10')).bbox().toString(), (new g.Rect(0, 0, 0, 10)).toString());
                assert.equal((new g.Line('0 0', '10 10')).bbox().toString(), (new g.Rect(0, 0, 10, 10)).toString());

                assert.equal((new g.Line('0 0', '-10 0')).bbox().toString(), (new g.Rect(-10, 0, 10, 0)).toString());
                assert.equal((new g.Line('0 0', '0 -10')).bbox().toString(), (new g.Rect(0, -10, 0, 10)).toString());
                assert.equal((new g.Line('0 0', '-10 -10')).bbox().toString(), (new g.Rect(-10, -10, 10, 10)).toString());
            });
        });

        QUnit.module('bearing()', function() {

            QUnit.test('should return the line\'s bearing', function(assert) {

                assert.equal((new g.Line('0 0', '0 -10')).bearing(), 'S', 'south bearing');
                assert.equal((new g.Line('0 0', '0 10')).bearing(), 'N', 'north bearing');
                assert.equal((new g.Line('0 0', '10 10')).bearing(), 'NE', 'north east bearing');
                assert.equal((new g.Line('0 0', '-10 10')).bearing(), 'NW', 'north west bearing');
                assert.equal((new g.Line('0 0', '10 0')).bearing(), 'E', 'east bearing');
                assert.equal((new g.Line('0 0', '-10 0')).bearing(), 'W', 'west bearing');
                assert.equal((new g.Line('0 0', '-10 -10')).bearing(), 'SW', 'south west bearing');
                assert.equal((new g.Line('0 0', '10 -10')).bearing(), 'SE', 'south east bearing');
            });
        });

        QUnit.module('clone()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok((new g.Line('1 2', '3 4')).clone() instanceof g.Line);
            });

            QUnit.test('returns a clone', function(assert) {

                var l1 = new g.Line('1 2', '3 4');
                var l2 = l1.clone();
                assert.notOk(l1 === l2);
                assert.equal(l1.toString(), l2.toString());
                assert.ok(l1.equals(l2));
            });
        });

        QUnit.module('closestPoint(p)', function() {

            QUnit.test('returns the closest point', function(assert) {

                var line = new g.Line('10 0', '20 0');
                assert.equal(line.closestPoint(new g.Point(15,0)).toString(), '15@0');
                assert.equal(line.closestPoint(new g.Point(15,20)).toString(), '15@0');
                assert.equal(line.closestPoint(new g.Point(15,-20)).toString(), '15@0');
                assert.equal(line.closestPoint(new g.Point(20,10)).toString(), '20@0');
                assert.equal(line.closestPoint(new g.Point(0,10)).toString(), '10@0');
                assert.equal(line.closestPoint(new g.Point(30,10)).toString(), '20@0');
                assert.equal(line.closestPoint(new g.Point(-10,10)).toString(), '10@0');
            });
        });

        QUnit.module('closestPointLength(p)', function() {

            QUnit.test('returns the length of the closest point', function(assert) {

                var line = new g.Line('10 0', '20 0');
                assert.equal(line.closestPointLength(new g.Point(15,0)), 5);
                assert.equal(line.closestPointLength(new g.Point(15,20)), 5);
                assert.equal(line.closestPointLength(new g.Point(15,-20)), 5);
                assert.equal(line.closestPointLength(new g.Point(20,10)), 10);
                assert.equal(line.closestPointLength(new g.Point(0,10)), 0);
                assert.equal(line.closestPointLength(new g.Point(30,10)), 10);
                assert.equal(line.closestPointLength(new g.Point(-10,10)), 0);
            });
        });

        QUnit.module('closestPointNormalizedLength(p)', function() {

            QUnit.test('returns the normalized length of the closest point', function(assert) {

                var line = new g.Line('10 0', '20 0');
                assert.equal(line.closestPointNormalizedLength(new g.Point(15,0)), 0.5);
                assert.equal(line.closestPointNormalizedLength(new g.Point(15,20)), 0.5);
                assert.equal(line.closestPointNormalizedLength(new g.Point(15,-20)), 0.5);
                assert.equal(line.closestPointNormalizedLength(new g.Point(20,10)), 1);
                assert.equal(line.closestPointNormalizedLength(new g.Point(0,10)), 0);
                assert.equal(line.closestPointNormalizedLength(new g.Point(30,10)), 1);
                assert.equal(line.closestPointNormalizedLength(new g.Point(-10,10)), 0);
            });
        });

        QUnit.module('closestPointTangent(p)', function() {

            QUnit.test('returns the tangent to line at the closest point', function(assert) {

                var line = new g.Line('10 0', '20 0');
                assert.equal(line.closestPointTangent(new g.Point(15,0)).toString(), '15@0 25@0');
                assert.equal(line.closestPointTangent(new g.Point(15,20)).toString(), '15@0 25@0');
                assert.equal(line.closestPointTangent(new g.Point(15,-20)).toString(), '15@0 25@0');
                assert.equal(line.closestPointTangent(new g.Point(20,10)).toString(), '20@0 30@0');
                assert.equal(line.closestPointTangent(new g.Point(0,10)).toString(), '10@0 20@0');
                assert.equal(line.closestPointTangent(new g.Point(30,10)).toString(), '20@0 30@0');
                assert.equal(line.closestPointTangent(new g.Point(-10,10)).toString(), '10@0 20@0');
            });
        });

        QUnit.module('equals()', function() {

            QUnit.test('checks whether two lines are exactly the same', function(assert) {

                var l1;
                var l2;

                l1 = new g.Line('100@100', '200@200');
                l2 = new g.Line('100@100', '200@200');
                assert.equal(l1.equals(l2), true);

                l1 = new g.Line('100@100', '200@200');
                l2 = new g.Line('100@100', '100@200');
                assert.equal(l1.equals(l2), false);

                l1 = new g.Line('100@100', '200@200');
                l2 = new g.Line('200@200', '100@100');
                assert.equal(l1.equals(l2), false);
            });
        });

        // Kept for backwards compatibility
        QUnit.module('intersection(line)', function() {

            QUnit.test('returns an intersection point for the line', function(assert) {

                var line1 = new g.Line('0 0', '8 0');
                var line2 = new g.Line('4 4', '4 -4');
                assert.equal(line1.intersection(line2).toString(), '4@0');
                var line3 = new g.Line('0 2', '2 8');
                assert.equal(line1.intersection(line3), null);
            });
        });

        QUnit.module('intersect(line)', function() {

            QUnit.test('returns an intersection point for the line', function(assert) {

                var line1 = new g.Line('2 4', '5 1');
                var line2 = new g.Line('2 1', '5 4');
                assert.equal(line1.intersection(line2).toString(), '3.5@2.5');
                var line3 = new g.Line('0 2', '2 8');
                assert.equal(line1.intersection(line3), null);
            });

            QUnit.test('returns the correct intersection points for lines in different directions', function(assert) {
                // The following test uses/assumes the lines of a rectangle and its diagonal for easy understanding.

                // diagonal in both directions
                var line1a = new g.Line('0 0', '10 10');
                var line1b = new g.Line('10 10', '0 0');
                // left line
                var line2a = new g.Line('0 0', '0 10');
                var line2b = new g.Line('0 10', '0 0');
                // top line
                var line3a = new g.Line('0 0', '10 0');
                var line3b = new g.Line('10 0', '0 0');
                // right line
                var line4a = new g.Line('10 0', '10 10');
                var line4b = new g.Line('10 10', '10 0');
                // bottom line
                var line5a = new g.Line('0 10', '10 10');
                var line5b = new g.Line('10 10', '0 10');

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

                assert.equal(new g.Line('0 0', '0 -10').intersect(new g.Rect(10, 20, 30, 40)), null, 'no intersection point');
            });

            QUnit.test('returns an array of intersecting points with the rectangle', function(assert) {

                var rect = new g.Rect(-10, -20, 30, 40);
                var line1 = new g.Line('0 0', '20 0');
                assert.equal(line1.intersect(rect).length, 1, 'one intersection point');
                assert.equal(line1.intersect(rect)[0].toString(), '20@0');

                var line2 = new g.Line('-20 0', '20 0');
                assert.equal(line2.intersect(rect).length, 2, 'two intersection points');
                assert.equal(line2.intersect(rect)[0].toString(), '20@0');
                assert.equal(line2.intersect(rect)[1].toString(), '-10@0');

                var line3 = new g.Line('0 0', '5 5');
                rect = new g.Rect(0, 0, 5, 5);
                assert.equal(line3.intersect(rect).length, 2, 'two intersection points');
                assert.equal(line3.intersect(rect)[0].toString(), '0@0');
                assert.equal(line3.intersect(rect)[1].toString(), '5@5');
            });
        });

        QUnit.module('isDifferentiable()', function() {

            QUnit.test('sanity', function(assert) {

                var line;

                line = new g.Line('0 0', '0 200');
                assert.equal(typeof line.isDifferentiable(), 'boolean');

                line = new g.Line('100 100', '100 100');
                assert.equal(typeof line.isDifferentiable(), 'boolean');
            });

            QUnit.test('checks whether the line is differentiable (can have tangents)', function(assert) {

                var line;

                line = new g.Line('0 0', '0 200');
                assert.equal(line.isDifferentiable(), true);

                line = new g.Line('100 100', '100 100');
                assert.equal(line.isDifferentiable(), false);
            });
        });

        QUnit.module('length()', function() {

        });

        QUnit.module('midpoint()', function() {

        });

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                var line = new g.Line('0 0', '100 0');
                assert.ok(line.pointAt(0.4) instanceof g.Point);
                assert.ok(line.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(line.pointAt(-1) instanceof g.Point);
                assert.ok(line.pointAt(10) instanceof g.Point);
            });

            QUnit.test('returns a point at given length ratio', function(assert) {

                var line = new g.Line('0 0', '100 0');
                assert.equal(line.pointAt(0.4).toString(), '40@0');
                assert.equal(line.pointAt(0.4, { precision: 0 }).toString(), '40@0');

                assert.equal(line.pointAt(-1).toString(), '0@0');
                assert.equal(line.pointAt(10).toString(), '100@0');
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var line = new g.Line('0 0', '100 0');
                assert.ok(line.pointAtLength(40) instanceof g.Point);
                assert.ok(line.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(line.pointAtLength(10000) instanceof g.Point);

                assert.ok(line.pointAtLength(-40) instanceof g.Point);
                assert.ok(line.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(line.pointAtLength(-10000) instanceof g.Point);
            });

            QUnit.test('returns a point at given length', function(assert) {

                var line = new g.Line('0 0', '100 0');
                assert.equal(line.pointAtLength(40).toString(), '40@0');
                assert.equal(line.pointAtLength(40, { precision: 0 }).toString(), '40@0');
                assert.equal(line.pointAtLength(10000).toString(), '100@0');

                assert.equal(line.pointAtLength(-40).toString(), '60@0');
                assert.equal(line.pointAtLength(-40, { precision: 0 }).toString(), '60@0');
                assert.equal(line.pointAtLength(-10000).toString(), '0@0');
            });
        });

        QUnit.module('pointOffset(point)', function() {

            QUnit.test('is perpendicular distance', function(assert) {
                [
                    new g.Line('0 0', '1 0'),
                    new g.Line('0 0', '10 0'),
                    new g.Line('0 0', '100 0')
                ].forEach(function(line) {
                    assert.equal(line.pointOffset('50@0'), 0);
                    assert.equal(line.pointOffset('50@10'), 10);
                    assert.equal(line.pointOffset('50@-10'), -10);
                })
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
                assert.equal(line.clone().rotate(nullPoint, angle).round(3).toString(), '5@5 20@20');
                assert.equal(line.clone().rotate(zeroPoint, angle).round(3).toString(), '5@5 20@20');
                assert.equal(line.clone().rotate(startPoint, angle).round(3).toString(), '5@5 20@20');
                assert.equal(line.clone().rotate(arbitraryPoint, angle).round(3).toString(), '5@5 20@20');

                angle = 154;
                assert.equal(line.clone().rotate(nullPoint, angle).round(3).toString(), '-2.302@-6.686 -9.208@-26.743');
                assert.equal(line.clone().rotate(zeroPoint, angle).round(3).toString(), '-2.302@-6.686 -9.208@-26.743');
                assert.equal(line.clone().rotate(startPoint, angle).round(3).toString(), '5@5 -1.906@-15.057');
                assert.equal(line.clone().rotate(arbitraryPoint, angle).round(3).toString(), '21.651@10.844 14.744@-9.213');
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

        QUnit.module('round()', function() {

            QUnit.test('sanity', function(assert) {

                var line = new g.Line('5 5', '20 20');
                var angle = 154;
                var point = new g.Point('14 6');

                assert.ok(line.clone().rotate(point, angle).round() instanceof g.Line);
                assert.ok(line.clone().rotate(point, angle).round(0) instanceof g.Line);
                assert.ok(line.clone().rotate(point, angle).round(3) instanceof g.Line);
                assert.ok(line.clone().rotate(point, angle).round(10) instanceof g.Line);
                assert.ok(line.clone().rotate(point, angle).round(-1) instanceof g.Line);
                assert.ok(line.clone().rotate(point, angle).round(-10) instanceof g.Line);
            });

            QUnit.test('should return a rounded version of self', function(assert) {

                var line = new g.Line('5 5', '20 20');
                var angle = 154;
                var point = new g.Point('14 6');

                assert.equal(line.clone().rotate(point, angle).round().toString(), '22@11 15@-9');
                assert.equal(line.clone().rotate(point, angle).round(0).toString(), '22@11 15@-9');
                assert.equal(line.clone().rotate(point, angle).round(3).toString(), '21.651@10.844 14.744@-9.213');
                assert.equal(line.clone().rotate(point, angle).round(10).toString(), '21.6507752699@10.8441343674 14.7444317773@-9.2133435289');
                assert.equal(line.clone().rotate(point, angle).round(-1).toString(), '20@10 10@-10');
                assert.equal(line.clone().rotate(point, angle).round(-10).toString(), '0@0 0@0');
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                var line = new g.Line('5 5', '20 20');
                assert.ok(line.clone().scale(0, 0) instanceof g.Line);
                assert.ok(line.clone().scale(0, 0, new g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(0, 0, new g.Point('10 10')) instanceof g.Line);

                assert.ok(line.clone().scale(0, 1) instanceof g.Line);
                assert.ok(line.clone().scale(0, 1, new g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(0, 1, new g.Point('10 10')) instanceof g.Line);

                assert.ok(line.clone().scale(1, 0) instanceof g.Line);
                assert.ok(line.clone().scale(1, 0, new g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(1, 0, new g.Point('10 10')) instanceof g.Line);

                assert.ok(line.clone().scale(1, 1) instanceof g.Line);
                assert.ok(line.clone().scale(1, 1, new g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(1, 1, new g.Point('10 10')) instanceof g.Line);

                assert.ok(line.clone().scale(10, 10) instanceof g.Line);
                assert.ok(line.clone().scale(10, 10, new g.Point('0 0')) instanceof g.Line);
                assert.ok(line.clone().scale(10, 10, new g.Point('10 10')) instanceof g.Line);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                var line = new g.Line('5 5', '20 20');
                assert.equal(line.clone().scale(0, 0).toString(), '0@0 0@0');
                assert.equal(line.clone().scale(0, 0, new g.Point('0 0')).toString(), '0@0 0@0');
                assert.equal(line.clone().scale(0, 0, new g.Point('10 10')).toString(), '10@10 10@10');

                assert.equal(line.clone().scale(0, 1).toString(), '0@5 0@20');
                assert.equal(line.clone().scale(0, 1, new g.Point('0 0')).toString(), '0@5 0@20');
                assert.equal(line.clone().scale(0, 1, new g.Point('10 10')).toString(), '10@5 10@20');

                assert.equal(line.clone().scale(1, 0).toString(), '5@0 20@0');
                assert.equal(line.clone().scale(1, 0, new g.Point('0 0')).toString(), '5@0 20@0');
                assert.equal(line.clone().scale(1, 0, new g.Point('10 10')).toString(), '5@10 20@10');

                assert.equal(line.clone().scale(1, 1).toString(), '5@5 20@20');
                assert.equal(line.clone().scale(1, 1, new g.Point('0 0')).toString(), '5@5 20@20');
                assert.equal(line.clone().scale(1, 1, new g.Point('10 10')).toString(), '5@5 20@20');

                assert.equal(line.clone().scale(10, 10).toString(), '50@50 200@200');
                assert.equal(line.clone().scale(10, 10, new g.Point('0 0')).toString(), '50@50 200@200');
                assert.equal(line.clone().scale(10, 10, new g.Point('10 10')).toString(), '-40@-40 110@110');
            });
        });

        QUnit.module('setLength()', function() {

            QUnit.test('sanity', function(assert) {

                var line;

                line = new g.Line('5 5', '5 5');
                assert.ok(line.clone().setLength(0) instanceof g.Line);
                assert.ok(line.clone().setLength(10) instanceof g.Line);

                line = new g.Line('5 5', '5 20');
                assert.ok(line.clone().setLength(0) instanceof g.Line);
                assert.ok(line.clone().setLength(10) instanceof g.Line);
            });

            QUnit.test('should return a scaled version of self with requested length', function(assert) {

                var line;

                line = new g.Line('5 5', '5 5');
                assert.ok(line.clone().setLength(0) instanceof g.Line);
                assert.ok(line.clone().setLength(10) instanceof g.Line);

                line = new g.Line('5 5', '5 20');
                assert.equal(line.clone().setLength(0).toString(), '5@5 5@5');
                assert.equal(line.clone().setLength(10).toString(), '5@5 5@15');
            });
        });

        QUnit.module('squaredLength()', function() {

        });

        QUnit.module('tangentAt()', function() {

            QUnit.test('sanity', function(assert) {

                var line;

                line = new g.Line('10 10', '20 20');
                assert.ok(line.tangentAt(0.4) instanceof g.Line);

                assert.ok(line.tangentAt(-1) instanceof g.Line);
                assert.ok(line.tangentAt(10) instanceof g.Line);

                line = new g.Line('10 10', '10 10');
                assert.equal(line.tangentAt(0.4), null);
            });

            QUnit.test('should return a line tangent to line at given length ratio', function(assert) {

                var line = new g.Line('10 10', '20 20');
                assert.equal(line.tangentAt(0.4).toString(), '14@14 24@24');

                assert.equal(line.tangentAt(-1).toString(), '10@10 20@20');
                assert.equal(line.tangentAt(10).toString(), '20@20 30@30');
            });
        });

        QUnit.module('tangentAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var line;

                line = new g.Line('10 10', '20 20');
                assert.ok(line.tangentAtLength(4) instanceof g.Line);
                assert.ok(line.tangentAtLength(10000) instanceof g.Line);

                assert.ok(line.tangentAtLength(-4) instanceof g.Line);
                assert.ok(line.tangentAtLength(-10000) instanceof g.Line);

                line = new g.Line('10 10', '10 10');
                assert.equal(line.tangentAtLength(), null);
            });

            QUnit.test('should return a line tangent to line at given length', function(assert) {

                var line = new g.Line('10 10', '20 20');
                assert.equal(line.tangentAtLength(4).toString(), '12.82842712474619@12.82842712474619 22.82842712474619@22.82842712474619');
                assert.equal(line.tangentAtLength(10000).toString(), '20@20 30@30');

                assert.equal(line.tangentAtLength(-4).toString(), '17.17157287525381@17.17157287525381 27.17157287525381@27.17157287525381');
                assert.equal(line.tangentAtLength(-10000).toString(), '10@10 20@20');
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

            QUnit.test('sanity', function(assert) {

                var line = new g.Line();
                assert.ok(line.vector() instanceof g.Point);
            });

            QUnit.test('returns the vector of the line', function(assert) {

                var line;

                line = new g.Line('10 10', '20 30');
                assert.equal(line.vector().toString(), '10@20');

                line = new g.Line('20 30', '10 10');
                assert.equal(line.vector().toString(), '-10@-20');
            });

        });

        QUnit.module('toString()', function() {

        });
    });
});

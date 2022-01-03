QUnit.module('intersection', function() {

    QUnit.module('polylineWithLine() & polygonWithLine()', function(assert) {

        QUnit.test('returns true if line intersects polyline', function(assert) {

            var polyline = new g.Polyline([
                new g.Point(10, 10),
                new g.Point(20, 10),
                new g.Point(20, 20),
                new g.Point(10, 20)
            ]);

            assert.equal(g.intersection.exists(polyline, new g.Line({ x: 15, y: 15 }, { x: 30, y: 15 })), true);
            assert.equal(g.intersection.exists(polyline, new g.Line({ x: 15, y: 15 }, { x: 0, y: 15 })), false);
            assert.equal(g.intersection.exists(new g.Polygon(polyline.points), new g.Line({ x: 15, y: 15 }, { x: 0, y: 15 })), true);
        });
    });

    QUnit.module('polylineWithPolyline() & polygonWithPolyline()', function(assert) {

        QUnit.test('returns true if polyline intersects polyline', function(assert) {

            var polyline1 = new g.Polyline([
                new g.Point(10, 10),
                new g.Point(20, 10),
                new g.Point(20, 20),
                new g.Point(10, 20),
                new g.Point(10, 10)
            ]);

            var polyline2 = new g.Polyline([
                new g.Point(14, 16),
                new g.Point(16, 16),
                new g.Point(15, 14),
                new g.Point(14, 16),
            ]);

            var polyline3 = new g.Polyline([
                new g.Point(0, 0),
                new g.Point(0, 100),
                new g.Point(100, 100),
                new g.Point(100, 0),
            ]);

            var polyline4 = new g.Polyline([
                new g.Point(0, 15),
                new g.Point(100, 15),
            ]);
            // self intersection
            assert.equal(g.intersection.exists(polyline1, polyline1), true);
            // through
            assert.equal(g.intersection.exists(polyline1, polyline4), true);
            assert.equal(g.intersection.exists(polyline4, polyline1), true);
            // inside
            assert.equal(g.intersection.exists(polyline1, polyline2), false);
            assert.equal(g.intersection.exists(polyline2, polyline1), false);
            // around
            assert.equal(g.intersection.exists(polyline1, polyline3), false);
            assert.equal(g.intersection.exists(polyline3, polyline1), false);
            assert.equal(g.intersection.exists(new g.Polygon(polyline1.points), polyline3), false);
            assert.equal(g.intersection.exists(new g.Polygon(polyline3.points), polyline1), true);
        });
    });

    QUnit.module('polygonWithPolyline() & polygonWithPolygon()', function(assert) {

        QUnit.test('returns true if polygon intersects polyline', function(assert) {

            var polyline1 = new g.Polyline([
                new g.Point(10, 10),
                new g.Point(20, 10),
                new g.Point(20, 20),
                new g.Point(10, 20),
                new g.Point(10, 10)
            ]);

            var polyline2 = new g.Polyline([
                new g.Point(14, 16),
                new g.Point(16, 16),
                new g.Point(15, 14),
                new g.Point(14, 16),
            ]);

            var polyline3 = new g.Polyline([
                new g.Point(0, 0),
                new g.Point(0, 100),
                new g.Point(100, 100),
                new g.Point(100, 0),
            ]);

            var polyline4 = new g.Polyline([
                new g.Point(0, 15),
                new g.Point(100, 15),
            ]);

            // self intersection
            assert.equal(g.intersection.exists(new g.Polygon(polyline1.points), polyline1), true);
            // through
            assert.equal(g.intersection.exists(new g.Polygon(polyline1.points), polyline4), true);
            assert.equal(g.intersection.exists(new g.Polygon(polyline4.points), polyline1), true);
            // inside
            assert.equal(g.intersection.exists(new g.Polygon(polyline1.points), polyline2), true);
            assert.equal(g.intersection.exists(new g.Polygon(polyline2.points), polyline1), false);
            // around
            assert.equal(g.intersection.exists(new g.Polygon(polyline1.points), polyline3), false);
            assert.equal(g.intersection.exists(new g.Polygon(polyline3.points), polyline1), true);
            assert.equal(g.intersection.exists(new g.Polygon(polyline1.points), new g.Polygon(polyline3.points)), true);
            assert.equal(g.intersection.exists(new g.Polygon(polyline3.points), new g.Polygon(polyline1.points)), true);
        });
    });

    QUnit.module('polylineWithEllipse() & polygonWithEllipse()', function(assert) {

        QUnit.test('returns true if ellipse intersects polyline', function(assert) {

            var ellipse = new g.Ellipse({ x: 15, y: 15 }, 4, 4);

            var polyline1 = new g.Polyline([
                new g.Point(10, 10),
                new g.Point(20, 10),
                new g.Point(20, 20),
                new g.Point(10, 20),
                new g.Point(10, 10)
            ]);

            var polyline2 = new g.Polyline([
                new g.Point(0, 15),
                new g.Point(100, 15),
            ]);

            assert.equal(g.intersection.exists(polyline1, ellipse), false);
            assert.equal(g.intersection.exists(new g.Polygon(polyline1.points), ellipse), true);
            assert.equal(g.intersection.exists(polyline2, ellipse), true);
        });
    });

    QUnit.module('polylineWithRect() & polygonWithRect()', function(assert) {

        QUnit.test('returns true if rectangle intersects polyline', function(assert) {

            var rect = new g.Rect(11, 11, 8, 8);

            var polyline1 = new g.Polyline([
                new g.Point(10, 10),
                new g.Point(20, 10),
                new g.Point(20, 20),
                new g.Point(10, 20),
                new g.Point(10, 10)
            ]);

            var polyline2 = new g.Polyline([
                new g.Point(0, 15),
                new g.Point(100, 15),
            ]);

            assert.equal(g.intersection.exists(polyline1, rect), false);
            assert.equal(g.intersection.exists(new g.Polygon(polyline1.points), rect), true);
            assert.equal(g.intersection.exists(polyline2, rect), true);
        });
    });

    QUnit.module('polylineWithPath() & polygonWithPath()', function(assert) {

        QUnit.test('returns true if rectangle intersects polyline', function(assert) {

            var path1 = new g.Path('M 11 11 L 19 11 L 19 19 L 11 19 Z');

            var polyline1 = new g.Polyline([
                new g.Point(10, 10),
                new g.Point(20, 10),
                new g.Point(20, 20),
                new g.Point(10, 20),
                new g.Point(10, 10)
            ]);

            var polyline2 = new g.Polyline([
                new g.Point(0, 15),
                new g.Point(100, 15),
            ]);

            assert.equal(g.intersection.exists(path1, polyline1), false);
            assert.equal(g.intersection.exists(path1, new g.Polygon(polyline1.points)), true);
            assert.equal(g.intersection.exists(path1, polyline2), true);

            var path2 = new g.Path('M 50 10 L 150 10 L 150 30 L 50 30');
            var path3 = new g.Path('M 50 10 L 150 10 L 150 30 L 50 30 Z');

            assert.equal(g.intersection.exists(path2, polyline2), false);
            assert.equal(g.intersection.exists(path3, polyline2), true);
        });
    });

    QUnit.module('pathWithPath()', function(assert) {

        QUnit.test('returns true if path intersects path', function(assert) {

            var path1 = new g.Path('M 0 15 L 100 15');
            var path2 = new g.Path('M 50 10 L 150 10 L 150 30 L 50 30');
            var path3 = new g.Path('M 50 10 L 150 10 L 150 30 L 50 30 Z');

            assert.equal(g.intersection.exists(path1, path2), false);
            assert.equal(g.intersection.exists(path2, path1), false);
            assert.equal(g.intersection.exists(path1, path3), true);
            assert.equal(g.intersection.exists(path3, path1), true);
            assert.equal(g.intersection.exists(path2, path3), true);
            assert.equal(g.intersection.exists(path3, path2), true);

            // multiple subpaths
            var path4 = new g.Path('M 200 0 L 200 30 M 50 0 50 30');
            assert.equal(g.intersection.exists(path1, path4), true);
            assert.equal(g.intersection.exists(path4, path1), true);
            assert.equal(g.intersection.exists(path1, path4.getSubpaths()[0]), false);
            assert.equal(g.intersection.exists(path1, path4.getSubpaths()[1]), true);
        });
    });

    QUnit.module('ellipseWithEllipse()', function(assert) {

        QUnit.test('returns true if ellipse intersects ellipse', function(assert) {

            var ellipse1 = new g.Ellipse({ x: 0, y: 0 }, 10, 10);
            var ellipse2 = new g.Ellipse({ x: 0, y: 0 }, 5, 5);
            assert.equal(g.intersection.exists(ellipse1, ellipse1), true);
            assert.equal(g.intersection.exists(ellipse1, ellipse2), true);
            ellipse2.x += 15;
            assert.equal(g.intersection.exists(ellipse1, ellipse2), true);
            ellipse2.x += 1;
            assert.equal(g.intersection.exists(ellipse1, ellipse2), false);

            var ellipse3 = new g.Ellipse({ x: 9, y: 9 }, 2, 2);
            assert.equal(g.intersection.exists(ellipse1, ellipse3), false);
            ellipse3.a += 2;
            ellipse3.b += 2;
            assert.equal(g.intersection.exists(ellipse1, ellipse3), true);
        });
    });

    QUnit.module('rectWithEllipse()', function(assert) {

        QUnit.test('returns true if rect intersects ellipse', function(assert) {

            var rect = new g.Rect(0, 0, 10, 10);
            var ellipse1 = new g.Ellipse({ x: 0, y: 0 }, 5, 5);
            assert.equal(g.intersection.exists(ellipse1, rect), true);
            assert.equal(g.intersection.exists(rect, ellipse1), true);
            ellipse1.x += 14;
            assert.equal(g.intersection.exists(rect, ellipse1), true);
            ellipse1.x += 1;
            assert.equal(g.intersection.exists(rect, ellipse1), false);

            var ellipse2 = new g.Ellipse({ x: 11.5, y: 11.5 }, 2, 2);
            assert.equal(g.intersection.exists(rect, ellipse2), false);
            ellipse2.a += 2;
            ellipse2.b += 2;
            assert.equal(g.intersection.exists(rect, ellipse2), true);
        });
    });

});

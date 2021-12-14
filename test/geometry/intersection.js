QUnit.module('intersection', function() {

    QUnit.module('polylineWithLine() & polygonWithLine()', function(assert) {

        QUnit.test('returns true if line intersects polyline', function(assert) {

            var polyline = new g.Polyline([
                new g.Point(10, 10),
                new g.Point(20, 10),
                new g.Point(20, 20),
                new g.Point(10, 20)
            ]);

            assert.equal(g.intersection.polylineWithLine(polyline, new g.Line({ x: 15, y: 15 }, { x: 30, y: 15 })), true);
            assert.equal(g.intersection.polylineWithLine(polyline, new g.Line({ x: 15, y: 15 }, { x: 0, y: 15 })), false);
            assert.equal(g.intersection.polygonWithLine(polyline, new g.Line({ x: 15, y: 15 }, { x: 0, y: 15 })), true);
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
            assert.equal(g.intersection.polylineWithPolyline(polyline1, polyline1), true);
            // through
            assert.equal(g.intersection.polylineWithPolyline(polyline1, polyline4), true);
            assert.equal(g.intersection.polylineWithPolyline(polyline4, polyline1), true);
            // inside
            assert.equal(g.intersection.polylineWithPolyline(polyline1, polyline2), false);
            assert.equal(g.intersection.polylineWithPolyline(polyline2, polyline1), false);
            // around
            assert.equal(g.intersection.polylineWithPolyline(polyline1, polyline3), false);
            assert.equal(g.intersection.polylineWithPolyline(polyline3, polyline1), false);
            assert.equal(g.intersection.polygonWithPolyline(polyline1, polyline3), false);
            assert.equal(g.intersection.polygonWithPolyline(polyline3, polyline1), true);
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
            assert.equal(g.intersection.polygonWithPolyline(polyline1, polyline1), true);
            // through
            assert.equal(g.intersection.polygonWithPolyline(polyline1, polyline4), true);
            assert.equal(g.intersection.polygonWithPolyline(polyline4, polyline1), true);
            // inside
            assert.equal(g.intersection.polygonWithPolyline(polyline1, polyline2), true);
            assert.equal(g.intersection.polygonWithPolyline(polyline2, polyline1), false);
            // around
            assert.equal(g.intersection.polygonWithPolyline(polyline1, polyline3), false);
            assert.equal(g.intersection.polygonWithPolyline(polyline3, polyline1), true);
            assert.equal(g.intersection.polygonWithPolygon(polyline1, polyline3), true);
            assert.equal(g.intersection.polygonWithPolygon(polyline3, polyline1), true);
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

            assert.equal(g.intersection.polylineWithEllipse(polyline1, ellipse), false);
            assert.equal(g.intersection.polygonWithEllipse(polyline1, ellipse), true);
            assert.equal(g.intersection.polylineWithEllipse(polyline2, ellipse), true);
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

            assert.equal(g.intersection.polylineWithRect(polyline1, rect), false);
            assert.equal(g.intersection.polygonWithRect(polyline1, rect), true);
            assert.equal(g.intersection.polylineWithRect(polyline2, rect), true);
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

            assert.equal(g.intersection.polylineWithPath(polyline1, path1), false);
            assert.equal(g.intersection.polygonWithPath(polyline1, path1), true);
            assert.equal(g.intersection.polylineWithPath(polyline2, path1), true);

            var path2 = new g.Path('M 50 10 L 150 10 L 150 30 L 50 30');
            var path3 = new g.Path('M 50 10 L 150 10 L 150 30 L 50 30 Z');

            assert.equal(g.intersection.polylineWithPath(polyline2, path2), false);
            assert.equal(g.intersection.polylineWithPath(polyline2, path3), true);
        });
    });

    QUnit.module('pathWithPath()', function(assert) {

        QUnit.test('returns true if path intersects path', function(assert) {

            var path1 = new g.Path('M 0 15 L 100 15');
            var path2 = new g.Path('M 50 10 L 150 10 L 150 30 L 50 30');
            var path3 = new g.Path('M 50 10 L 150 10 L 150 30 L 50 30 Z');

            assert.equal(g.intersection.pathWithPath(path1, path2), false);
            assert.equal(g.intersection.pathWithPath(path2, path1), false);
            assert.equal(g.intersection.pathWithPath(path1, path3), true);
            assert.equal(g.intersection.pathWithPath(path3, path1), true);
            assert.equal(g.intersection.pathWithPath(path2, path3), true);
            assert.equal(g.intersection.pathWithPath(path3, path2), true);

            // multiple subpaths
            var path4 = new g.Path('M 200 0 L 200 30 M 50 0 50 30');
            assert.equal(g.intersection.pathWithPath(path1, path4), true);
            assert.equal(g.intersection.pathWithPath(path4, path1), true);
            assert.equal(g.intersection.pathWithPath(path1, path4.getSubpaths()[0]), false);
            assert.equal(g.intersection.pathWithPath(path1, path4.getSubpaths()[1]), true);
        });
    });

});

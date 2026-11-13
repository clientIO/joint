'use strict';

QUnit.module('polygon', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Polygon object from a polyline or a polygon', function(assert) {

            [
                new g.Polyline(['1 1', '2 2', '3 1']),
                new g.Polygon(['1 1', '2 2', '3 1'])
            ].forEach(function(source) {
                const polygon = new g.Polygon(source);
                assert.ok(polygon instanceof g.Polygon);
                assert.equal(polygon.type, g.types.Polygon);
                assert.equal(polygon.serialize(), '1,1 2,2 3,1');
                // a copy: neither the array nor the points are shared
                assert.notEqual(polygon.points, source.points);
                assert.notEqual(polygon.points[0], source.points[0]);
                polygon.points[0].x = 100;
                polygon.points.pop();
                assert.equal(source.serialize(), '1,1 2,2 3,1');
            });

            // without `new`
            assert.equal(g.Polygon(new g.Polyline(['1 1', '2 2'])).serialize(), '1,1 2,2');
            // an empty one
            assert.equal(new g.Polygon(new g.Polyline()).points.length, 0);
            assert.equal(new g.Polygon(new g.Polygon()).points.length, 0);
        });

        QUnit.test('a polygon created from an open polyline is closed', function(assert) {

            const polyline = new g.Polyline(['0 0', '10 0', '10 10']);
            const polygon = new g.Polygon(polyline);
            // the line crosses the closing edge of the polygon only
            const line = new g.Line(new g.Point(0, 8), new g.Point(4, 2));
            assert.equal(polyline.intersectionWithLine(line), null);
            assert.equal(polygon.intersectionWithLine(line).length, 1);
        });
    });
});

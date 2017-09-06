'use strict';

QUnit.module('polyline', function() {

    QUnit.module('prototype', function() {

        QUnit.test('convex hull', function(assert) {

            assert.ok(g.Polyline([]) instanceof g.Polyline);
            assert.ok(g.Polyline([g.Point(100,100), g.Point(200,200)]) instanceof g.Polyline);
            assert.equal(g.Polyline([]).convexHull().toString(), "");
            assert.equal(g.Polyline([g.Point(100, 100)]).convexHull().toString(), "100@100");
            assert.equal(g.Polyline([g.Point(100, 100), g.Point(200, 100)]).convexHull().toString(), "100@100,200@100");
            assert.equal(g.Polyline([g.Point(100, 100), g.Point(200, 100), g.Point(300, 100)]).convexHull().toString(), "100@100,300@100");
            assert.equal(g.Polyline([g.Point(200, 100), g.Point(100, 100), g.Point(300, 100)]).convexHull().toString(), "100@100,300@100");
            assert.equal(g.Polyline([g.Point(100, 100), g.Point(200, 100), g.Point(300, 100), g.Point(400, 100)]).convexHull().toString(), "100@100,400@100");
            assert.equal(g.Polyline([g.Point(200, 100), g.Point(100, 100), g.Point(300, 100), g.Point(400, 100)]).convexHull().toString(), "100@100,400@100");
            assert.equal(g.Polyline([g.Point(100, 100), g.Point(100, 500)]).convexHull().toString(), "100@100,100@500");
            assert.equal(g.Polyline([g.Point(100, 100), g.Point(100, 500), g.Point(500, 500)]).convexHull().toString(), "100@100,500@500,100@500");
            assert.equal(g.Polyline([g.Point(100, 100), g.Point(100, 500), g.Point(300, 300), g.Point(500, 500), g.Point(500, 100)]).convexHull().toString(), "100@100,500@100,500@500,100@500");
            assert.equal(g.Polyline([g.Point(100, 100), g.Point(200, 100), g.Point(300, 200), g.Point(300, 200), g.Point(300, 300)]).convexHull().toString(), "100@100,200@100,300@200,300@300");
            assert.equal(g.Polyline([g.Point(300, 200), g.Point(300, 200), g.Point(300, 300), g.Point(100, 100), g.Point(200, 100)]).convexHull().toString(), "300@200,300@300,100@100,200@100");
            assert.equal(g.Polyline([g.Point(480, 80), g.Point(520, 80), g.Point(520, 120), g.Point(480, 120), g.Point(380, 80), g.Point(420, 80), g.Point(420,120), g.Point(380, 120), g.Point(280, 80), g.Point(320, 80), g.Point(320,120), g.Point(280,120), g.Point(180, 80), g.Point(220, 80), g.Point(220, 120), g.Point(180, 120), g.Point(80, 80), g.Point(120, 80), g.Point(120, 120), g.Point(80, 120)]).convexHull().toString(), "520@80,520@120,80@120,80@80");
            assert.equal(g.Polyline([g.Point(180, 80), g.Point(220, 80), g.Point(220, 120), g.Point(180, 120), g.Point(180, 280), g.Point(220, 280), g.Point(220,320), g.Point(180, 320), g.Point(180, 380), g.Point(220, 380), g.Point(220,420), g.Point(180,420), g.Point(180, 180), g.Point(220, 180), g.Point(220, 220), g.Point(180, 220), g.Point(80, 380), g.Point(120, 380), g.Point(120, 420), g.Point(80, 420)]).convexHull().toString(), "180@80,220@80,220@420,80@420,80@380");
            assert.equal(g.Polyline([g.Point(80, 80), g.Point(120, 80), g.Point(120, 120), g.Point(80, 120), g.Point(180, 80), g.Point(220, 80), g.Point(220, 120), g.Point(180, 120), g.Point(180, 280), g.Point(220, 280), g.Point(220,320), g.Point(180, 320), g.Point(180, 380), g.Point(220, 380), g.Point(220, 420), g.Point(180, 420), g.Point(180, 180), g.Point(220, 180), g.Point(220, 220), g.Point(180, 220), g.Point(80, 380), g.Point(120, 380), g.Point(120, 420), g.Point(80, 420)]).convexHull().toString(), "80@80,220@80,220@420,80@420");
            assert.equal(g.Polyline([g.Point(280, 280), g.Point(320, 280), g.Point(320, 320), g.Point(280, 320), g.Point(180, 280), g.Point(220, 280), g.Point(220, 320), g.Point(180, 320), g.Point(80, 180), g.Point(120, 180), g.Point(120, 220), g.Point(80, 220), g.Point(180, 80), g.Point(220, 80), g.Point(220, 120), g.Point(180, 120), g.Point(280, 80), g.Point(320, 80), g.Point(320, 120), g.Point(280, 120), g.Point(80, 80), g.Point(120, 80), g.Point(120, 120), g.Point(80, 120), g.Point(380, 80), g.Point(420, 80), g.Point(420, 120), g.Point(380, 120)]).convexHull().toString(), "320@320,180@320,80@220,80@80,420@80,420@120");
        
        });

    });

});

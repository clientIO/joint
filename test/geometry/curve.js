'use strict';

QUnit.module('curve', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Curve object', function(assert) {

            var curve = g.Curve('10 10', '10 40', '50 40', '50 10');
            assert.ok(curve, 'returns instance of g.Curve');
            assert.ok(typeof curve.start !== 'undefined', 'has "start" property');
            assert.ok(typeof curve.controlPoint1 !== 'undefined', 'has "controlPoint1" property');
            assert.ok(typeof curve.controlPoint2 !== 'undefined', 'has "controlPoint2" property');
            assert.ok(typeof curve.end !== 'undefined', 'has "end" property');
            assert.equal(curve.start.x, 10, 'start.x is correct');
            assert.equal(curve.start.y, 10, 'start.y is correct');
            assert.equal(curve.controlPoint1.x, 10, 'controlPoint1.x is correct');
            assert.equal(curve.controlPoint1.y, 40, 'controlPoint1.y is correct');
            assert.equal(curve.controlPoint2.x, 50, 'controlPoint2.x is correct');
            assert.equal(curve.controlPoint2.y, 40, 'controlPoint2.y is correct');
            assert.equal(curve.end.x, 50, 'end.x is correct');
            assert.equal(curve.end.y, 10, 'end.y is correct');

            var curve2 = g.Curve(curve);
            assert.ok(curve2, 'returns instance of g.Curve');
            assert.ok(typeof curve2.start !== 'undefined', 'has "start" property');
            assert.ok(typeof curve2.controlPoint1 !== 'undefined', 'has "controlPoint1" property');
            assert.ok(typeof curve2.controlPoint2 !== 'undefined', 'has "controlPoint2" property');
            assert.ok(typeof curve2.end !== 'undefined', 'has "end" property');
            assert.notOk(curve === curve2);
            assert.equal(curve.toString(), curve2.toString());
            assert.ok(curve.equals(curve2));
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').bbox() instanceof g.Rect);
            });

            QUnit.test('should return the curve\'s bounding box', function(assert) {

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').bbox().toString(), '10@10 50@32.5');
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0, g.Point('10 10')) instanceof g.Curve);

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1, g.Point('10 10')) instanceof g.Curve);

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0, g.Point('10 10')) instanceof g.Curve);

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1, g.Point('10 10')) instanceof g.Curve);

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10, g.Point('0 0')) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10, g.Point('10 10')) instanceof g.Curve);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0).toString(), g.Curve('0 0', '0 0', '0 0', '0 0').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0, g.Point('0 0')).toString(), g.Curve('0 0', '0 0', '0 0', '0 0').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 0, g.Point('10 10')).toString(), g.Curve('10 10', '10 10', '10 10', '10 10').toString());

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1).toString(), g.Curve('0 10', '0 40', '0 40', '0 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1, g.Point('0 0')).toString(), g.Curve('0 10', '0 40', '0 40', '0 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(0, 1, g.Point('10 10')).toString(), g.Curve('10 10', '10 40', '10 40', '10 10').toString());

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0).toString(), g.Curve('10 0', '10 0', '50 0', '50 0').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0, g.Point('0 0')).toString(), g.Curve('10 0', '10 0', '50 0', '50 0').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 0, g.Point('10 10')).toString(), g.Curve('10 10', '10 10', '50 10', '50 10').toString());

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1).toString(), g.Curve('10 10', '10 40', '50 40', '50 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1, g.Point('0 0')).toString(), g.Curve('10 10', '10 40', '50 40', '50 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(1, 1, g.Point('10 10')).toString(), g.Curve('10 10', '10 40', '50 40', '50 10').toString());

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10).toString(), g.Curve('100 100', '100 400', '500 400', '500 100').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10, g.Point('0 0')).toString(), g.Curve('100 100', '100 400', '500 400', '500 100').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').scale(10, 10, g.Point('10 10')).toString(), g.Curve('10 10', '10 310', '410 310', '410 10').toString());
            });
        });

        QUnit.module('translate()', function() {

            QUnit.test('sanity', function(assert) {

                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').translate(0, 0) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').translate(0, 10) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').translate(10, 0) instanceof g.Curve);
                assert.ok(g.Curve('10 10', '10 40', '50 40', '50 10').translate(10, 10) instanceof g.Curve);
            });

            QUnit.test('should return a translated version of self', function(assert) {

                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').translate(0, 0).toString(), g.Curve('10 10', '10 40', '50 40', '50 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').translate(0, 10).toString(), g.Curve('10 20', '10 50', '50 50', '50 20').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').translate(10, 0).toString(), g.Curve('20 10', '20 40', '60 40', '60 10').toString());
                assert.equal(g.Curve('10 10', '10 40', '50 40', '50 10').translate(10, 10).toString(), g.Curve('20 20', '20 50', '60 50', '60 20').toString());
            });
        });

        QUnit.module('toString()', function() {

        });
    });
});

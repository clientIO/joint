'use strict';

QUnit.module('toDeg(radians)', function() {

    QUnit.test('should be a function', function(assert) {

        assert.equal(typeof g.toDeg, 'function');
    });

    QUnit.test('should correctly convert the angle (in radians) to degrees', function(assert) {

        var values = [
            // Values have a maximum precision of 3 decimal places.
            { radians: 1, degrees: 57.296 },
            { radians: 2, degrees: 114.592 },
            { radians: 3, degrees: 171.887 },
            { radians: 3.2, degrees: 183.346 },
            { radians: 5, degrees: 286.479 }
        ];

        var degrees, radians;

        for (var i = 0; i < values.length; i++) {
            degrees = values[i].degrees;
            radians = values[i].radians;
            assert.equal(g.toDeg(radians).toFixed(3), degrees, 'radians = ' + radians);
        }
    });
});

'use strict';

QUnit.module('toRad(degrees)', function() {

    QUnit.test('should be a function', function(assert) {

        assert.equal(typeof g.toRad, 'function');
    });

    QUnit.test('should correctly convert the angle (in degrees) to radians', function(assert) {

        var values = [
            // Values have a maximum precision of 3 decimal places.
            { radians: 0.785, degrees: 45 },
            { radians: 1.047, degrees: 60 },
            { radians: 1.571, degrees: 90 },
            { radians: 2.793, degrees: 160 },
            { radians: 4.712, degrees: 270 }
        ];

        var degrees, radians;

        for (var i = 0; i < values.length; i++) {
            degrees = values[i].degrees;
            radians = values[i].radians;
            assert.equal(g.toRad(degrees).toFixed(3), radians, 'degrees = ' + degrees);
        }
    });
});

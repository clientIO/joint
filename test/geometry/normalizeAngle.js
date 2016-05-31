'use strict';

QUnit.module('normalizeAngle(angle)', function() {

    QUnit.test('returns normalized value of angle (within the range [0,360] degrees)', function(assert) {

        var normalizedAngles = [
            { angle: 720, normalized: 0 },
            { angle: 180, normalized: 180 },
            { angle: 370, normalized: 10 },
            { angle: 1080, normalized: 0 },
            { angle: 1085, normalized: 5 },
            { angle: 0, normalized: 0 },
            { angle: 360, normalized: 0 },
            { angle: -360, normalized: 360 },
            { angle: -180, normalized: 180 },
            { angle: -90, normalized: 270 }
        ];

        var angle, normalized;

        for (var i = 0; i < normalizedAngles.length; i++) {
            angle = normalizedAngles[i].angle;
            normalized = normalizedAngles[i].normalized;
            assert.equal(g.normalizeAngle(angle), normalized, 'angle = ' + angle);
        }
    });
});

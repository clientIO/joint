'use strict';

QUnit.module('random(min, max, generator)', function() {

    QUnit.test('returns an integer from the interval [min, max]', function(assert) {

        for (let i = 0; i < 100; i++) {
            const value = g.random(1, 6);
            assert.ok(Number.isInteger(value) && value >= 1 && value <= 6, 'value = ' + value);
        }
    });

    QUnit.test('uses the generator', function(assert) {

        const min = function() { return 0; };
        const max = function() { return 0.9999999; };
        assert.equal(g.random(1, 6, min), 1);
        assert.equal(g.random(1, 6, max), 6);
        assert.equal(g.random(6, 1, min), 1, 'switched min and max');
        assert.equal(g.random(5, undefined, max), 5, 'max only');
        assert.equal(g.random(undefined, undefined, max), 1, 'no interval');
    });

    QUnit.test('takes the generator as the last argument', function(assert) {

        const max = function() { return 0.9999999; };
        assert.equal(g.random(max), 1, 'no interval');
        assert.equal(g.random(5, max), 5, 'max only');
        assert.equal(g.random(1, 6, max), 6, 'min and max');
    });

    QUnit.test('returns the same sequence for generators with the same seed', function(assert) {

        const a = g.seededGenerator(3);
        const b = g.seededGenerator(3);
        for (let i = 0; i < 20; i++) {
            assert.equal(g.random(0, 100, a), g.random(0, 100, b));
        }
    });
});

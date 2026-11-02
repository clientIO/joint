'use strict';

QUnit.module('seededGenerator(seed)', function() {

    QUnit.test('returns the known sequence of a seed', function(assert) {

        const generator = g.seededGenerator(42);
        const expected = [
            0.6011037519201636,
            0.44829055899754167,
            0.8524657934904099,
            0.6697340414393693,
            0.17481389874592423
        ];
        expected.forEach(function(value) {
            assert.equal(generator(), value);
        });
    });

    QUnit.test('returns the same sequence for the same seed', function(assert) {

        const a = g.seededGenerator(7);
        const b = g.seededGenerator(7);
        const c = g.seededGenerator(8);
        const sequenceA = [];
        const sequenceB = [];
        const sequenceC = [];
        for (let i = 0; i < 100; i++) {
            sequenceA.push(a());
            sequenceB.push(b());
            sequenceC.push(c());
        }
        assert.deepEqual(sequenceA, sequenceB);
        assert.notDeepEqual(sequenceA, sequenceC);
    });

    QUnit.test('returns numbers from the interval [0, 1)', function(assert) {

        const generator = g.seededGenerator(0);
        let inRange = true;
        for (let i = 0; i < 10000; i++) {
            const value = generator();
            if (value < 0 || value >= 1) inRange = false;
        }
        assert.ok(inRange);
    });

    QUnit.test('converts the seed to an unsigned 32-bit integer', function(assert) {

        assert.equal(g.seededGenerator(1.5)(), g.seededGenerator(1)());
        assert.equal(g.seededGenerator(-1)(), g.seededGenerator(4294967295)());
        assert.equal(g.seededGenerator(4294967296)(), g.seededGenerator(0)());
        assert.equal(g.seededGenerator(NaN)(), g.seededGenerator(0)());
        assert.equal(g.seededGenerator(Infinity)(), g.seededGenerator(0)());
    });
});

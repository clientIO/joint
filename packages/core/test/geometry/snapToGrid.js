'use strict';

QUnit.module('snapToGrid(value, gridSize)', function() {

    QUnit.test('returns value rounded to the nearest increment of the given grid size', function(assert) {

        var expected = [
            { value: 9, gridSize: 10, newValue: 10 },
            { value: 17, gridSize: 10, newValue: 20 },
            { value: 4, gridSize: 10, newValue: 0 },
            { value: 3, gridSize: 2, newValue: 4 }
        ];

        var value, gridSize, newValue;

        for (var i = 0; i < expected.length; i++) {
            value = expected[i].value;
            gridSize = expected[i].gridSize;
            newValue = expected[i].newValue;
            assert.equal(g.snapToGrid(value, gridSize), newValue, 'value = ' + value + ', gridSize = ' + gridSize);
        }
    });
});

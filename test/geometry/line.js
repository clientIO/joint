'use strict';

QUnit.module('line', function() {

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Line object', function(assert) {

            var line = g.line(g.point(), g.point(3, 8));
            assert.ok(line, 'returns instance of g.line');
            assert.ok(typeof line.start !== 'undefined', 'has "start" property');
            assert.ok(typeof line.end !== 'undefined', 'has "end" property');
            assert.equal(line.start.x, 0, 'start.x is correct');
            assert.equal(line.start.y, 0, 'start.y is correct');
            assert.equal(line.end.x, 3, 'end.x is correct');
            assert.equal(line.end.y, 8, 'end.y is correct');
            assert.ok(g.line() instanceof g.line, 'no arguments provided');
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('bearing()', function() {

            QUnit.test('should return the line\'s bearing', function(assert) {

                assert.equal(g.line('0 0', '0 -10').bearing(), 'S', 'south bearing');
                assert.equal(g.line('0 0', '0 10').bearing(), 'N', 'north bearing');
                assert.equal(g.line('0 0', '10 10').bearing(), 'NE', 'north east bearing');
                assert.equal(g.line('0 0', '-10 10').bearing(), 'NW', 'north west bearing');
                assert.equal(g.line('0 0', '10 0').bearing(), 'E', 'east bearing');
                assert.equal(g.line('0 0', '-10 0').bearing(), 'W', 'west bearing');
                assert.equal(g.line('0 0', '-10 -10').bearing(), 'SW', 'south west bearing');
                assert.equal(g.line('0 0', '10 -10').bearing(), 'SE', 'south east bearing');
            });
        });

        QUnit.module('clone()', function() {

        });

        QUnit.module('intersection(line)', function() {

        });

        QUnit.module('length()', function() {

        });

        QUnit.module('midpoint()', function() {

        });

        QUnit.module('pointAt(t)', function() {

        });

        QUnit.module('pointOffset(point)', function() {

        });

        QUnit.module('squaredLength()', function() {

        });

        QUnit.module('toString()', function() {

        });
    });
});

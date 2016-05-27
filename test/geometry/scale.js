'use strict';

QUnit.module('scale', function() {

    QUnit.module('linear(domain, range, value)', function() {

        QUnit.test('returns the value from the domain interval scaled to the range interval', function(assert) {

            assert.equal(g.scale.linear([.5, 1], [50, 150], .75), 100, 'linear scale up');
            assert.equal(g.scale.linear([50, 150], [.5, 1], 100), .75, 'linear scale down');
        });
    });
});

require.config({
    baseUrl: '../../',
    paths: {
        'qunit': 'node_modules/qunitjs/qunit/qunit'
    }
});

require(['qunit'], function(QUnit) {

    QUnit.start();
    QUnit.module('RequireJS');

    (function() {

        var buildFiles = [
            'build/geometry',
            'build/geometry.min'
        ];

        while (buildFiles.length > 0) {

            (function(buildFile) {

                QUnit.test('sanity checks for build file: "' + buildFile + '"', function(assert) {

                    var done = assert.async();

                    require([buildFile], function(g) {

                        assert.ok(typeof g !== 'undefined', 'Should be able to require g module');
                        assert.ok(typeof g.rect === 'function', 'g.rect() method should exist');
                        assert.ok(typeof g.point === 'function', 'g.point() method should exist');

                        done();
                    });
                });
            })( buildFiles.pop() );
        }

    })();
});

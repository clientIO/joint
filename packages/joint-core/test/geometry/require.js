require.config({
    baseUrl: '../../'
});

// The global QUnit (see `requirejs.html`), as a module.
// eslint-disable-next-line no-undef
define('qunit', [], function() {
    return window.QUnit;
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

require.config({
    baseUrl: '../../',
    paths: {
        'qunit': 'node_modules/qunitjs/qunit/qunit',

        // Dependencies for Joint:
        'jquery': 'node_modules/jquery/dist/jquery',
        'backbone': 'node_modules/backbone/backbone',
        'lodash': 'node_modules/lodash/index'
    },
    map: {
        '*': {
            // Backbone requires underscore. This forces requireJS to load lodash instead:
            'underscore': 'lodash'
        }
    }
});

require(['qunit'], function(QUnit) {

    QUnit.start();
    QUnit.module('RequireJS');

    var buildFiles = [
        'build/joint.core',
        'build/joint.core.min',
        'build/joint',
        'build/joint.min'
    ];

    QUnit.test('require joint build files', function(assert) {

        var done = assert.async();

        require(buildFiles, function() {

            var modules = Array.prototype.slice.call(arguments);
            var buildFile, joint;

            assert.ok(buildFiles.length === modules.length, 'expected ' + buildFiles.length + ' build file(s) to be loaded');

            for (var i = 0; i < modules.length; i++) {

                buildFile = buildFiles[i];
                joint = modules[i];

                QUnit.test('sanity checks for build file: "' + buildFile + '"', function(assert) {

                    assert.ok(typeof joint !== 'undefined', 'Should be able to require joint module');
                    assert.ok(typeof joint.dia === 'object', 'Joint should have "dia" object');
                    assert.ok(typeof joint.dia.Graph === 'function', 'joint.dia.Graph should be a function');
                    assert.ok(typeof joint.dia.Paper === 'function', 'joint.dia.Paper should be a function');
                });
            }

            done();
        });
    });
});

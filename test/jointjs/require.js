require.config({
    baseUrl: '../../',
    paths: {
        // Dependencies for Joint:
        'jquery': 'lib/jquery/jquery',
        'backbone': 'lib/backbone/backbone',
        'lodash': 'lib/lodash/lodash'
    },
    map: {
        '*': {
            // Backbone requires underscore. This forces requireJS to load lodash instead:
            'underscore': 'lodash'
        }
    }
});

module('RequireJS');

(function() {

    var buildFiles = [
        'dist/joint.core',
        'dist/joint.core.min',
        'dist/joint',
        'dist/joint.min'
    ];

    test('require joint build files', function(assert) {

        var done = assert.async();

        require(buildFiles, function() {

            var modules = Array.prototype.slice.call(arguments);
            var buildFile, joint;

            assert.ok(buildFiles.length === modules.length, 'expected ' + buildFiles.length + ' build file(s) to be loaded');

            for (var i = 0; i < modules.length; i++) {

                buildFile = buildFiles[i];
                joint = modules[i];

                test('sanity checks for build file: "' + buildFile + '"', function(assert) {

                    assert.ok(typeof joint !== 'undefined', 'Should be able to require joint module');
                    assert.ok(typeof joint.dia === 'object', 'Joint should have "dia" object');
                    assert.ok(typeof joint.dia.Graph === 'function', 'joint.dia.Graph should be a function');
                    assert.ok(typeof joint.dia.Paper === 'function', 'joint.dia.Paper should be a function');
                });
            }

            done();
        });
    });

})();

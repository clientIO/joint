require.config({
    baseUrl: '../../',
    paths: {
        // Dependencies for Joint:
        'jquery': 'lib/jquery',
        'backbone': 'lib/backbone',
        'lodash': 'lib/lodash',
        'g': 'src/geometry',
        'V': 'src/vectorizer'
    },
    map: {
        '*': {
            // Backbone requires underscore. This forces requireJS to load lodash instead:
            'underscore': 'lodash'
        }
    }
});

(function() {

    var buildFiles = [
        'dist/joint.all.clean.build',
        'dist/joint.all.clean.build.min',
        'dist/joint.clean.build',
        'dist/joint.clean.build.min'
    ];

    while (buildFiles.length > 0) {

        (function(buildFile) {

            test('sanity checks for distribution file: "' + buildFile + '"', function(assert) {

                var done = assert.async();

                require([buildFile], function(joint) {

                    assert.ok(typeof joint !== 'undefined', 'Should be able to require joint module');
                    assert.ok(typeof joint.dia === 'object', 'Joint should have "dia" object');
                    done();
                });
            });
        })( buildFiles.pop() );
    }

})();

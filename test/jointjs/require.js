require.config({
    baseUrl: '../../',
    paths: {
        // Dependencies for Joint:
        'jquery': 'lib/jquery/dist/jquery',
        'backbone': 'lib/backbone/backbone',
        'lodash': 'lib/lodash/dist/lodash',
        'g': 'src/geometry',
        'V': 'src/vectorizer',
        'Handlebars': 'lib/handlebars/handlebars'
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

    test('verify that geometry library is accessible through vectorizer', function(assert) {

        var done = assert.async();

        require(['V'], function(V) {

            var el = V('<g><rect/><text/></g>');
            var errorMessage = '';

            try {
                // Call translateCenterToPoint which depends on the geometry library.  If this 
                // call throws an error then the geometry library was not properly included 
                // by require js.
                el.translateCenterToPoint({ x: 5, y: 5 });                
            }
            catch (ex) {
                errorMessage = ex.toString();
            }

            assert.strictEqual(errorMessage, '', 'Should not encounter an unexpected error');
            done();
        });
    });

})();

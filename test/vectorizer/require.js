require.config({
    baseUrl: '../../',
    paths: {
        // Dependencies for Vectorizer:
        'g': 'src/geometry'
    }
});

module('RequireJS');

(function() {

    var buildFiles = [
        'dist/vectorizer',
        'dist/vectorizer.min'
    ];

    while (buildFiles.length > 0) {

        (function(buildFile) {

            test('sanity checks for distribution file: "' + buildFile + '"', function(assert) {

                var done = assert.async();

                require([buildFile], function(V) {

                    assert.ok(typeof V !== 'undefined', 'Should be able to require Vectorizer module');
                    assert.ok(typeof V === 'function', 'V should be a function');

                    var vRect = V('rect');

                    assert.ok(V.isVElement(vRect), 'Constructor produces a vectorizer element, when a string was provided.');
                    assert.ok(vRect.node instanceof SVGElement, 'The vectorizer element has the attribute "node" that references to an SVGElement.');
                    assert.ok(V.isVElement(V(vRect)), 'Constructor produces a vectorizer element, when a vectorizer element was provided.');
                    assert.ok(V(vRect).node instanceof SVGElement, 'The vectorizer element has again the attribute "node" that references to an SVGElement.');
                    done();
                });
            });
        })( buildFiles.pop() );
    }

})();

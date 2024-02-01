require.config({
    baseUrl: '../..',
    paths: {
        'qunit': 'node_modules/qunit/qunit/qunit',
        '@dagrejs/graphlib': 'node_modules/@dagrejs/graphlib/dist/graphlib',
        '@dagrejs/dagre': 'node_modules/@dagrejs/dagre/dist/dagre',
        '@joint/core': 'node_modules/@joint/core/build/joint'
    }
});

require(['qunit'], function(QUnit) {

    QUnit.start();
    QUnit.module('RequireJS');

    QUnit.test('require DirectedGraph module', function(assert) {

        assert.expect(0);
        const done = assert.async();

        require(['dist/DirectedGraph'], function(m) {

            QUnit.test('sanity checks for dist/DirectedGraph.js', function(assert) {

                assert.ok(typeof m !== 'undefined', 'Should be able to require DirectedGraph module');
                assert.ok(typeof m.DirectedGraph === 'object', 'DirectedGraph should be an object');
                assert.ok(typeof m.DirectedGraph.layout === 'function', 'DirectedGraph.layout should be a function');
                assert.ok(typeof m.DirectedGraph.toGraphLib === 'function', 'DirectedGraph.toGraphLib should be a function');
                assert.ok(typeof m.DirectedGraph.fromGraphLib === 'function', 'DirectedGraph.fromGraphLib should be a function');
            });

            done();
        });
    });
});

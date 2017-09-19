QUnit.module('Browserify', function() {

    QUnit.test('sanity checks for browserify bundle file', function(assert) {

        assert.ok(typeof joint !== 'undefined', 'Joint object should be defined');
        assert.ok(typeof joint.dia === 'object', 'Joint object should have "dia" object');
        assert.ok(typeof joint.dia.Graph === 'function', 'joint.dia.Graph should be a function');
        assert.ok(typeof joint.dia.Paper === 'function', 'joint.dia.Paper should be a function');
    });
});


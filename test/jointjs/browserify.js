module('Browserify');

test('sanity checks for browserify bundle file', function(assert) {

    assert.ok(typeof joint !== 'undefined', 'Joint object should be defined');
    assert.ok(typeof joint.dia === 'object', 'Joint object should have "dia" object');
});
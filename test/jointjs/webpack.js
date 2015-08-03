module('Webpack');

test('sanity checks for webpack bundle file', function(assert) {

    assert.ok(typeof joint !== 'undefined', 'Joint object should be defined');
    assert.ok(typeof joint.dia === 'object', 'Joint object should have "dia" object');
    assert.ok(new joint.dia.Paper() instanceof Backbone.View, 'A new dia.Paper object can be initialized');
});

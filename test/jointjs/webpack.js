QUnit.module('Webpack', function() {

    QUnit.test('sanity checks for webpack bundle file', function(assert) {

        assert.ok(typeof joint !== 'undefined', 'Joint object should be defined');
        assert.ok(typeof joint.dia === 'object', 'Joint object should have "dia" object');

        var paper = new joint.dia.Paper();

        assert.ok(paper instanceof Backbone.View, 'A new dia.Paper object can be initialized');

        paper.remove();
    });
});


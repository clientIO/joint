QUnit.module('joint.dia.Paper', function(hooks) {

    var paper;
    var graph;

    hooks.beforeEach(function() {

        var $fixture = $('<div>', { id: 'qunit-fixture' }).appendTo(document.body);
        var $paper = $('<div/>').appendTo($fixture);

        graph = new joint.dia.Graph;
        paper = new joint.dia.Paper({
            el: $paper,
            model: graph,
            async: false
        });
    });

    hooks.afterEach(function() {

        paper.remove();
        graph = null;
        paper = null;
    });

    QUnit.module('API: freeze(), unfreeze(), isFrozen()', function() {

        QUnit.test('sanity', function(assert) {
            assert.equal(paper.viewport.childNodes.length, 0);
            assert.notOk(paper.isFrozen());
            paper.freeze();
            assert.ok(paper.isFrozen());
            var rect = new joint.shapes.standard.Rectangle();
            rect.addTo(graph);
            assert.ok(paper.isFrozen());
            assert.equal(paper.viewport.childNodes.length, 0);
            paper.unfreeze();
            assert.notOk(paper.isFrozen());
            assert.equal(paper.viewport.childNodes.length, 1);
        });

        QUnit.module('option: key', function() {

            QUnit.test('keep unfrozen', function(assert) {
                assert.notOk(paper.isFrozen());
                paper.freeze({ key: 'test' });
                assert.ok(paper.isFrozen());
                paper.unfreeze({ key: 'test' });
                assert.notOk(paper.isFrozen());
            });

            QUnit.test('keep frozen', function(assert) {
                paper.freeze();
                assert.ok(paper.isFrozen());
                paper.freeze({ key: 'test' });
                assert.ok(paper.isFrozen());
                paper.unfreeze({ key: 'test' });
                assert.ok(paper.isFrozen());
            });

            QUnit.test('keep unfrozen - nested', function(assert) {
                assert.notOk(paper.isFrozen());
                // UNFROZEN
                paper.freeze({ key: 'test1' });
                assert.ok(paper.isFrozen());
                // < nested
                paper.freeze({ key: 'test2' });
                assert.ok(paper.isFrozen());
                paper.unfreeze({ key: 'test2' });
                assert.ok(paper.isFrozen());
                // nested >
                paper.unfreeze({ key: 'test1' });
                assert.notOk(paper.isFrozen());
            });

            QUnit.test('keep frozen - nested', function(assert) {
                paper.freeze();
                assert.ok(paper.isFrozen());
                // FROZEN
                paper.freeze({ key: 'test1' });
                assert.ok(paper.isFrozen());
                // < nested
                paper.freeze({ key: 'test2' });
                assert.ok(paper.isFrozen());
                paper.unfreeze({ key: 'test2' });
                assert.ok(paper.isFrozen());
                // nested >
                paper.unfreeze({ key: 'test1' });
                assert.ok(paper.isFrozen());
            });
        });


    });

});

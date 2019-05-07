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

    // TODO:
    // elements and links
    // onViewUpdate
    // onViewPostponed

    QUnit.module('options', function() {

        QUnit.module('viewport', function() {
            QUnit.test('sanity', function(assert) {
                var visible = true;
                var viewportSpy = sinon.spy(function() { return visible; });
                paper.options.viewport = viewportSpy;
                var rect = new joint.shapes.standard.Rectangle();
                rect.addTo(graph);
                var rectView = rect.findView(paper);
                assert.ok(viewportSpy.calledOnce);
                // TODO: is false ok?
                assert.ok(viewportSpy.calledWithExactly(rectView, false, paper));
                assert.ok(viewportSpy.calledOn(paper));
                assert.equal(rectView.el.parentNode, paper.viewport);
                viewportSpy.resetHistory();
                visible = false;
                rect.translate(10, 0);
                assert.ok(viewportSpy.calledOnce);
                assert.ok(viewportSpy.calledWithExactly(rectView, false, paper));
                viewportSpy.resetHistory();
                rect.translate(10, 0);
                assert.ok(viewportSpy.calledOnce);
                assert.ok(viewportSpy.calledWithExactly(rectView, true, paper));
                assert.notOk(rectView.el.parentNode);
            });
        });

        QUnit.module('onViewUpdate', function() {

            QUnit.test('sanity', function(assert) {
                var onViewUpdateSpy = sinon.spy();
                paper.options.onViewUpdate = onViewUpdateSpy;
                var rect = new joint.shapes.standard.Rectangle();
                rect.addTo(graph, { test1: true });
                var rectView = rect.findView(paper);
                assert.ok(onViewUpdateSpy.calledOnce);
                assert.ok(onViewUpdateSpy.calledWithExactly(rectView, sinon.match.number, sinon.match({ test1: true }), paper));
                assert.ok(onViewUpdateSpy.calledOn(paper));
                onViewUpdateSpy.resetHistory();
                rect.translate(10, 0, { test2: true });
                assert.ok(onViewUpdateSpy.calledOnce);
                assert.ok(onViewUpdateSpy.calledWithExactly(rectView, sinon.match.number, sinon.match({ test2: true }), paper));
            });

            QUnit.test('update connected links', function(assert) {

                assert.ok(true);
            });
        });

        QUnit.module('onViewPostponed', function() {

            QUnit.test('sanity', function(assert) {
                var leftoverFlag = 1;
                var onViewPostponedSpy = sinon.spy(function() {
                    leftoverFlag = 0;
                    return true;
                });
                paper.options.onViewPostponed = onViewPostponedSpy;
                paper.options.elementView = joint.dia.ElementView.extend({
                    confirmUpdate: function() {
                        return leftoverFlag;
                    }
                });
                var rect = new joint.shapes.standard.Rectangle();
                rect.addTo(graph);
                var rectView = rect.findView(paper);
                assert.ok(onViewPostponedSpy.calledOnce);
                assert.ok(onViewPostponedSpy.calledWithExactly(rectView, sinon.match.number, paper));
                assert.ok(onViewPostponedSpy.calledOn(paper));
                onViewPostponedSpy.resetHistory();
                rect.translate(10, 0);
                assert.ok(onViewPostponedSpy.notCalled);
            });

            QUnit.test('force postponed view update', function(assert) {
                paper.options.viewport = function(view) { return view.model.isLink(); };
                var onViewPostponedSpy = sinon.spy(paper.options, 'onViewPostponed');
                var rect1 = new joint.shapes.standard.Rectangle();
                var rect2 = new joint.shapes.standard.Rectangle();
                var link = new joint.shapes.standard.Link();
                link.source(rect1);
                link.target(rect2);
                paper.freeze();
                rect1.addTo(graph);
                rect2.addTo(graph);
                link.addTo(graph);
                paper.unfreeze();
                assert.ok(onViewPostponedSpy.calledOnce);
                assert.ok(onViewPostponedSpy.calledWithExactly(link.findView(paper), sinon.match.number, paper));
                assert.equal(paper.viewport.childNodes.length, 3);
            });
        });
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

        QUnit.test('add+remove+change+add while frozen', function(assert) {
            paper.freeze();
            var rect = new joint.shapes.standard.Rectangle();
            rect.resize(50, 50);
            rect.position(0, 0);
            rect.addTo(graph);
            rect.remove();
            rect.resize(101, 102);
            rect.translate(201, 202);
            rect.addTo(graph);
            paper.unfreeze();
            assert.equal(paper.viewport.childNodes.length, 1);
            assert.checkBbox(paper, rect, 201, 202, 101, 102);
            rect.remove();
            assert.equal(paper.viewport.childNodes.length, 0);
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

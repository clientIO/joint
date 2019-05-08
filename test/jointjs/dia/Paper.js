QUnit.module('joint.dia.Paper', function(hooks) {

    var paper;
    var paperEl;
    var graph;

    function cellNodesCount(paper) {
        return V(paper.viewport).children().length;
    }

    hooks.beforeEach(function() {

        var fixtureEl = document.getElementById('qunit-fixture') || document.createElement('div');
        paperEl = document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        fixtureEl.appendChild(paperEl);
        document.body.appendChild(fixtureEl);

        graph = new joint.dia.Graph;
    });

    hooks.afterEach(function() {
        if (paper) paper.remove();
        graph = null;
        paper = null;
        paperEl = null;
    });

    QUnit.module('async = FALSE', function(hooks) {

        var Paper = joint.dia.Paper;

        hooks.beforeEach(function() {
            paper = new Paper({
                el: paperEl,
                model: graph,
                async: false
            });
        });

        QUnit.module('getContentArea() > options > useModelGeometry', function() {

            function addCells() {
                var rect1 = new joint.shapes.standard.Rectangle();
                var rect2 = new joint.shapes.standard.Rectangle();
                var link = new joint.shapes.standard.Link();
                rect1.resize(100, 100);
                rect2.resize(100, 100);
                rect1.position(-100, -100);
                rect2.position(100, 100);
                link.source(rect1);
                link.target(rect2);
                link.vertices([{ x: 0, y: 300 }]);
                rect1.addTo(graph);
                rect2.addTo(graph);
                link.addTo(graph);
            }

            QUnit.test('useModelGeometry = FALSE', function(assert) {
                var area = paper.getContentArea();
                assert.ok(area instanceof g.Rect);
                assert.deepEqual(area.toJSON(), { x: 0, y: 0, width: 0, height: 0 });
                paper.freeze();
                addCells();
                area = paper.getContentArea();
                assert.ok(area instanceof g.Rect);
                assert.deepEqual(area.toJSON(), { x: 0, y: 0, width: 0, height: 0 });
                paper.unfreeze();
                area = paper.getContentArea();
                assert.deepEqual(area.toJSON(), { x: -100, y: -100, width: 300, height: 400 });
            });

            QUnit.test('useModelGeometry = TRUE', function(assert) {
                var area = paper.getContentArea({ useModelGeometry: true });
                assert.ok(area instanceof g.Rect);
                assert.deepEqual(area.toJSON(), { x: 0, y: 0, width: 0, height: 0 });
                paper.freeze();
                addCells();
                area = paper.getContentArea({ useModelGeometry: true });
                assert.ok(area instanceof g.Rect);
                assert.deepEqual(area.toJSON(), { x: -100, y: -100, width: 300, height: 400 });
                paper.unfreeze();
                area = paper.getContentArea({ useModelGeometry: true });
                assert.deepEqual(area.toJSON(), { x: -100, y: -100, width: 300, height: 400 });
            });
        });

        Object.keys(Paper.sorting).forEach(function(sortingType) {

            QUnit.module('sorting = ' + sortingType, function(hooks) {

                hooks.beforeEach(function() {
                    paper.options.sorting = Paper.sorting[sortingType];
                });

                QUnit.module('options', function() {

                    QUnit.module('sorting', function() {

                        QUnit.test('sanity', function(assert) {
                            var rect1 = new joint.shapes.standard.Rectangle({ z: 0 });
                            var rect2 = new joint.shapes.standard.Rectangle({ z: 2 });
                            var rect3 = new joint.shapes.standard.Rectangle({ z: 1 });
                            var sortViewsExactSpy = sinon.spy(paper, 'sortViewsExact');
                            graph.resetCells([rect1, rect2, rect3]);
                            var rect1View = rect1.findView(paper);
                            var rect2View = rect2.findView(paper);
                            var rect3View = rect3.findView(paper);
                            assert.equal(rect1View.el.previousElementSibling, null);
                            assert.equal(rect2View.el.previousElementSibling, rect3View.el);
                            assert.equal(rect3View.el.previousElementSibling, rect1View.el);
                            assert.equal(sortViewsExactSpy.callCount, paper.options.sorting === Paper.sorting.EXACT ? 1 : 0);
                            rect3.toFront();
                            assert.equal(sortViewsExactSpy.callCount, paper.options.sorting === Paper.sorting.EXACT ? 2 : 0);
                            if (paper.options.sorting === Paper.sorting.NONE) {
                                assert.equal(rect1View.el.previousElementSibling, null);
                                assert.equal(rect2View.el.previousElementSibling, rect3View.el);
                                assert.equal(rect3View.el.previousElementSibling, rect1View.el);
                            } else {
                                assert.equal(rect1View.el.previousElementSibling, null);
                                assert.equal(rect2View.el.previousElementSibling, rect1View.el);
                                assert.equal(rect3View.el.previousElementSibling, rect2View.el);
                            }
                            sortViewsExactSpy.resetHistory();
                            rect3.translate(10, 10);
                            assert.ok(sortViewsExactSpy.notCalled);
                        });

                        QUnit.test('frozen', function(assert) {
                            paper.freeze();
                            var rect1 = new joint.shapes.standard.Rectangle({ z: 0 });
                            var rect2 = new joint.shapes.standard.Rectangle({ z: 2 });
                            var rect3 = new joint.shapes.standard.Rectangle({ z: 1 });
                            var sortViewsExactSpy = sinon.spy(paper, 'sortViewsExact');
                            graph.resetCells([rect1, rect2, rect3]);
                            var rect1View = rect1.findView(paper);
                            var rect2View = rect2.findView(paper);
                            var rect3View = rect3.findView(paper);
                            rect3.toFront();
                            assert.ok(sortViewsExactSpy.notCalled);
                            paper.unfreeze();
                            assert.equal(sortViewsExactSpy.callCount, paper.options.sorting === Paper.sorting.EXACT ? 1 : 0);
                            if (paper.options.sorting !== Paper.sorting.NONE) {
                                assert.equal(rect1View.el.previousElementSibling, null);
                                assert.equal(rect2View.el.previousElementSibling, rect1View.el);
                                assert.equal(rect3View.el.previousElementSibling, rect2View.el);
                            }
                            sortViewsExactSpy.resetHistory();
                            paper.freeze();
                            rect3.translate(10, 10);
                            paper.unfreeze();
                            assert.ok(sortViewsExactSpy.notCalled);
                        });
                    });

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
                            var rect1 = new joint.shapes.standard.Rectangle();
                            var rect2 = new joint.shapes.standard.Rectangle();
                            var link1 = new joint.shapes.standard.Link();
                            var link2 = new joint.shapes.standard.Link();
                            link1.source(rect1);
                            link1.target(rect2);
                            link2.target(link1);
                            rect1.addTo(graph);
                            rect2.addTo(graph);
                            link1.addTo(graph);
                            link2.addTo(graph);
                            var onViewUpdateSpy = sinon.spy(paper.options, 'onViewUpdate');
                            rect1.translate(10, 0, { test: true });
                            assert.ok(onViewUpdateSpy.calledThrice);
                            assert.ok(onViewUpdateSpy.calledWithExactly(link1.findView(paper), sinon.match.number, sinon.match({ test: true }), paper));
                            assert.ok(onViewUpdateSpy.calledWithExactly(link2.findView(paper), sinon.match.number, sinon.match({ test: true }), paper));
                            assert.ok(onViewUpdateSpy.calledWithExactly(rect1.findView(paper), sinon.match.number, sinon.match({ test: true }), paper));
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
                            link.addTo(graph);
                            rect1.addTo(graph);
                            rect2.addTo(graph);
                            paper.unfreeze();
                            assert.ok(onViewPostponedSpy.calledOnce);
                            assert.ok(onViewPostponedSpy.calledWithExactly(link.findView(paper), sinon.match.number, paper));
                            assert.equal(cellNodesCount(paper), 3);
                        });
                    });
                });

                QUnit.module('prototype', function() {

                    QUnit.module('updateViews()', function() {

                        QUnit.module('options', function() {

                            QUnit.test('batchSize', function(assert) {
                                paper.freeze();
                                var rect1 = new joint.shapes.standard.Rectangle();
                                var rect2 = new joint.shapes.standard.Rectangle();
                                rect1.addTo(graph);
                                rect2.addTo(graph);
                                var res = paper.updateViews({ batchSize: 1 });
                                assert.deepEqual(res, { batches: 2, updated: 2 });
                                assert.equal(cellNodesCount(paper), 2);
                            });

                            QUnit.test('viewport', function(assert) {
                                paper.freeze();
                                var rect1 = new joint.shapes.standard.Rectangle();
                                var rect2 = new joint.shapes.standard.Rectangle();
                                rect1.addTo(graph);
                                rect2.addTo(graph);
                                var viewportSpy = sinon.spy(function() { return true; });
                                var res = paper.updateViews({ viewport: viewportSpy });
                                assert.deepEqual(res, { batches: 1, updated: 2 });
                                assert.equal(cellNodesCount(paper), 2);
                                assert.ok(viewportSpy.calledTwice);
                            });
                        });
                    });

                    QUnit.test('dumpViews()', function(assert) {
                        var rect1 = new joint.shapes.standard.Rectangle();
                        var rect2 = new joint.shapes.standard.Rectangle();
                        var link = new joint.shapes.standard.Link();
                        rect1.resize(100, 100);
                        rect2.resize(100, 100);
                        rect2.position(200, 0);
                        link.source(rect1);
                        link.target(rect2);
                        paper.options.viewport = function(view) { return view.model === rect1; };
                        rect1.addTo(graph);
                        rect2.addTo(graph);
                        link.addTo(graph);
                        assert.equal(cellNodesCount(paper), 1);
                        paper.dumpViews();
                        assert.equal(cellNodesCount(paper), 3);
                        assert.checkBbox(paper, rect1, 0, 0, 100, 100);
                        assert.checkBbox(paper, rect2, 200, 0, 100, 100);
                        assert.checkBbox(paper, link, 100, 50, 100, 0);
                    });

                    QUnit.test('checkViewport()', function(assert) {
                        var rect1 = new joint.shapes.standard.Rectangle();
                        var rect2 = new joint.shapes.standard.Rectangle();
                        var rect3 = new joint.shapes.standard.Rectangle();
                        var rectNever = new joint.shapes.standard.Rectangle();
                        var rectAlways = new joint.shapes.standard.Rectangle();
                        paper.options.viewport = function(view) { return [rect1, rectAlways].indexOf(view.model) > -1; };
                        paper.freeze();
                        rect1.addTo(graph);
                        rect2.addTo(graph);
                        rect3.addTo(graph);
                        rectNever.addTo(graph);
                        rectAlways.addTo(graph);
                        paper.unfreeze();
                        var rect1View = rect1.findView(paper);
                        var rect2View = rect2.findView(paper);
                        var rect3View = rect3.findView(paper);
                        var rectAlwaysView = rectAlways.findView(paper);
                        paper.options.viewport = function(view) { return [rect2, rect3, rectAlways].indexOf(view.model) > -1; };
                        assert.equal(cellNodesCount(paper), 2);
                        assert.equal(rect1View.el.parentNode, paper.viewport);
                        assert.equal(rectAlwaysView.el.parentNode, paper.viewport);
                        var res1 = paper.checkViewport();
                        assert.deepEqual(res1, { mounted: 2, unmounted: 1 });
                        paper.updateViews();
                        assert.equal(cellNodesCount(paper), 3);
                        assert.equal(rect2View.el.parentNode, paper.viewport);
                        assert.equal(rect3View.el.parentNode, paper.viewport);
                        assert.equal(rectAlwaysView.el.parentNode, paper.viewport);
                        paper.options.viewport = function(view) { return [rect1, rectAlways].indexOf(view.model) > -1; };
                        var res2 = paper.checkViewport();
                        assert.deepEqual(res2, { mounted: 1, unmounted: 2 });
                        paper.updateViews();
                        assert.equal(cellNodesCount(paper), 2);
                        assert.equal(rect1.findView(paper).el.parentNode, paper.viewport);
                        assert.equal(rectAlwaysView.el.parentNode, paper.viewport);
                    });

                    QUnit.test('requireView()', function(assert) {
                        assert.equal(paper.requireView(), null);
                        paper.options.viewport = function() { return false; };
                        var rect = new joint.shapes.standard.Rectangle();
                        rect.translate(201, 202);
                        rect.resize(101, 102);
                        rect.addTo(graph);
                        var rectView = rect.findView(paper);
                        assert.notOk(rectView.el.parentNode);
                        rectView = paper.requireView(rect);
                        assert.ok(rectView.el.parentNode, paper.viewport);
                        assert.checkBbox(paper, rect, 201, 202, 101, 102);
                    });

                    QUnit.module('freeze(), unfreeze(), isFrozen()', function() {

                        QUnit.test('sanity', function(assert) {
                            assert.equal(cellNodesCount(paper), 0);
                            assert.notOk(paper.isFrozen());
                            paper.freeze();
                            assert.ok(paper.isFrozen());
                            var rect = new joint.shapes.standard.Rectangle();
                            rect.addTo(graph);
                            assert.ok(paper.isFrozen());
                            assert.equal(cellNodesCount(paper), 0);
                            paper.unfreeze();
                            assert.notOk(paper.isFrozen());
                            assert.equal(cellNodesCount(paper), 1);
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
                            assert.equal(cellNodesCount(paper), 1);
                            assert.checkBbox(paper, rect, 201, 202, 101, 102);
                            rect.remove();
                            assert.equal(cellNodesCount(paper), 0);
                        });

                        QUnit.test('keep frozen on reset views', function(assert) {
                            paper.freeze();
                            var rect = new joint.shapes.standard.Rectangle();
                            rect.resize(101, 102);
                            rect.position(201, 202);
                            graph.resetCells([rect]);
                            assert.equal(cellNodesCount(paper), 0);
                            assert.ok(paper.isFrozen());
                            paper.unfreeze();
                            assert.notOk(paper.isFrozen());
                            assert.equal(cellNodesCount(paper), 1);
                            assert.checkBbox(paper, rect, 201, 202, 101, 102);
                        });

                        QUnit.module('options', function() {

                            QUnit.module('key', function() {

                                QUnit.test('keep unfrozen', function(assert) {
                                    assert.notOk(paper.isFrozen());
                                    paper.freeze({ key: 'test1' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test2' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test1' });
                                    assert.notOk(paper.isFrozen());
                                });

                                QUnit.test('keep frozen', function(assert) {
                                    paper.freeze();
                                    assert.ok(paper.isFrozen());
                                    paper.freeze({ key: 'test1' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test2' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test1' });
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
                });

            });

            QUnit.module('async = TRUE', function(hooks) {

                hooks.beforeEach(function() {
                    paper = new joint.dia.Paper({
                        el: paperEl,
                        model: graph,
                        async: true
                    });
                });


            });
        });

    });
});

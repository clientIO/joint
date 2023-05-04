QUnit.module('HighlighterView', function(hooks) {

    var paper, graph, paperEl, element, elementView, link, linkView;

    hooks.beforeEach(function() {

        var fixtureEl = document.getElementById('qunit-fixture') || document.createElement('div');
        paperEl = document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        fixtureEl.appendChild(paperEl);
        document.body.appendChild(fixtureEl);

        graph = new joint.dia.Graph;
        paper = new joint.dia.Paper({
            el: paperEl,
            model: graph
        });
        // Element
        element = new joint.shapes.standard.Rectangle({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 }
        });
        element.addTo(graph);
        elementView = element.findView(paper);
        // Link
        link = new joint.shapes.standard.Link({
            target: { x: 100, y: 100  },
            source: { x: 200, y: 200  }
        });
        link.addTo(graph);
        linkView = link.findView(paper);
    });

    QUnit.module('static get()', function() {

        QUnit.test('get by id', function(assert) {
            var h1 = joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-1');
            var h2 = joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-2');
            assert.equal(joint.dia.HighlighterView.get(elementView, 'highlighter-id-1'), h1);
            assert.equal(joint.dia.HighlighterView.get(elementView, 'highlighter-id-2'), h2);
            assert.equal(joint.dia.HighlighterView.get(elementView, 'highlighter-id-3'), null);
            // Extended Class
            var Child = joint.dia.HighlighterView.extend({});
            assert.equal(Child.get(elementView, 'highlighter-id-1'), null);
            var h3 = Child.add(elementView, 'body', 'highlighter-id-3');
            assert.equal(Child.get(elementView, 'highlighter-id-3'), h3);
            assert.equal(joint.dia.HighlighterView.get(elementView, 'highlighter-id-3'), h3);
        });

        QUnit.test('get all', function(assert) {
            var res;
            assert.deepEqual(joint.dia.HighlighterView.get(elementView), []);
            var h1 = joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-1');
            var h2 = joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-2');
            res = joint.util.sortBy(joint.dia.HighlighterView.get(elementView), 'id');
            assert.deepEqual(res, [h1, h2]);
            // Extended Class
            var Child = joint.dia.HighlighterView.extend({});
            assert.deepEqual(Child.get(elementView), []);
            var h3 = Child.add(elementView, 'body', 'highlighter-id-3');
            assert.deepEqual(Child.get(elementView), [h3]);
            res = joint.util.sortBy(joint.dia.HighlighterView.get(elementView), 'id');
            assert.deepEqual(res, [h1, h2, h3]);
        });

    });

    QUnit.module('static add()', function() {

        QUnit.test('no id', function(assert) {
            assert.throws(function() {
                joint.dia.HighlighterView.add(elementView, 'body');
            }, /An ID required/);
        });

        QUnit.test('duplicate id', function(assert) {
            var id = 'highlighter-id';
            var highlighter = joint.dia.HighlighterView.add(elementView, 'body', id);
            assert.equal(highlighter.el.parentNode, elementView.el);
            var highlighter2 = joint.dia.HighlighterView.add(elementView, 'body', id);
            assert.equal(highlighter2.el.parentNode, elementView.el);
            assert.equal(highlighter.el.parentNode, null);
            assert.notEqual(highlighter, highlighter2);
        });

        QUnit.test('different id', function(assert) {
            var id = 'highlighter-id';
            var highlighter = joint.dia.HighlighterView.add(elementView, 'body', id + '-1');
            var highlighter2 = joint.dia.HighlighterView.add(elementView, 'body', id) + '-2';
            assert.notEqual(highlighter, highlighter2);
        });

    });

    QUnit.module('static remove()', function() {

        QUnit.test('remove(cellView)', function(assert) {

            joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-1');
            joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-2');
            joint.dia.HighlighterView.remove(elementView);
            assert.equal(joint.dia.HighlighterView.get(elementView, 'highlighter-id-1'), null);
            assert.equal(joint.dia.HighlighterView.get(elementView, 'highlighter-id-2'), null);
        });

        QUnit.test('remove(cellView, id)', function(assert) {

            joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-1');
            var highlighter2 = joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-2');
            joint.dia.HighlighterView.remove(elementView, 'highlighter-id-1');
            assert.equal(joint.dia.HighlighterView.get(elementView, 'highlighter-id-1'), null);
            assert.equal(joint.dia.HighlighterView.get(elementView, 'highlighter-id-2'), highlighter2);
        });

    });

    QUnit.module('static removeAll()', function() {

        QUnit.test('removeAll(paper)', function(assert) {

            const highlighterId1 = 'highlighter-id-1';
            const highlighterId2 = 'highlighter-id-2';

            const graph2 = new joint.dia.Graph();
            const paper2 = new joint.dia.Paper({ model: graph2 });
            const element2 = element.clone();
            const element3 = element.clone();

            element2.addTo(graph2);
            element3.addTo(graph);

            const elementView2 = element2.findView(paper2);
            const elementView3 = element3.findView(paper);

            joint.dia.HighlighterView.add(elementView, 'body', highlighterId1);
            joint.dia.HighlighterView.add(elementView, 'body', highlighterId2);
            joint.dia.HighlighterView.add(elementView2, 'body', highlighterId1);
            joint.dia.HighlighterView.add(elementView3, 'body', highlighterId1);
            joint.dia.HighlighterView.removeAll(paper);

            assert.equal(joint.dia.HighlighterView.get(elementView, highlighterId1), null);
            assert.equal(joint.dia.HighlighterView.get(elementView, highlighterId2), null);
            assert.ok(joint.dia.HighlighterView.get(elementView2, highlighterId1));
            assert.equal(joint.dia.HighlighterView.get(elementView3, highlighterId1), null);
        });

        QUnit.test('removeAll(paper, id)', function(assert) {

            const highlighterId1 = 'highlighter-id-1';
            const highlighterId2 = 'highlighter-id-2';

            const graph2 = new joint.dia.Graph();
            const paper2 = new joint.dia.Paper({ model: graph2 });
            const element2 = element.clone();
            const element3 = element.clone();

            element2.addTo(graph2);
            element3.addTo(graph);

            const elementView2 = element2.findView(paper2);
            const elementView3 = element3.findView(paper);

            joint.dia.HighlighterView.add(elementView, 'body', highlighterId1);
            joint.dia.HighlighterView.add(elementView, 'body', highlighterId2);
            joint.dia.HighlighterView.add(elementView2, 'body', highlighterId1);
            joint.dia.HighlighterView.add(elementView3, 'body', highlighterId1);
            joint.dia.HighlighterView.removeAll(paper, highlighterId1);

            assert.equal(joint.dia.HighlighterView.get(elementView, highlighterId1), null);
            assert.ok(joint.dia.HighlighterView.get(elementView, highlighterId2));
            assert.ok(joint.dia.HighlighterView.get(elementView2, highlighterId1));
            assert.equal(joint.dia.HighlighterView.get(elementView3, highlighterId1), null);
        });
    });

    QUnit.module('base class', function() {

        QUnit.module('options', function() {

            QUnit.test('layer', function(assert) {

                var highlighter;
                var id = 'highlighter-id';

                // Layer = Back/Front
                ['back', 'front'].forEach(function(layer) {
                    var vLayer = V(paper.getLayerNode(layer));
                    var layerChildrenCount = vLayer.children().length;
                    highlighter = joint.dia.HighlighterView.add(elementView, 'body', id, {
                        layer: layer
                    });
                    assert.ok(highlighter.vel.parent().hasClass('highlight-transform'));
                    assert.ok(vLayer.contains(highlighter.el));
                    assert.equal(vLayer.children().length, layerChildrenCount + 1);
                    joint.dia.HighlighterView.update(elementView, id);
                    assert.equal(vLayer.children().length, layerChildrenCount + 1);
                    joint.dia.HighlighterView.remove(elementView, id);
                    assert.equal(vLayer.children().length, layerChildrenCount);
                });

                // Layer = Null
                highlighter = joint.dia.HighlighterView.add(elementView, 'body', id, {
                    layer: null
                });
                assert.notOk(highlighter.vel.parent().hasClass('highlight-transform'));
                assert.equal(highlighter.el.parentNode, elementView.el);
                joint.dia.HighlighterView.remove(elementView, id);

            });

            QUnit.test('z', function(assert) {
                var layer = joint.dia.Paper.Layers.FRONT;
                var h1 = joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-1', { layer: layer, z: 2 });
                var h2 = joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-2', { layer: layer, z: 3  });
                var h3 = joint.dia.HighlighterView.add(elementView, 'body', 'highlighter-id-3', { layer: layer, z: 1 });
                var frontLayerNode = paper.getLayerNode(layer);
                assert.equal(frontLayerNode.children.length, 3);
                assert.equal(frontLayerNode.children[0], h3.el.parentNode);
                assert.equal(frontLayerNode.children[1], h1.el.parentNode);
                assert.equal(frontLayerNode.children[2], h2.el.parentNode);
            });

        });

        QUnit.module('Mount & Unmount', function() {

            QUnit.test('are mounted back with the same transformation as when they were unmounted', function(assert) {
                const id = 'highlighter-id';
                const layer = 'back';
                const highlighter = joint.dia.HighlighterView.add(elementView, 'body', id, { layer });
                const transformation = V.matrixToTransformString(highlighter.el.getCTM());
                assert.ok(highlighter.el.isConnected);
                highlighter.unmount();
                assert.notEqual(V.matrixToTransformString(highlighter.el.getCTM()), transformation);
                assert.notOk(highlighter.el.isConnected);
                highlighter.mount();
                assert.equal(
                    V.matrixToTransformString(highlighter.el.getCTM()),
                    transformation,
                    'Highlighter should be mounted with the same transformation as before.'
                );
                assert.ok(highlighter.el.isConnected);
                joint.dia.HighlighterView.remove(elementView, id);
            });

            QUnit.test('are mounted and unmounted with the element view', function(assert) {
                ['back', null].forEach(layer => {
                    const id = 'highlighter-id';
                    const highlighter = joint.dia.HighlighterView.add(elementView, 'root', id, { layer });
                    assert.ok(highlighter.el.isConnected);
                    paper.dumpViews({ viewport: () => false });
                    assert.notOk(highlighter.el.isConnected);
                    if (layer) {
                        assert.notOk(highlighter.transformGroup);
                        assert.ok(highlighter.detachedTransformGroup);
                    }
                    paper.dumpViews({ viewport: () => true });
                    assert.ok(highlighter.el.isConnected);
                    if (layer) {
                        assert.ok(highlighter.transformGroup);
                        assert.notOk(highlighter.detachedTransformGroup);
                    }
                    joint.dia.HighlighterView.remove(elementView, id);
                });
            });

            QUnit.test('are not mounted to an unmounted element view', function(assert) {
                ['back', null].forEach(layer => {
                    const id = 'highlighter-id';
                    paper.dumpViews({ viewport: () => false });
                    const highlighter = joint.dia.HighlighterView.add(elementView, 'root', id, { layer });
                    assert.notOk(highlighter.el.isConnected);
                    if (layer) {
                        assert.notOk(highlighter.transformGroup);
                        assert.notOk(highlighter.detachedTransformGroup);
                    }
                    paper.dumpViews({ viewport: () => true });
                    assert.ok(highlighter.el.isConnected);
                    if (layer) {
                        assert.ok(highlighter.transformGroup);
                        const { tx, ty } = highlighter.transformGroup.translate();
                        const { x, y } = element.position();
                        assert.equal(tx, x);
                        assert.equal(ty, y);
                        assert.notOk(highlighter.detachedTransformGroup);
                    }
                    joint.dia.HighlighterView.remove(elementView, id);
                });
            });

            QUnit.test('are mounted and unmounted with the link view', function(assert) {
                ['back', null].forEach(layer => {
                    const id = 'highlighter-id';
                    const highlighter = joint.dia.HighlighterView.add(linkView, 'root', id, { layer });
                    assert.ok(highlighter.el.isConnected);
                    paper.dumpViews({ viewport: () => false });
                    assert.notOk(highlighter.el.isConnected);
                    if (layer) {
                        assert.notOk(highlighter.transformGroup);
                        assert.ok(highlighter.detachedTransformGroup);
                    }
                    paper.dumpViews({ viewport: () => true });
                    assert.ok(highlighter.el.isConnected);
                    if (layer) {
                        assert.ok(highlighter.transformGroup);
                        assert.notOk(highlighter.detachedTransformGroup);
                    }
                    joint.dia.HighlighterView.remove(linkView, id);
                });
            });
        });

        QUnit.test('Highlight element by a node', function(assert) {

            var highlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'highlight');
            var unhighlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'unhighlight');

            var id = 'highlighter-id';
            var node = elementView.el.querySelector('[joint-selector="body"]');

            // Highlight
            var highlighter = joint.dia.HighlighterView.add(elementView, node, id);
            assert.equal(highlighter, joint.dia.HighlighterView.get(elementView, id));
            assert.ok(highlighter instanceof joint.dia.HighlighterView);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(elementView, node));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            // Update (Default will unhighlight and highlight)
            element.attr(['body', 'fill'], 'red', { dirty: true });
            var node2 = elementView.el.querySelector('[joint-selector="body"]');
            assert.notEqual(node, node2);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(elementView, node));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(elementView, node));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            // Unhighlight
            joint.dia.HighlighterView.remove(elementView, id);
            assert.equal(joint.dia.HighlighterView.get(elementView, id), null);
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(elementView, node));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            assert.ok(highlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            highlightSpy.restore();
            unhighlightSpy.restore();
        });

        QUnit.test('Highlight element by a selector', function(assert) {

            var highlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'highlight');
            var unhighlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'unhighlight');

            var id = 'highlighter-id';
            var node = elementView.el.querySelector('[joint-selector="body"]');

            // Highlight
            var highlighter = joint.dia.HighlighterView.add(elementView, 'body', id);
            assert.equal(highlighter, joint.dia.HighlighterView.get(elementView, id));
            assert.ok(highlighter instanceof joint.dia.HighlighterView);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(elementView, node));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            // Update (Default will unhighlight and highlight)
            element.attr(['body', 'fill'], 'red', { dirty: true });
            var node2 = elementView.el.querySelector('[joint-selector="body"]');
            assert.notEqual(node, node2);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(elementView, node2));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(elementView, node));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            // Unhighlight
            joint.dia.HighlighterView.remove(elementView, id);
            assert.equal(joint.dia.HighlighterView.get(elementView, id), null);
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(elementView, node2));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            assert.ok(highlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            highlightSpy.restore();
            unhighlightSpy.restore();
        });

        QUnit.test('Highlight port by a selector', function(assert) {

            var portId = 'port1';

            var highlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'highlight');
            var unhighlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'unhighlight');
            var invalidSpy = sinon.spy();

            paper.on('cell:highlight:invalid', invalidSpy);

            element.addPort({ id: portId });
            var id = 'highlighter-id';
            var node = elementView.findPortNode(portId, 'circle');
            var selector = { port: portId, selector: 'circle' };

            // Highlight
            var highlighter = joint.dia.HighlighterView.add(elementView, selector, id);
            assert.equal(highlighter, joint.dia.HighlighterView.get(elementView, id));
            assert.ok(highlighter instanceof joint.dia.HighlighterView);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(elementView, node));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.notCalled);
            assert.ok(invalidSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();
            invalidSpy.resetHistory();

            // Remove Target Node
            element.removePorts();
            assert.ok(invalidSpy.calledOnce);
            assert.ok(invalidSpy.calledOnceWithExactly(elementView, id, highlighter));
            assert.ok(highlightSpy.notCalled);
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(elementView, node));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();
            invalidSpy.resetHistory();

            element.addPort({ id: portId });
            var node2 = elementView.findPortNode(portId, 'circle');
            assert.ok(invalidSpy.notCalled);
            assert.ok(unhighlightSpy.notCalled);
            assert.ok(highlightSpy.calledOnceWithExactly(elementView, node2));
            assert.ok(highlightSpy.calledOn(highlighter));
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();
            invalidSpy.resetHistory();

            // // Unhighlight
            joint.dia.HighlighterView.remove(elementView, id);
            assert.equal(joint.dia.HighlighterView.get(elementView, id), null);
            assert.ok(invalidSpy.notCalled);
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(elementView, node2));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            assert.ok(highlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();
            invalidSpy.resetHistory();

            highlightSpy.restore();
            unhighlightSpy.restore();
        });

        QUnit.test('Highlight invalid by a selector', function(assert) {

            var highlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'highlight');
            var unhighlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'unhighlight');
            var invalidSpy = sinon.spy();

            paper.on('cell:highlight:invalid', invalidSpy);

            var id = 'highlighter-id';

            // Highlight
            var highlighter = joint.dia.HighlighterView.add(elementView, 'invalidSelector', id);
            assert.equal(highlighter, joint.dia.HighlighterView.get(elementView, id));
            assert.ok(highlighter instanceof joint.dia.HighlighterView);
            assert.ok(highlightSpy.notCalled);
            assert.ok(unhighlightSpy.notCalled);
            assert.ok(invalidSpy.calledOnce);
            assert.ok(invalidSpy.calledOnceWithExactly(elementView, id, highlighter));
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();
            invalidSpy.resetHistory();

            // Unhighlight / Remove
            highlighter.remove();
            assert.ok(highlightSpy.notCalled);
            assert.ok(unhighlightSpy.notCalled);
            assert.ok(invalidSpy.notCalled);
            assert.equal(null, joint.dia.HighlighterView.get(elementView, id));

            highlightSpy.restore();
            unhighlightSpy.restore();
        });

        QUnit.test('Highlight link by a node', function(assert) {

            var highlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'highlight');
            var unhighlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'unhighlight');

            var id = 'highlighter-id';
            var node = linkView.el.querySelector('[joint-selector="line"]');

            // Highlight
            var highlighter = joint.dia.HighlighterView.add(linkView, node, id);
            assert.equal(highlighter, joint.dia.HighlighterView.get(linkView, id));
            assert.ok(highlighter instanceof joint.dia.HighlighterView);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(linkView, node));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            // Update (Default will unhighlight and highlight)
            link.attr(['line', 'stroke'], 'red', { dirty: true });
            var node2 = linkView.el.querySelector('[joint-selector="line"]');
            assert.notEqual(node, node2);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(linkView, node));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(linkView, node));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            // Unhighlight
            joint.dia.HighlighterView.remove(linkView, id);
            assert.equal(joint.dia.HighlighterView.get(linkView, id), null);
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(linkView, node));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            assert.ok(highlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            highlightSpy.restore();
            unhighlightSpy.restore();
        });

        QUnit.test('Highlight link by a selector', function(assert) {

            var highlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'highlight');
            var unhighlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'unhighlight');

            var id = 'highlighter-id';
            var node = linkView.el.querySelector('[joint-selector="line"]');

            // Highlight
            var highlighter = joint.dia.HighlighterView.add(linkView, 'line', id);
            assert.equal(highlighter, joint.dia.HighlighterView.get(linkView, id));
            assert.ok(highlighter instanceof joint.dia.HighlighterView);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(linkView, node));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            // Update (Default will unhighlight and highlight)
            link.attr(['line', 'stroke'], 'red', { dirty: true });
            var node2 = linkView.el.querySelector('[joint-selector="line"]');
            assert.notEqual(node, node2);
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledOnceWithExactly(linkView, node2));
            assert.ok(highlightSpy.calledOn(highlighter));
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(linkView, node));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            // Unhighlight
            joint.dia.HighlighterView.remove(linkView, id);
            assert.equal(joint.dia.HighlighterView.get(linkView, id), null);
            assert.ok(unhighlightSpy.calledOnce);
            assert.ok(unhighlightSpy.calledOnceWithExactly(linkView, node2));
            assert.ok(unhighlightSpy.calledOn(highlighter));
            assert.ok(highlightSpy.notCalled);
            highlightSpy.resetHistory();
            unhighlightSpy.resetHistory();

            highlightSpy.restore();
            unhighlightSpy.restore();
        });

        QUnit.test('Highlight label by a selector', function(assert) {

            link.set('defaultLabel', {
                markup: [{
                    tagName: 'rect',
                    selector: 'labelBody'
                }, {
                    tagName: 'text',
                    selector: 'labelText'
                }],
                attrs: {
                    labelText: {
                        text: 'First',
                    },
                    labelBody: {
                        ref: 'labelText',
                        refWidth: '100%',
                        refHeight: '100%',
                    }
                }
            });

            var labels = [{
                attrs: {
                    labelText: {
                        text: 'One',
                    },
                }
            }, {
                attrs: {
                    labelText: {
                        text: 'Two',
                    },
                }
            }];

            link.labels(labels);

            labels.forEach(function(label, index) {

                var highlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'highlight');
                var unhighlightSpy = sinon.spy(joint.dia.HighlighterView.prototype, 'unhighlight');

                var id = 'highlighter-id';
                var selector = { label: index, selector: 'labelBody' };
                var node = linkView.findLabelNode(selector.label, selector.selector);

                // Highlight
                var highlighter = joint.dia.HighlighterView.add(linkView, selector, id);
                assert.equal(highlighter, joint.dia.HighlighterView.get(linkView, id));
                assert.ok(highlighter instanceof joint.dia.HighlighterView);
                assert.ok(highlightSpy.calledOnce);
                assert.ok(highlightSpy.calledOnceWithExactly(linkView, node));
                assert.ok(highlightSpy.calledOn(highlighter));
                assert.ok(unhighlightSpy.notCalled);
                highlightSpy.resetHistory();
                unhighlightSpy.resetHistory();

                // Update (Default will unhighlight and highlight)
                link.attr(['line', 'stroke'], ['red','green'][index], { dirty: true });
                var node2 = linkView.findLabelNode(selector.label, selector.selector);
                assert.notEqual(node, node2);
                assert.ok(highlightSpy.calledOnce);
                assert.ok(highlightSpy.calledOnceWithExactly(linkView, node2));
                assert.ok(highlightSpy.calledOn(highlighter));
                assert.ok(unhighlightSpy.calledOnce);
                assert.ok(unhighlightSpy.calledOnceWithExactly(linkView, node));
                assert.ok(unhighlightSpy.calledOn(highlighter));
                highlightSpy.resetHistory();
                unhighlightSpy.resetHistory();

                // Unhighlight
                joint.dia.HighlighterView.remove(linkView, id);
                assert.equal(joint.dia.HighlighterView.get(linkView, id), null);
                assert.ok(unhighlightSpy.calledOnce);
                assert.ok(unhighlightSpy.calledOnceWithExactly(linkView, node2));
                assert.ok(unhighlightSpy.calledOn(highlighter));
                assert.ok(highlightSpy.notCalled);
                highlightSpy.resetHistory();
                unhighlightSpy.resetHistory();

                highlightSpy.restore();
                unhighlightSpy.restore();
            });
        });

        QUnit.module('UPDATE_ATTRIBUTES', function() {

            QUnit.test('array', function(assert) {

                var Child1 = joint.dia.HighlighterView.extend({
                    UPDATE_ATTRIBUTES: ['attribute1', 'attribute2']
                });

                var highlightSpy = sinon.spy(Child1.prototype, 'highlight');

                var id = 'highlighter-id';

                Child1.add(elementView, 'root', id);

                assert.ok(highlightSpy.calledOnce);
                highlightSpy.resetHistory();

                element.attr(['body', 'stroke'], 'red');
                assert.ok(highlightSpy.calledOnce);
                highlightSpy.resetHistory();


                element.set('attribute1', 'attributeValue1');
                assert.ok(highlightSpy.calledOnce);
                highlightSpy.resetHistory();

                element.set('attribute2', 'attributeValue2');
                assert.ok(highlightSpy.calledOnce);
                highlightSpy.resetHistory();

                element.set('otherAttribute', 'otherAttributeValue');
                assert.ok(highlightSpy.notCalled);
                highlightSpy.resetHistory();
            });

            QUnit.test('function', function(assert) {

                var updateAttributesSpy = sinon.spy(function() {
                    return ['attribute1', 'attribute2'];
                });

                var Child1 = joint.dia.HighlighterView.extend({
                    UPDATE_ATTRIBUTES: updateAttributesSpy
                });

                var highlightSpy = sinon.spy(Child1.prototype, 'highlight');

                var id = 'highlighter-id';

                Child1.add(elementView, 'root', id);

                assert.ok(highlightSpy.calledOnce);
                assert.ok(updateAttributesSpy.calledOn(Child1.get(elementView, id)));
                highlightSpy.resetHistory();

                element.attr(['body', 'stroke'], 'red');
                assert.ok(highlightSpy.calledOnce);
                highlightSpy.resetHistory();


                element.set('attribute1', 'attributeValue1');
                assert.ok(highlightSpy.calledOnce);
                highlightSpy.resetHistory();

                element.set('attribute2', 'attributeValue2');
                assert.ok(highlightSpy.calledOnce);
                highlightSpy.resetHistory();

                element.set('otherAttribute', 'otherAttributeValue');
                assert.ok(highlightSpy.notCalled);
                highlightSpy.resetHistory();
            });
        });
    });


    QUnit.module('addClass', function() {

        QUnit.test('Highlight element by a selector', function(assert) {

            var HighlighterView = joint.highlighters.addClass;
            var id = 'highlighter-id';
            var el = elementView.vel.findOne('[joint-selector="body"]');
            var className = 'test-class';
            // Highlight
            var highlighter = HighlighterView.add(elementView, 'body', id, {
                className: className
            });
            assert.ok(highlighter instanceof HighlighterView);
            assert.ok(el.hasClass(className));

            // Update (Default will unhighlight and highlight)
            element.attr(['body', 'fill'], 'red', { dirty: true });
            var el2 = elementView.vel.findOne('[joint-selector="body"]');
            assert.ok(el2.hasClass(className));

            // Unhighlight
            joint.dia.HighlighterView.remove(elementView, id);
            assert.notOk(el.hasClass(className));
        });

        QUnit.test('Highlight link by a selector', function(assert) {

            var HighlighterView = joint.highlighters.addClass;
            var id = 'highlighter-id';
            var el = linkView.vel.findOne('[joint-selector="line"]');
            var className = 'test-class';
            // Highlight
            var highlighter = HighlighterView.add(linkView, { selector: 'line' }, id, {
                className: className
            });
            assert.ok(highlighter instanceof HighlighterView);
            assert.ok(el.hasClass(className));

            // Render (Default will unhighlight and highlight)
            link.attr(['line', 'stroke'], 'red', { dirty: true });
            var el2 = linkView.vel.findOne('[joint-selector="line"]');
            assert.ok(el2.hasClass(className));

            // Unhighlight
            joint.dia.HighlighterView.remove(linkView, id);
            assert.notOk(el.hasClass(className));
        });

    });

    QUnit.module('opacity', function() {

        QUnit.test('Highlight element by a selector', function(assert) {

            var HighlighterView = joint.highlighters.opacity;
            var id = 'highlighter-id';
            var el = elementView.vel.findOne('[joint-selector="body"]');
            var className = 'joint-highlight-opacity';

            // Highlight
            var highlighter = HighlighterView.add(elementView, 'body', id);
            assert.ok(highlighter instanceof HighlighterView);
            assert.ok(el.hasClass(className));

            // Render (Default will unhighlight and highlight)
            element.attr(['body', 'fill'], 'red', { dirty: true });
            var el2 = elementView.vel.findOne('[joint-selector="body"]');
            assert.ok(el2.hasClass(className));

            // Unhighlight
            joint.dia.HighlighterView.remove(elementView, id);
            assert.notOk(el.hasClass(className));
        });

    });

    QUnit.module('mask', function() {

        QUnit.test('Highlight element by a selector', function(assert) {

            var HighlighterView = joint.highlighters.mask;
            var id = 'highlighter-id';

            // Highlight
            var highlighter = HighlighterView.add(elementView, 'body', id);
            assert.ok(highlighter instanceof HighlighterView);
            assert.equal(elementView.el, highlighter.el.parentNode);
            assert.ok(paper.isDefined(highlighter.getMaskId()));

            // Update
            var size1 = highlighter.vel.getBBox().toString();
            element.resize(200, 200);
            var size2 = highlighter.vel.getBBox().toString();
            assert.notEqual(size1, size2);
            assert.ok(paper.isDefined(highlighter.getMaskId()));

            // Unhighlight
            joint.dia.HighlighterView.remove(elementView, id);
            assert.notEqual(elementView.el, highlighter.el.parentNode);
            assert.notOk(paper.isDefined(highlighter.getMaskId()));
        });

        QUnit.test('Purging the mask nodes', function(assert) {
            // class names
            const HighlighterView = joint.highlighters.mask;
            const id = 'highlighter-id';
            elementView.el.classList.add('root');
            elementView.el.querySelector('rect').classList.add('body');
            elementView.el.querySelector('text').classList.add('label');
            const highlighter = HighlighterView.add(elementView, 'root', id, { deep: true });
            const maskEl = paper.svg.getElementById(highlighter.getMaskId());
            assert.notOk(maskEl.querySelector('.root'));
            assert.notOk(maskEl.querySelector('.body'));
            assert.notOk(maskEl.querySelector('.label'));
        });
    });

    QUnit.module('stroke', function() {

        QUnit.test('Highlight element by a selector', function(assert) {

            var HighlighterView = joint.highlighters.stroke;
            var id = 'highlighter-id';

            // Highlight
            var highlighter = HighlighterView.add(elementView, 'body', id);
            assert.ok(highlighter instanceof HighlighterView);
            assert.equal(elementView.el, highlighter.el.parentNode);

            // Update
            var size1 = highlighter.vel.getBBox().toString();
            element.resize(200, 200);
            var size2 = highlighter.vel.getBBox().toString();
            assert.notEqual(size1, size2);

            // Unhighlight
            joint.dia.HighlighterView.remove(elementView, id);
            assert.notEqual(elementView.el, highlighter.el.parentNode);
        });


        QUnit.module('Rendering', function() {

            QUnit.test('no rotatable group', function(assert) {
                element.set({
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    angle: 90,
                    markup: [
                        {
                            tagName: 'rect',
                            selector: 'rect',
                        },
                    ],
                    attrs: {
                        rect: {
                            x: 21,
                            y: 13,
                            width: 20,
                            height: 10
                        }
                    }
                });

                const h1 = joint.highlighters.stroke.add(elementView, 'rect', 'l1', {
                    layer: 'front',
                    padding: 0
                });

                assert.checkBboxApproximately(1/* +- */, h1.vel.getBBox({ target: paper.svg }), {
                    x: 100 - 13 - 10,
                    y: 21,
                    width: 10,
                    height: 20
                });

                const h2 = joint.highlighters.stroke.add(elementView, 'rect', 'l0', {
                    layer: null,
                    padding: 0
                });

                assert.checkBboxApproximately(1/* +- */, h2.vel.getBBox({ target: paper.svg }), {
                    x: 100 - 13 - 10,
                    y: 21,
                    width: 10,
                    height: 20
                });
            });

            QUnit.test('rotatable group', function(assert) {
                element.set({
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    angle: 90,
                    markup: [
                        {
                            tagName: 'g',
                            selector: 'rotatable',
                            children: [
                                {
                                    tagName: 'rect',
                                    selector: 'rectInside',
                                }
                            ],
                        }, {
                            tagName: 'rect',
                            selector: 'rectOutside',
                        },
                    ],
                    attrs: {
                        rectInside: {
                            x: 21,
                            y: 13,
                            width: 20,
                            height: 10
                        },
                        rectOutside: {
                            x: 7,
                            y: 5,
                            width: 20,
                            height: 10,
                            fill: 'red'
                        }
                    }
                });

                const h1 = joint.highlighters.stroke.add(elementView, 'rectInside', 'in1', {
                    layer: 'front',
                    padding: 0,
                    attrs: { stroke: 'green' }
                });

                assert.checkBboxApproximately(1/* +- */, h1.vel.getBBox({ target: paper.svg }), {
                    x: 100 - 13 - 10,
                    y: 21,
                    width: 10,
                    height: 20
                });

                const h2 = joint.highlighters.stroke.add(elementView, 'rectOutside', 'out1', {
                    layer: 'front',
                    padding: 0,
                    attrs: { stroke: 'gray' }
                });

                assert.checkBboxApproximately(1/* +- */, h2.vel.getBBox({ target: paper.svg }), {
                    x: 7,
                    y: 5,
                    width: 20,
                    height: 10
                });

                const h3 = joint.highlighters.stroke.add(elementView, 'rectInside', 'in2', {
                    layer: null,
                    padding: 0,
                });

                assert.checkBboxApproximately(1/* +- */, h3.vel.getBBox({ target: paper.svg }), {
                    x: 100 - 13 - 10,
                    y: 21,
                    width: 10,
                    height: 20
                });

                const h4 = joint.highlighters.stroke.add(elementView, 'rectOutside', 'out2', {
                    layer: null,
                    padding: 0
                });

                assert.checkBboxApproximately(1/* +- */, h4.vel.getBBox({ target: paper.svg }), {
                    x: 7,
                    y: 5,
                    width: 20,
                    height: 10
                });

            });
        });
    });

    QUnit.module('list', function() {

        QUnit.test('options', function(assert) {

            var HighlighterView = joint.highlighters.list.extend({
                createListItem: function(item, size) {
                    return V('rect', size).node;
                }
            });
            var id = 'highlighter-id';

            assert.throws(function() {
                HighlighterView.add(elementView, 'root', id);
            }, 'List: attribute is required');

            var highlighter;

            highlighter = HighlighterView.add(elementView, 'root', id, {
                attribute: 'rects',
                size: 13,
                gap: 11
            });

            var highlightSpy = sinon.spy(HighlighterView.prototype, 'createListItem');

            element.set('rects', []);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 0@0');
            assert.ok(highlightSpy.notCalled);
            highlightSpy.resetHistory();

            element.set('rects', ['a','b']);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 37@13');
            assert.ok(highlightSpy.calledTwice);
            assert.ok(highlightSpy.calledWithExactly('a', sinon.match({ width: 13, height: 13 }), null));
            assert.ok(highlightSpy.calledWithExactly('b', sinon.match({ width: 13, height: 13 }), null));
            highlightSpy.resetHistory();

            // only removes 'b' - does not create 'a' again
            element.set('rects', ['a']);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 13@13');
            assert.ok(highlightSpy.notCalled);
            highlightSpy.resetHistory();

            var prevListItem = highlighter.el.children[0];
            element.set('rects', ['c']);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 13@13');
            assert.ok(highlightSpy.calledOnce);
            assert.ok(highlightSpy.calledWithExactly('c', sinon.match({ width: 13, height: 13 }), prevListItem));
            highlightSpy.resetHistory();

            highlighter.remove();

            // size as an object
            highlighter = HighlighterView.add(elementView, 'body', id, {
                attribute: 'rects',
                size: { width: 13, height: 17 },
                gap: 11
            });

            element.set('rects', []);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 0@0');

            element.set('rects', ['a','b']);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 37@17');

            element.set('rects', ['a']);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 13@17');

            highlighter.remove();

            // direction column
            highlighter = HighlighterView.add(elementView, 'body', id, {
                attribute: 'rects',
                size: { width: 13, height: 13 },
                gap: 11,
                direction: HighlighterView.Directions.COLUMN
            });

            element.set('rects', []);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 0@0');

            element.set('rects', ['a','b']);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 13@37');

            element.set('rects', ['a']);
            assert.equal(highlighter.vel.getBBox().toString(), '0@0 13@13');

            highlighter.remove();

            // position
            var t;
            element.resize(100, 100);
            element.set('rects', ['a','b']);

            // bottom-right column
            highlighter = HighlighterView.add(elementView, 'body', id, {
                attribute: 'rects',
                size: 13,
                gap: 11,
                direction: HighlighterView.Directions.COLUMN,
                position: HighlighterView.Positions.BOTTOM_RIGHT,
                margin: 5
            });

            t = highlighter.vel.translate();
            assert.equal(t.tx, 100-13-5);
            assert.equal(t.ty, 100-37-5);
            highlighter.remove();

            // bottom-left column
            highlighter = HighlighterView.add(elementView, 'body', id, {
                attribute: 'rects',
                size: 13,
                gap: 11,
                direction: HighlighterView.Directions.COLUMN,
                position: HighlighterView.Positions.BOTTOM_LEFT,
                margin: 5
            });

            t = highlighter.vel.translate();
            assert.equal(t.tx, 5);
            assert.equal(t.ty, 100-37-5);
            highlighter.remove();

            // top-right row
            highlighter = HighlighterView.add(elementView, 'body', id, {
                attribute: 'rects',
                size: 13,
                gap: 11,
                direction: HighlighterView.Directions.ROW,
                position: HighlighterView.Positions.TOP_RIGHT,
                margin: 5
            });

            t = highlighter.vel.translate();
            assert.equal(t.tx, 100-37-5);
            assert.equal(t.ty, 5);
            highlighter.remove();

            // top-left row margin
            highlighter = HighlighterView.add(elementView, 'body', id, {
                attribute: 'rects',
                size: 13,
                gap: 11,
                direction: HighlighterView.Directions.ROW,
                position: HighlighterView.Positions.TOP_LEFT,
                margin: { top: 1, left: 3 }
            });

            t = highlighter.vel.translate();
            assert.equal(t.tx, 3);
            assert.equal(t.ty, 1);
            highlighter.remove();
        });

    });
});

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

    QUnit.module('base class', function() {

        QUnit.module('options', function() {

            QUnit.test('layer', function(assert) {

                var highlighter;
                var id = 'highlighter-id';

                // Layer = Back/Front
                ['back', 'front'].forEach(function(layer) {
                    var vLayer = V(paper.getLayerNode(layer));
                    var backChildrenCount = vLayer.children().length;
                    highlighter = joint.dia.HighlighterView.add(elementView, 'body', id, {
                        layer: layer
                    });
                    assert.ok(highlighter.vel.parent().hasClass('highlight-transform'));
                    assert.ok(vLayer.contains(highlighter.el));
                    assert.equal(vLayer.children().length, backChildrenCount + 1);
                    joint.dia.HighlighterView.update(elementView, id);
                    assert.equal(vLayer.children().length, backChildrenCount + 1);
                    joint.dia.HighlighterView.remove(elementView, id);
                    assert.equal(vLayer.children().length, backChildrenCount);
                });

                // Layer = Null
                highlighter = joint.dia.HighlighterView.add(elementView, 'body', id, {
                    layer: null
                });
                assert.notOk(highlighter.vel.parent().hasClass('highlight-transform'));
                assert.equal(highlighter.el.parentNode, elementView.el);
                joint.dia.HighlighterView.remove(elementView, id);

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

    });
});

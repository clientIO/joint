QUnit.module('Attributes', function() {

    QUnit.module('getAttributeDefinition()', function() {

        QUnit.test('will find correct defintion', function(assert) {

            joint.dia.attributes.globalTest = 'global';
            joint.dia.attributes.priority = 'lower';

            var Cell = joint.dia.Cell.extend({}, {
                attributes: {
                    localTest: 'local',
                    priority: 'higher'
                }
            });

            assert.equal(Cell.getAttributeDefinition(), null);
            assert.equal(Cell.getAttributeDefinition('nonExistingTest'), null);
            assert.equal(Cell.getAttributeDefinition('globalTest'), 'global');
            assert.equal(Cell.getAttributeDefinition('localTest'), 'local');
            assert.equal(Cell.getAttributeDefinition('priority'), 'higher');
        });
    });

    QUnit.module('Text Attributes', function(hooks) {

        var WIDTH = 85;
        var HEIGHT = 97;

        var paper, graph, cell, cellView, node, refBBox;

        hooks.beforeEach(function() {
            graph = new joint.dia.Graph;
            var fixtures = document.getElementById('qunit-fixture');
            var paperEl = document.createElement('div');
            fixtures.appendChild(paperEl);
            paper = new joint.dia.Paper({ el: paperEl, model: graph });
            cell = new joint.shapes.standard.Rectangle();
            cell.addTo(graph);
            cellView = cell.findView(paper);
            refBBox = new g.Rect(0, 0, WIDTH, HEIGHT);
            node = cellView.el.querySelector('text');
        });

        hooks.afterEach(function() {
            paper.remove();
        });


        QUnit.module('textWrap', function() {

            QUnit.test('qualify', function(assert) {

                var ns = joint.dia.attributes;
                assert.notOk(ns.textWrap.qualify.call(cellView, 'string', node, {}));
                assert.ok(ns.textWrap.qualify.call(cellView, { 'plainObject': true }, node, {}));
            });

            QUnit.test('set', function(assert) {

                var ns = joint.dia.attributes;
                var bbox = refBBox.clone();
                var spy = sinon.spy(joint.util, 'breakText');

                // no text
                spy.resetHistory();
                ns.textWrap.set.call(cellView, {}, bbox, node, {});
                assert.equal(node.textContent, '-'); // Vectorizer empty line has `-` character with opacity 0
                assert.ok(!spy.called || spy.calledWith('', sinon.match.instanceOf(g.Rect)));

                // text via `text` attribute
                spy.resetHistory();
                ns.textWrap.set.call(cellView, {}, bbox, node, { text: 'text' });
                assert.equal(node.textContent, 'text');

                // text as part of the `textWrap` value
                spy.resetHistory();
                ns.textWrap.set.call(cellView, { text: 'text' }, bbox, node, {});
                assert.equal(node.textContent, 'text');

                // width & height absolute
                bbox = refBBox.clone();
                ns.textWrap.set.call(cellView, { text: 'text', width: -20, height: -30 }, bbox, node, {});
                assert.ok(new g.Rect(0, 0, WIDTH - 20, HEIGHT - 30).equals(bbox));
                bbox = refBBox.clone();

                // width & height relative
                bbox = refBBox.clone();
                ns.textWrap.set.call(cellView, { text: 'text', width: '50%', height: '200%' }, bbox, node, {});
                assert.ok(new g.Rect(0, 0, WIDTH / 2, HEIGHT * 2).equals(bbox));

            });
        });
    });

    QUnit.module('Proxy Attributes', function(hooks) {

        var paper, graph, cell, cellView;

        hooks.beforeEach(function() {
            graph = new joint.dia.Graph;
            var fixtures = document.getElementById('qunit-fixture');
            var paperEl = document.createElement('div');
            fixtures.appendChild(paperEl);
            paper = new joint.dia.Paper({ el: paperEl, model: graph });
            cell = new joint.shapes.standard.Rectangle({ width: 100, height: 100 });
            cell.addTo(graph);
            cellView = cell.findView(paper);
        });

        hooks.afterEach(function() {
            paper.remove();
        });


        QUnit.module('containerSelector', function() {

            QUnit.test('highlighting', function(assert) {

                paper.options.embeddingMode = true;
                cell.attr(['root', 'containerSelector'], 'body');
                var body = cellView.findBySelector('body')[0];

                var highlightSpy = sinon.spy();
                var unhighlightSpy = sinon.spy();
                paper.on('cell:highlight', highlightSpy);
                paper.on('cell:unhighlight', unhighlightSpy);

                var cell2 = new joint.shapes.standard.Rectangle({ width: 100, height: 100 });
                cell2.addTo(graph);
                var cellView2 = cell2.findView(paper);
                var data = {};
                var clientCellCenter = paper.localToClientPoint(cell.getBBox().center());
                simulate.mousedown({ el: cellView2.el, clientX: clientCellCenter.x, clientY: clientCellCenter.y, data: data });
                simulate.mousemove({ el: cellView2.el, clientX: clientCellCenter.x, clientY: clientCellCenter.y, data: data });
                // Highlight
                assert.ok(highlightSpy.calledOnce);
                assert.ok(highlightSpy.calledWithExactly(cellView, body, sinon.match({ embedding: true })));
                assert.notOk(unhighlightSpy.called);
                simulate.mouseup({ el: cellView2.el, clientX: clientCellCenter.x, clientY: clientCellCenter.y, data: data });
                // Unhighlight
                assert.ok(unhighlightSpy.calledOnce);
                assert.ok(unhighlightSpy.calledWithExactly(cellView, body, sinon.match({ embedding: true })));
                assert.notOk(highlightSpy.callCount > 1);
            });
        });

        QUnit.module('magnetSelector', function() {

            QUnit.test('highlighting, magnet, validation', function(assert) {

                paper.options.embeddingMode = true;
                cell.attr(['root', 'magnetSelector'], 'body');
                var body = cellView.findBySelector('body')[0];

                var highlightSpy = sinon.spy();
                var unhighlightSpy = sinon.spy();
                var validateSpy = sinon.spy(function() { return true; });
                paper.on('cell:highlight', highlightSpy);
                paper.on('cell:unhighlight', unhighlightSpy);
                paper.options.validateConnection = validateSpy;

                var link = new joint.dia.Link({ width: 100, height: 100 });
                link.addTo(graph);
                var linkView = link.findView(paper);
                assert.equal(linkView.sourceMagnet, null);
                var cellCenter = cell.getBBox().center();
                var evt = { type: 'mousemove' };
                linkView.startArrowheadMove('source');
                evt.target = paper.el;
                linkView.pointermove(evt, cellCenter.x, cellCenter.y);
                evt.target = cellView.el;
                linkView.pointermove(evt, cellCenter.x, cellCenter.t);
                // Highlight
                assert.ok(highlightSpy.calledOnce);
                assert.ok(highlightSpy.calledWithExactly(cellView, body, sinon.match({ connecting: true })));
                assert.notOk(unhighlightSpy.called);
                linkView.pointerup(evt, cellCenter.x, cellCenter.y);
                // Unhighlight
                assert.ok(unhighlightSpy.calledOnce);
                assert.ok(unhighlightSpy.calledWithExactly(cellView, body, sinon.match({ connecting: true })));
                assert.notOk(highlightSpy.callCount > 1);
                assert.equal(linkView.sourceMagnet, body);
                // Validation
                assert.ok(validateSpy.calledOnce);
                assert.ok(validateSpy.calledWithExactly(cellView, body, undefined, undefined, 'source', linkView));
            });
        });

    });

});

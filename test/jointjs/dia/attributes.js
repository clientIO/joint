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

        var paper, graph, cell, cellView, node, refBBox
        var ns = joint.dia.attributes;

        hooks.beforeEach(function() {
            graph = new joint.dia.Graph;
            paper = new joint.dia.Paper({ model: graph });
            cell = new joint.shapes.standard.Rectangle()
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
                assert.notOk(ns.textWrap.qualify.call(cellView, 'string', node, {}));
                assert.ok(ns.textWrap.qualify.call(cellView, { 'plainObject': true }, node, {}));
            });

            QUnit.test('set', function(assert) {

                var bbox = refBBox.clone();
                var spy = sinon.spy(joint.util, 'breakText');

                // no text
                spy.reset();
                ns.textWrap.set.call(cellView, {}, bbox, node, {});
                assert.equal(node.textContent, '-'); // Vectorizer empty line has `-` character with opacity 0
                assert.ok(!spy.called || spy.calledWith('', sinon.match.instanceOf(g.Rect)));

                // text via `text` attribute
                spy.reset();
                ns.textWrap.set.call(cellView, {}, bbox, node, { text: 'text' });
                assert.equal(node.textContent, 'text');
                assert.ok(spy.calledWith('text', sinon.match.instanceOf(g.Rect)));

                // text as part of the `textWrap` value
                spy.reset();
                ns.textWrap.set.call(cellView, { text: 'text' }, bbox, node, {});
                assert.equal(node.textContent, 'text');
                assert.ok(spy.calledWith('text', sinon.match.instanceOf(g.Rect)));

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
});

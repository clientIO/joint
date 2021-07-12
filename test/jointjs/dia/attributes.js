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
                linkView.pointermove(evt, cellCenter.x, cellCenter.y);
                // Highlight
                assert.ok(highlightSpy.calledOnce);
                assert.ok(highlightSpy.calledWithExactly(cellView, cellView.el, sinon.match({ connecting: true, type: joint.dia.CellView.Highlighting.CONNECTING })));
                assert.notOk(unhighlightSpy.called);
                linkView.pointerup(evt, cellCenter.x, cellCenter.y);
                // Unhighlight
                assert.ok(unhighlightSpy.calledOnce);
                assert.ok(unhighlightSpy.calledWithExactly(cellView, cellView.el, sinon.match({ connecting: true, type: joint.dia.CellView.Highlighting.CONNECTING })));
                assert.notOk(highlightSpy.callCount > 1);
                assert.equal(linkView.sourceMagnet, body);
                // Validation
                assert.ok(validateSpy.calledOnce);
                assert.ok(validateSpy.calledWithExactly(cellView, undefined, undefined, undefined, 'source', linkView));
            });
        });

        QUnit.module('highlighterSelector', function() {

            QUnit.test('highlighting, magnet, validation', function(assert) {

                cell.attr(['root', 'highlighterSelector'], 'body');
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
                linkView.pointermove(evt, cellCenter.x, cellCenter.y);
                // Highlight
                assert.ok(highlightSpy.calledOnce);
                assert.ok(highlightSpy.calledWithExactly(cellView, body, sinon.match({ connecting: true })));
                assert.notOk(unhighlightSpy.called);
                linkView.pointerup(evt, cellCenter.x, cellCenter.y);
                // Unhighlight
                assert.ok(unhighlightSpy.calledOnce);
                assert.ok(unhighlightSpy.calledWithExactly(cellView, body, sinon.match({ connecting: true })));
                assert.notOk(highlightSpy.callCount > 1);
                assert.equal(linkView.sourceMagnet, null);
                // Validation
                assert.ok(validateSpy.calledOnce);
                assert.ok(validateSpy.calledWithExactly(cellView, undefined, undefined, undefined, 'source', linkView));
            });

            QUnit.test('port highlighting, validation', function(assert) {

                cell.prop('ports', {
                    groups: {
                        'group1': {
                            markup: [{
                                position: 'bottom',
                                tagName: 'rect',
                                selector: 'portBody',
                                attributes: {
                                    'width': 20,
                                    'height': 20,
                                    'x': -10,
                                    'y': -10,
                                    'fill': 'white',
                                    'stroke': 'black'
                                }
                            }],
                            attrs: {
                                portBody: {
                                    highlighterSelector: 'root',
                                    magnet: true,
                                    rx: 10,
                                    ry: 10
                                }
                            }
                        }
                    }
                });

                cell.addPort({ id: 'port1', group: 'group1' });

                var body = cellView.findPortNode('port1', 'portBody');
                var root = cellView.findPortNode('port1', 'root');

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
                var portPosition = cell.getPortsPositions('group1')['port1'];
                var portCenter = cell.position().offset(portPosition.x, portPosition.y);
                var evt = { type: 'mousemove' };
                linkView.startArrowheadMove('source');
                evt.target = paper.el;
                linkView.pointermove(evt, portCenter.x, portCenter.y);
                evt.target = body;
                linkView.pointermove(evt, portCenter.x, portCenter.y);
                // Highlight
                assert.ok(highlightSpy.calledOnce);
                assert.ok(highlightSpy.calledWithExactly(cellView, root, sinon.match({ connecting: true })));
                assert.notOk(unhighlightSpy.called);
                linkView.pointerup(evt, portCenter.x, portCenter.y);
                // Unhighlight
                assert.ok(unhighlightSpy.calledOnce);
                assert.ok(unhighlightSpy.calledWithExactly(cellView, root, sinon.match({ connecting: true })));
                assert.notOk(highlightSpy.callCount > 1);
                assert.equal(linkView.sourceMagnet, body);
                // Validation
                assert.ok(validateSpy.calledOnce);
                assert.ok(validateSpy.calledWithExactly(cellView, body, undefined, undefined, 'source', linkView));
            });
        });


    });

    QUnit.module('Calc()', function(hooks) {

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
            node = cellView.el.querySelector('path');
        });

        hooks.afterEach(function() {
            paper.remove();
        });

        QUnit.test('calculates an expression', function(assert) {
            var ns = joint.dia.attributes;
            [
                // sanity
                ['', ''],
                ['M 0 0 10 10', 'M 0 0 10 10'],
                ['calc(w)', String(WIDTH)],
                ['calc(h)', String(HEIGHT)],
                ['calc(s)', String(Math.min(WIDTH, HEIGHT))],
                ['calc(l)', String(Math.max(WIDTH, HEIGHT))],
                ['calc(d)', String(Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT))],
                // multiply
                ['calc(2*w)', String(WIDTH * 2)],
                ['calc(2*h)', String(HEIGHT * 2)],
                ['calc(0.5*w)', String(WIDTH / 2)],
                ['calc(0.5*h)', String(HEIGHT / 2)],
                ['calc(-.5*w)', String(WIDTH / -2)],
                ['calc(-.5*h)', String(HEIGHT / -2)],
                ['calc(1e-1*w)', String(WIDTH * 1e-1)],
                ['calc(1e-1*h)', String(HEIGHT * 1e-1)],
                // add
                ['calc(w+10)', String(WIDTH + 10)],
                ['calc(h+10)', String(HEIGHT + 10)],
                ['calc(w+10.5)', String(WIDTH + 10.5)],
                ['calc(h+10.5)', String(HEIGHT + 10.5)],
                ['calc(w-10)', String(WIDTH - 10)],
                ['calc(h-10)', String(HEIGHT - 10)],
                ['calc(2*w+10)', String(WIDTH * 2 + 10)],
                ['calc(2*h+10)', String(HEIGHT * 2 + 10)],
                // spaces
                ['calc( 2 * w + 10 )', String(WIDTH * 2 + 10)],
                ['calc( 2 * h + 10 )', String(HEIGHT * 2 + 10)],
                // multiple expressions
                ['M 0 0 calc(w) calc(h) 200 200', 'M 0 0 ' + WIDTH + ' ' + HEIGHT + ' 200 200'],
                ['M 0 0 calc(w+10) calc(h+10)', 'M 0 0 ' + (WIDTH + 10) + ' ' + (HEIGHT + 10)],
                ['M 0 0 calc(1*w-10) calc(1*h-10)', 'M 0 0 ' + (WIDTH - 10) + ' ' + (HEIGHT - 10)],
                // misc
                ['M 0 0 calc(10 0', 'M 0 0 calc(10 0']
            ].forEach(function(testCase) {
                var attrs = ns.d.set.call(cellView, testCase[0], refBBox.clone(), node, {});
                assert.deepEqual(attrs, { d: testCase[1] });
            });
        });

        QUnit.test('throws error when invalid', function(assert) {
            var ns = joint.dia.attributes;
            [
                'calc()',
                'calc(10)',
                'calc(w+(10))',
                'calc(2*i+10)',
                'calc(10+2*w)',
            ].forEach(function(testCase) {
                assert.throws(
                    function() {
                        ns.d.set.call(cellView, testCase,  refBBox.clone(), node, {});
                    },
                    /Invalid calc\(\) expression/,
                    testCase
                );
            });
        });
    });
});


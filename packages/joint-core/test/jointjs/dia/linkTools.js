QUnit.module('linkTools', function(hooks) {

    var paper, graph, paperEl, link, linkView;

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
        var element1 = new joint.shapes.standard.Rectangle({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 }
        });
        element1.addTo(graph);
        var element2 = new joint.shapes.standard.Rectangle({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 }
        });
        element2.addTo(graph);

        link = new joint.shapes.standard.Link({
            target: { id: element1.id },
            source: { id: element2.id }
        });
        link.addTo(graph);

        linkView = link.findView(paper);
    });

    hooks.afterEach(function() {

        if (paper) paper.remove();
        paper = null;
        paperEl = null;
        graph = null;
        link = null;
        linkView = null;
    });

    QUnit.module('Mount & Unmount', function() {

        QUnit.test('are mounted and unmounted with the link view', function(assert) {
            const remove = new joint.linkTools.Remove();
            const toolsView = new joint.dia.ToolsView({ tools: [remove] });
            linkView.addTools(toolsView);
            assert.ok(toolsView.el.parentNode);
            assert.ok(toolsView.isMounted());
            paper.dumpViews({ viewport: () => false });
            assert.notOk(toolsView.el.parentNode);
            assert.notOk(toolsView.isMounted());
            paper.dumpViews({ viewport: () => true });
            assert.ok(toolsView.el.parentNode);
            assert.ok(toolsView.isMounted());
        });
    });

    QUnit.module('TargetAnchor', function() {
        [{
            resetAnchor: true,
            resultAnchor: undefined
        }, {
            resetAnchor: false,
            resultAnchor: { name: 'bottomRight' }
        }, {
            resetAnchor: { name: 'topLeft' },
            resultAnchor: { name: 'topLeft' }
        }].forEach(function(testCase) {
            QUnit.test('resetAnchor (' + JSON.stringify(testCase.resetAnchor) + ')', function(assert) {
                link.prop(['target', 'anchor'], { name: 'bottomRight' });
                var anchor = new joint.linkTools.TargetAnchor({ resetAnchor: testCase.resetAnchor });
                linkView.addTools(new joint.dia.ToolsView({ tools: [anchor] }));
                anchor.onPointerDblClick(/* evt */);
                assert.deepEqual(link.prop(['target', 'anchor']), testCase.resultAnchor);
            });
        });

        QUnit.test('No area', function(assert) {
            const CustomAnchor = joint.linkTools.TargetAnchor.extend({
                children: [{
                    tagName: 'circle',
                    selector: 'anchor',
                    attributes: {
                        'cursor': 'pointer'
                    }
                }]
            });
            const anchor = new CustomAnchor();
            linkView.addTools(new joint.dia.ToolsView({ tools: [anchor] }));
            assert.ok(true, 'The anchor tool does not require an area node.');
        });

        QUnit.test('No anchor', function(assert) {
            const CustomAnchor = joint.linkTools.TargetAnchor.extend({
                children: [{
                    tagName: 'rect',
                    selector: 'area',
                    attributes: {
                        'pointer-events': 'none',
                        'fill': 'none',
                        'stroke': '#33334F',
                        'stroke-dasharray': '2,4',
                        'rx': 5,
                        'ry': 5
                    }
                }]
            });
            const anchor = new CustomAnchor();
            linkView.addTools(new joint.dia.ToolsView({ tools: [anchor] }));
            assert.ok(true, 'The anchor tool does not require an anchor node.');
        });

        QUnit.test('Element area bounding box', function(assert) {
            paper.translate(11, 13);
            const areaPadding = 7;
            const anchor = new joint.linkTools.TargetAnchor({ areaPadding });
            linkView.addTools(new joint.dia.ToolsView({ tools: [anchor] }));
            anchor.toggleArea(true);
            const areaBBox = V(anchor.childNodes.area).getBBox({ target: paper.viewport });
            assert.checkBboxApproximately(1e-6, areaBBox, link.getTargetCell().getBBox().inflate(areaPadding));
        });

        QUnit.test('Link area bounding box', function(assert) {
            const link2 = new joint.shapes.standard.Link({
                source: { x: 100, y: 100 },
                target: { x: 200, y: 200 }
            });
            graph.addCell(link2);
            link.target(link2);
            paper.translate(11, 13);
            const areaPadding = 7;
            const anchor = new joint.linkTools.TargetAnchor({ areaPadding });
            linkView.addTools(new joint.dia.ToolsView({ tools: [anchor] }));
            anchor.toggleArea(true);
            const areaBBox = V(anchor.childNodes.area).getBBox({ target: paper.viewport });
            assert.checkBboxApproximately(1e-6, areaBBox, link.getTargetCell().getBBox().inflate(areaPadding));
        });
    });

    QUnit.module('SourceAnchor', function() {
        [{
            resetAnchor: true,
            resultAnchor: undefined
        }, {
            resetAnchor: false,
            resultAnchor: { name: 'bottomRight' }
        }, {
            resetAnchor: { name: 'topLeft' },
            resultAnchor: { name: 'topLeft' }
        }].forEach(function(testCase) {
            QUnit.test('resetAnchor (' + JSON.stringify(testCase.resetAnchor) + ')', function(assert) {
                link.prop(['source', 'anchor'], { name: 'bottomRight' });
                var anchor = new joint.linkTools.SourceAnchor({ resetAnchor: testCase.resetAnchor });
                linkView.addTools(new joint.dia.ToolsView({ tools: [anchor] }));
                anchor.onPointerDblClick(/* evt */);
                assert.deepEqual(link.prop(['source', 'anchor']), testCase.resultAnchor);
            });
        });

        QUnit.test('Element area bounding box', function(assert) {
            paper.translate(11, 13);
            const areaPadding = 7;
            const anchor = new joint.linkTools.SourceAnchor({ areaPadding });
            linkView.addTools(new joint.dia.ToolsView({ tools: [anchor] }));
            anchor.toggleArea(true);
            const areaBBox = V(anchor.childNodes.area).getBBox({ target: paper.viewport });
            assert.checkBboxApproximately(1e-6, areaBBox, link.getSourceCell().getBBox().inflate(areaPadding));
        });

        QUnit.test('Link area bounding box', function(assert) {
            const link2 = new joint.shapes.standard.Link({
                source: { x: 100, y: 100 },
                target: { x: 200, y: 200 }
            });
            graph.addCell(link2);
            link.source(link2);
            paper.translate(11, 13);
            const areaPadding = 7;
            const anchor = new joint.linkTools.SourceAnchor({ areaPadding });
            linkView.addTools(new joint.dia.ToolsView({ tools: [anchor] }));
            anchor.toggleArea(true);
            const areaBBox = V(anchor.childNodes.area).getBBox({ target: paper.viewport });
            assert.checkBboxApproximately(1e-6, areaBBox, link.getSourceCell().getBBox().inflate(areaPadding));
        });
    });

    QUnit.module('Connect', function() {
        QUnit.test('options: magnet', function(assert) {
            var newLink;
            var defaultLinkSpy = sinon.spy(function() {
                newLink = new joint.shapes.standard.Link();
                return newLink;
            });
            // magnet defined as a function
            var magnetSpy = sinon.spy(function(view) {
                return view.findBySelector('line')[0];
            });
            paper.options.defaultLink = defaultLinkSpy;
            var connect = new joint.linkTools.Connect({ magnet: magnetSpy });
            linkView.addTools(new joint.dia.ToolsView({ tools: [connect] }));
            var evt = {};
            connect.dragstart(evt);
            connect.drag(evt);
            connect.dragend(evt);
            assert.ok(newLink);
            assert.equal(defaultLinkSpy.callCount, 1);
            assert.equal(magnetSpy.callCount, 1);
            assert.ok(magnetSpy.calledWithExactly(linkView, connect));
            assert.deepEqual(newLink.source(), { id: link.id, magnet: 'line' });
            assert.ok(magnetSpy.calledOn(connect));
            // magnet defined as an SVGElement
            connect.options.magnet = linkView.findBySelector('wrapper')[0];
            evt = {};
            connect.dragstart(evt);
            connect.drag(evt);
            connect.dragend(evt);
            assert.equal(defaultLinkSpy.callCount, 2);
            assert.deepEqual(newLink.source(), { id: link.id, magnet: 'wrapper' });
            // magnet defined as a selector
            connect.options.magnet = 'line';
            evt = {};
            connect.dragstart(evt);
            connect.drag(evt);
            connect.dragend(evt);
            assert.equal(defaultLinkSpy.callCount, 3);
            assert.deepEqual(newLink.source(), { id: link.id, magnet: 'line' });
            // invalid magnet
            connect.options.magnet = 1;
            evt = {};
            assert.throws(function() {
                connect.dragstart(evt);
            }, /Connect: magnet must be an SVGElement/);
        });
    });

    QUnit.test('Rendering', function(assert) {
        paper.options.defaultConnectionPoint = { name: 'anchor' };
        link.remove();
        paper.freeze();
        link.addTo(graph);
        var target = link.getTargetCell();
        target.position(300, 100);
        link.vertices([{ x: 200, y: 200 }]);
        var vertices = new joint.linkTools.Vertices();
        var boundary = new joint.linkTools.Boundary({ padding: 0 });
        var toolsView = new joint.dia.ToolsView({
            tools: [
                boundary,
                vertices
            ]
        });
        var spy = sinon.spy(toolsView, 'update');
        link.findView(paper).addTools(toolsView);
        assert.equal(spy.callCount, 0);
        assert.notOk(toolsView.isRendered);
        paper.unfreeze();
        assert.equal(spy.callCount, 1);
        assert.ok(toolsView.isRendered);
        assert.equal(boundary.vel.getBBox().toString(), '150@150 350@200');
        assert.equal(vertices.vel.getBBox().toString(), '150@150 350@206');
        assert.equal(vertices.vel.children().length, 2);
        target.translate(10, 10);
        assert.equal(spy.callCount, 2);
        link.remove();
        assert.equal(spy.callCount, 2);
    });

    QUnit.module('options', function() {

        [
            joint.dia.Paper.Layers.TOOLS,
            joint.dia.Paper.Layers.FRONT
        ].forEach(function(layer) {

            QUnit.test('> layer = "' + layer + '", z = number', function(assert) {

                var link2 = new joint.shapes.standard.Link();
                var link3 = new joint.shapes.standard.Link();
                graph.addCells(link2, link3);

                var toolsLayerNode = paper.getLayerNode(layer);
                var t1 = new joint.dia.ToolsView({ z: 2, tools: [], layer: layer });
                var t2 = new joint.dia.ToolsView({ z: 3, tools: [], layer: layer });
                var t3 = new joint.dia.ToolsView({ z: 1, tools: [], layer: layer });

                linkView.addTools(t1);
                link2.findView(paper).addTools(t2);
                link3.findView(paper).addTools(t3);

                assert.equal(toolsLayerNode.children.length, 3);
                assert.equal(toolsLayerNode.childNodes.length, 6);
                assert.equal(toolsLayerNode.children[0], t3.el);
                assert.equal(toolsLayerNode.children[1], t1.el);
                assert.equal(toolsLayerNode.children[2], t2.el);
            });
        });
    });



});

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


});

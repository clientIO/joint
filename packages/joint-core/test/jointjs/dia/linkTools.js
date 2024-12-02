QUnit.module('linkTools', function(hooks) {

    var paper, graph, paperEl, link, linkView;

    hooks.beforeEach(function() {

        var fixtureEl = document.getElementById('qunit-fixture') || document.createElement('div');
        paperEl = document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        fixtureEl.appendChild(paperEl);
        document.body.appendChild(fixtureEl);

        graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        paper = new joint.dia.Paper({
            el: paperEl,
            model: graph,
            cellViewNamespace: joint.shapes,
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

        QUnit.test('are not mounted when none of the tools is visible', function(assert) {
            let isVisible = false;
            const button1 = new joint.linkTools.Button({ visibility: () => isVisible });
            const button2 = new joint.linkTools.Button({ visibility: () => false });
            const toolsView = new joint.dia.ToolsView({ tools: [button1, button2] });
            linkView.addTools(toolsView);
            assert.notOk(toolsView.el.parentNode);
            assert.notOk(toolsView.isMounted());
            toolsView.update();
            assert.notOk(toolsView.el.parentNode);
            assert.notOk(toolsView.isMounted());
            isVisible = true;
            toolsView.update();
            assert.ok(toolsView.el.parentNode);
            assert.ok(toolsView.isMounted());
        });
    });

    QUnit.module('Visibility', function() {

        QUnit.test('isVisible()', function(assert) {
            const remove = new joint.linkTools.Remove();
            assert.ok(remove.isVisible());
            remove.hide();
            assert.notOk(remove.isVisible());
            remove.show();
            assert.ok(remove.isVisible());
        });

        QUnit.test('updateVisibility()', function(assert) {
            const remove = new joint.linkTools.Remove();
            const toolsView = new joint.dia.ToolsView({ tools: [remove] });
            linkView.addTools(toolsView);
            assert.notEqual(getComputedStyle(remove.el).display, 'none');
            remove.hide();
            assert.equal(getComputedStyle(remove.el).display, 'none');
            remove.show();
            assert.notEqual(getComputedStyle(remove.el).display, 'none');
        });

        QUnit.module('option: visibility', function(assert) {

            QUnit.test('is visible or hidden', function(assert) {
                let isVisible = true;
                const visibilitySpy = sinon.spy(() => isVisible);
                const removeButton = new joint.linkTools.Remove({
                    visibility: visibilitySpy
                });
                const otherButton = new joint.linkTools.Button();
                const toolsView = new joint.dia.ToolsView({
                    tools: [
                        removeButton,
                        otherButton
                    ]
                });
                linkView.addTools(toolsView);

                // Initial state.
                assert.notEqual(getComputedStyle(removeButton.el).display, 'none');
                assert.ok(removeButton.isVisible());
                assert.equal(visibilitySpy.callCount, 1);
                assert.ok(visibilitySpy.calledWithExactly(linkView, removeButton));
                assert.ok(visibilitySpy.calledOn(removeButton));

                // Visibility function should be called on update.
                isVisible = false;
                toolsView.update();
                assert.equal(getComputedStyle(removeButton.el).display, 'none');
                assert.notOk(removeButton.isVisible());
                assert.ok(removeButton.isExplicitlyVisible());
                assert.equal(visibilitySpy.callCount, 2);
                assert.ok(visibilitySpy.calledWithExactly(linkView, removeButton));
                assert.ok(visibilitySpy.calledOn(removeButton));

                // Other button should not be affected by the visibility function.
                assert.notEqual(getComputedStyle(otherButton.el).display, 'none');
                assert.ok(otherButton.isVisible());

                // Focus & blur on other button should not change the visibility of
                // the remove button.
                toolsView.focusTool(otherButton);
                assert.equal(getComputedStyle(removeButton.el).display, 'none');
                assert.notOk(removeButton.isVisible());
                assert.notOk(removeButton.isExplicitlyVisible());
                toolsView.blurTool(otherButton);
                assert.equal(getComputedStyle(removeButton.el).display, 'none');
                assert.notOk(removeButton.isVisible());
                assert.ok(removeButton.isExplicitlyVisible());

                isVisible = true;
                toolsView.update();
                toolsView.focusTool(otherButton);
                assert.equal(getComputedStyle(removeButton.el).display, 'none');
                assert.notOk(removeButton.isVisible());
                assert.notOk(removeButton.isExplicitlyVisible());
                toolsView.blurTool(otherButton);
                assert.notEqual(getComputedStyle(removeButton.el).display, 'none');
                assert.ok(removeButton.isVisible());
                assert.ok(removeButton.isExplicitlyVisible());
            });

            QUnit.test('it\'s not updated when hidden', function(assert) {
                const button1 = new joint.linkTools.Button({
                    visibility: () => false
                });
                const button2 = new joint.linkTools.Button({
                    visibility: () => true
                });
                const button1UpdateSpy = sinon.spy(button1, 'update');
                const button2UpdateSpy = sinon.spy(button2, 'update');
                const toolsView = new joint.dia.ToolsView({
                    tools: [button1, button2]
                });
                linkView.addTools(toolsView);
                assert.equal(button1.update.callCount, 0);
                assert.equal(button2.update.callCount, 1);
                toolsView.update();
                assert.equal(button1.update.callCount, 0);
                assert.equal(button2.update.callCount, 2);
                button1.show();
                button2.hide();
                toolsView.update();
                assert.equal(button1.update.callCount, 0);
                assert.equal(button2.update.callCount, 2);
                toolsView.focusTool(null); // hide all
                assert.equal(button1.update.callCount, 0);
                assert.equal(button2.update.callCount, 2);
                toolsView.blurTool(null); // show all
                assert.equal(button1.update.callCount, 0);
                assert.equal(button2.update.callCount, 3);
                button1UpdateSpy.restore();
                button2UpdateSpy.restore();
            });
        });


        QUnit.test('show()', function(assert) {
            paper.freeze();
            const remove = new joint.linkTools.Vertices();
            const toolsView = new joint.dia.ToolsView({ tools: [remove] });
            linkView.addTools(toolsView);
            linkView.hideTools();
            paper.unfreeze();
            assert.notOk(toolsView.isRendered);
            assert.notOk(toolsView.el.isConnected);
            linkView.showTools();
            assert.ok(toolsView.isRendered);
            assert.ok(toolsView.el.isConnected);
        });
    });

    QUnit.module('RotateLabel', function() {

        QUnit.test('postponed rendering', function(assert) {
            const button = new joint.linkTools.RotateLabel({ labelIndex: 0 });
            const toolsView = new joint.dia.ToolsView({
                tools: [button]
            });
            linkView.addTools(toolsView);
            // The button should not be visible because there is no label yet.
            assert.notOk(link.label(0));
            assert.equal(button.el.style.display, 'none');
            assert.notOk(toolsView.isRendered);
            // The button should be rendered after the label is added.
            link.appendLabel({});
            assert.ok(link.label(0));
            assert.notEqual(button.el.style.display, 'none');
            assert.ok(toolsView.isRendered);
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
                return view.findNode('line');
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
            connect.options.magnet = linkView.findNode('wrapper');
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

    QUnit.module('TargetArrowhead', function() {

        QUnit.test('events', function(assert) {

            const arrowhead = new joint.linkTools.TargetArrowhead();
            linkView.addTools(new joint.dia.ToolsView({ tools: [arrowhead] }));
            const listener = new joint.mvc.Listener();
            const events = [];

            listener.listenTo(paper, {
                'all': (eventName) => events.push(eventName)
            });

            // Make sure the link is connected to a target element
            assert.ok(link.getTargetCell());

            simulate.mousedown({ el: arrowhead.el });
            simulate.mousemove({ el: paper.el });
            simulate.mouseup({ el: paper.el });

            assert.deepEqual(
                events.filter((event) => event !== 'render:done'),
                [
                    'cell:pointerdown',
                    'link:pointerdown',
                    'cell:pointermove',
                    'link:pointermove',
                    'link:disconnect',
                    'link:pointerup',
                    'cell:pointerup',
                    'cell:mouseleave',
                    'link:mouseleave',
                ]
            );

            listener.stopListening();
        });

        QUnit.test('data', function(assert) {

            assert.expect(3);

            const arrowhead = new joint.linkTools.TargetArrowhead();
            linkView.addTools(new joint.dia.ToolsView({ tools: [arrowhead] }));
            const listener = new joint.mvc.Listener();

            listener.listenTo(paper, {
                'link:pointerdown': (linkView, evt) => evt.data.test = true,
                'link:pointermove': (linkView, evt) => assert.ok(evt.data.test),
                'link:pointerup': (linkView, evt) => assert.ok(evt.data.test),
            });

            // Make sure the link is connected to a target element
            assert.ok(link.getTargetCell());

            simulate.mousedown({ el: arrowhead.el });
            simulate.mousemove({ el: paper.el });
            simulate.mouseup({ el: paper.el });

            listener.stopListening();
        });
    });

    QUnit.module('Vertices', function() {
        QUnit.test('vertexAdding', function(assert) {
            // vertexAdding = true
            const vertices1 = new joint.linkTools.Vertices({
                vertexAdding: true
            });
            linkView.addTools(new joint.dia.ToolsView({ tools: [vertices1] }));
            assert.ok(vertices1.el.querySelector('.joint-vertices-path'));
            assert.notOk(linkView.el.querySelector('.joint-vertices-path'));
            linkView.removeTools();
            // vertexAdding = false
            const vertices2 = new joint.linkTools.Vertices({
                vertexAdding: false
            });
            linkView.addTools(new joint.dia.ToolsView({ tools: [vertices2] }));
            assert.notOk(vertices2.el.querySelector('.joint-vertices-path'));
            assert.notOk(linkView.el.querySelector('.joint-vertices-path'));
            linkView.removeTools();
            // interactiveLinkNode selector
            const selector = 'wrapper';
            const vertices3 = new joint.linkTools.Vertices({
                vertexAdding: { interactiveLinkNode: selector }
            });
            linkView.addTools(new joint.dia.ToolsView({ tools: [vertices3] }));
            assert.notOk(vertices3.el.querySelector('.joint-vertices-path'));
            assert.ok(linkView.el.querySelector('.joint-vertices-path'));
            assert.ok(joint.mvc.$.event.has(linkView.findNode(selector)));
            assert.ok(linkView.findNode(selector).classList.contains('joint-vertices-path'));
            linkView.removeTools();
            assert.notOk(linkView.el.querySelector('.joint-vertices-path'));
            assert.notOk(linkView.findNode(selector).classList.contains('joint-vertices-path'));
            assert.notOk(joint.mvc.$.event.has(linkView.findNode(selector)));
        });
    });

    QUnit.module('Button', function() {

        QUnit.test('distance as number', function(assert) {
            const targetX = 333;
            const distance = -17;
            const button = new joint.linkTools.Button({ distance });
            linkView.addTools(new joint.dia.ToolsView({ tools: [button] }));
            // move the target cell to the right, to make the link horizontal
            link.getTargetCell().position(targetX, link.getSourceCell().position().x);
            assert.equal(button.el.getCTM().e, targetX + distance);
        });

        QUnit.test('distance as function', function(assert) {
            const targetX = 333;
            const distance = -17;
            const distanceSpy = sinon.spy(() => distance);
            const button = new joint.linkTools.Button({ distance: distanceSpy });
            linkView.addTools(new joint.dia.ToolsView({ tools: [button] }));
            assert.ok(distanceSpy.calledOnce);
            assert.ok(distanceSpy.calledWithExactly(linkView, button));
            assert.ok(distanceSpy.calledOn(button));
            // move the target cell to the right, to make the link horizontal
            link.getTargetCell().position(targetX, link.getSourceCell().position().x);
            assert.ok(distanceSpy.calledTwice);
            assert.equal(button.el.getCTM().e, targetX + distance);
        });
    });

});

QUnit.module('paper inside a shadow root', function(hooks) {

    let hostEl;
    let graph;
    let paper;

    // `composed: true` lets the event cross the shadow boundary, as user events do,
    // so it reaches the listeners on the `document`.
    function dispatchMouseEvent(el, type, point) {
        el.dispatchEvent(new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            clientX: point.x,
            clientY: point.y
        }));
    }

    function getClientCenter(cell) {
        return paper.localToClientPoint(cell.getBBox().center());
    }

    function getBodyNode(cell) {
        return paper.findViewByModel(cell).findNode('body');
    }

    hooks.beforeEach(function() {
        const fixtureEl = document.getElementById('qunit-fixture') || document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        document.body.appendChild(fixtureEl);
        hostEl = document.createElement('div');
        // Keep the paper inside the viewport, so `elementFromPoint()` can find its nodes.
        hostEl.style.position = 'fixed';
        hostEl.style.left = '0px';
        hostEl.style.top = '0px';
        fixtureEl.appendChild(hostEl);
        const shadowRoot = hostEl.attachShadow({ mode: 'open' });
        graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        paper = new joint.dia.Paper({
            model: graph,
            cellViewNamespace: joint.shapes,
            width: 600,
            height: 400,
            linkPinning: false
        });
        shadowRoot.appendChild(paper.el);
    });

    hooks.afterEach(function() {
        paper.remove();
        hostEl.remove();
        paper = null;
        graph = null;
        hostEl = null;
    });

    QUnit.module('pointerclick', function() {

        QUnit.test('triggers element:pointerclick when an element is clicked', function(assert) {
            const element = new joint.shapes.standard.Rectangle({
                position: { x: 100, y: 100 },
                size: { width: 100, height: 100 }
            });
            graph.addCell(element);
            const elementClickSpy = sinon.spy();
            const blankClickSpy = sinon.spy();
            paper.on('element:pointerclick', elementClickSpy);
            paper.on('blank:pointerclick', blankClickSpy);

            const node = getBodyNode(element);
            const point = getClientCenter(element);
            dispatchMouseEvent(node, 'mousedown', point);
            dispatchMouseEvent(node, 'mouseup', point);

            assert.ok(elementClickSpy.calledOnce);
            assert.equal(elementClickSpy.firstCall.args[0], paper.findViewByModel(element));
            assert.equal(elementClickSpy.firstCall.args[1].target, node);
            assert.ok(blankClickSpy.notCalled);
        });

        QUnit.test('triggers blank:pointerclick when the blank area is clicked', function(assert) {
            const blankClickSpy = sinon.spy();
            paper.on('blank:pointerclick', blankClickSpy);

            const point = paper.localToClientPoint({ x: 50, y: 50 });
            dispatchMouseEvent(paper.svg, 'mousedown', point);
            dispatchMouseEvent(paper.svg, 'mouseup', point);

            assert.ok(blankClickSpy.calledOnce);
        });
    });

    QUnit.module('mouseleave', function() {

        QUnit.test('is not triggered when the pointer is released over the dragged element', function(assert) {
            const element = new joint.shapes.standard.Rectangle({
                position: { x: 100, y: 100 },
                size: { width: 100, height: 100 }
            });
            graph.addCell(element);
            const mouseleaveSpy = sinon.spy();
            paper.on('element:mouseleave', mouseleaveSpy);

            const node = getBodyNode(element);
            const point = getClientCenter(element);
            dispatchMouseEvent(node, 'mouseover', point);
            dispatchMouseEvent(node, 'mousedown', point);
            const endPoint = { x: point.x + 20, y: point.y + 20 };
            dispatchMouseEvent(node, 'mousemove', endPoint);
            dispatchMouseEvent(node, 'mouseup', endPoint);

            assert.deepEqual(element.position().toJSON(), { x: 120, y: 120 });
            assert.ok(mouseleaveSpy.notCalled);
        });
    });

    QUnit.module('arrowhead', function(hooks) {

        let source;
        let target;
        let other;
        let link;

        hooks.beforeEach(function() {
            source = new joint.shapes.standard.Rectangle({
                position: { x: 50, y: 50 },
                size: { width: 100, height: 60 }
            });
            target = new joint.shapes.standard.Rectangle({
                position: { x: 350, y: 50 },
                size: { width: 100, height: 60 }
            });
            other = new joint.shapes.standard.Rectangle({
                position: { x: 350, y: 250 },
                size: { width: 100, height: 60 }
            });
            link = new joint.shapes.standard.Link({
                source: { id: source.id },
                target: { id: target.id }
            });
            graph.addCells([source, target, other, link]);
            const linkView = paper.findViewByModel(link);
            linkView.addTools(new joint.dia.ToolsView({
                tools: [new joint.linkTools.TargetArrowhead()]
            }));
        });

        function startArrowheadDrag() {
            const arrowheadNode = paper.el.querySelector('.target-arrowhead');
            const point = paper.localToClientPoint(paper.findViewByModel(link).targetPoint);
            dispatchMouseEvent(arrowheadNode, 'mousedown', point);
            return arrowheadNode;
        }

        QUnit.test('connects to the element the arrowhead is dropped on', function(assert) {
            startArrowheadDrag();
            const node = getBodyNode(other);
            const point = getClientCenter(other);
            dispatchMouseEvent(node, 'mousemove', point);
            dispatchMouseEvent(node, 'mouseup', point);

            assert.equal(link.target().id, other.id);
        });

        QUnit.test('snapLinksSelf: connects to the element at the snapped point', function(assert) {
            paper.options.snapLinksSelf = { radius: 30 };
            const arrowheadNode = startArrowheadDrag();
            const sourceCenter = source.getBBox().center();
            const point = paper.localToClientPoint(sourceCenter.offset(10, 10));
            dispatchMouseEvent(arrowheadNode, 'mousemove', point);
            dispatchMouseEvent(arrowheadNode, 'mouseup', point);

            assert.equal(link.target().id, source.id);
        });
    });
});

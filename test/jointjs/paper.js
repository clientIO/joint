QUnit.module('paper', function(hooks) {

    hooks.beforeEach(function() {

        var $fixture = $('#qunit-fixture');
        var $paper = $('<div/>');
        $fixture.append($paper);

        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({
            el: $paper,
            gridSize: 10,
            model: this.graph
        });
    });

    hooks.afterEach(function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });

    QUnit.test('paper.addCell() number of sortViews()', function(assert) {

        var spy = sinon.spy(this.paper, 'sortViews');

        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;
        var r3 = new joint.shapes.basic.Rect;

        this.graph.addCell(r1);

        assert.equal(spy.callCount, 1, 'sort the views one time per each addCell()');

        this.graph.addCell(r2);

        assert.equal(spy.callCount, 2, 'sort the views one time per each addCell()');

        this.graph.addCell(r3);

        assert.equal(spy.callCount, 3, 'sort the views one time per each addCell()');

    });

    QUnit.test('paper.addCells() number of sortViews()', function(assert) {

        var spy = sinon.spy(this.paper, 'sortViews');

        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;
        var r3 = new joint.shapes.basic.Rect;
        var r4 = new joint.shapes.basic.Rect;

        this.graph.addCells([r1, r2]);

        assert.equal(spy.callCount, 1, 'sort the views one time per each addCells()');

        this.graph.addCells([r3, r4]);

        assert.equal(spy.callCount, 2, 'sort the views one time per each addCells()');

    });

    QUnit.test('async paper.addCells() should not throw on non-flat array', function(assert) {

        assert.expect(2);
        var done = assert.async();

        var a = new joint.shapes.basic.Rect;
        var b = new joint.shapes.basic.Rect;
        var c = new joint.shapes.basic.Rect;

        this.paper.options.async = { batchSize: 1 };

        this.paper.on('render:done', function() {
            assert.equal(this.graph.getCells().length, 3);
            assert.equal(this.paper.findViewsInArea(g.rect(-10, -10, 500, 500)).length, 3);
            done();
        }, this);

        this.paper.model.addCells([[a], [b, [c]]]);
    });

    QUnit.test('paper.resetViews()', function(assert) {

        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;
        var r3 = new joint.shapes.basic.Rect;

        var viewport = V(this.paper.viewport);

        viewport.append(V('rect').addClass('not-a-cell'));

        this.graph.addCell(r1);

        var r1View = this.paper.findViewByModel(r1);
        var $r1 = r1View.$el;

        this.graph.resetCells([r2, r3]);

        assert.equal(this.graph.get('cells').length, 2, 'previous cells were removed from the graph after calling graph.resetCells()');
        assert.ok(!$r1 || !$.contains(this.paper.$el[0], $r1[0]), 'previous cells were removed from the paper after calling graph.resetCells()');
        assert.equal(viewport.find('.not-a-cell').length, 1, 'should not remove non-cell DOM elements from viewport');
    });

    QUnit.test('graph.fromJSON(), graph.toJSON()', function(assert) {

        var json = JSON.parse('{"cells":[{"type":"basic.Circle","size":{"width":100,"height":60},"position":{"x":110,"y":480},"id":"bbb9e641-9756-4f42-997a-f4818b89f374","embeds":"","z":0},{"type":"link","source":{"id":"bbb9e641-9756-4f42-997a-f4818b89f374"},"target":{"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6"},"id":"b4289c08-07ea-49d2-8dde-e67eb2f2a06a","z":1},{"type":"basic.Rect","position":{"x":420,"y":410},"size":{"width":100,"height":60},"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6","embeds":"","z":2}]}');

        this.graph.fromJSON(json);

        assert.equal(this.graph.get('cells').length, 3, 'all the cells were reconstructed from JSON');

        // Check that the link is before the last cell in the DOM. This check is there because
        // paper might have resorted the cells so that links are always AFTER elements.
        var linkView = this.paper.findViewByModel('b4289c08-07ea-49d2-8dde-e67eb2f2a06a');
        var rectView = this.paper.findViewByModel('cbd1109e-4d34-4023-91b0-f31bce1318e6');
        var circleView = this.paper.findViewByModel('bbb9e641-9756-4f42-997a-f4818b89f374');

        assert.ok(rectView.el.previousSibling === linkView.el, 'link view is before rect element in the DOM');
        assert.ok(linkView.el.previousSibling === circleView.el, 'link view is after circle element in the DOM');

        this.graph.fromJSON(this.graph.toJSON());
        assert.equal(this.graph.get('cells').length, 3, 'all the cells were reconstructed from JSON');

        // Check that the link is before the last cell in the DOM. This check is there because
        // paper might have resorted the cells so that links are always AFTER elements.
        linkView = this.paper.findViewByModel('b4289c08-07ea-49d2-8dde-e67eb2f2a06a');
        rectView = this.paper.findViewByModel('cbd1109e-4d34-4023-91b0-f31bce1318e6');
        circleView = this.paper.findViewByModel('bbb9e641-9756-4f42-997a-f4818b89f374');

        assert.ok(rectView.el.previousSibling === linkView.el, 'link view is before rect element in the DOM');
        assert.ok(linkView.el.previousSibling === circleView.el, 'link view is after circle element in the DOM');
    });

    QUnit.test('contextmenu', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 20, height: 20 } });
        this.graph.resetCells([r1]);

        var cellContextmenuCallback = sinon.spy();
        this.paper.on('cell:contextmenu', cellContextmenuCallback);
        var blankContextmenuCallback = sinon.spy();
        this.paper.on('blank:contextmenu', blankContextmenuCallback);

        var r1View = this.paper.findViewByModel(r1);
        r1View.$el.trigger('contextmenu');
        assert.ok(cellContextmenuCallback.called, 'cell:contextmenu triggered');
        this.paper.$el.trigger('contextmenu');
        assert.ok(blankContextmenuCallback.called, 'blank:contextmenu triggered');
    });

    QUnit.test('paper.getArea()', function(assert) {

        this.paper.setOrigin(0, 0);
        this.paper.setDimensions(1000, 800);

        assert.ok(this.paper.getArea() instanceof g.rect, 'Paper area is a geometry rectangle.');
        assert.deepEqual(
            _.pick(this.paper.getArea(), 'x', 'y', 'width', 'height'),
            { x: 0, y: 0, width: 1000, height: 800 },
            'Paper area returns correct results for unscaled, untranslated viewport.');

        this.paper.setOrigin(100, 100);

        assert.deepEqual(
            _.pick(this.paper.getArea(), 'x', 'y', 'width', 'height'),
            { x: -100, y: -100, width: 1000, height: 800 },
            'Paper area returns correct results for unscaled, but translated viewport.');

        V(this.paper.viewport).scale(2, 2);

        assert.deepEqual(
            _.pick(this.paper.getArea(), 'x', 'y', 'width', 'height'),
            { x: -50, y: -50, width: 500, height: 400 },
            'Paper area returns correct results for scaled and translated viewport.');
    });

    QUnit.test('paper.options: linkView & elementView', function(assert) {

        assert.expect(8);

        var customElementView = joint.dia.ElementView.extend({ custom: true });
        var customLinkView = joint.dia.LinkView.extend({ custom: true });
        var element = new joint.shapes.basic.Rect();
        var link = new joint.dia.Link();

        // Custom View via class

        this.paper.options.elementView = customElementView;
        this.paper.options.linkView = customLinkView;

        this.graph.addCell(element);
        assert.equal(element.findView(this.paper).constructor, customElementView,
            'custom element view used when "elementView" option contains one.');

        this.graph.addCell(link);
        assert.equal(link.findView(this.paper).constructor, customLinkView,
            'custom link view used when "linkView" option contains one.');

        // Custom View via function

        element.remove();
        link.remove();

        this.paper.options.elementView = function(el) {
            assert.ok(el === element,
                '"elementView" option function executed with correct parameters.');
            return customElementView;
        };

        this.paper.options.linkView = function(l) {
            assert.ok(l === link,
                '"linkView" option function executed with correct parameters.');
            return customLinkView;
        };

        this.graph.addCell(element);
        assert.equal(element.findView(this.paper).constructor, customElementView,
            'the custom element view was used when "elementView" option function returns one.');

        this.graph.addCell(link);
        assert.equal(link.findView(this.paper).constructor, customLinkView,
            'the custom link view was used when "linkView" option function returns one.');

        // Default View via function

        element.remove();
        link.remove();

        this.paper.options.elementView = function(el) {
            return null;
        };

        this.paper.options.linkView = function(l) {
            return null;
        };

        this.graph.addCell(element);
        assert.equal(element.findView(this.paper).constructor, joint.dia.ElementView,
            'the default element view was used when "elementView" option function returns no view.');

        this.graph.addCell(link);
        assert.equal(link.findView(this.paper).constructor, joint.dia.LinkView,
            'the default link view was used when "linkView" option function returns no view.');

    });

    QUnit.test('paper.options: cellViewNamespace', function(assert) {

        var customElementView = joint.dia.ElementView.extend({ custom: true });
        var customLinkView = joint.dia.LinkView.extend({ custom: true });
        var element = new joint.shapes.basic.Rect({ type: 'elements.Element' });
        var link = new joint.dia.Link({ type: 'links.Link' });

        this.paper.options.cellViewNamespace = {
            elements: { ElementView: customElementView },
            links: { LinkView: customLinkView }
        };

        this.graph.addCells([element, link]);

        assert.equal(element.findView(this.paper).constructor, customElementView,
            'the custom element view was found in the custom namespace.');

        assert.equal(link.findView(this.paper).constructor, customLinkView,
            'the custom link view was found in the custom namespace.');

    });

    QUnit.module('connect/disconnect event', function(hooks) {

        var connectedLinkView;
        var soloLinkView;
        var disconnectSpy;
        var connectSpy;
        var graphCells = [];

        hooks.beforeEach(function() {
            var source = new joint.shapes.basic.Rect({
                id: 'source',
                position: { x: 100, y: 100 },
                size: { width: 100, height: 100 }
            });
            var target = new joint.shapes.basic.Rect({
                id: 'target',
                position: { x: 400, y: 100 },
                size: { width: 100, height: 100 }
            });
            var solo = new joint.shapes.basic.Rect({
                id: 'solo',
                position: { x: 400, y: 400 },
                size: { width: 100, height: 100 }
            });
            var link = new joint.dia.Link({ id: 'link', source: { id: source.id }, target: { id: target.id } });
            var soloLink = new joint.dia.Link({ id: 'link2', source: { id: source.id }, target: { x: 300, y: 300 } });

            graphCells = [source, target, solo, link, soloLink];
            this.graph.addCells(graphCells);

            connectedLinkView = link.findView(this.paper);
            soloLinkView = soloLink.findView(this.paper);

            disconnectSpy = sinon.spy();
            connectSpy = sinon.spy();
            this.paper.on('link:disconnect', disconnectSpy);
            this.paper.on('link:connect', connectSpy);
        });

        QUnit.test('disconnect from element', function(assert) {

            var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

            connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
            connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove' }, 0, 0);
            connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup' }, 0, 0);

            assert.notOk(connectSpy.called);
            assert.ok(disconnectSpy.calledOnce);
        });

        QUnit.test('disconnect from element, connect to new one', function(assert) {

            var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');
            var soloView = graphCells[2].findView(this.paper);

            connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
            connectedLinkView.pointermove({ target: soloView.el, type: 'mousemove' }, 450, 450);
            connectedLinkView.pointerup({ target: soloView.el, type: 'mouseup' }, 450, 450);

            assert.ok(connectSpy.calledOnce, 'connect to solo');
            assert.ok(disconnectSpy.calledOnce, 'disconnect from source');
        });

        QUnit.test('disconnect from element, connect to same one - nothing changed', function(assert) {

            var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');
            var targetView = graphCells[1].findView(this.paper);

            connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
            connectedLinkView.pointermove({ target: targetView.el, type: 'mousemove' }, 450, 450);
            connectedLinkView.pointerup({ target: targetView.el, type: 'mouseup' }, 450, 150);

            assert.notOk(connectSpy.called, 'connect should not be called');
            assert.notOk(disconnectSpy.called, 'disconnect should not be called');
        });

        QUnit.module('snapLinks enabled', function(hooks) {

            QUnit.test('test name', function(assert) {

                var arrowhead = soloLinkView.el.querySelector('.marker-arrowhead[end=target]');
                var targetView = graphCells[1].findView(this.paper);
                var soloView = graphCells[2].findView(this.paper);

                soloLinkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
                soloLinkView.pointermove({ target: soloView.el, type: 'mousemove' }, 450, 450);
                soloLinkView.pointermove({ target: targetView.el, type: 'mousemove' }, 450, 150);
                soloLinkView.pointerup({ target: targetView.el, type: 'mouseup' }, 450, 450);

                assert.ok(connectSpy.calledOnce, 'connect should be called once');
                assert.notOk(disconnectSpy.called, 'disconnect should not be called');
            });
        });


        QUnit.module('linkPinning', function(hooks) {

            QUnit.test('enabled - disconnect link with no new target element', function(assert) {

                this.paper.options.linkPinning = true;

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove' }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup' }, 50, 50);

                assert.ok(disconnectSpy.called);
                assert.notOk(connectSpy.called);
            });

            QUnit.test('disabled - disconnect link with no new target element', function(assert) {

                this.paper.options.linkPinning = true;

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove' }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup' }, 50, 50);

                assert.ok(disconnectSpy.called);
                assert.notOk(connectSpy.called);
            });
        });

        QUnit.test('disconnect when link pinning disabled', function(assert) {

            this.paper.options.linkPinning = false;

            var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

            connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
            connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove' }, 50, 50);
            connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup' }, 50, 50);

            assert.notOk(disconnectSpy.called, 'message');
            assert.notOk(connectSpy.called, 'message');
        });
    });

    QUnit.module('connect/disconnect to ports event ', function(hooks) {

        var disconnectSpy;
        var connectSpy;

        hooks.beforeEach(function() {
            this.modelWithPorts = new joint.shapes.devs.Model({
                position: { x: 500, y: 250 },
                size: { width: 100, height: 100 },
                inPorts: ['in1', 'in2'],
                outPorts: ['out']
            });

            disconnectSpy = sinon.spy();
            connectSpy = sinon.spy();
            this.paper.on('link:disconnect', disconnectSpy);
            this.paper.on('link:connect', connectSpy);
        });

        QUnit.test('connect to port', function(assert) {

            var link = new joint.dia.Link({ id: 'link' });

            this.graph.addCells([this.modelWithPorts, link]);
            var linkView = link.findView(this.paper);
            var arrowhead = linkView.el.querySelector('.marker-arrowhead[end=source]');
            var port = this.paper.findViewByModel(this.modelWithPorts).el.querySelector('.port-body[port="in1"]');

            linkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
            linkView.pointermove({ target: port, type: 'mousemove' }, 0, 0);
            linkView.pointerup({ target: port, type: 'mouseup' }, 0, 0);

            assert.ok(connectSpy.calledOnce);
            assert.notOk(disconnectSpy.called);
        });

        QUnit.test('reconnect port', function(assert) {

            var link = new joint.dia.Link({ id: 'link', source: { id: this.modelWithPorts, port: 'in1' } });

            this.graph.addCells([this.modelWithPorts, link]);
            var linkView = link.findView(this.paper);
            var arrowhead = linkView.el.querySelector('.marker-arrowhead[end=source]');
            var portElement = this.paper.findViewByModel(this.modelWithPorts).el.querySelector('.port-body[port="in2"]');

            linkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
            linkView.pointermove({ target: portElement, type: 'mousemove' }, 0, 0);
            linkView.pointerup({ target: portElement, type: 'mouseup' }, 0, 0);

            assert.ok(connectSpy.calledOnce);
            assert.ok(disconnectSpy.calledOnce);
        });
    });

    QUnit.test('paper.options: linkPinning', function(assert) {

        assert.expect(5);

        var source = new joint.shapes.basic.Rect({
            id: 'source',
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 }
        });
        var target = new joint.shapes.basic.Rect({
            id: 'target',
            position: { x: 400, y: 100 },
            size: { width: 100, height: 100 }
        });
        var link = new joint.dia.Link({ id: 'link', source: { id: source.id }, target: { id: target.id } });
        var newLink; // to be created.

        this.graph.addCells([source, target, link]);

        var linkView = link.findView(this.paper);
        var sourceView = source.findView(this.paper);
        var targetView = target.findView(this.paper);

        var arrowhead = linkView.el.querySelector('.marker-arrowhead[end=target]');

        this.paper.options.linkPinning = false;
        linkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
        linkView.pointermove({ target: this.paper.el, type: 'mousemove' }, 50, 50);
        linkView.pointerup({ target: this.paper.el, type: 'mouseup' }, 50, 50);

        assert.deepEqual(link.get('target'), { id: target.id }, 'pinning disabled: when the arrowhead is dragged&dropped to the blank paper area, the arrowhead is return to its original position.');

        this.paper.options.linkPinning = true;
        linkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
        linkView.pointermove({ target: this.paper.el, type: 'mousemove' }, 50, 50);
        linkView.pointerup({ target: this.paper.el, type: 'mouseup' }, 50, 50);

        assert.deepEqual(link.get('target'), {
            x: 50,
            y: 50
        }, 'pinning enabled: when the arrowhead is dragged&dropped to the blank paper area, the arrowhead is set to a point.');

        this.paper.options.linkPinning = false;
        linkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
        linkView.pointermove({ target: targetView.el, type: 'mousemove' }, 450, 150);
        linkView.pointerup({ target: targetView.el, type: 'mouseup' }, 450, 150);

        assert.deepEqual(link.get('target'), { id: 'target' }, 'pinning disabled: it\'s still possible to connect link to elements.');

        this.paper.options.linkPinning = true;
        source.attr('.', { magnet: true });
        sourceView.pointerdown({ target: sourceView.el, type: 'mousedown' }, 150, 150);
        sourceView.pointermove({ target: this.paper.el, type: 'mousemove' }, 150, 400);
        sourceView.pointerup({ target: this.paper.el, type: 'mouseup' }, 150, 400);

        newLink = _.reject(this.graph.getLinks(), { id: 'link' })[0];
        if (newLink) {
            assert.deepEqual(newLink.get('target'), {
                x: 150,
                y: 400
            }, 'pinning enabled: when there was a link created from a magnet a dropped into the blank paper area, the link target is set to a point.');
            newLink.remove();
        }

        this.paper.options.linkPinning = false;
        sourceView.pointerdown({ target: sourceView.el, type: 'mousedown' }, 150, 150);
        sourceView.pointermove({ target: this.paper.el, type: 'mousemove' }, 150, 400);
        sourceView.pointerup({ target: this.paper.el, type: 'mouseup' }, 150, 400);

        newLink = _.reject(this.graph.getLinks(), { id: 'link' })[0];
        assert.notOk(newLink, 'pinning disabled: when there was a link created from a magnet a dropped into the blank paper area, the link was removed after the drop.');
    });

    QUnit.test('paper.options: guard', function(assert) {

        var element = new joint.shapes.basic.Rect({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 }
        });

        this.graph.addCell(element);

        var elementView = this.paper.findViewByModel(element);
        var paperOffsetX = this.paper.$el.offset().left;
        var paperOffsetY = this.paper.$el.offset().top;
        var bboxBefore = element.getBBox();
        var bboxAfter;
        var diffX;
        var diffY;

        simulate.mousedown({
            el: elementView.$el[0],
            clientX: paperOffsetX + bboxBefore.x + 10,
            clientY: paperOffsetY + bboxBefore.y + 10,
            button: 2
        });

        simulate.mousemove({
            el: elementView.$el[0],
            clientX: paperOffsetX + bboxBefore.x + 50,
            clientY: paperOffsetY + bboxBefore.y + 50,
            button: 2
        });

        bboxAfter = element.getBBox();
        diffX = Math.abs(bboxAfter.x - bboxBefore.x);
        diffY = Math.abs(bboxAfter.y - bboxBefore.y);

        assert.ok(diffX > 30 && diffY > 30, 'element should have been moved');

        // Use guard option to only allow mouse events for left mouse button.
        this.paper.options.guard = function(evt, view) {

            var isMouseEvent = evt.type.substr(0, 'mouse'.length) === 'mouse';

            if (isMouseEvent && evt.button !== 0) {

                return true;
            }

            return false;
        };

        simulate.mousedown({
            el: elementView.$el[0],
            clientX: paperOffsetX + bboxBefore.x + 10,
            clientY: paperOffsetY + bboxBefore.y + 10,
            button: 2
        });

        simulate.mousemove({
            el: elementView.$el[0],
            clientX: paperOffsetX + bboxBefore.x + 50,
            clientY: paperOffsetY + bboxBefore.y + 50,
            button: 2
        });

        bboxBefore = bboxAfter;
        bboxAfter = element.getBBox();
        diffX = Math.abs(bboxAfter.x - bboxBefore.x);
        diffY = Math.abs(bboxAfter.y - bboxBefore.y);

        assert.ok(diffX < 5 && diffY < 5, 'element should not have been moved');
    });

    QUnit.test('getContentBBox()', function(assert) {

        checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }, 'empty graph, content bbox should be correct');

        var rect1 = new joint.shapes.basic.Rect({
            position: {
                x: 20,
                y: 20
            },
            size: {
                width: 40,
                height: 40
            }
        });

        this.graph.addCell(rect1);

        checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), {
            x: 20,
            y: 20,
            width: 40,
            height: 40
        }, 'one rectangle, content bbox should be correct');

        var rect2 = new joint.shapes.basic.Rect({
            position: {
                x: 5,
                y: 8
            },
            size: {
                width: 25,
                height: 25
            }
        });

        this.graph.addCell(rect2);

        checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), {
            x: 5,
            y: 8,
            width: 55,
            height: 52
        }, 'two rectangles, content bbox should be correct');

        var circle1 = new joint.shapes.basic.Circle({
            position: {
                x: 75,
                y: 5
            },
            size: {
                width: 25,
                height: 25
            }
        });

        this.graph.addCell(circle1);

        checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), {
            x: 5,
            y: 5,
            width: 95,
            height: 55
        }, 'two rectangles + one circle, content bbox should be correct');

        V(this.paper.viewport).scale(2, 2);

        checkBboxApproximately(4/* +- */, this.paper.getContentBBox(), {
            x: 10,
            y: 10,
            width: 190,
            height: 110
        }, 'two rectangles + one circle (scaled by factor of 2), content bbox should be correct');
    });

    QUnit.test('findViewsInArea(rect[, opt])', function(assert) {

        var cells = [
            new joint.shapes.basic.Rect({
                position: { x: 20, y: 20 },
                size: { width: 20, height: 20 }
            }),
            new joint.shapes.basic.Rect({
                position: { x: 80, y: 80 },
                size: { width: 40, height: 60 }
            }),
            new joint.shapes.basic.Rect({
                position: { x: 120, y: 180 },
                size: { width: 40, height: 40 }
            })
        ];

        this.graph.addCells(cells);

        var viewsInArea;

        viewsInArea = this.paper.findViewsInArea(new g.rect(0, 0, 10, 10));

        assert.equal(viewsInArea.length, 0, 'area with no elements in it');

        viewsInArea = this.paper.findViewsInArea(new g.rect(0, 0, 25, 25));

        assert.equal(viewsInArea.length, 1, 'area with 1 element in it');

        viewsInArea = this.paper.findViewsInArea(new g.rect(0, 0, 300, 300));

        assert.equal(viewsInArea.length, 3, 'area with 3 elements in it');

        viewsInArea = this.paper.findViewsInArea(new g.rect(0, 0, 100, 100), { strict: true });

        assert.equal(viewsInArea.length, 1, '[opt.strict = TRUE] should require elements to be completely within rect');
    });

    QUnit.test('linkAllowed(linkViewOrModel)', function(assert) {

        assert.equal(typeof this.paper.linkAllowed, 'function', 'should be a function');

        var paper = this.paper;

        assert.throws(function() {

            paper.linkAllowed();

        }, new Error('Must provide link model or view.'), 'should throw error when link model/view is missing');

        var rect1 = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 40, height: 40 }
        });

        var rect2 = new joint.shapes.basic.Rect({
            position: { x: 80, y: 30 },
            size: { width: 40, height: 40 }
        });

        this.graph.addCells([rect1, rect2]);

        // Defaults.
        this.paper.options.multiLinks = true;
        this.paper.options.linkPinning = true;

        var link = new joint.dia.Link({
            source: { x: 300, y: 300 },
            target: { x: 320, y: 320 }
        });

        this.graph.addCells([link]);

        var linkView = this.paper.findViewByModel(link);

        assert.ok(this.paper.linkAllowed(link), 'can use link model');
        assert.ok(this.paper.linkAllowed(linkView), 'can use link view');

        var pinnedLink = new joint.dia.Link({
            source: { id: rect1.id },
            target: { x: 200, y: 200 }
        });

        this.paper.options.linkPinning = false;
        assert.notOk(this.paper.linkAllowed(pinnedLink), 'pinned link not allowed when link pinning is disabled');

        this.paper.options.linkPinning = true;
        assert.ok(this.paper.linkAllowed(pinnedLink), 'pinned link allowed when link pinning is enabled');

        var multiLink1 = new joint.dia.Link({
            source: { id: rect1.id },
            target: { id: rect2.id }
        });

        var multiLink2 = new joint.dia.Link({
            source: { id: rect1.id },
            target: { id: rect2.id }
        });

        this.graph.addCells([multiLink1, multiLink2]);

        this.paper.options.multiLinks = false;
        assert.notOk(this.paper.linkAllowed(multiLink2), 'multi link not allowed when link multi-links is disabled');

        this.paper.options.multiLinks = true;
        assert.ok(this.paper.linkAllowed(multiLink2), 'multi link allowed when link multi-links is enabled');
    });

    QUnit.test('setGridSize(gridSize)', function(assert) {

        assert.equal(typeof joint.dia.Paper.prototype.setGridSize, 'function', 'should be a function');

        var newGridSize = 33;
        this.paper.setGridSize(newGridSize);

        assert.equal(this.paper.options.gridSize, newGridSize, 'should set options.gridSize');
    });

    QUnit.test('drawGrid(opt)', function(assert) {

        var done = assert.async();

        assert.equal(typeof joint.dia.Paper.prototype.drawGrid, 'function', 'should be a function');

        var called = false;

        var TestPaper = joint.dia.Paper.extend({
            drawGrid: function() {
                called = true;
                joint.dia.Paper.prototype.drawGrid.apply(this, arguments);
            }
        });

        var paper = new TestPaper({
            model: new joint.dia.Graph
        });

        var callerMethods = [
            {
                name: 'setGridSize'
            },
            {
                name: 'scale',
                args: [1]
            },
            {
                name: 'setOrigin',
                args: [0, 0]
            }
        ];

        paper.options.drawGrid = true;

        _.each(callerMethods, function(callerMethod) {
            called = false;
            paper[callerMethod.name].apply(paper, callerMethod.args || []);
            assert.ok(called, 'should be called by ' + callerMethod.name + '()');
        });

        paper.options.drawGrid = false;

        _.each(callerMethods, function(callerMethod) {
            called = false;
            paper[callerMethod.name].apply(paper, callerMethod.args || []);
            assert.notOk(called, 'when paper.options.drawGrid set to FALSE, should be called by ' + callerMethod.name + '()');
        });

        paper.options.drawGrid = true;

        var inputsAndOutputs = [
            {
                message: 'normal',
                gridSize: 5,
                origin: {
                    x: 0,
                    y: 0
                },
                scale: {
                    x: 1,
                    y: 1
                },
                opt: {
                    color: '#aaa',
                    thickness: 1
                },
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAGklEQVQIW2NctWrV/7CwMEYGJIDCgYlTKAgAl6cEBngimTIAAAAASUVORK5CYII='
            },
            {
                message: 'using default options',
                gridSize: 5,
                origin: {
                    x: 0,
                    y: 0
                },
                scale: {
                    x: 1,
                    y: 1
                },
                opt: {},
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAGklEQVQIW2NctWrV/7CwMEYGJIDCgYlTKAgAl6cEBngimTIAAAAASUVORK5CYII='
            },
            {
                message: 'custom color',
                gridSize: 5,
                origin: {
                    x: 0,
                    y: 0
                },
                scale: {
                    x: 1,
                    y: 1
                },
                opt: {
                    color: 'purple',
                    thickness: 1
                },
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAGUlEQVQIW2NsYGj438DQwMiABFA4MHEKBQEwrwMGTWEEKgAAAABJRU5ErkJggg=='
            },
            {
                message: 'custom thickness',
                gridSize: 5,
                origin: {
                    x: 0,
                    y: 0
                },
                scale: {
                    x: 1,
                    y: 1
                },
                opt: {
                    color: '#aaa',
                    thickness: 3
                },
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAIElEQVQIW2NctWrVfwYoCAsLYwQxGYkXhGlFpsFmoAMAr2UMBnjfcSIAAAAASUVORK5CYII='
            },
            {
                message: 'large, odd gridSize',
                gridSize: 23,
                origin: {
                    x: 0,
                    y: 0
                },
                scale: {
                    x: 1,
                    y: 1
                },
                opt: {
                    color: '#aaa',
                    thickness: 1
                },
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAANklEQVRIS2NctWrV/7CwMEYGGgCaGApz56jhWGNsNFhGg4X4rDyaWkZTy2hqIT4ERlML8WEFAMyCBBj4/EAnAAAAAElFTkSuQmCC'
            },
            {
                message: 'negative origin',
                gridSize: 7,
                origin: {
                    x: -5,
                    y: -8
                },
                scale: {
                    x: 1,
                    y: 1
                },
                opt: {
                    color: '#aaa',
                    thickness: 1
                },
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAGUlEQVQIW2NkwAMYB63kqlWr/oeFhaE4EABJ6wQImIsygAAAAABJRU5ErkJggg=='
            },
            {
                message: 'positive origin',
                gridSize: 7,
                origin: {
                    x: 11,
                    y: 7
                },
                scale: {
                    x: 1,
                    y: 1
                },
                opt: {
                    color: '#aaa',
                    thickness: 1
                },
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAHElEQVQIW2NkQAOrVq36HxYWxggSBhO4wKCTBADiCQQIkW6pkwAAAABJRU5ErkJggg=='
            },
            {
                message: 'scaled up',
                gridSize: 12,
                origin: {
                    x: 0,
                    y: 0
                },
                scale: {
                    x: 2,
                    y: 2
                },
                opt: {
                    color: '#aaa',
                    thickness: 1
                },
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAARUlEQVRIS2NctWrVfwYGBoawsDBGEE1twEhzC6jtYnTzaBIsyJaMWkAwCkeDaDSICIYAQQWjqWg0iAiGAEEFo6loBAQRAJa9CBnOM9wvAAAAAElFTkSuQmCC'
            },
            {
                message: 'scaled down',
                gridSize: 20,
                origin: {
                    x: 0,
                    y: 0
                },
                scale: {
                    x: 0.5,
                    y: 0.5
                },
                opt: {
                    color: '#aaa',
                    thickness: 2
                },
                imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIElEQVQYV2NctWrV/7CwMEYGAoCgApj+UYV4Q5Lo4AEAZLcECwWKMoMAAAAASUVORK5CYII='
            }
        ];

        async.each(inputsAndOutputs, function(inputsAndOutput, next) {

            var gridSize = inputsAndOutput.gridSize;
            var origin = inputsAndOutput.origin;
            var scale = inputsAndOutput.scale;
            var opt = inputsAndOutput.opt;

            paper.setGridSize(gridSize);
            paper.scale(scale.x, scale.y);
            paper.setOrigin(origin.x, origin.y);
            paper.drawGrid(opt);

            var actualBackgroundImage = paper.$el.css('background-image');
            var message = inputsAndOutput.message;

            normalizeImageDataUri(inputsAndOutput.imageDataUri, function(error, normalizedImageDataUri) {

                var expectedBackgroundImage = normalizeCssAttr('background-image', 'url("' + normalizedImageDataUri + '")');
                assert.equal(actualBackgroundImage, expectedBackgroundImage, message);
                next();
            });

        }, done);
    });

    QUnit.module('interactivity', function(hooks) {

        hooks.beforeEach(function() {

            this.paper.options.interactive = false;

            var r1 = new joint.shapes.basic.Rect;
            var r2 = new joint.shapes.basic.Rect;

            this.graph.addCell(r1);
            this.graph.addCell(r2);
            new joint.dia.Link()
                .set({
                    source: { id: r1.id },
                    target: { id: r2.id }
                })
                .addTo(this.graph);

        });

        QUnit.test('set by value', function(assert) {

            this.paper.setInteractivity(true);

            var cells = this.graph.getCells();
            assert.ok(cells.length > 0, 'make sure cells are iterated');

            _.each(cells, function(cell) {

                var cellView = this.paper.findViewByModel(cell);
                assert.ok(cellView.options.interactive);
            }, this);
        });

        QUnit.test('set by function', function(assert) {

            this.paper.setInteractivity(function(cellView) {
                return { manipulate: cellView.model.isLink() };
            });

            var cells = this.graph.getCells();
            assert.ok(cells.length > 0, 'make sure cells are iterated');

            _.each(cells, function(cell) {

                var cellView = this.paper.findViewByModel(cell);
                assert.equal(cellView.can('manipulate'), cellView.model.isLink(), 'only links can be manipulated');
            }, this);
        });
    });
});

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

        var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 20, height: 20 }});
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

        this.paper.scale(2, 2);

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
            var link = new joint.dia.Link({ id: 'link', source: { id: source.id }, target: { id: target.id }});
            var soloLink = new joint.dia.Link({ id: 'link2', source: { id: source.id }, target: { x: 300, y: 300 }});

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

            var data = {};
            connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
            connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 0, 0);
            connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 0, 0);

            assert.notOk(connectSpy.called);
            assert.ok(disconnectSpy.calledOnce);
        });

        QUnit.test('disconnect from element, connect to new one', function(assert) {

            var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');
            var soloView = graphCells[2].findView(this.paper);

            var data = {};
            connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
            connectedLinkView.pointermove({ target: soloView.el, type: 'mousemove', data: data }, 450, 450);
            connectedLinkView.pointerup({ target: soloView.el, type: 'mouseup', data: data }, 450, 450);

            assert.ok(connectSpy.calledOnce, 'connect to solo');
            assert.ok(disconnectSpy.calledOnce, 'disconnect from source');
        });

        QUnit.test('disconnect from element, connect to same one - nothing changed', function(assert) {

            var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');
            var targetView = graphCells[1].findView(this.paper);

            var data = {};
            connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
            connectedLinkView.pointermove({ target: targetView.el, type: 'mousemove', data: data }, 450, 450);
            connectedLinkView.pointerup({ target: targetView.el, type: 'mouseup', data: data }, 450, 150);

            assert.notOk(connectSpy.called, 'connect should not be called');
            assert.notOk(disconnectSpy.called, 'disconnect should not be called');
        });

        QUnit.module('snapLinks enabled', function(hooks) {

            QUnit.test('test name', function(assert) {

                var arrowhead = soloLinkView.el.querySelector('.marker-arrowhead[end=target]');
                var targetView = graphCells[1].findView(this.paper);
                var soloView = graphCells[2].findView(this.paper);

                var data = {};
                soloLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
                soloLinkView.pointermove({ target: soloView.el, type: 'mousemove', data: data }, 450, 450);
                soloLinkView.pointermove({ target: targetView.el, type: 'mousemove', data: data }, 450, 150);
                soloLinkView.pointerup({ target: targetView.el, type: 'mouseup', data: data }, 450, 450);

                assert.ok(connectSpy.calledOnce, 'connect should be called once');
                assert.notOk(disconnectSpy.called, 'disconnect should not be called');
            });
        });


        QUnit.module('linkPinning', function(hooks) {

            QUnit.test('enabled - disconnect link with no new target element', function(assert) {

                this.paper.options.linkPinning = true;

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                var data = {};
                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

                assert.ok(disconnectSpy.called);
                assert.notOk(connectSpy.called);
            });

            QUnit.test('disabled - disconnect link with no new target element', function(assert) {

                this.paper.options.linkPinning = true;

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                var data = {};
                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

                assert.ok(disconnectSpy.called);
                assert.notOk(connectSpy.called);
            });

            QUnit.test('disconnect when link pinning disabled', function(assert) {

                this.paper.options.linkPinning = false;

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                var data = {};
                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

                assert.notOk(disconnectSpy.called, 'message');
                assert.notOk(connectSpy.called, 'message');
            });
        });


        QUnit.module('allowLink', function(hooks) {

            QUnit.test('sanity', function(assert) {

                var allowLinkSpy = sinon.spy();

                this.paper.options.allowLink = allowLinkSpy;

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                var data = {};
                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

                assert.ok(allowLinkSpy.calledOnce);
                assert.ok(allowLinkSpy.calledWith(connectedLinkView, connectedLinkView.paper));
                assert.equal(allowLinkSpy.thisValues[0], connectedLinkView.paper);
            });

            QUnit.test('enabled - disconnect when return false', function(assert) {

                this.paper.options.allowLink = function() { return false };

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                var data = {};
                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

                assert.notOk(disconnectSpy.called);
            });

            QUnit.test('enabled - disconnect when return true', function(assert) {

                this.paper.options.allowLink = function() { return true };

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                var data = {};
                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

                assert.ok(disconnectSpy.called);
            });

            QUnit.test('disconnect when disabled', function(assert) {

                this.paper.options.allowLink = null;

                var arrowhead = connectedLinkView.el.querySelector('.marker-arrowhead[end=target]');

                var data = {};
                connectedLinkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
                connectedLinkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
                connectedLinkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

                assert.ok(disconnectSpy.called, 'message');
            });
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

            var data = {};
            linkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
            linkView.pointermove({ target: port, type: 'mousemove', data: data }, 0, 0);
            linkView.pointerup({ target: port, type: 'mouseup', data: data }, 0, 0);

            assert.ok(connectSpy.calledOnce);
            assert.notOk(disconnectSpy.called);
        });

        QUnit.test('reconnect port', function(assert) {

            var link = new joint.dia.Link({ id: 'link', source: { id: this.modelWithPorts, port: 'in1' }});

            this.graph.addCells([this.modelWithPorts, link]);
            var linkView = link.findView(this.paper);
            var arrowhead = linkView.el.querySelector('.marker-arrowhead[end=source]');
            var portElement = this.paper.findViewByModel(this.modelWithPorts).el.querySelector('.port-body[port="in2"]');

            var data = {};
            linkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
            linkView.pointermove({ target: portElement, type: 'mousemove', data: data }, 0, 0);
            linkView.pointerup({ target: portElement, type: 'mouseup', data: data }, 0, 0);

            assert.ok(connectSpy.calledOnce);
            assert.ok(disconnectSpy.calledOnce);
        });
    });

    QUnit.test('paper.options: moveThreshold', function(assert) {

        var graph = this.graph;
        var paper = this.paper;
        var el = (new joint.shapes.basic.Rect()).size(100, 100).position(0, 0).addTo(graph);
        var elView = el.findView(paper);
        var elRect = elView.el.querySelector('rect');
        var spy = sinon.spy();

        paper.options.moveThreshold = 2;
        paper.on('element:pointermove', spy);
        var data = {};
        paper.pointerdown($.Event('mousedown', { target: elRect, data: data }));
        paper.pointermove($.Event('mousemove', { target: elRect, data: data })); // Ignored
        paper.pointermove($.Event('mousemove', { target: elRect, data: data })); // Ignored
        paper.pointermove($.Event('mousemove', { target: elRect, data: data })); // Processed
        paper.pointerup($.Event('mouseup', { target: elRect, data: data }));

        assert.ok(spy.calledOnce);
    });

    QUnit.test('paper.options: linkPinning', function(assert) {

        assert.expect(5);

        var data;
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
        var link = new joint.dia.Link({ id: 'link', source: { id: source.id }, target: { id: target.id }});
        var newLink; // to be created.

        this.graph.addCells([source, target, link]);

        var linkView = link.findView(this.paper);
        var sourceView = source.findView(this.paper);
        var targetView = target.findView(this.paper);

        var arrowhead = linkView.el.querySelector('.marker-arrowhead[end=target]');

        this.paper.options.linkPinning = false;
        data = {};
        linkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
        linkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
        linkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

        assert.deepEqual(link.get('target'), { id: target.id }, 'pinning disabled: when the arrowhead is dragged&dropped to the blank paper area, the arrowhead is return to its original position.');

        this.paper.options.linkPinning = true;
        data = {};
        linkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
        linkView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 50, 50);
        linkView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 50, 50);

        assert.deepEqual(link.get('target'), {
            x: 50,
            y: 50
        }, 'pinning enabled: when the arrowhead is dragged&dropped to the blank paper area, the arrowhead is set to a point.');

        this.paper.options.linkPinning = false;
        data = {};
        linkView.pointerdown({ target: arrowhead, type: 'mousedown', data: data }, 0, 0);
        linkView.pointermove({ target: targetView.el, type: 'mousemove', data: data }, 450, 150);
        linkView.pointerup({ target: targetView.el, type: 'mouseup', data: data }, 450, 150);

        assert.deepEqual(link.get('target'), { id: 'target' }, 'pinning disabled: it\'s still possible to connect link to elements.');

        this.paper.options.linkPinning = true;
        source.attr('.', { magnet: true });
        data = {};
        sourceView.dragMagnetStart({ target: sourceView.el, type: 'mousedown', data: data }, 150, 150);
        sourceView.pointermove({ type: 'mousemove', data: data }, 150, 400);

        newLink = _.reject(this.graph.getLinks(), { id: 'link' })[0];
        if (newLink) {
            assert.deepEqual(newLink.get('target'), {
                x: 150,
                y: 400
            }, 'pinning enabled: when there was a link created from a magnet a dropped into the blank paper area, the link target is set to a point.');
            newLink.remove();
        }

        this.paper.options.linkPinning = false;
        data = {};
        sourceView.pointerdown({ target: sourceView.el, type: 'mousedown', data: data }, 150, 150);
        sourceView.pointermove({ target: this.paper.el, type: 'mousemove', data: data }, 150, 400);
        sourceView.pointerup({ target: this.paper.el, type: 'mouseup', data: data }, 150, 400);

        newLink = _.reject(this.graph.getLinks(), { id: 'link' })[0];
        assert.notOk(newLink, 'pinning disabled: when there was a link created from a magnet a dropped into the blank paper area, the link was removed after the drop.');
    });

    QUnit.test('paper.options: guard', function(assert) {

        assert.expect(4);

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
            el: elementView.el,
            clientX: paperOffsetX + bboxBefore.x + 10,
            clientY: paperOffsetY + bboxBefore.y + 10,
            button: 1
        });

        simulate.mousemove({
            el: elementView.el,
            clientX: paperOffsetX + bboxBefore.x + 50,
            clientY: paperOffsetY + bboxBefore.y + 50,
            button: 1
        });

        simulate.mouseup({
            el: elementView.el,
            clientX: paperOffsetX + bboxBefore.x + 50,
            clientY: paperOffsetY + bboxBefore.y + 50,
            button: 1
        });

        bboxAfter = element.getBBox();
        diffX = Math.abs(bboxAfter.x - bboxBefore.x);
        diffY = Math.abs(bboxAfter.y - bboxBefore.y);

        assert.ok(diffX > 30 && diffY > 30, 'element should have been moved');

        // Use guard option to only allow mouse events for left mouse button.
        this.paper.options.guard = function(evt, view) {

            assert.ok(evt instanceof $.Event);
            assert.equal(view, elementView);

            var isMouseEvent = evt.type.substr(0, 'mouse'.length) === 'mouse';

            if (isMouseEvent && evt.button !== 0) {

                return true;
            }

            return false;
        };

        simulate.mousedown({
            el: elementView.el,
            clientX: paperOffsetX + bboxBefore.x + 10,
            clientY: paperOffsetY + bboxBefore.y + 10,
            button: 1
        });

        simulate.mousemove({
            el: elementView.el,
            clientX: paperOffsetX + bboxBefore.x + 50,
            clientY: paperOffsetY + bboxBefore.y + 50,
            button: 1
        });

        simulate.mouseup({
            el: elementView.el,
            clientX: paperOffsetX + bboxBefore.x + 50,
            clientY: paperOffsetY + bboxBefore.y + 50,
            button: 1
        });

        bboxBefore = bboxAfter;
        bboxAfter = element.getBBox();
        diffX = Math.abs(bboxAfter.x - bboxBefore.x);
        diffY = Math.abs(bboxAfter.y - bboxBefore.y);

        assert.ok(diffX < 5 && diffY < 5, 'element should not have been moved');
    });

    QUnit.test('getContentArea()', function(assert) {

        assert.checkBboxApproximately(2/* +- */, this.paper.getContentArea(), {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }, 'empty graph, content area should be correct');

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

        assert.checkBboxApproximately(2/* +- */, this.paper.getContentArea(), {
            x: 20,
            y: 20,
            width: 40,
            height: 40
        }, 'one rectangle, content area should be correct');

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

        assert.checkBboxApproximately(2/* +- */, this.paper.getContentArea(), {
            x: 5,
            y: 8,
            width: 55,
            height: 52
        }, 'two rectangles, content area should be correct');

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

        assert.checkBboxApproximately(2/* +- */, this.paper.getContentArea(), {
            x: 5,
            y: 5,
            width: 95,
            height: 55
        }, 'two rectangles + one circle, content area should be correct');

        V(this.paper.viewport).scale(2, 2);

        assert.checkBboxApproximately(4/* +- */, this.paper.getContentArea(), {
            x: 5,
            y: 5,
            width: 95,
            height: 55
        }, 'two rectangles + one circle (scaled by factor of 2), content area should be correct');
    });

    QUnit.test('getContentBBox()', function(assert) {

        assert.checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), {
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

        assert.checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), {
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

        assert.checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), {
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

        assert.checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), {
            x: 5,
            y: 5,
            width: 95,
            height: 55
        }, 'two rectangles + one circle, content bbox should be correct');

        V(this.paper.viewport).scale(2, 2);

        assert.checkBboxApproximately(4/* +- */, this.paper.getContentBBox(), {
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

        }, new Error('Must provide a linkView.'), 'should throw error when linkview is missing');

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

        assert.ok(this.paper.linkAllowed(linkView), 'can use link view');

        var pinnedLink = new joint.dia.Link({
            source: { id: rect1.id },
            target: { x: 200, y: 200 }
        });

        this.graph.addCell(pinnedLink);

        var pinnedLinkView = this.paper.findViewByModel(pinnedLink);

        this.paper.options.linkPinning = false;
        assert.notOk(this.paper.linkAllowed(pinnedLinkView), 'pinned link not allowed when link pinning is disabled');

        this.paper.options.linkPinning = true;
        assert.ok(this.paper.linkAllowed(pinnedLinkView), 'pinned link allowed when link pinning is enabled');

        var multiLink1 = new joint.dia.Link({
            source: { id: rect1.id },
            target: { id: rect2.id }
        });

        var multiLink2 = new joint.dia.Link({
            source: { id: rect1.id },
            target: { id: rect2.id }
        });

        this.graph.addCells([multiLink1, multiLink2]);

        var multiLink2View = this.paper.findViewByModel(multiLink2);

        this.paper.options.multiLinks = false;
        assert.notOk(this.paper.linkAllowed(multiLink2View), 'multi link not allowed when link multi-links is disabled');

        this.paper.options.multiLinks = true;
        assert.ok(this.paper.linkAllowed(multiLink2View), 'multi link allowed when link multi-links is enabled');
    });

    QUnit.test('setGridSize(gridSize)', function(assert) {

        assert.equal(typeof joint.dia.Paper.prototype.setGridSize, 'function', 'should be a function');

        var newGridSize = 33;
        this.paper.setGridSize(newGridSize);

        assert.equal(this.paper.options.gridSize, newGridSize, 'should set options.gridSize');
    });

    QUnit.module('draw grid options', function(hooks) {

        var getGridVel = function(paper) {
            var image = paper.$grid.css('backgroundImage').replace(/url\("*|"*\)/g, '').replace('data:image/svg+xml;base64,', '');
            return image !== 'none' ?  V(atob(image)) : undefined;
        };

        var preparePaper = function(drawGrid, paperSettings) {

            paperSettings = paperSettings ||
                {
                    gridSize: 10,
                    scale: { x: 1, y: 1 },
                    origin: { x: 0, y: 0 }
                };

            var paper = new joint.dia.Paper({
                drawGrid: drawGrid
            });

            paper.setGridSize(paperSettings.gridSize);
            paper.scale(paperSettings.scale.x, paperSettings.scale.y);
            paper.setOrigin(paperSettings.origin.x, paperSettings.origin.y);

            return paper;
        };

        QUnit.test('no grid', function(assert) {

            var paper = preparePaper(false);
            var svg = getGridVel(paper);
            assert.equal(svg, undefined);
        });

        QUnit.module('Check rendered output', function(hooks) {

            QUnit.test('default format', function(assert) {

                var drawGrid = { color: 'red', thickness: 2 };
                var paper = preparePaper(drawGrid);
                paper.drawGrid();

                var svg = getGridVel(paper);

                assert.equal(svg.node.childNodes.length, 2, 'defs + rect with pattern fill');
                var patterns = V(svg.node.childNodes[0]).find('pattern');
                assert.equal(patterns.length, 1);

                var shape = V(patterns[0].node.childNodes[0]);
                assert.equal(shape.attr('width'), drawGrid.thickness, 'has correct width');
                assert.equal(shape.attr('height'), drawGrid.thickness, 'has correct height');
                assert.equal(shape.attr('fill'), drawGrid.color, 'has correct color');
            });

            QUnit.test('custom markup only', function(assert) {

                var drawGrid = { markup: '<circle r="10" fill="black" />', color: 'red' };
                var paper = preparePaper(drawGrid);
                paper.drawGrid();

                var svg = getGridVel(paper);

                assert.equal(svg.node.childNodes.length, 2, 'defs + rect with pattern fill');
                var defs = V(svg.node.childNodes[0]);
                var patterns = defs.find('pattern');

                assert.equal(patterns.length, 1);

                var shape = V(patterns[0].node.childNodes[0]);
                assert.equal(shape.attr('width'), undefined, 'width shouldn\'t be set');
                assert.equal(shape.attr('height'), undefined, 'height shouldn\'t be set');
                assert.equal(shape.attr('fill'), 'black', 'color shouldn\'t be updated');
            });

            QUnit.test('custom update only', function(assert) {

                var drawGrid = {
                    update: function(element, opt) {
                        V(element).attr({ 'fill': 'green', width: 999, height: 111 })
                    }, color: 'red'
                };
                var paper = preparePaper(drawGrid);
                paper.drawGrid();

                var svg = getGridVel(paper);

                var patterns = V(svg.node.childNodes[0]).find('pattern');
                assert.equal(svg.node.childNodes.length, 2, 'defs + rect with pattern fill');
                assert.equal(patterns.length, 1);

                var shape = V(patterns[0].node.childNodes[0]);
                assert.equal(shape.attr('width'), 999);
                assert.equal(shape.attr('height'), 111);
                assert.equal(shape.attr('fill'), 'green');
            });

            QUnit.test('patterns with scale factor', function(assert) {

                var drawGrid = [
                    { color: 'red' },
                    { color: 'green', scaleFactor: 2 }
                ];

                var paper = preparePaper(drawGrid, {
                    gridSize: 10,
                    scale: { x: 1, y: 1 },
                    origin: { x: -5, y: -5 }
                });

                paper.drawGrid();

                var svg = getGridVel(paper);

                var patterns = V(svg.node.childNodes[0]).find('pattern');
                assert.equal(svg.node.childNodes.length, 3, 'defs + 2x rect with pattern fill');
                assert.equal(patterns.length, 2);

                var redDotAttrs = V(patterns[0]).attr();
                var greenDotAttrs = V(patterns[1]).attr();

                assert.deepEqual(
                    { width: redDotAttrs.width, height: redDotAttrs.height, x: redDotAttrs.x, y: redDotAttrs.y },
                    { width: '10', height: '10', x: '5', y: '5' },
                    'red dot pattern attrs'
                );

                assert.deepEqual(
                    {
                        width: greenDotAttrs.width,
                        height: greenDotAttrs.height,
                        x: greenDotAttrs.x,
                        y: greenDotAttrs.y
                    },
                    { width: '20', height: '20', x: '15', y: '15' },
                    'green dot pattern attrs'
                );
            });

            QUnit.test('local options - as an object', function(assert) {

                var drawGrid = [
                    { color: 'red' },
                    { color: 'green' }
                ];

                var paper = preparePaper(drawGrid, {
                    gridSize: 10,
                    scale: { x: 1, y: 1 },
                    origin: { x: -5, y: -5 }
                });

                paper.drawGrid({ color: 'pink' });

                var svg = getGridVel(paper);

                assert.equal(svg.node.childNodes.length, 3, 'defs + 2x rect with pattern fill');
                var defs = V(svg.node.childNodes[0]);
                var patterns = defs.find('pattern');

                assert.equal(patterns.length, 2);

                var redDot = V(patterns[0].node.childNodes[0]);

                assert.equal(redDot.attr('fill'), 'pink', 'color updated by local options');
            });

            QUnit.test('local options - as an array', function(assert) {

                var drawGrid = [
                    { color: 'red' },
                    { color: 'green' }
                ];

                var paper = preparePaper(drawGrid, {
                    gridSize: 10,
                    scale: { x: 1, y: 1 },
                    origin: { x: -5, y: -5 }
                });

                paper.drawGrid([{ color: 'black' }, { color: 'pink' }]);

                var svg = getGridVel(paper);

                var patterns = V(svg.node.childNodes[0]).find('pattern');
                var greenDot = V(patterns[1].node.childNodes[0]);

                assert.equal(svg.node.childNodes.length, 3, 'defs + 2x rect with pattern fill');
                assert.equal(patterns.length, 2);
                assert.equal(greenDot.attr('fill'), 'pink', 'color updated by local options');
            });

            QUnit.test('update mesh', function(assert) {

                var drawGrid = { name: 'mesh', color: 'red', thickness: 2 };
                var paper = preparePaper(drawGrid);
                paper.drawGrid();

                var svg = getGridVel(paper);

                var patterns = V(svg.node.childNodes[0]).find('pattern');
                var patternAttr = V(patterns[0].node.childNodes[0]).attr();
                assert.equal(patternAttr.stroke, 'red');
                assert.equal(patternAttr['stroke-width'], '2');

                paper.drawGrid({ color: 'blue', thickness: 1 });
                svg = getGridVel(paper);
                patterns = V(svg.node.childNodes[0]).find('pattern');
                patternAttr = V(patterns[0].node.childNodes[0]).attr();
                assert.equal(patternAttr.stroke, 'blue');
                assert.equal(patternAttr['stroke-width'], '1');
            });

            QUnit.test('doubleMesh', function(assert) {

                var drawGrid = { name: 'doubleMesh', args: [{ color: 'red', thickness: 2 }] };
                var paper = preparePaper(drawGrid);
                paper.drawGrid();

                var svg = getGridVel(paper);

                var patterns = V(svg.node.childNodes[0]).find('pattern');
                var patternAttr = V(patterns[0].node.childNodes[0]).attr();
                assert.equal(patternAttr.stroke, 'red');
                assert.equal(patternAttr['stroke-width'], '2');

                paper.drawGrid({ color: 'blue', thickness: 1 });
                svg = getGridVel(paper);
                patterns = V(svg.node.childNodes[0]).find('pattern');
                patternAttr = V(patterns[0].node.childNodes[0]).attr();
                assert.equal(patternAttr.stroke, 'blue');
                assert.equal(patternAttr['stroke-width'], '1');
            });
        });

        QUnit.module('setGrid() - possible definitions of the drawGrid options', function(hooks) {

            /** @type joint.dia.Paper */
            var paper;

            hooks.beforeEach(function() {
                paper = new joint.dia.Paper();
            });

            QUnit.test('set doubleMesh settings', function(assert) {

                var drawGridTestFixtures = [
                    { name: 'doubleMesh', args: { color: 'red', thickness: 11 }}, //update first layer
                    { name: 'doubleMesh', args: [{ color: 'red', thickness: 11 }, { color: 'black', thickness: 55 }] }, //udate both alyers
                    { name: 'doubleMesh', color: 'red', thickness: 11 } // update firs layer
                ];

                var check = function(message) {

                    assert.equal(paper._gridSettings.length, 2);
                    var firstLayer = paper._gridSettings[0];

                    assert.equal(firstLayer.color, 'red', message + ': color');
                    assert.equal(firstLayer.thickness, 11, message + ': thickness');
                    assert.equal(firstLayer.markup, 'path', message + ': markup');
                    assert.ok(_.isFunction(firstLayer.update), message + ': update');
                };

                paper.setGrid(drawGridTestFixtures[0]);
                check('args: {}');

                paper.setGrid(drawGridTestFixtures[1]);
                var secondLayer = paper._gridSettings[1];
                var message = 'args: [{}] - second layer';
                assert.equal(secondLayer.color, 'black', message + ': color');
                assert.equal(secondLayer.thickness, 55, message + ': thickness');
                assert.equal(secondLayer.markup, 'path', message + ': markup');
                assert.ok(_.isFunction(secondLayer.update), message + ': update');
                check('args: [{}]');

                paper.setGrid(drawGridTestFixtures[2]);
                check('no args');
            });

            QUnit.test('update default', function(assert){

                paper.setGrid({ color: 'red', thickness: 11 });
                assert.propEqual(paper._gridSettings[0], {
                    color: 'red',
                    thickness: 11,
                    markup: 'rect',
                    update: {}
                }, 'update default');
                assert.ok(_.isFunction(paper._gridSettings[0].update));
            });

            QUnit.test('create custom', function(assert) {

                var drawGridTestFixtures = [
                    { markup: 'rect', update: 'fnc' }, //custom one-layer grid
                    [{ markup: 'rect', update: 'fnc' }, { markup: 'rect2', update: 'fnc2' }], //custom double layered grid
                    { markup: '<circle/>' } // minimal setup for custom grid
                ];

                paper.setGrid(drawGridTestFixtures[0]);
                assert.deepEqual(paper._gridSettings[0], { markup: 'rect', update: 'fnc' }, 'custom markup and update');

                paper.setGrid(drawGridTestFixtures[1]);
                assert.ok(_.isArray(paper._gridSettings));
                assert.deepEqual(paper._gridSettings[0], { markup: 'rect', update: 'fnc' }, 'custom markup and update - first layer');
                assert.deepEqual(paper._gridSettings[1], { markup: 'rect2', update: 'fnc2' }, 'custom markup and update- second layer');

                paper.setGrid(drawGridTestFixtures[2]);
                assert.ok(_.isArray(paper._gridSettings));
                assert.deepEqual(paper._gridSettings[0], { markup: '<circle/>' }, 'custom grid - minimal setup');
            });

            QUnit.test('initialize gridSettings', function(assert) {

                var dotDefault = joint.dia.Paper.gridPatterns.dot[0];

                paper.setGrid({ markup: '<rect/>' });
                assert.deepEqual(paper._gridSettings[0], { markup: '<rect/>' }, 'markup only');

                paper.setGrid({ update: 'custom' });
                assert.propEqual(_.omit(paper._gridSettings[0], 'update'), _.omit(dotDefault, 'update'), 'override update function');
                assert.equal(paper._gridSettings[0].update, 'custom');

                paper.setGrid('dot');
                assert.propEqual(paper._gridSettings[0], dotDefault, 'update');

                paper.setGrid([{ color: 'red' }, { color: 'black' }]);
            });
        });
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

            cells.forEach(function(cell) {

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

            cells.forEach(function(cell) {

                var cellView = this.paper.findViewByModel(cell);
                assert.equal(cellView.can('manipulate'), cellView.model.isLink(), 'only links can be manipulated');
            }, this);
        });
    });

    QUnit.test('matrix()', function(assert) {

        assert.deepEqual(this.paper.matrix(), this.paper.matrix().inverse(), 'when the paper is not transformed it returns the identity matrix');

        this.paper.setOrigin(100, 100);
        assert.deepEqual(V.decomposeMatrix(this.paper.matrix()), {
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateX: 100,
            translateY: 100
        }, 'changing the origin of the paper will modify the matrix');

        this.paper.scale(2, 2);
        assert.deepEqual(V.decomposeMatrix(this.paper.matrix()), {
            rotation: 0,
            scaleX: 2,
            scaleY: 2,
            skewX: 0,
            skewY: 0,
            translateX: 100,
            translateY: 100
        }, 'changing the scale of the paper will modify the matrix');

        this.paper.rotate(90);
        assert.deepEqual(V.decomposeMatrix(this.paper.matrix()), {
            rotation: 90,
            scaleX: 2,
            scaleY: 2,
            skewX: 90,
            skewY: 90,
            translateX: 100,
            translateY: 100
        }, 'changing the rotation of the paper will modify the matrix');
    });

    QUnit.module('transformations', function() {

        QUnit.test('scale', function(assert) {
            this.paper.scale(2);
            var viewportScale = V.matrixToScale(this.paper.viewport.getCTM());
            assert.equal(viewportScale.sx, 2);
            assert.equal(viewportScale.sy, 2);
            var getterScale = this.paper.scale();
            assert.equal(getterScale.sx, 2);
            assert.equal(getterScale.sy, 2);
        });

        QUnit.test('translate', function(assert) {
            this.paper.translate(10, 20);
            var viewportTranslate = V.matrixToTranslate(this.paper.viewport.getCTM());
            assert.equal(viewportTranslate.tx, 10);
            assert.equal(viewportTranslate.ty, 20);
            var getterTranslate = this.paper.translate();
            assert.equal(getterTranslate.tx, 10);
            assert.equal(getterTranslate.ty, 20);
        });

        QUnit.test('rotate', function(assert) {
            this.paper.rotate(45);
            var viewportRotate = V.matrixToRotate(this.paper.viewport.getCTM());
            assert.equal(viewportRotate.angle, 45);
            var getterRotate = this.paper.rotate();
            assert.equal(getterRotate.angle, 45);
        });
    });

    // Backgrounds
    QUnit.module('background', function(hooks) {

        function getUrlFromAttribute(attribute) {
            var urlMatches = /^url\((.+)\)$/.exec(attribute);
            return urlMatches && _.trim(urlMatches[1], '"');
        }

        var bgImageDataURL = 'data:image/png;base64,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';

        QUnit.test('color', function(assert) {

            this.paper.drawBackground({ color: 'red' });

            assert.checkCssAttr('backgroundColor', this.paper.$el, 'red');
        });

        QUnit.test('image', function(assert) {

            assert.expect(1);

            var done = assert.async();

            this.paper.drawBackground({ image: bgImageDataURL });

            _.delay(
                _.bind(function() {
                    assert.equal(
                        getUrlFromAttribute(this.paper.$background.css('backgroundImage')),
                        bgImageDataURL
                    );
                    done();
                }, this)
            );
        });

        QUnit.test('opacity', function(assert) {

            assert.expect(1);

            var done = assert.async();

            this.paper.drawBackground({ image: bgImageDataURL, opacity: 0.5 });

            _.delay(
                _.bind(function() {
                    assert.checkCssAttr('opacity', this.paper.$background, 0.5);
                    done();
                }, this)
            );
        });

        QUnit.module('repeat', function(hooks) {

            var img = document.createElement('img');
            img.src = bgImageDataURL;

            QUnit.test('flip-x', function(assert) {

                assert.expect(4);

                var done = assert.async();
                var flipXSpy = sinon.spy(joint.dia.Paper.backgroundPatterns, 'flipX');

                this.paper.drawBackground({
                    image: bgImageDataURL,
                    repeat: 'flip-x'
                });

                _.delay(function() {

                    assert.ok(flipXSpy.calledOnce);
                    assert.equal(flipXSpy.firstCall.args[0].src, bgImageDataURL);

                    var canvas = joint.dia.Paper.backgroundPatterns.flipX(img);
                    assert.equal(canvas.width, 2 * img.width);
                    assert.equal(canvas.height, img.height);

                    done();
                });
            });

            QUnit.test('flip-y', function(assert) {

                assert.expect(4);

                var done = assert.async();
                var flipYSpy = sinon.spy(joint.dia.Paper.backgroundPatterns, 'flipY');

                this.paper.drawBackground({
                    image: bgImageDataURL,
                    repeat: 'flip-y'
                });

                _.delay(function() {

                    assert.ok(flipYSpy.calledOnce);
                    assert.equal(flipYSpy.firstCall.args[0].src, bgImageDataURL);

                    var canvas = joint.dia.Paper.backgroundPatterns.flipY(img);
                    assert.equal(canvas.width, img.width);
                    assert.equal(canvas.height, 2 * img.height);

                    done();
                });
            });


            QUnit.test('flip-xy', function(assert) {

                assert.expect(4);

                var done = assert.async();
                var flipXYSpy = sinon.spy(joint.dia.Paper.backgroundPatterns, 'flipXy');

                this.paper.drawBackground({
                    image: bgImageDataURL,
                    repeat: 'flip-xy'
                });

                _.delay(function() {

                    assert.ok(flipXYSpy.calledOnce);
                    assert.equal(flipXYSpy.firstCall.args[0].src, bgImageDataURL);

                    var canvas = joint.dia.Paper.backgroundPatterns.flipXy(img);
                    assert.equal(canvas.width, 2 * img.width);
                    assert.equal(canvas.height, 2 * img.height);

                    done();
                });
            });

            QUnit.test('watermark', function(assert) {

                assert.expect(4);

                var done = assert.async();
                var watermarkSpy = sinon.spy(joint.dia.Paper.backgroundPatterns, 'watermark');

                this.paper.drawBackground({
                    image: bgImageDataURL,
                    repeat: 'watermark'
                });

                _.delay(function() {
                    assert.ok(watermarkSpy.calledOnce);
                    assert.equal(watermarkSpy.firstCall.args[0].src, bgImageDataURL);

                    var canvas = joint.dia.Paper.backgroundPatterns.watermark(img);
                    assert.ok(canvas.width > img.width);
                    assert.ok(canvas.height > img.height);

                    done();
                });
            });

            QUnit.test('[native]', function(assert) {

                assert.expect(2);

                var done = assert.async();

                assert.notEqual(this.paper.$background.css('background-repeat'), 'round');

                this.paper.drawBackground({
                    image: bgImageDataURL,
                    repeat: 'round'
                });

                _.delay(
                    _.bind(function() {
                        assert.equal(
                            this.paper.$background.css('background-repeat'),
                            'round'
                        );
                        done();
                    }, this)
                );
            });

        });

        QUnit.module('size', function() {

            QUnit.test('object', function(assert) {

                assert.expect(2);

                var done = assert.async();
                var paper = this.paper;

                paper.drawBackground({
                    image: bgImageDataURL,
                    size: { width: 100, height: 100 }
                });

                _.delay(function() {
                    assert.equal(paper.$background.css('backgroundSize'), '100px 100px');
                    paper.scale(2, 3);
                    assert.equal(paper.$background.css('backgroundSize'), '200px 300px');
                    done();
                });
            });

            QUnit.test('[native]', function(assert) {

                assert.expect(2);

                var done = assert.async();
                var paper = this.paper;

                paper.drawBackground({
                    image: bgImageDataURL,
                    size: '100px 100px'
                });

                _.delay(function() {
                    assert.equal(paper.$background.css('backgroundSize'), '100px 100px');
                    paper.scale(2, 3);
                    assert.equal(paper.$background.css('backgroundSize'), '100px 100px');
                    done();
                });
            });

        });

        QUnit.module('position', function() {

            QUnit.test('object', function(assert) {

                assert.expect(2);

                var done = assert.async();
                var paper = this.paper;

                paper.drawBackground({
                    image: bgImageDataURL,
                    position: { x: 100, y: 100 }
                });

                _.delay(function() {
                    assert.equal(paper.$background.css('backgroundPosition'), '100px 100px');
                    paper.scale(2, 3);
                    assert.equal(paper.$background.css('backgroundPosition'), '200px 300px');
                    done();
                });
            });

            QUnit.test('[native]', function(assert) {

                assert.expect(2);

                var done = assert.async();
                var paper = this.paper;

                paper.drawBackground({
                    image: bgImageDataURL,
                    position: '100px 100px'
                });

                _.delay(function() {
                    assert.equal(paper.$background.css('backgroundPosition'), '100px 100px');
                    paper.scale(2, 3);
                    assert.equal(paper.$background.css('backgroundPosition'), '100px 100px');
                    done();
                });
            });

        });

        QUnit.test('quality', function(assert) {

            var img1 = document.createElement('img');
            img1.src = bgImageDataURL;

            assert.expect(2);

            var done = assert.async();

            this.paper.drawBackground({
                image: bgImageDataURL,
                repeat: 'flip-x', // quality is valid only for custom repeat values, which uses canvas
                quality: 1 / 2
            });

            _.delay(
                _.bind(function() {
                    var img2 = document.createElement('img');
                    img2.src = getUrlFromAttribute(this.paper.$background.css('backgroundImage'));
                    img2.onload = function() {
                        assert.equal(img2.width, img1.width);
                        assert.equal(img2.height, img1.height / 2);
                        done();
                    };
                }, this)
            );
        });
    });
});

QUnit.module('links', function(hooks) {

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

    QUnit.module('isElement()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Link.prototype.isElement, 'function');
        });

        QUnit.test('should return FALSE', function(assert) {

            var link = new joint.dia.Link;

            assert.notOk(link.isElement());
        });
    });

    QUnit.module('isLink()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Link.prototype.isLink, 'function');
        });

        QUnit.test('should return TRUE', function(assert) {

            var link = new joint.dia.Link;

            assert.ok(link.isLink());
        });
    });

    QUnit.test('construction', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
        var r2 = r1.clone().translate(300);

        this.graph.addCell([r1, r2]);

        var l0 = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            attrs: { '.connection': { stroke: 'black' }}
        });

        this.graph.addCell(l0);

        assert.strictEqual(l0.constructor, joint.dia.Link, 'link.constructor === joint.dia.Link');

        var v0 = this.paper.findViewByModel(l0);

        assert.checkDataPath(v0.$('.connection').attr('d'), 'M 140 70 L 320 70', 'link path data starts at the source right-middle point and ends in the target left-middle point');

        var l1 = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            markup: '<path class="connection"/>'
        });

        assert.ok(_.isUndefined(l1.get('source').x) && _.isUndefined(l1.get('source').y),
            'Source connected to an element has no x or y.');
        assert.ok(_.isUndefined(l1.get('target').x) && _.isUndefined(l1.get('target').y),
            'Target connected to an element has no x or y.');

        this.graph.addCell(l1);
        var v1 = this.paper.findViewByModel(l1);

        assert.ok(v1, 'link with custom markup (1 child) is rendered.');

        var l2 = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            markup: '<path class="connection"/><path class="connection-wrap"/>'
        });
        this.graph.addCell(l2);
        var v2 = this.paper.findViewByModel(l2);

        assert.ok(v2, 'link with custom markup (2 children) is rendered.');

        // It should be possible to create empty links and set source/target later.
        var lEmpty = new joint.dia.Link;
        assert.ok(true, 'creating a link with no source/target does not throw an exception');
        var rEmpty = new joint.shapes.basic.Rect;
        var r2Empty = new joint.shapes.basic.Rect;

        this.graph.addCells([lEmpty, rEmpty, r2Empty]);

        lEmpty.set('source', { id: rEmpty.id });
        lEmpty.set('target', { id: r2Empty.id });

        assert.equal(lEmpty.get('source').id, rEmpty.id, 'source was set correctly on a blank link');
        assert.equal(lEmpty.get('target').id, r2Empty.id, 'target was set correctly on a blank link');
    });

    QUnit.module('validation', function() {

        QUnit.test('sanity', function(assert) {

            var paper = this.paper;
            var graph = this.graph;

            var r1, r2, l0;
            r1 = new joint.shapes.standard.Rectangle;
            r1.position(0, 0);
            r1.size(100, 100);
            r1.addPort({ id: 'port', attrs: { circle: { magnet: true }}})
            r2 = r1.clone();
            r2.translate(200);
            l0 = new joint.shapes.standard.Link;
            l0.source(r1);
            l0.target(r2);

            graph.addCells([r1, r2, l0]);

            var lv0 = l0.findView(paper);
            var rv1 = r1.findView(paper);
            var rv2 = r2.findView(paper);
            var r1port = rv1.el.querySelector('circle');
            var r2port = rv2.el.querySelector('circle');

            var spy = paper.options.validateConnection = sinon.spy(function() { return true; });
            var evt;

            evt = { type: 'mousemove' };
            lv0.startArrowheadMove('source');
            evt.target = paper.el;
            lv0.pointermove(evt, 1000, 1000);
            evt.target = rv1.el;
            lv0.pointermove(evt, 50, 50);
            lv0.pointerup(evt, 50, 50);

            assert.ok(spy.calledOnce);
            assert.ok(spy.calledWithExactly(rv1, undefined, rv2, undefined, 'source', lv0));
            spy.reset();

            lv0.startArrowheadMove('source');
            evt.target = paper.el;
            lv0.pointermove(evt, 1000, 1000);
            evt.target = r1port;
            lv0.pointermove(evt, 5, 5);
            lv0.pointerup(evt, 50, 50);

            assert.ok(spy.calledOnce);
            assert.ok(spy.calledWithExactly(rv1, r1port, rv2, undefined, 'source', lv0));
            spy.reset();

            lv0.startArrowheadMove('target');
            evt.target = paper.el;
            lv0.pointermove(evt, 1000, 1000);
            evt.target = rv2.el;
            lv0.pointermove(evt, 5, 5);
            lv0.pointerup(evt, 50, 50);

            assert.ok(spy.calledOnce);
            assert.ok(spy.calledWithExactly(rv1, r1port, rv2, undefined, 'target', lv0));
            spy.reset();

            lv0.startArrowheadMove('target');
            evt.target = paper.el;
            lv0.pointermove(evt, 1000, 1000);
            evt.target = r2port;
            lv0.pointermove(evt, 5, 5);
            lv0.pointerup(evt, 50, 50);

            assert.ok(spy.calledOnce);
            assert.ok(spy.calledWithExactly(rv1, r1port, rv2, r2port, 'target', lv0));
            spy.reset();

        });
    });

    QUnit.test('interaction', function(assert) {

        assert.expect(6);

        var event;
        var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
        var r2 = r1.clone().translate(300);
        var r3 = r2.clone().translate(300);

        this.graph.addCell([r1, r2, r3]);

        var vr1 = this.paper.findViewByModel(r1);
        var vr3 = this.paper.findViewByModel(r3);

        var l0 = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            attrs: { '.connection': { stroke: 'black' }},
            labels: [
                { position: .5, attrs: { text: { text: 'test label' }}}
            ]
        });

        this.graph.addCell(l0);

        var v0 = this.paper.findViewByModel(l0);

        this.paper.options.validateConnection = function(vs, ms, vt, mt, v) {
            assert.ok(vs === vr1 && vt === vr3, 'connection validation executed');
            return vt instanceof joint.dia.ElementView;
        };

        // adding vertices
        event = { target: v0.el.querySelector('.connection') };
        v0.pointerdown(event, 200, 70);
        v0.pointerup(event);
        assert.deepEqual(l0.get('vertices'), [{ x: 200, y: 70 }], 'vertex added after click the connection.');

        var firstVertexRemoveArea = v0.el.querySelector('.marker-vertex-remove-area');

        event = { target: v0.el.querySelector('.connection') };
        v0.pointerdown(event, 300, 70);
        v0.pointermove(event, 300, 100);
        v0.pointerup(event);
        assert.deepEqual(l0.get('vertices'), [{ x: 200, y: 70 }, { x: 300, y: 100 }], 'vertex added and translated after click the connection wrapper and mousemove.');

        event = { target: firstVertexRemoveArea };
        v0.pointerdown(event);
        v0.pointerup(event);

        // arrowheadmove

        var highlighted = false;

        this.paper.on('cell:highlight', function(cellView, el) {

            if (el[0] === vr3.el[0]) {
                highlighted = true;
            }
        });

        this.paper.on('cell:unhighlight', function(cellView, el) {

            if (el[0] === vr3.el[0]) {
                highlighted = false;
            }
        });

        event = { target: v0.el.querySelector('.marker-arrowhead[end="target"]') };
        v0.pointerdown(event);
        event.target = vr3.el;
        event.type = 'mousemove';
        v0.pointermove(event, 630, 40);
        assert.ok(highlighted, 'moving pointer over the rectangle makes the rectangle highlighted');

        event.target = this.paper.el;
        v0.pointermove(event, 400, 400);
        assert.notOk(highlighted, 'after moving the pointer to coordinates 400, 400 the rectangle is not highlighted anymore');

        v0.pointerup(event);
        assert.checkDataPath(v0.el.querySelector('.connection').getAttribute('d'), 'M 140 78 L 300 100 L 400 400', 'link path data starts at the source right-middle point, going through the vertex and ends at the coordinates 400, 400');
    });

    QUnit.test('defaultLink', function(assert) {

        assert.expect(10);

        this.paper.options.defaultLink = new joint.dia.Link();

        var link = this.paper.getDefaultLink();

        assert.ok(link instanceof joint.dia.Link, 'sanity: defaultLink is cloned');

        this.paper.options.defaultLink = function(v, m) {

            return new joint.dia.Link();
        };

        link = this.paper.getDefaultLink();

        assert.ok(link instanceof joint.dia.Link, 'sanity: defaultLink is a function');

        var MyLink = joint.dia.Link.extend({
            isMyLink: true
        });

        var model = new joint.shapes.basic.Rect({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 },
            attrs: { rect: { magnet: true, port: 'myPort' }}
        });

        this.graph.addCell(model);

        var view = this.paper.findViewByModel(model);
        var rect = view.$('rect')[0];

        this.graph.on('add', function(cell) {

            assert.ok(cell.isMyLink, 'We click the port and a default link was created.');

            // check source of the link
            var source = cell.get('source');
            assert.ok(source.id  === model.id && source.port === 'myPort', 'It starts in the port we clicked.');

            // check target of the link
            var target = cell.get('target');
            assert.ok(typeof target.id === 'undefined', 'It ends in the paper.');

        });

        this.paper.options.defaultLink = new MyLink();

        simulate.mousedown({ el: rect });
        simulate.mouseup({ el: rect });

        link = this.graph.getLinks()[0];
        var linkView = link.findView(this.paper);
        assert.equal(linkView.sourceMagnet, rect);
        link.remove();

        this.paper.options.defaultLink = function(cellView, magnet) {

            assert.ok(cellView === view && magnet === rect, 'We set defaultLink to a function. It was executed with correct parameters.');

            return new MyLink();
        };

        simulate.mousedown({ el: rect });
        simulate.mouseup({ el: rect });

    });

    QUnit.test('source', function(assert) {

        var link = new joint.dia.Link({
            source: { x: 40, y: 40 },
            target: { x: 100, y: 100 }
        });

        this.graph.addCell(link);

        assert.equal(typeof link.source, 'function', 'should be a function');

        var source;

        source = link.source();

        assert.deepEqual(source, { x: 40, y: 40 }, 'source is a correct point');

        var element = new joint.shapes.basic.Rect({
            position: { x: 20, y: 20 },
            size: { width: 60, height: 60 }
        });

        this.graph.addCell(element);

        link.source(element);

        source = link.source();

        assert.deepEqual(source, { id: element.id }, 'source is a correct element');
        assert.equal(source.id, link.getSourceElement().id, 'source element ID is correct');
    });

    QUnit.test('target', function(assert) {

        var link = new joint.dia.Link({
            source: { x: 40, y: 40 },
            target: { x: 100, y: 100 }
        });

        this.graph.addCell(link);

        assert.equal(typeof link.target, 'function', 'should be a function');

        var target;

        target = link.target();

        assert.deepEqual(target, { x: 100, y: 100 }, 'target is a correct point');

        var element = new joint.shapes.basic.Rect({
            position: { x: 20, y: 20 },
            size: { width: 60, height: 60 }
        });

        this.graph.addCell(element);

        link.target({ id: element.id });

        target = link.target();

        assert.deepEqual(target, { id: element.id }, 'target is a correct element');
        assert.equal(target.id, link.getTargetElement().id, 'target element ID is correct');
    });

    QUnit.test('disconnect(), connect()', function(assert) {

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });

        this.graph.addCell(myrect);

        var myrect2 = myrect.clone();
        myrect2.translate(300);
        this.graph.addCell(myrect2);

        var link = new joint.dia.Link({

            source: { id: myrect.id },
            target: { id: myrect2.id },
            attrs: { '.connection': { stroke: 'black' }}
        });

        this.graph.addCell(link);

        var linkView = this.paper.findViewByModel(link);

        // disconnect:
        link.set('source', linkView.sourcePoint.toJSON());

        assert.notOk(link.get('source').id, 'source of the link became a point');
        assert.ok(link.get('target').id, 'target of the link is still not a point');

        assert.checkDataPath(linkView.$('.connection').attr('d'), 'M 140 70 L 320 70', 'link path data stayed the same after disconnection');
        assert.checkDataPath(linkView.$('.connection-wrap').attr('d'), 'M 140 70 L 320 70', 'link connection-wrap path data is the same as the .connection path data');

        myrect.translate(-10);

        assert.checkDataPath(linkView.$('.connection').attr('d'), 'M 140 70 L 320 70', 'link path data stayed the same after the disconnected source moved');

        link.set('source', { id: myrect.id });

        assert.checkDataPath(linkView.$('.connection').attr('d'), 'M 130 70 L 320 70', 'link path data updated after the disconnected source became re-connected again');

        myrect.translate(10);

        assert.checkDataPath(linkView.$('.connection').attr('d'), 'M 140 70 L 320 70', 'link path data updated after the just connected source moved');

        // disconnect:
        link.set('target', linkView.targetPoint.toJSON());

        assert.notOk(link.get('target').id, 'target of the link became a point');
        assert.ok(link.get('source').id, 'source of the link is still not a point');

        link.set('target', { id: myrect2.id });

        assert.ok(link.get('source').id, 'source of the link is still not a point');
        assert.ok(link.get('target').id, 'target of the link stopped being a point');

        myrect.remove({ disconnectLinks: true });

        assert.notOk(link.get('source').id, 'source of the link became a point after the source element has been removed');
        assert.ok(link.get('target').id, 'target of the link is still not a point');
    });

    QUnit.test('getLinks(), clone()', function(assert) {

        var myrect = new joint.shapes.basic.Rect;
        var myrect2 = myrect.clone();

        this.graph.addCell(myrect);
        this.graph.addCell(myrect2);

        var link = new joint.dia.Link({
            source: { id: myrect.id },
            target: { id: myrect2.id }
        });
        var link2 = link.clone();
        this.graph.addCell(link);
        this.graph.addCell(link2);

        assert.deepEqual(_.map(this.graph.getConnectedLinks(myrect), 'id'), [link.id, link2.id], 'getConnectedLinks() returns both links comming out of the source element');
        assert.deepEqual(_.map(this.graph.getConnectedLinks(myrect2), 'id'), [link.id, link2.id], 'getConnectedLinks() returns both links leading to the target element');

        link.disconnect();

        assert.deepEqual(_.map(this.graph.getConnectedLinks(myrect), 'id'), [link2.id], 'getConnectedLinks() returns only one link coming out of it after the other has been disconnected');
        assert.deepEqual(_.map(this.graph.getConnectedLinks(myrect2), 'id'), [link2.id], 'getConnectedLinks() returns only one link leading to it after the other has been disconnected');

        assert.deepEqual(_.map(this.graph.getConnectedLinks(myrect, { outbound: true }), 'id'), [link2.id], 'getConnectedLinks(outbound) returns only the one link coming out the element');
        assert.deepEqual(_.map(this.graph.getConnectedLinks(myrect, { inbound: true }), 'id'), [], 'getConnectedLinks(inbound) returns no link as the element is not source of any link');
    });

    QUnit.test('hasLoop()', function(assert) {

        var myrect = new joint.shapes.basic.Rect;
        this.graph.addCell(myrect);
        var link = new joint.dia.Link({ source: { id: myrect.id }, target: { id: myrect.id }});
        this.graph.addCell(link);
        assert.equal(link.hasLoop(), true, 'link has a loop');

        var myrect2 = new joint.shapes.basic.Rect;
        this.graph.addCell(myrect2);
        var link2 = new joint.dia.Link({ source: { id: myrect2.id }, target: { x: 20, y: 20 }});
        this.graph.addCell(link2);
        assert.equal(link2.hasLoop(), false, 'link pinned to the paper does not have a loop');
        assert.equal(link2.hasLoop({ deep: true }), false, 'link pinned to the paper does not have a loop with deep = true');

        var myrect3 = new joint.shapes.basic.Rect;
        var myrect3a = new joint.shapes.basic.Rect;
        myrect3.embed(myrect3a);
        this.graph.addCells([myrect3, myrect3a]);
        var link3 = new joint.dia.Link({ source: { id: myrect3.id }, target: { id: myrect3a.id }});
        this.graph.addCell(link3);
        assert.equal(link3.hasLoop(), false, 'link targetting an embedded element does not have a loop with deep = false');
        assert.equal(link3.hasLoop({ deep: true }), true, 'link targetting an embedded element does have a loop with deep = true');
    });

    QUnit.test('markers', function(assert) {

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });
        var myrect2 = myrect.clone();
        myrect2.translate(300);

        this.graph.addCell(myrect);
        this.graph.addCell(myrect2);

        var link = new joint.dia.Link({

            source: { id: myrect.id },
            target: { id: myrect2.id },
            attrs: {
                '.connection': {
                    stroke: 'black'
                },
                '.marker-source': {
                    d: 'M 10 0 L 0 5 L 10 10 z'
                },
                '.marker-target': {
                    d: 'M 10 0 L 0 5 L 10 10 z'
                }
            }
        });

        this.graph.addCell(link);

        var linkView = this.paper.findViewByModel(link);

        var markerSourceBbox = V(linkView.$('.marker-source')[0]).bbox();

        assert.deepEqual(
            { x: markerSourceBbox.x, y: markerSourceBbox.y, width: markerSourceBbox.width, height: markerSourceBbox.height },
            { x: 140, y: 65, width: 10, height: 10 },
            '.marker-source should point to the left edge of the rectangle'
        );

        var markerTargetBbox = V(linkView.$('.marker-target')[0]).bbox();

        assert.deepEqual(
            { x: markerTargetBbox.x, y: markerTargetBbox.y, width: markerTargetBbox.width, height: markerTargetBbox.height, rotation: V(linkView.$('.marker-target')[0]).rotate().angle },
            { x: 310, y: 65, width: 10, height: 10, rotation: -180 },
            '.marker-target should point to the right edge of the rectangle 2 and should be rotated by -180 degrees'
        );
    });

    QUnit.test('vertices', function(assert) {

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });
        var myrect2 = myrect.clone();
        myrect2.translate(300);

        this.graph.addCell(myrect);
        this.graph.addCell(myrect2);

        var link = new joint.dia.Link({

            source: { id: myrect.id },
            target: { id: myrect2.id },
            vertices: [{ x: 80, y: 150 }, { x: 380, y: 150 }],
            attrs: {
                '.connection': {
                    stroke: 'black'
                },
                '.marker-source': {
                    d: 'M 10 0 L 0 5 L 10 10 z'
                },
                '.marker-target': {
                    d: 'M 10 0 L 0 5 L 10 10 z'
                }
            }
        });

        this.graph.addCell(link);

        var linkView = this.paper.findViewByModel(link);

        var markerSourceBbox = V(linkView.$('.marker-source')[0]).bbox();

        assert.deepEqual(
            {
                x: markerSourceBbox.x,
                y: markerSourceBbox.y,
                width: markerSourceBbox.width,
                height: markerSourceBbox.height,
                rotation: g.normalizeAngle(V(linkView.$('.marker-source')[0]).rotate().angle)
            },
            {
                x: 75,
                y: 110,
                width: 10,
                height: 10,
                rotation: g.normalizeAngle(-270)
            },
            '.marker-source should point to the bottom edge of the rectangle and should be rotated by -270 degrees'
        );

        var markerTargetBbox = V(linkView.$('.marker-target')[0]).bbox();

        assert.deepEqual(
            {
                x: markerTargetBbox.x,
                y: markerTargetBbox.y,
                width: markerTargetBbox.width,
                height: markerTargetBbox.height,
                rotation: g.normalizeAngle(V(linkView.$('.marker-target')[0]).rotate().angle)
            },
            {
                x: 375,
                y: 110,
                width: 10,
                height: 10,
                rotation: g.normalizeAngle(-270)
            },
            '.marker-target should point to the bottom edge of the rectangle 2 and should be rotated by -270 degrees'
        );

        assert.equal($('.marker-vertex').length, 2, 'there is exactly 2 vertex markers on the page');

        var firstVertextPosition = g.rect(V($('.marker-vertex')[0]).bbox()).center();
        assert.deepEqual(
            { x: firstVertextPosition.x, y: firstVertextPosition.y },
            link.get('vertices')[0],
            'first vertex is in the same position as defined in the vertices array'
        );

        var secondVertextPosition = g.rect(V($('.marker-vertex')[1]).bbox()).center();
        assert.deepEqual(
            { x: secondVertextPosition.x, y: secondVertextPosition.y },
            link.get('vertices')[1],
            'second vertex is in the same position as defined in the vertices array'
        );
    });

    QUnit.test('perpendicularLinks', function(assert) {

        this.paper.options.perpendicularLinks = true;

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });
        var myrect2 = myrect.clone();
        myrect2.translate(300);

        this.graph.addCell(myrect);
        this.graph.addCell(myrect2);

        var link = new joint.dia.Link({

            source: { id: myrect.id },
            target: { id: myrect2.id },
            vertices: [{ x: 138, y: 150 }, { x: 180, y: 108 }],
            attrs: {
                '.connection': {
                    stroke: 'black'
                },
                '.marker-source': {
                    d: 'M 0 0 L 0 0 z'
                },
                '.marker-target': {
                    d: 'M 0 0 L 0 0 z'
                }
            }
        });

        this.graph.addCell(link);

        var linkView = this.paper.findViewByModel(link);

        var markerSourceBbox = V(linkView.$('.marker-source')[0]).bbox();

        assert.deepEqual(
            { x: markerSourceBbox.x, y: markerSourceBbox.y },
            { x: 138, y: 110 },
            '.marker-source should point vertically to the edge of the source rectangle making the part of the link before the first vertex perpendicular to the source rectangle'
        );

        var markerTargetBbox = V(linkView.$('.marker-target')[0]).bbox();

        assert.deepEqual(
            { x: markerTargetBbox.x, y: markerTargetBbox.y },
            { x: myrect2.get('position').x, y: 108 },
            '.marker-target should point horizontally to the edge of the target rectangle making the part of the link after the last vertex perpendicular to the target rectangle'
        );

    });

    QUnit.module('Labels', function(assert) {

        QUnit.test('labels', function(assert) {

            var myrect = new joint.shapes.basic.Rect;
            var myrect2 = myrect.clone();
            myrect2.translate(300);

            this.graph.addCell(myrect);
            this.graph.addCell(myrect2);

            var link = new joint.dia.Link({

                source: { id: myrect.id },
                target: { id: myrect2.id },
                labels: [
                    { position: 10, attrs: { text: { text: '1..n' }}},
                    { position: .5, attrs: { text: { text: 'Foo', fill: 'white', 'font-family': 'sans-serif' }, rect: { stroke: '#F39C12', 'stroke-width': 20, rx: 5, ry: 5 }}},
                    { position: -10, attrs: { text: { text: '*' }}}
                ]
            });

            this.graph.addCell(link);

            var linkView = this.paper.findViewByModel(link);

            assert.equal(linkView.$('.label').length, 3, 'label elements were correctly added to the DOM');

            var label1Bbox = V(linkView.$('.label')[0]).bbox();
            var label2Bbox = V(linkView.$('.label')[1]).bbox();
            var label3Bbox = V(linkView.$('.label')[2]).bbox();

            assert.ok(label1Bbox.x < label2Bbox.x, 'second label is positioned after the first one');
            assert.ok(label2Bbox.x < label3Bbox.x, 'third label is positioned after the second one');

            assert.equal(linkView.$('.label')[0].textContent, '1..n', 'first label has correctly set text');
            assert.equal(linkView.$('.label')[1].textContent, 'Foo', 'second label has correctly set text');
            assert.equal(linkView.$('.label')[2].textContent, '*', 'third label has correctly set text');

            link.label(1, { attrs: { text: { text: 'Bar' }}});

            assert.equal(linkView.$('.label')[1].textContent, 'Bar', 'a call to link.label() changed text of the second label correctly');

            link.label(0, { position: -10 });

            label1Bbox = V(linkView.$('.label')[0]).bbox();
            assert.ok(label1Bbox.x > label2Bbox.x, 'second label is positioned before the first one after changing the first one position');
        });

        QUnit.test('labelMove', function(assert) {

            assert.expect(2);

            var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 50, height: 50 }});
            var r2 = r1.clone().translate(250);

            this.graph.addCell([r1, r2]);

            var l0 = new joint.dia.Link({
                source: { id: r1.id },
                target: { id: r2.id },
                attrs: { '.connection': { stroke: 'black' }},
                labels: [
                    { position: .5, attrs: { text: { text: 'test label' }}}
                ]
            });

            this.graph.addCell(l0);

            var v0 = this.paper.findViewByModel(l0);

            v0.options.interactive = { labelMove: true };
            var event = { currentTarget: v0.$('.label')[0], type: 'mousedown' };
            v0.dragLabelStart(event);
            v0.pointermove(event, 150, 25);
            assert.equal(l0.get('labels')[0].position.offset, -50, 'offset was set during the label drag');
            assert.equal(l0.get('labels')[0].position.distance, .25, 'distance was set during the label drag');
            v0.pointerup(event);
        });

        QUnit.test('change:labels', function(assert) {

            var l = new joint.dia.Link({
                source: { x: 0, y: 0 },
                target: { x: 100, y: 100 }
            }).addTo(this.graph);

            var view = l.findView(this.paper);
            var renderSpy = sinon.spy(view, 'renderLabels');
            var updateSpy = sinon.spy(view, 'updateLabels');

            l.set({
                labels: [
                    { position: 20, attrs: { text: { text: 'label1' }}},
                    { position: -20, attrs: { text: { text: 'label2' }}}
                ]
            });
            assert.ok(renderSpy.calledOnce);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();


            l.prop('labels/0/attrs/text/text', 'label3', { rewrite: true });
            assert.ok(renderSpy.notCalled);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/0', { attrs: { text: { text: 'label4' }}}, { rewrite: true });
            assert.ok(renderSpy.notCalled);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/1', { markup: '<rect/><text/>' }, { rewrite: true });
            assert.ok(renderSpy.calledOnce);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/0/markup', '<rect/><text/>', { rewrite: true });
            assert.ok(renderSpy.calledOnce);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/1', { markup: [{ tagName: 'rect' }, { tagName: 'text' }] }, { rewrite: true });
            assert.ok(renderSpy.calledOnce);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/0/markup', [{ tagName: 'rect' }, { tagName: 'text' }], { rewrite: true });
            assert.ok(renderSpy.calledOnce);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/1', { markup: [{ tagName: 'rect', selector: 'body' }, { tagName: 'text', selector: 'label' }] }, { rewrite: true });
            assert.ok(renderSpy.calledOnce);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/0/markup', [{ tagName: 'rect', selector: 'body' }, { tagName: 'text', selector: 'label' }], { rewrite: true });
            assert.ok(renderSpy.calledOnce);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/0/attrs/label/text', 'label3', { rewrite: true });
            assert.ok(renderSpy.notCalled);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();

            l.prop('labels/0', { attrs: { label: { text: 'label4' }}}, { rewrite: true });
            assert.ok(renderSpy.notCalled);
            assert.ok(updateSpy.calledOnce);
            renderSpy.reset();
            updateSpy.reset();
        });

    });

    QUnit.test('magnets & ports', function(assert) {

        var myrect = new joint.shapes.basic.Rect;
        var myrect2 = myrect.clone();
        myrect2.translate(300);

        this.graph.addCells([myrect, myrect2]);

        myrect.attr('text', { magnet: true, port: 'port1' });
        myrect2.attr('text', { magnet: true, port: 'port2' });

        var myrectView = this.paper.findViewByModel(myrect);
        var myrect2View = this.paper.findViewByModel(myrect2);

        simulate.mousedown({ el: myrectView.$('text')[0] });
        simulate.mousemove({ el: myrect2View.$('text')[0] });
        simulate.mouseup({ el: myrect2View.$('text')[0] });

        var link = this.graph.getLinks()[0];
        var linkView = link.findView(this.paper);
        assert.equal(link.get('source').port, 'port1', 'port was automatically assigned to the link source');
        assert.equal(link.get('target').port, 'port2', 'port was automatically assigned to the link target');
        assert.equal(linkView.sourceMagnet, myrectView.$('text')[0], 'source selector points to the magnet element');
        assert.equal(linkView.targetMagnet, myrect2View.$('text')[0], 'target selector points to the magnet element');

        // The functionality below is not implemented, hence skiping the test.
        // myrect.attr('text', { port: 'port3' });
        // equal(link.get('source').port, 'port3', 'changing port on an element automatically changes the same port on a link');
    });

    QUnit.test('snap links', function(assert) {

        var event;
        var link = new joint.dia.Link({
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 }
        });

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 100, y: 100 }
        });

        this.graph.addCells([myrect, link]);

        var v = this.paper.findViewByModel(link);
        var t = v.el.querySelector('.marker-arrowhead[end=target]');

        // link target was out of the radius and therefore was not snapped to the element

        this.paper.options.snapLinks = { radius: 5 };

        event = { target: t };
        v.pointerdown(event, 0, 0);
        event.target = this.paper.el;
        v.pointermove(event, 90, 90);
        v.pointerup(event, 90, 90);

        assert.deepEqual(link.get('target'), {
            x: 90, y: 90
        }, 'link target was out of the radius and therefore was not snapped to the element');

        // link target was snapped to the element

        this.paper.options.snapLinks = { radius: 50 };

        event = { target: t };
        v.pointerdown(event, 0, 0);
        event.target = this.paper.el;
        v.pointermove(event, 90, 90);
        v.pointerup(event, 90, 90);

        assert.ok(link.get('target').id === myrect.id, 'link target was snapped to the element');

        // link target was snapped to the port

        // getBoundingClientRect returns negative values for top and left when paper not visible
        this.paper.options.snapLinks = { radius: Number.MAX_VALUE };

        myrect.attr('.', { magnet: false });
        myrect.attr('text', { magnet: true, port: 'port' });

        this.paper.options.validateConnection = function() { return true; };

        event = { target: t };
        v.pointerdown(event, 0, 0);
        event.target = this.paper.el;
        v.pointermove(event, 90, 90);
        v.pointerup(event, 90, 90);

        assert.ok(link.get('target').port === 'port', 'link target was snapped to the port');

        // the validation is taken into account when snapping to port

        this.paper.options.validateConnection = function() { return false; };

        event = { target: t };
        v.pointerdown(event, 0, 0);
        event.target = this.paper.el;
        v.pointermove(event, 90, 90);
        v.pointerup(event, 90, 90);

        assert.deepEqual(link.get('target'), {
            x: 90, y: 90
        }, 'the validation is taken into account when snapping to port');
    });

    QUnit.test('mark available', function(assert) {

        var event;
        var link = new joint.dia.Link({
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 }
        });

        var myrect1 = new joint.shapes.basic.Rect({
            position: { x: 100, y: 100 }
        });

        var myrect2 = new joint.shapes.basic.Rect({
            position: { x: 200, y: 200 },
            attrs: {
                '.': { magnet: false },
                rect: { magnet: true },
                text: { magnet: true }
            }
        });

        this.graph.addCells([myrect1, myrect2, link]);

        var v = this.paper.findViewByModel(link);
        var t = v.el.querySelector('.marker-arrowhead[end=target]');

        this.paper.options.markAvailable = true;

        event = { target: t };
        v.pointerdown(event, 0, 0);

        var availableMagnets = this.paper.el.querySelectorAll('.available-magnet');
        var availableCells = this.paper.el.querySelectorAll('.available-cell');

        assert.equal(availableMagnets.length, 3,
            '3 magnets got marked when dragging an arrowhead started.');
        assert.equal(availableCells.length, 2,
            '2 cells got marked when dragging an arrowhead started.');

        event.target = this.paper.el;
        v.pointerup(event, 90, 90);

        availableMagnets = this.paper.el.querySelectorAll('.available-magnet');
        availableCells = this.paper.el.querySelectorAll('.available-cell');

        assert.equal(availableMagnets.length + availableCells.length, 0,
            'When dragging an arrowhed stopped all magnets and cells were unmarked.');
    });

    QUnit.test('defaultRouter', function(assert) {

        assert.expect(1);

        this.paper.options.defaultRouter = function(vertices) {
            assert.ok(vertices.length > 0, 'Default router was used for the model with no router defined.');
        };

        var linkDefaultRouter = new joint.dia.Link({
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
            vertices: [{ x: 50, y: 50 }]
        });

        var linkOwnRouter = new joint.dia.Link({
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
            router: { name: 'orthogonal' },
            vertices: []
        });

        this.graph.addCells([linkDefaultRouter, linkOwnRouter]);
    });

    QUnit.test('defaultConnector', function(assert) {

        assert.expect(1);

        this.paper.options.defaultConnector = function(s, t, vertices) {
            assert.ok(vertices.length > 0, 'Default connector was used for the model with no connector defined.');
            return 'M 0 0';
        };

        var linkDefaultConnector = new joint.dia.Link({
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
            vertices: [{ x: 50, y: 50 }]
        });

        var linkOwnConnector = new joint.dia.Link({
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
            connector: { name: 'normal' },
            vertices: []
        });

        this.graph.addCells([linkDefaultConnector, linkOwnConnector]);
    });

    QUnit.test('getSourceElement', function(assert) {

        var link = new joint.dia.Link({
            source: { x: 40, y: 40 },
            target: { x: 100, y: 100 }
        });

        this.graph.addCell(link);

        assert.equal(typeof link.getSourceElement, 'function', 'should be a function');

        var source;

        source = link.getSourceElement();

        assert.equal(source, null, 'without source element');

        var element = new joint.shapes.basic.Rect({
            position: { x: 20, y: 20 },
            size: { width: 60, height: 60 }
        });

        this.graph.addCell(element);

        link.set('source', { id: element.id });

        source = link.getSourceElement();

        assert.ok(source && source instanceof joint.dia.Element && source.id === element.id, 'with source element');

        var linkNotInGraph = new joint.dia.Link({
            source: { id: element.get('id') },
            target: { id: element.get('id') }
        });

        var thrownError;

        try {
            linkNotInGraph.getSourceElement();
        } catch (error) {
            thrownError = error;
        }

        assert.ok(typeof thrownError === 'undefined', 'should not throw an error when link not in graph');
    });

    QUnit.test('getTargetElement', function(assert) {

        var link = new joint.dia.Link({
            source: { x: 40, y: 40 },
            target: { x: 100, y: 100 }
        });

        this.graph.addCell(link);

        assert.equal(typeof link.getTargetElement, 'function', 'should be a function');

        var target;

        target = link.getTargetElement();

        assert.equal(target, null, 'without target element');

        var element = new joint.shapes.basic.Rect({
            position: { x: 20, y: 20 },
            size: { width: 60, height: 60 }
        });

        this.graph.addCell(element);

        link.set('target', { id: element.id });

        target = link.getTargetElement();

        assert.ok(target && target instanceof joint.dia.Element && target.id === element.id, 'with target element');

        var linkNotInGraph = new joint.dia.Link({
            source: { id: element.get('id') },
            target: { id: element.get('id') }
        });

        var thrownError;

        try {
            linkNotInGraph.getTargetElement();
        } catch (error) {
            thrownError = error;
        }

        assert.ok(typeof thrownError === 'undefined', 'should not throw an error when link not in graph');
    });

    QUnit.test('getRelationshipAncestor()', function(assert) {

        var a = new joint.shapes.basic.Rect({ id: 'a' });
        var b = new joint.shapes.basic.Rect({ id: 'b' });
        var c = new joint.shapes.basic.Rect({ id: 'c' });
        var l = new joint.dia.Link({ id: 'l' });

        this.graph.addCells([a, b, c, l]);

        assert.equal(l.getRelationshipAncestor(), null, 'Link has no parent and connects 2 points. No ancestor found.');

        l.set('source', { id: 'a' });
        assert.equal(l.getRelationshipAncestor(), null, 'Link has no parent and connects a point and an element. No ancestor found.');

        l.set('target', { id: 'b' });
        assert.equal(l.getRelationshipAncestor(), null, 'Link has no parent and connects 2 elements. No ancestor found.');

        c.embed(a).embed(b);
        assert.equal(l.getRelationshipAncestor(), null, 'Source and target are embedded. No ancestor found.');

        c.embed(l);
        assert.equal(l.getRelationshipAncestor(), c, 'Source, target and link are embedded. Ancestor found.');

        c.unembed(a).unembed(b);
        assert.equal(l.getRelationshipAncestor(), null, 'Only link is embeded. No ancestor found.');
    });

    QUnit.test('isRelationshipEmbeddedIn()', function(assert) {

        var a = new joint.shapes.basic.Rect({ id: 'a' });
        var b = new joint.shapes.basic.Rect({ id: 'b' });
        var c = new joint.shapes.basic.Rect({ id: 'c' });
        var l = new joint.dia.Link({ id: 'l' });

        this.graph.addCells([a, b, c, l]);

        assert.notOk(l.isRelationshipEmbeddedIn(c), 'Link has no parent and connects 2 points. The relationship is not embedded.');

        c.embed(l);
        assert.ok(l.isRelationshipEmbeddedIn(c), 'Link is embedded and connects 2 points. The relationship is embedded.');

        l.set('source', { id: 'a' });
        assert.notOk(l.isRelationshipEmbeddedIn(c), 'Link is embedded and connects a point and an element with no parent. The relationship is not embedded.');

        l.set('target', { id: 'b' });
        assert.notOk(l.isRelationshipEmbeddedIn(c), 'Link is embedded and connects 2 elements with no parents. The relationship is not embedded.');

        c.embed(a).embed(b);
        assert.ok(l.isRelationshipEmbeddedIn(c), 'Link is embedded and connects 2 elements also embedded. The relationship is embedded.');
    });

    QUnit.test('update count', function(assert) {

        var a = new joint.shapes.basic.Rect({ id: 'a' });
        var b = new joint.shapes.basic.Rect({ id: 'b' });
        var c = new joint.shapes.basic.Rect({ id: 'c' });
        var l = new joint.dia.Link({ id: 'l' });
        var l2 = new joint.dia.Link({ id: 'l2' });

        this.graph.addCells([a, b, c, l, l2]);
        var lv = l.findView(this.paper);
        var l2v = l2.findView(this.paper);

        sinon.spy(lv, 'update');
        sinon.spy(lv, 'findRoute');
        sinon.spy(l2v, 'update');

        l.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link point to point, link translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: link point to point, link translated');

        l.set('target', { id: 'a' });
        lv.update.reset();
        l.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link point to element, source translated');

        l.set('target', { x: 0, y: 0 });
        l.set('source', { id: 'a' });
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element to point, source translated');

        lv.update.reset();
        l.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element to point, link translated');

        l.vertices([{ x: 0, y: 0 }]);
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element to point with vertices, link translated');

        // loop
        l.vertices([]);
        l.set('target', { id: 'a' });
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: loop link, source translated');

        // link element-element
        l.set('target', { id: 'b' });
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element, source translated');

        l.set('vertices', [{ x: 0, y: 0 }]);
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element with vertices, source translated');

        l.set('target', { x: 0, y: 0 });
        lv.update.reset();
        l.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link point-element with vertices, link translated');

        // loop + vertices
        l.set('target', { id: 'a' });
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: loop link with vertices, source translated.');

        // embeds

        // loop + vertices + embedded
        a.embed(l);
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: embedded loop link with vertices, source translated.');

        // loop + vertices + embedded (moving container)
        c.embed(a);
        lv.update.reset();
        c.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: embedded loop link with vertices, container translated.');

        // loop + vertices + embedded (resizing source)
        lv.update.reset();
        a.resize(100, 100);
        assert.equal(lv.update.callCount, 1, 'update: embedded loop link with vertices, source resized.');

        a.unembed(l);
        lv.update.reset();
        a.resize(99, 99);
        assert.equal(lv.update.callCount, 1, 'update: loop link with vertices, source resized.');

        c.embed(b).embed(l);
        l.set('target', { id: 'b' });

        // source, target and link with vertices are embedded,
        // translating container
        lv.findRoute.reset();
        lv.update.reset();
        c.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element with vertices embedded, container translated');
        assert.equal(lv.findRoute.callCount, 0, 'findRoute: link element-element with vertices embedded, container translated');

        // translating source
        lv.findRoute.reset();
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element with vertices embedded, source translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: link element-element with vertices embedded, source translated');

        // translating target
        lv.findRoute.reset();
        lv.update.reset();
        b.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element with vertices embedded, target translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: link element-element with vertices embedded, target translated');

        // source, target and link are embedded,
        // translating container
        l.set('vertices', []);
        lv.findRoute.reset();
        lv.update.reset();
        c.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element embedded, container translated');
        assert.equal(lv.findRoute.callCount, 0, 'findRoute: link element-element embedded, container translated');

        // translating source
        lv.findRoute.reset();
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element embedded, source translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: link element-element embedded, source translated');

        // translating target
        lv.findRoute.reset();
        lv.update.reset();
        b.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element embedded, target translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: link element-element embedded, target translated');

        // loop link and element are embedded
        // translating container
        l.set('target', { id: 'a' });
        lv.findRoute.reset();
        lv.update.reset();
        c.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: loop link embedded, container translated');
        assert.equal(lv.findRoute.callCount, 0, 'findRoute: loop link embedded, container translated');

        // translating element
        lv.findRoute.reset();
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: loop link embedded, source translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: loop link embedded, source translated');

        // link is not embedded, source and target embedded
        // translateing container
        c.unembed(l);
        l.set('target', { id: 'b' });
        lv.findRoute.reset();
        lv.update.reset();
        c.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element with embedded ends, container translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: link element-element with embedded ends, container translated');

        // translating source
        lv.findRoute.reset();
        lv.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element with embedded ends, source translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: link element-element with embedded ends, source translated');

        // translating target
        lv.findRoute.reset();
        lv.update.reset();
        b.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: link element-element with embedded ends, source translated');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: link element-element with embedded ends, source translated');

        // adding vertex
        lv.findRoute.reset();
        lv.update.reset();
        l.set('vertices', [{ x: 0, y: 0 }]);
        assert.equal(lv.update.callCount, 1, 'update: vertex added');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: vertex added');

        // changing attr
        lv.findRoute.reset();
        lv.update.reset();
        l.attr('.connection/stroke', 'red');
        assert.equal(lv.update.callCount, 1, 'update: change attrs');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: change attrs');

        // source resize
        lv.findRoute.reset();
        lv.update.reset();
        a.resize(20, 20);
        assert.equal(lv.update.callCount, 1, 'update: source resized');
        assert.equal(lv.findRoute.callCount, 1, 'findRoute: source resized');

        // 2 loop links connected to the same element.
        l2.set('source', { id: 'a' }).set('target', { id: 'b' });
        l.set('source', { id: 'a' }).set('target', { id: 'b' });
        lv.update.reset();
        l2v.update.reset();
        a.translate(10, 10);
        assert.equal(lv.update.callCount, 1, 'update: 2 loops link, source translated (first)');
        assert.equal(l2v.update.callCount, 1, 'update: 2 loops link, source translated (second)');

        lv.update.restore();
        lv.findRoute.restore();
        l2v.update.restore();
    });

    QUnit.module('detect link source/target/port changed', function(hooks) {

        QUnit.test('link changed', function(assert) {
            var previousLinkSource = { id: 'a' };
            var currentLinkSource = { id: 'b' };

            var equals = joint.dia.Link.endsEqual(previousLinkSource, currentLinkSource);
            assert.notOk(equals);
        });

        QUnit.test('link attached', function(assert) {
            var previousLinkSource = { x: 0, y: 0 };
            var currentLinkSource = { id: 'b' };

            var equals = joint.dia.Link.endsEqual(previousLinkSource, currentLinkSource);
            assert.notOk(equals);
        });

        QUnit.test('port attached', function(assert) {
            var previousLinkSource = { id: 'a' };
            var currentLinkSource = { id: 'a', port: 'in' };

            var equals = joint.dia.Link.endsEqual(previousLinkSource, currentLinkSource);
            assert.notOk(equals);
        });

        QUnit.test('not valid port change', function(assert) {
            var previousLinkSource = { id: 'a', port: null };
            var currentLinkSource = { id: 'a', port: undefined };

            var equals = joint.dia.Link.endsEqual(previousLinkSource, currentLinkSource);
            assert.ok(equals);
        });
    });

    QUnit.module('label API', function() {

        QUnit.module('label', function() {

            QUnit.test('getter', function(assert) {
                var link = new joint.dia.Link({ labels: [{ position: { distance: 10, offset: 10 }}, { position: { distance: 20, offset: 20 }}] });
                assert.deepEqual(link.label(0), { position: { distance: 10, offset: 10 }});
                assert.deepEqual(link.label(1), { position: { distance: 20, offset: 20 }});
                assert.deepEqual(link.label(2), undefined);
            });

            QUnit.test('setter', function(assert) {
                var link = new joint.dia.Link({ labels: [{ position: { distance: 10, offset: 10 }}, { position: { distance: 20, offset: 20 }}] });
                link.label(0, { position: { distance: 100, offset: 100 }});
                link.label(1, { position: { distance: 200 }});
                link.label(2, { position: { distance: 30, offset: 30 }});
                assert.deepEqual(link.get('labels'), [{ position: { distance: 100, offset: 100 }}, { position: { distance: 200, offset: 20 }}, { position: { distance: 30, offset: 30 }}]);
            });
        });

        QUnit.module('labels', function() {

            QUnit.test('getter', function(assert) {
                var link = new joint.dia.Link();
                assert.deepEqual(link.labels(), []);
                link.set('labels', [{ position: { distance: 10, offset: 10 }}]);
                assert.notEqual(link.labels(), link.get('labels'), 'Copy');
                assert.deepEqual(link.labels(), [{ position: { distance: 10, offset: 10 }}]);
            });

            QUnit.test('setter', function(assert) {
                var link = new joint.dia.Link({ labels: [{ position: { distance: 10, offset: 10 }}, { position: { distance: 20, offset: 20 }}] });
                link.labels([{ position: { distance: 30, offset: 30 }}]);
                assert.deepEqual(link.get('labels'), [{ position: { distance: 30, offset: 30 }}]);
            });
        });

        QUnit.module('insertLabel', function() {

            QUnit.test('sanity', function(assert) {
                var link = new joint.dia.Link();

                var error;
                try {
                    link.insertLabel(0);
                } catch (e) {
                    error = e;
                }
                assert.equal(!!error, true);

                link.insertLabel(-1, { position: { distance: 20, offset: 20 }});
                link.insertLabel(0, { position: { distance: 10, offset: 10 }});
                link.insertLabel(100, { position: { distance: 30, offset: 30 }});
                assert.deepEqual(link.labels(), [{ position: { distance: 10, offset: 10 }}, { position: { distance: 20, offset: 20 }}, { position: { distance: 30, offset: 30 }}]);
            });
        });

        QUnit.module('appendLabel', function() {

            QUnit.test('sanity', function(assert) {
                var link = new joint.dia.Link();

                var error;
                try {
                    link.appendLabel();
                } catch (e) {
                    error = e;
                }
                assert.equal(!!error, true);

                link.appendLabel({ position: { distance: 10, offset: 10 }});
                assert.deepEqual(link.labels(), [{ position: { distance: 10, offset: 10 }}]);
            });
        });

        QUnit.module('removeLabel', function() {

            QUnit.test('sanity', function(assert) {
                var link = new joint.dia.Link({ labels: [{ position: { distance: 10, offset: 10 }}, { position: { distance: 20, offset: 20 }}, { position: { distance: 30, offset: 30 }}, { position: { distance: 40, offset: 40 }}] });
                link.removeLabel(100);
                assert.deepEqual(link.labels(), [{ position: { distance: 10, offset: 10 }}, { position: { distance: 20, offset: 20 }}, { position: { distance: 30, offset: 30 }}, { position: { distance: 40, offset: 40 }}]);
                link.removeLabel(-1);
                assert.deepEqual(link.labels(), [{ position: { distance: 10, offset: 10 }}, { position: { distance: 20, offset: 20 }}, { position: { distance: 30, offset: 30 }}]);
                link.removeLabel(0);
                assert.deepEqual(link.labels(), [{ position: { distance: 20, offset: 20 }}, { position: { distance: 30, offset: 30 }}]);
            });
        });
    });

    QUnit.module('vertex API', function() {

        QUnit.module('vertex', function() {

            QUnit.test('getter', function(assert) {
                var link = new joint.dia.Link({ vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }] });
                assert.deepEqual(link.vertex(0), { x: 0, y: 0 });
                assert.deepEqual(link.vertex(1), { x: 1, y: 1 });
                assert.deepEqual(link.vertex(2), undefined);
            });

            QUnit.test('setter', function(assert) {
                var link = new joint.dia.Link({ vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }] });
                link.vertex(0, { x: 10, y: 10 });
                link.vertex(1, { x: 20 });
                link.vertex(2, { x: 3, y: 3 });
                assert.deepEqual(link.get('vertices'), [{ x: 10, y: 10 }, { x: 20, y: 1 }, { x: 3, y: 3 }]);
            });
        });

        QUnit.module('vertices', function() {

            QUnit.test('getter', function(assert) {
                var link = new joint.dia.Link();
                assert.deepEqual(link.vertices(), []);
                link.set('vertices', [{ x: 0, y: 0 }]);
                assert.notEqual(link.vertices(), link.get('vertices'), 'Copy');
                assert.deepEqual(link.vertices(), [{ x: 0, y: 0 }]);
            });

            QUnit.test('setter', function(assert) {
                var link = new joint.dia.Link({ vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }] });
                link.vertices([{ x: 3, y: 3 }]);
                assert.deepEqual(link.get('vertices'), [{ x: 3, y: 3 }]);
            });
        });

        QUnit.module('insertVertex', function() {

            QUnit.test('sanity', function(assert) {
                var link = new joint.dia.Link();

                var error;
                try {
                    link.insertVertex(0);
                } catch (e) {
                    error = e;
                }
                assert.equal(!!error, true);

                link.insertVertex(-1, { x: 1, y: 1 });
                link.insertVertex(0, { x: 0, y: 0 });
                link.insertVertex(100, { x: 2, y: 2 });
                assert.deepEqual(link.vertices(), [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]);
            });
        });

        QUnit.module('removeVertex', function() {

            QUnit.test('sanity', function(assert) {
                var link = new joint.dia.Link({ vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }] });
                link.removeVertex(100);
                assert.deepEqual(link.vertices(), [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }]);
                link.removeVertex(-1);
                assert.deepEqual(link.vertices(), [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]);
                link.removeVertex(0);
                assert.deepEqual(link.vertices(), [{ x: 1, y: 1 }, { x: 2, y: 2 }]);
            });
        });
    });

    QUnit.test('reparent()', function(assert) {

        var Rectangle = joint.shapes.standard.Rectangle;
        var Link = joint.shapes.standard.Link;

        var a = new Rectangle;
        var aa = new Rectangle;
        var ab = new Rectangle;
        var aaa = new Rectangle;
        var aab = new Rectangle;
        var b = new Rectangle;
        var l = new Link;

        this.graph.resetCells([a, aa, ab, aaa, aab, b, l]);
        a.embed(aa).embed(ab);
        aa.embed(aaa).embed(aab);

        l.reparent();
        assert.equal(l.getParentCell(), null);

        l.source(a);
        l.target({ x: 0, y: 0 });
        l.reparent();
        assert.equal(l.getParentCell(), null, 'only source');

        l.source({ x: 0, y: 0 });
        l.target(a);
        l.reparent();
        assert.equal(l.getParentCell(), null, 'only target');

        l.source(a);
        l.target(b);
        l.reparent();
        assert.equal(l.getParentCell(), null, 'both lvl 1');

        l.source({ x: 0, y: 0 });
        l.target(aa);
        l.reparent();
        assert.equal(l.getParentCell(), null, 'only target lvl 2');

        l.source(ab);
        l.target(aa);
        l.reparent();
        assert.equal(l.getParentCell(), a, 'both lvl 2');

        l.source(ab);
        l.target(aaa);
        l.reparent();
        assert.equal(l.getParentCell(), a, 'lvl 2 & lvl 3');

        l.source(aab);
        l.target(aaa);
        l.reparent();
        assert.equal(l.getParentCell(), aa, 'both lvl 3');

        l.source(aa);
        l.target(aab);
        l.reparent();
        assert.equal(l.getParentCell(), aa, 'lvl 2 & lvl 3 embedded');

        l.source(aab);
        l.target(aa);
        l.reparent();
        assert.equal(l.getParentCell(), aa, 'lvl 3 & lvl 2 embedded');

        l.source(a);
        l.target(a);
        l.reparent();
        assert.equal(l.getParentCell(), a, 'loop');

    });
});

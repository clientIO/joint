module('links', {

    setup: function() {

        var $fixture = $('#qunit-fixture');
        var $paper = $('<div/>');
        $fixture.append($paper);

        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({

            el: $paper,
            gridSize: 10,
            model: this.graph
        });
    },

    teardown: function() {

        delete this.graph;
        delete this.paper;
    }
});

test('construction', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
    var r2 = r1.clone().translate(300);

    this.graph.addCell([r1,r2]);

    var l0 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        attrs: { '.connection': { stroke: 'black' } }
    });

    this.graph.addCell(l0);

    strictEqual(l0.constructor, joint.dia.Link, 'link.constructor === joint.dia.Link');

    var v0 = this.paper.findViewByModel(l0);

    equal(v0.$('.connection').attr('d'), 'M 140 70 320 70', 'link path data starts at the source right-middle point and ends in the target left-middle point');

    var l1 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        markup: '<path class="connection"/>'
    });

    ok(_.isUndefined(l1.get('source').x) && _.isUndefined(l1.get('source').y),
       'Source connected to an element has no x or y.');
    ok(_.isUndefined(l1.get('target').x) && _.isUndefined(l1.get('target').y),
       'Target connected to an element has no x or y.');

    this.graph.addCell(l1);
    var v1 = this.paper.findViewByModel(l1);

    ok(v1, 'link with custom markup (1 child) is rendered.');

    var l2 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        markup: '<path class="connection"/><path class="connection-wrap"/>'
    });
    this.graph.addCell(l2);
    var v2 = this.paper.findViewByModel(l2);

    ok(v2, 'link with custom markup (2 children) is rendered.')

    var l3 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        markup: '<path class="no-connection"/>'
    });

    throws(function() {
        this.graph.addCell(l3);
    }, 'Markup with no connection throws an exception.');

    // It should be possible to create empty links and set source/target later.
    var lEmpty = new joint.dia.Link;
    ok(true, 'creating a link with no source/target does not throw an exception');
    var rEmpty = new joint.shapes.basic.Rect;
    var r2Empty = new joint.shapes.basic.Rect;

    this.graph.addCells([lEmpty, rEmpty, r2Empty]);

    lEmpty.set('source', { id: rEmpty.id });
    lEmpty.set('target', { id: r2Empty.id });

    equal(lEmpty.get('source').id, rEmpty.id, 'source was set correctly on a blank link');
    equal(lEmpty.get('target').id, r2Empty.id, 'target was set correctly on a blank link');
});

test('interaction', function() {

    expect(6);

    var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
    var r2 = r1.clone().translate(300);
    var r3 = r2.clone().translate(300);

    this.graph.addCell([r1,r2, r3]);

    var vr1 = this.paper.findViewByModel(r1);
    var vr2 = this.paper.findViewByModel(r2);
    var vr3 = this.paper.findViewByModel(r3);

    var l0 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        attrs: { '.connection': { stroke: 'black' } },
        labels: [
            { position: .5, attrs: { text: { text: 'test label' } } }
        ]
    });

    this.graph.addCell(l0);

    var v0 = this.paper.findViewByModel(l0);

    this.paper.options.validateConnection = function(vs, ms, vt, mt, v) {
        ok(vs === vr1 && vt === vr3, 'connection validation executed');
        return vt instanceof joint.dia.ElementView;
    };

    // adding vertices

    v0.pointerdown({ target: v0.el.querySelector('.connection')}, 200, 70);
    v0.pointerup();
    deepEqual(l0.get('vertices'), [{x: 200, y: 70}], 'vertex added after click the connection.');

    var firstVertexRemoveArea = v0.el.querySelector('.marker-vertex-remove-area');

    v0.pointerdown({ target: v0.el.querySelector('.connection-wrap') }, 300, 70);
    v0.pointermove({}, 300, 100);
    v0.pointerup();
    deepEqual(l0.get('vertices'), [{x: 200, y: 70}, {x: 300, y: 100}], 'vertex added and translated after click the connection wrapper and mousemove.');

    v0.pointerdown({ target: firstVertexRemoveArea });
    v0.pointerup();

    // arrowheadmove

    v0.pointerdown({ target: v0.el.querySelector('.marker-arrowhead[end="target"]') });
    v0.pointermove({ target: vr3.el, type: 'mousemove' }, 630, 40);
    ok(vr3.el.getAttribute('class').indexOf('highlighted') >= 0, 'moving pointer over the rectangle makes the rectangle highlighted');

    v0.pointermove({ target: this.paper.el, type: 'mousemove' }, 400, 400);
    ok(vr3.el.getAttribute('class').indexOf('highlighted') == -1, 'after moving the pointer to coordinates 400,400 the rectangle is not highlighted anymore');

    v0.pointerup();
    equal(v0.el.querySelector('.connection').getAttribute('d'), 'M 140 78 300 100 400 400', 'link path data starts at the source right-middle point, going through the vertex and ends at the coordinates 400,400');
});

test('labelMove', function() {

    expect(2);

    var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 50, height: 50 }});
    var r2 = r1.clone().translate(250);

    this.graph.addCell([r1,r2]);

    var vr1 = this.paper.findViewByModel(r1);
    var vr2 = this.paper.findViewByModel(r2);

    var l0 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        attrs: { '.connection': { stroke: 'black' } },
        labels: [
            { position: .5, attrs: { text: { text: 'test label' } } }
        ]
    });

    this.graph.addCell(l0);

    var v0 = this.paper.findViewByModel(l0);

    v0.options.interactive = { labelMove: true };
    v0.pointerdown({ target: v0.$('.label')[0], type: 'mousedown' });
    v0.pointermove({ target: v0.$('.label')[0], type: 'mousemove' }, 150, 25);
    equal(l0.get('labels')[0].position.offset, -50, 'offset was set during the label drag');
    equal(l0.get('labels')[0].position.distance, .25, 'distance was set during the label drag');
    v0.pointerup();
});

test('defaultLink', function() {

    expect(9);

    this.paper.options.defaultLink = new joint.dia.Link();

    var link = this.paper.getDefaultLink();

    ok(link instanceof joint.dia.Link, 'sanity: defaultLink is cloned');

    this.paper.options.defaultLink = function(v, m) {

        return new joint.dia.Link();
    };

    link = this.paper.getDefaultLink();

    ok(link instanceof joint.dia.Link, 'sanity: defaultLink is a function');


    var myLink = joint.dia.Link.extend({
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

        ok(cell.isMyLink, 'We click the port and a default link was created.');

        // check source of the link
        var source = cell.get('source');
        ok(source.id  === model.id && source.port === 'myPort', 'It starts in the port we clicked.');

        // check target of the link
        var target = cell.get('target');
        ok(typeof target.id === 'undefined', 'It ends in the paper.');

    });

    this.paper.options.defaultLink = new myLink();

    simulate.mousedown({ el: rect });

    this.graph.getLinks()[0].remove();

    this.paper.options.defaultLink = function(cellView, magnet) {

        ok(cellView === view && magnet === rect, 'We set defaultLink to a function. It was executed with correct parameters.');

        return new myLink();
    };

    simulate.mousedown({ el: rect });

});

test('disconnect(), connect()', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(myrect);

    var myrect2 = myrect.clone();
    myrect2.translate(300);
    this.graph.addCell(myrect2);

    var link = new joint.dia.Link({

        source: { id: myrect.id },
        target: { id: myrect2.id },
        attrs: { '.connection': { stroke: 'black' } }
    });

    this.graph.addCell(link);

    var linkView = this.paper.findViewByModel(link);
    var myrectView = this.paper.findViewByModel(myrect);
    var myrect2View = this.paper.findViewByModel(myrect2);
    
    // disconnect:
    link.set('source', linkView.getConnectionPoint('source', link.previous('source'), link.get('target')));
    
    ok(link.get('source') instanceof g.point, 'source of the link became a point');
    ok(!(link.get('target') instanceof g.point), 'target of the link is still not a point');

    equal(linkView.$('.connection').attr('d'), 'M 140 70 320 70', 'link path data stayed the same after disconnection');
    equal(linkView.$('.connection-wrap').attr('d'), 'M 140 70 320 70', 'link connection-wrap path data is the same as the .connection path data');

    myrect.translate(-10);

    equal(linkView.$('.connection').attr('d'), 'M 140 70 320 70', 'link path data stayed the same after the disconnected source moved');

    link.set('source', { id: myrect.id });

    equal(linkView.$('.connection').attr('d'), 'M 130 70 320 70', 'link path data updated after the disconnected source became re-connected again');

    myrect.translate(10);

    equal(linkView.$('.connection').attr('d'), 'M 140 70 320 70', 'link path data updated after the just connected source moved');

    // disconnect:
    link.set('target', linkView.getConnectionPoint('target', link.previous('target'), link.get('source')));

    ok(link.get('target') instanceof g.point, 'target of the link became a point');
    ok(!(link.get('source') instanceof g.point), 'source of the link is still not a point');

    link.set('target', { id: myrect2.id });

    ok(!(link.get('source') instanceof g.point), 'source of the link is still not a point');
    ok(!(link.get('target') instanceof g.point), 'target of the link stopped being a point');

    myrect.remove({ disconnectLinks: true });

    ok(link.get('source') instanceof g.point, 'source of the link became a point after the source element has been removed');
    ok(!(link.get('target') instanceof g.point), 'target of the link is still not a point');
});


test('getLinks(), clone()', function() {

    var myrect = new joint.shapes.basic.Rect;
    var myrect2 = myrect.clone();
    
    this.graph.addCell(myrect);
    this.graph.addCell(myrect2);

    var link = new joint.dia.Link({

        source: { id: myrect.id },
        target: { id: myrect2.id },
        attrs: { '.connection': { stroke: 'black' } }
    });
    var link2 = link.clone();
    this.graph.addCell(link);
    this.graph.addCell(link2);

    deepEqual(_.pluck(this.graph.getConnectedLinks(myrect), 'id'), [link.id, link2.id], 'getConnectedLinks() returns both links comming out of the source element');
    deepEqual(_.pluck(this.graph.getConnectedLinks(myrect2), 'id'), [link.id, link2.id], 'getConnectedLinks() returns both links leading to the target element');

    link.disconnect();

    deepEqual(_.pluck(this.graph.getConnectedLinks(myrect), 'id'), [link2.id], 'getConnectedLinks() returns only one link coming out of it after the other has been disconnected');
    deepEqual(_.pluck(this.graph.getConnectedLinks(myrect2), 'id'), [link2.id], 'getConnectedLinks() returns only one link leading to it after the other has been disconnected');

    deepEqual(_.pluck(this.graph.getConnectedLinks(myrect, { outbound: true }), 'id'), [link2.id], 'getConnectedLinks(outbound) returns only the one link coming out the element');
    deepEqual(_.pluck(this.graph.getConnectedLinks(myrect, { inbound: true }), 'id'), [], 'getConnectedLinks(inbound) returns no link as the element is not source of any link');
});

test('markers', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
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
    
    deepEqual(
        { x: markerSourceBbox.x, y: markerSourceBbox.y, width: markerSourceBbox.width, height: markerSourceBbox.height },
        { x: 140, y: 65, width: 10, height: 10 },
        '.marker-source should point to the left edge of the rectangle'
    );

    var markerTargetBbox = V(linkView.$('.marker-target')[0]).bbox();
    
    deepEqual(
        { x: markerTargetBbox.x, y: markerTargetBbox.y, width: markerTargetBbox.width, height: markerTargetBbox.height, rotation: V(linkView.$('.marker-target')[0]).rotate().angle },
        { x: 310, y: 65, width: 10, height: 10, rotation: -180 },
        '.marker-target should point to the right edge of the rectangle 2 and should be rotated by -180 degrees'
    );
});


test('vertices', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
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

    deepEqual(
        { x: markerSourceBbox.x, y: markerSourceBbox.y, width: markerSourceBbox.width, height: markerSourceBbox.height, rotation: V(linkView.$('.marker-source')[0]).rotate().angle },
        { x: 75, y: 110, width: 10, height: 10, rotation: -270 },
        '.marker-source should point to the bottom edge of the rectangle and should be rotated by -270 degrees'
    );

    var markerTargetBbox = V(linkView.$('.marker-target')[0]).bbox();
    
    deepEqual(
        { x: markerTargetBbox.x, y: markerTargetBbox.y, width: markerTargetBbox.width, height: markerTargetBbox.height, rotation: V(linkView.$('.marker-target')[0]).rotate().angle },
        { x: 375, y: 110, width: 10, height: 10, rotation: -270 },
        '.marker-target should point to the bottom edge of the rectangle 2 and should be rotated by -270 degrees'
    );

    equal($('.marker-vertex').length, 2, 'there is exactly 2 vertex markers on the page');

    var firstVertextPosition = g.rect(V($('.marker-vertex')[0]).bbox()).center();
    deepEqual(
        { x: firstVertextPosition.x, y: firstVertextPosition.y },
        link.get('vertices')[0],
        'first vertex is in the same position as defined in the vertices array'
    );

    var secondVertextPosition = g.rect(V($('.marker-vertex')[1]).bbox()).center();
    deepEqual(
        { x: secondVertextPosition.x, y: secondVertextPosition.y },
        link.get('vertices')[1],
        'second vertex is in the same position as defined in the vertices array'
    );
});


test('perpendicularLinks', function() {

    this.paper.options.perpendicularLinks = true;
    
    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
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

    deepEqual(
        { x: markerSourceBbox.x, y: markerSourceBbox.y },
        { x: 138, y: 110 },
        '.marker-source should point vertically to the edge of the source rectangle making the part of the link before the first vertex perpendicular to the source rectangle'
    );

    var markerTargetBbox = V(linkView.$('.marker-target')[0]).bbox();

    deepEqual(
        { x: markerTargetBbox.x, y: markerTargetBbox.y },
        { x: myrect2.get('position').x, y: 108 },
        '.marker-target should point horizontally to the edge of the target rectangle making the part of the link after the last vertex perpendicular to the target rectangle'
    );
    
});

test('labels', function() {

    var myrect = new joint.shapes.basic.Rect;
    var myrect2 = myrect.clone();
    myrect2.translate(300);
    
    this.graph.addCell(myrect);
    this.graph.addCell(myrect2);

    var link = new joint.dia.Link({

        source: { id: myrect.id },
        target: { id: myrect2.id },
        labels: [
            { position: 10, attrs: { text: { text: '1..n' } }},
            { position: .5, attrs: { text: { text: 'Foo', fill: 'white', 'font-family': 'sans-serif' }, rect: { stroke: '#F39C12', 'stroke-width': 20, rx: 5, ry: 5 } }},
            { position: -10, attrs: { text: { text: '*' } }}
        ]
    });

    this.graph.addCell(link);

    var linkView = this.paper.findViewByModel(link);

    equal(linkView.$('.label').length, 3, 'label elements were correctly added to the DOM');

    var label1Bbox = V(linkView.$('.label')[0]).bbox();
    var label2Bbox = V(linkView.$('.label')[1]).bbox();
    var label3Bbox = V(linkView.$('.label')[2]).bbox();

    ok(label1Bbox.x < label2Bbox.x, 'second label is positioned after the first one');
    ok(label2Bbox.x < label3Bbox.x, 'third label is positioned after the second one');

    equal(linkView.$('.label')[0].textContent, '1..n', 'first label has correctly set text');
    equal(linkView.$('.label')[1].textContent, 'Foo', 'second label has correctly set text');
    equal(linkView.$('.label')[2].textContent, '*', 'third label has correctly set text');

    link.label(1, { attrs: { text: { text: 'Bar' } } });

    equal(linkView.$('.label')[1].textContent, 'Bar', 'a call to link.label() changed text of the second label correctly');

    link.label(0, { position: -10 });

    label1Bbox = V(linkView.$('.label')[0]).bbox();
    ok(label1Bbox.x > label2Bbox.x, 'second label is positioned before the first one after changing the first one position');    
});

test('magnets & ports', function() {

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

    equal(link.get('source').port, 'port1', 'port was automatically assigned to the link source');
    equal(link.get('target').port, 'port2', 'port was automatically assigned to the link target');
    equal(myrectView.$(link.get('source').selector)[0], myrectView.$('text')[0], 'source selector points to the magnet element');
    equal(myrect2View.$(link.get('target').selector)[0], myrect2View.$('text')[0], 'target selector points to the magnet element');

    // The functionality below is not implemented, hence skiping the test.
    // myrect.attr('text', { port: 'port3' });
    // equal(link.get('source').port, 'port3', 'changing port on an element automatically changes the same port on a link');
});

test('snap links', function() {

    var link = new joint.dia.Link({
        source: {x: 0, y: 0},
        target: {x: 0, y: 0}
    });

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 100, y: 100 }
    });

    this.graph.addCells([myrect, link]);

    var v = this.paper.findViewByModel(link);
    var t = v.el.querySelector('.marker-arrowhead[end=target]');

// link target was out of the radius and therefore was not snapped to the element

    this.paper.options.snapLinks = { radius: 5 };

    v.pointerdown({ target: t }, 0 ,0);
    v.pointermove({ target: this.paper.el }, 90 , 90);
    v.pointerup({ target: this.paper.el }, 90 , 90);

    deepEqual(link.get('target'), {
        x: 90, y: 90
    }, 'link target was out of the radius and therefore was not snapped to the element');

// link target was snapped to the element

    this.paper.options.snapLinks = { radius: 50 };

    v.pointerdown({ target: t }, 0 ,0);
    v.pointermove({ target: this.paper.el }, 90 , 90);
    v.pointerup({ target: this.paper.el }, 90 , 90);

    ok(link.get('target').id === myrect.id, 'link target was snapped to the element');

// link target was snapped to the port

    // getBoundingClientRect returns negative values for top and left when paper not visible
    this.paper.options.snapLinks = { radius: Number.MAX_VALUE };

    myrect.attr('.', { magnet: false });
    myrect.attr('text', { magnet: true, port: 'port' });

    this.paper.options.validateConnection = function() { return true; }

    v.pointerdown({ target: t }, 0 ,0);
    v.pointermove({ target: this.paper.el }, 90 , 90);
    v.pointerup({ target: this.paper.el }, 90 , 90);

    ok(link.get('target').port === 'port', 'link target was snapped to the port');

// the validation is taken into account when snapping to port

    this.paper.options.validateConnection = function() { return false; }

    v.pointerdown({ target: t }, 0 ,0);
    v.pointermove({ target: this.paper.el }, 90 , 90);
    v.pointerup({ target: this.paper.el }, 90 , 90);

    deepEqual(link.get('target'), {
        x: 90, y: 90
    }, 'the validation is taken into account when snapping to port');
})

test('mark available', function(){

    var link = new joint.dia.Link({
        source: {x: 0, y: 0},
        target: {x: 0, y: 0}
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

    v.pointerdown({ target: t }, 0 ,0);

    var availableMagnets = this.paper.el.querySelectorAll('.available-magnet');
    var availableCells = this.paper.el.querySelectorAll('.available-cell');

    equal(availableMagnets.length, 3,
          '3 magnets got marked when dragging an arrowhead started.');
    equal(availableCells.length, 2,
          '2 cells got marked when dragging an arrowhead started.');

    v.pointerup({ target: this.paper.el }, 90 , 90);

    var availableMagnets = this.paper.el.querySelectorAll('.available-magnet');
    var availableCells = this.paper.el.querySelectorAll('.available-cell');

    equal(availableMagnets.length + availableCells.length, 0,
          'When dragging an arrowhed stopped all magnets and cells were unmarked.');
});

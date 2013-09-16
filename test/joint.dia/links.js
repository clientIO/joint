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

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 }
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

    strictEqual(link.constructor, joint.dia.Link, 'link.constructor === joint.dia.Link');

    var linkView = this.paper.findViewByModel(link);

    equal(linkView.$('.connection').attr('d'), 'M 140 70 320 70', 'link path data starts at the source right-middle point and ends in the target left-middle point');
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

test('manhattan routing', function() {

    // One vertex.
    
    var r1 = new joint.shapes.basic.Rect({ position: { x: 200, y: 60 }, size: { width: 50, height: 30 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 125, y: 60 }, size: { width: 50, height: 30 } });

    var l1 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        manhattan: true,
        vertices: [{ x: 150, y: 200 }]
    });

    this.graph.addCells([r1, r2, l1]);

    var l1View = this.paper.findViewByModel(l1);
    var l1PathData = l1View.$('.connection').attr('d');
    
    equal(l1PathData, 'M 225 90 225 200 150 200 150 90', 'link with one vertex was correctly routed');

    // No vertex.

    var r3 = new joint.shapes.basic.Rect({ position: { x: 40, y: 40 }, size: { width: 50, height: 30 } });
    var r4 = new joint.shapes.basic.Rect({ position: { x: 220, y: 120 }, size: { width: 50, height: 30 } });

    var l2 = new joint.dia.Link({
        source: { id: r3.id },
        target: { id: r4.id },
        manhattan: true
    });

    this.graph.addCells([r3, r4, l2]);

    var l2View = this.paper.findViewByModel(l2);
    var l2PathData = l2View.$('.connection').attr('d');

    equal(l2PathData, 'M 65 70 65 135 220 135', 'link with no vertex was correctly routed');

    // Check for spikes.

    var r5 = new joint.shapes.basic.Rect({ position: { x: 200, y: 60 }, size: { width: 50, height: 30 } });
    var r6 = new joint.shapes.basic.Rect({ position: { x: 350, y: 40 }, size: { width: 50, height: 30 } });

    var l3 = new joint.dia.Link({
        source: { id: r5.id },
        target: { id: r6.id },
        manhattan: true,
        vertices: [{ x: 150, y: 200 }]
    });

    this.graph.addCells([r5, r6, l3]);

    var l3View = this.paper.findViewByModel(l3);
    var l3PathData = l3View.$('.connection').attr('d');

    equal(l3PathData, 'M 225 90 225 200 150 200 150 55 350 55', 'no spike (a return path segment) was created');
});

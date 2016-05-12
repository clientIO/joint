module('routers', {

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

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    }
});

test('construction', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 } });
    var r2 = r1.clone().translate(300);

    this.graph.addCell([r1, r2]);

    var l0 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        router: { name: 'non-existing' }
    });

    throws(function() { this.graph.addCell(l0); }, /non-existing/, 'Recognize an unexisting router.');

    l0.set('router', { name: 'orthogonal' });

    this.graph.addCell(l0);

    equal(this.graph.getLinks().length, 1, 'An orthogonal link was succesfully added to the graph');

    var l1 = l0.clone().set('router', { name: 'manhattan' });

    this.graph.addCell(l1);

    equal(this.graph.getLinks().length, 2, 'A manhattan link was succesfully added to the graph');

    var l2 = l0.clone().set('router', { name: 'metro' });

    this.graph.addCell(l2);

    equal(this.graph.getLinks().length, 3, 'A metro link was succesfully added to the graph');

});

test('normal routing', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 200, y: 60 }, size: { width: 50, height: 30 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 125, y: 60 }, size: { width: 50, height: 30 } });

    var link = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        router: { name: 'normal' },
        vertices: [{ x: 150, y: 200 }]
    });

    this.graph.addCells([r1, r2, link]);

    var linkView = this.paper.findViewByModel(link);
    var pathData = linkView.$('.connection').attr('d');

    checkDataPath(pathData, 'M 216 90 150 200 150 90', 'link was correctly routed');
});

test('orthogonal routing', function() {

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

    checkDataPath(l1PathData, 'M 225 90 225 200 150 200 150 90', 'link with one vertex was correctly routed');

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

    checkDataPath(l2PathData, 'M 90 55 245 55 245 120', 'link with no vertex was correctly routed');

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

    checkDataPath(l3PathData, 'M 225 90 225 200 150 200 150 55 350 55', 'no spike (a return path segment) was created');
});

test('manhattan routing', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 } });
    var r2 = r1.clone().translate(300);

    var r3 = r2.clone().translate(300);

    var l0 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r3.id },
        router: { name: 'manhattan', args: {
            step: 20,
            paddingBox: { x: 0, y: 0, width: 0, height: 0 }
        } }
    });

    this.graph.addCell([r1, r2, r3, l0]);

    v0 = this.paper.findViewByModel(l0);

    var d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 140 80 300 80 300 120 600 120 600 80 620 80', 'Route avoids an obstacle.');

    r1.translate(0, 50);

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 140 120 600 120 600 80 620 80',
          'Source has been moved. Route recalculated starting from target.');

    r3.translate(0, -50);

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 140 120 600 120 600 20 620 20',
          'Target has been moved. Route recalculated starting from source.');

    l0.set({
        vertices: [],
        router: {
            name: 'manhattan',
            args: {
                step: 20,
                paddingBox: { x: -20, y: -20, width: 40, height: 40 }
            }
        }
    });

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 140 120 280 120 280 0 580 0 580 20 620 20',
          'The option paddingBox was passed. The source and target element and obstacles are avoided taken this padding in account.');

    throws(function() {

        l0.set('router', {
            name: 'manhattan',
            args: {
                maximumLoops: 1,
                fallbackRoute: function() { throw 'fallback-route'; }
            }
        });

    }, /fallback-route/, 'A fallback route is available.');

    l0.set('router', {
        name: 'manhattan',
        args: {
            maximumLoops: 1,
            step: 20,
            paddingBox: { x: 0, y: 0, width: 0, height: 0 }
        }
    });

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 140 120 680 120 680 60',
          'The default fallback router made an orthogonal link.');

    l0.set({
        vertices: [{ x: 20, y: 20 }],
        router: {
            name: 'manhattan',
            args: {
                step: 20,
                paddingBox: { x: 0, y: 0, width: 0, height: 0 }
            }
        }
    });

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 80 80 80 20 20 20 20 0 600 0 600 20 620 20',
          'A vertex was added. Route correctly recalculated.');

    l0.set({
        vertices: [{ x: 21, y: 21 }]
    });

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 80 80 80 20 20 20 20 0 600 0 600 20 620 20',
          'A vertex was moved (not snapped to the grid now). Route correctly recalculated.');

    throws(function() {

        l0.set({
            target: { x: 200, y: 200 },
            router: {
                name: 'manhattan',
                args: {
                    draggingRoute: function() { throw 'dragging-route'; }
                }
            }
        });

    }, /dragging-route/, 'A dragging route is triggered correctly');

    l0.set({
        target: { id: r3.id },
        vertices: [],
        router: {
            name: 'manhattan',
            args: {
                excludeTypes: ['basic.Rect'],
                step: 20,
                paddingBox: { x: 0, y: 0, width: 0, height: 0 }
            }
        }
    });

    r1.translate(0, -50);
    r3.translate(0, 50);

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 140 70 620 70',
          'Set excludeTypes parameter to "basic.Rect" makes routing ignore those shapes.');

    r2.remove();

    l0.set({
        vertices: [{ x: 800, y: 80 }],
        router: {
            name: 'manhattan',
            args: {
                excludeEnds: ['target'],
                step: 20,
                paddingBox: { x: 0, y: 0, width: 0, height: 0 }
            }
        }
    });

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 140 80 800 80 800 100 760 100 760 80 740 80',
          'Set excludeEnds parameter to "target" makes routing ignore target element.');

    l0.set({
        vertices: [],
        router: {
            name: 'manhattan',
            args: {
                startDirections: ['left'],
                endDirections: ['right'],
                step: 20,
                paddingBox: { x: 0, y: 0, width: 0, height: 0 }
            }
        }
    });

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 20 80 0 80 0 120 760 120 760 80 740 80',
          'Set startDirections & endDirections parameters makes routing starts and ends from/to the given direction.');

});

test('metro routing', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 } });
    var r2 = r1.clone().translate(300, 300);

    var r3 = r2.clone().translate(300, 300);

    var l0 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r3.id },
        router: {
            name: 'metro',
            args: {
                step: 20,
                paddingBox: { x: 0, y: 0, width: 0, height: 0 }
            }
        }
    });

    this.graph.addCell([r1, r2, r3, l0]);

    v0 = this.paper.findViewByModel(l0);

    var d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 140 80 160 80 400 320 440 320 680 560 680 630',
          'Route avoids an obstacle.');

    l0.set('router', {
        name: 'metro',
        args: {
            maximumLoops: 1
        }
    });

    d = v0.$('.connection').attr('d');

    checkDataPath(d, 'M 80 70 81 70 680 670 680 670',
          'The default fallback router made a metro link.');

});

test('oneSide routing', function(assert) {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 } });
    var r2 = r1.clone().translate(300, 300);
    var l = new joint.dia.Link({ source: { id: r1.id }, target: { id: r2.id } });

    this.graph.addCell([r1, r2, l]);

    var v = this.paper.findViewByModel(l);

    // Left side
    l.set('router', { name: 'oneSide', args: { padding: 20, side: 'left' } });
    var d = v.$('.connection').attr('d');
    checkDataPath(d, 'M 20 70 0 70 0 370 320 370', 'Route goes only on the left side.');

    // Padding option
    l.set('router', { name: 'oneSide', args: { padding: 40, side: 'left' } });
    d = v.$('.connection').attr('d');
    checkDataPath(d, 'M 20 70 -20 70 -20 370 320 370', 'Route respects the padding.');

    // Right side
    l.set('router', { name: 'oneSide', args: { padding: 40, side: 'right' } });
    d = v.$('.connection').attr('d');
    checkDataPath(d, 'M 140 70 480 70 480 370 440 370', 'Route goes only on the right side.');

    // Top side
    l.set('router', { name: 'oneSide', args: { padding: 40, side: 'top' } });
    d = v.$('.connection').attr('d');
    checkDataPath(d, 'M 80 30 80 -10 380 -10 380 330', 'Route goes only on the top.');

    // Bottom side
    l.set('router', { name: 'oneSide', args: { padding: 40, side: 'bottom' } });
    d = v.$('.connection').attr('d');
    checkDataPath(d, 'M 80 110 80 450 380 450 380 410', 'Route goes only on the bottom');

    // Wrong side specified
    assert.throws(function() {
        l.set('router', { name: 'oneSide', args: { padding: 40, side: 'non-existing' } });
    }, 'An error is thrown when a non-existing side is provided.');
});

test('custom routing', function(assert) {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 } });
    var r2 = r1.clone().translate(300, 300);
    var l = new joint.dia.Link({ source: { id: r1.id }, target: { id: r2.id } });

    this.graph.addCell([r1, r2, l]);

    var called = 0;

    l.set('router', function(oldVertices) {
        assert.deepEqual(oldVertices, []);
        called += 1;
        return oldVertices;
    });

    assert.equal(called, 1);
});

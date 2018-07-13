QUnit.module('routers', function(hooks) {

    hooks.beforeEach(
        function() {

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

    QUnit.test('construction', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
        var r2 = r1.clone().translate(300);

        this.graph.addCell([r1, r2]);

        var l0 = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            router: { name: 'non-existing' }
        });

        assert.throws(function() {
            this.graph.addCell(l0);
        }, /non-existing/, 'Recognize an unexisting router.');

        l0.set('router', { name: 'orthogonal' });

        this.graph.addCell(l0);

        assert.equal(this.graph.getLinks().length, 1, 'An orthogonal link was successfully added to the graph');

        var l1 = l0.clone().set('router', { name: 'manhattan' });

        this.graph.addCell(l1);

        assert.equal(this.graph.getLinks().length, 2, 'A manhattan link was successfully added to the graph');

        var l2 = l0.clone().set('router', { name: 'metro' });

        this.graph.addCell(l2);

        assert.equal(this.graph.getLinks().length, 3, 'A metro link was successfully added to the graph');

    });

    QUnit.test('normal routing', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 200, y: 60 }, size: { width: 50, height: 30 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 125, y: 60 }, size: { width: 50, height: 30 }});

        var link = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            router: { name: 'normal' },
            vertices: [{ x: 150, y: 200 }]
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.$('.connection').attr('d');

        assert.checkDataPath(pathData, 'M 216 90 L 150 200 L 150 90', 'link was correctly routed');
    });

    QUnit.test('orthogonal routing', function(assert) {

        // One vertex.

        var r1 = new joint.shapes.basic.Rect({ position: { x: 200, y: 60 }, size: { width: 50, height: 30 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 125, y: 60 }, size: { width: 50, height: 30 }});

        var l1 = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            manhattan: true,
            vertices: [{ x: 150, y: 200 }]
        });

        this.graph.addCells([r1, r2, l1]);

        var l1View = this.paper.findViewByModel(l1);
        var l1PathData = l1View.$('.connection').attr('d');

        assert.checkDataPath(l1PathData, 'M 225 90 L 225 200 L 150 200 L 150 90', 'link with one vertex was correctly routed');

        // No vertex.

        var r3 = new joint.shapes.basic.Rect({ position: { x: 40, y: 40 }, size: { width: 50, height: 30 }});
        var r4 = new joint.shapes.basic.Rect({ position: { x: 220, y: 120 }, size: { width: 50, height: 30 }});

        var l2 = new joint.dia.Link({
            source: { id: r3.id },
            target: { id: r4.id },
            manhattan: true
        });

        this.graph.addCells([r3, r4, l2]);

        var l2View = this.paper.findViewByModel(l2);
        var l2PathData = l2View.$('.connection').attr('d');

        assert.checkDataPath(l2PathData, 'M 90 55 L 245 55 L 245 120', 'link with no vertex was correctly routed');

        // Check for spikes.

        var r5 = new joint.shapes.basic.Rect({ position: { x: 200, y: 60 }, size: { width: 50, height: 30 }});
        var r6 = new joint.shapes.basic.Rect({ position: { x: 350, y: 40 }, size: { width: 50, height: 30 }});

        var l3 = new joint.dia.Link({
            source: { id: r5.id },
            target: { id: r6.id },
            manhattan: true,
            vertices: [{ x: 150, y: 200 }]
        });

        this.graph.addCells([r5, r6, l3]);

        var l3View = this.paper.findViewByModel(l3);
        var l3PathData = l3View.$('.connection').attr('d');

        assert.checkDataPath(l3PathData, 'M 225 90 L 225 200 L 150 200 L 150 55 L 350 55', 'no spike (a return path segment) was created');
    });

    QUnit.test('manhattan routing', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
        var r2 = r1.clone().translate(300);

        var r3 = r2.clone().translate(300);

        var l0 = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r3.id },
            router: {
                name: 'manhattan', args: {
                    step: 20,
                    paddingBox: { x: 0, y: 0, width: 0, height: 0 }
                }
            }
        });

        this.graph.addCell([r1, r2, r3, l0]);

        var v0 = this.paper.findViewByModel(l0);

        var d = v0.$('.connection').attr('d');

        assert.checkDataPath(d, 'M 140 70 L 300 70 L 300 10 L 600 10 L 600 70 L 620 70', 'Route avoids an obstacle.');

        r1.translate(0, 50);

        d = v0.$('.connection').attr('d');

        assert.checkDataPath(d, 'M 140 120 L 600 120 L 600 70 L 620 70',
            'Source has been moved. Route recalculated starting from target.');

        r3.translate(0, -50);

        d = v0.$('.connection').attr('d');

        assert.checkDataPath(d, 'M 140 120 L 600 120 L 600 20 L 620 20',
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

        assert.checkDataPath(d, 'M 140 120 L 280 120 L 280 0 L 580 0 L 580 20 L 620 20',
            'The option paddingBox was passed. The source and target element and obstacles are avoided taken this padding in account.');

        assert.throws(function() {

            l0.set('router', {
                name: 'manhattan',
                args: {
                    maximumLoops: 1,
                    fallbackRoute: function() {
                        throw 'fallback-route';
                    }
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

        assert.checkDataPath(d, 'M 140 120 L 680 120 L 680 60',
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

        assert.checkDataPath(d, 'M 80 80 L 80 20 L 20 20 L 20 0 L 600 0 L 600 20 L 620 20',
            'A vertex was added. Route correctly recalculated.');

        l0.set({
            vertices: [{ x: 21, y: 21 }]
        });

        d = v0.$('.connection').attr('d');

        assert.checkDataPath(d, 'M 80 80 L 80 21 L 21 21 L 21 20 L 620 20',
            'A vertex was moved (not snapped to the grid now). Route correctly recalculated.');

        assert.throws(function() {

            l0.set({
                target: { x: 200, y: 200 },
                router: {
                    name: 'manhattan',
                    args: {
                        draggingRoute: function() {
                            throw 'dragging-route';
                        }
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

        assert.checkDataPath(d, 'M 140 70 L 620 70',
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

        assert.checkDataPath(d, 'M 140 70 L 800 70 L 800 80 L 760 80 L 760 70 L 740 70',
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

        assert.checkDataPath(d, 'M 20 70 L 0 70 L 0 10 L 760 10 L 760 70 L 740 70',
            'Set startDirections & endDirections parameters makes routing starts and ends from/to the given direction.');

    });

    QUnit.test('metro routing', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
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

        var v0 = this.paper.findViewByModel(l0);

        var d = v0.$('.connection').attr('d');

        assert.checkDataPath(d, 'M 140 70 L 160 70 L 400 310 L 440 310 L 680 550 L 680 630',
            'Route avoids an obstacle.');

        l0.set('router', {
            name: 'metro',
            args: {
                maximumLoops: 1
            }
        });

        d = v0.$('.connection').attr('d');

        assert.checkDataPath(d, 'M 80 70 L 81 70 L 680 670 L 680 670',
            'The default fallback router made a metro link.');

    });

    QUnit.test('oneSide routing', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
        var r2 = r1.clone().translate(300, 300);
        var l = new joint.dia.Link({ source: { id: r1.id }, target: { id: r2.id }});

        this.graph.addCell([r1, r2, l]);

        var v = this.paper.findViewByModel(l);

        // Left side
        l.set('router', { name: 'oneSide', args: { padding: 20, side: 'left' }});
        var d = v.$('.connection').attr('d');
        assert.checkDataPath(d, 'M 20 70 L 0 70 L 0 370 L 320 370', 'Route goes only on the left side.');

        // Padding option
        l.set('router', { name: 'oneSide', args: { padding: 40, side: 'left' }});
        d = v.$('.connection').attr('d');
        assert.checkDataPath(d, 'M 20 70 L -20 70 L -20 370 L 320 370', 'Route respects the padding.');

        // Right side
        l.set('router', { name: 'oneSide', args: { padding: 40, side: 'right' }});
        d = v.$('.connection').attr('d');
        assert.checkDataPath(d, 'M 140 70 L 480 70 L 480 370 L 440 370', 'Route goes only on the right side.');

        // Top side
        l.set('router', { name: 'oneSide', args: { padding: 40, side: 'top' }});
        d = v.$('.connection').attr('d');
        assert.checkDataPath(d, 'M 80 30 L 80 -10 L 380 -10 L 380 330', 'Route goes only on the top.');

        // Bottom side
        l.set('router', { name: 'oneSide', args: { padding: 40, side: 'bottom' }});
        d = v.$('.connection').attr('d');
        assert.checkDataPath(d, 'M 80 110 L 80 450 L 380 450 L 380 410', 'Route goes only on the bottom');

        // Wrong side specified
        assert.throws(function() {
            l.set('router', { name: 'oneSide', args: { padding: 40, side: 'non-existing' }});
        }, 'An error is thrown when a non-existing side is provided.');
    });

    QUnit.test('custom routing', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
        var r2 = r1.clone().translate(300, 300);
        var l = new joint.dia.Link({ source: { id: r1.id }, target: { id: r2.id }});

        this.graph.addCell([r1, r2, l]);

        var called = 0;

        l.set('router', function(oldVertices) {
            assert.deepEqual(oldVertices, []);
            called += 1;
            return oldVertices;
        });

        assert.equal(called, 1);
    });
});

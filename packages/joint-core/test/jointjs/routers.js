QUnit.module('routers', function(hooks) {

    hooks.beforeEach(function() {

        const fixtureEl = fixtures.getElement();
        const paperEl = document.createElement('div');
        fixtureEl.appendChild(paperEl);
        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({
            el: paperEl,
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


        var fallbackRouteSpy = sinon.spy(function() { return []; });

        l0.set('router', {
            name: 'manhattan',
            args: {
                maximumLoops: 1,
                fallbackRoute: fallbackRouteSpy
            }
        });

        assert.ok(fallbackRouteSpy.calledOnce);

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

        var draggingRouteSpy = sinon.spy();

        l0.set({
            target: { x: 200, y: 200 },
            router: {
                name: 'manhattan',
                args: {
                    draggingRoute: draggingRouteSpy
                }
            }
        });

        assert.ok(draggingRouteSpy.calledOnce);

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


        var spyIsPointObstacle = sinon.spy(function() { return false; });

        l0.set({
            vertices: [],
            router: {
                name: 'manhattan',
                args: {
                    isPointObstacle: spyIsPointObstacle
                }
            }
        });

        d = v0.$('.connection').attr('d');

        assert.ok(spyIsPointObstacle.called);
        assert.ok(spyIsPointObstacle.alwaysCalledWithExactly(sinon.match.instanceOf(g.Point)));
        assert.checkDataPath(d, 'M 140 70 L 620 70', 'isPointObstacle option is taken into account');

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

    const width = 50;
    const height = 50;
    const size = { width, height };
    const margin = 28;
    const rightAngleRouter = { name: 'rightAngle', args: { margin }};
    const position = { x: 0, y: 150 };

    this.addTestSubjects = function(sourceSide, targetSide, router = rightAngleRouter) {
        const r1 = new joint.shapes.standard.Rectangle({ size });
        const r2 = r1.clone().position(position.x, position.y);
        const l = new joint.shapes.standard.Link({ source: { id: r1.id, anchor: { name: sourceSide }}, target: { id: r2.id, anchor: { name: targetSide }}, router });

        this.graph.addCells([r1, r2, l]);
        return [r1, r2, l];
    };

    this.addTestSubjectsWithVertices = function(sourceSide, targetSide, vertices) {
        const [r1, r2, l] = this.addTestSubjects(sourceSide, targetSide, { ...rightAngleRouter, args: { margin, useVertices: true }});
        l.vertices(vertices);
        return [r1, r2, l];
    };

    const topVerticalPathSegments = [
        `${width / 2} 0`,
        `${width / 2} -${margin}`,
        `${width + margin} -${margin}`,
        `${width + margin} ${(height + position.y) / 2}`,
        `${width / 2} ${(height + position.y) / 2}`,
        `${width / 2} ${position.y}`
    ];
    const topHorizontalPathSegments = [
        `${width / 2} 0`,
        `${width / 2} -${margin}`,
        `${position.y + width / 2} -${margin}`,
        `${position.y + width / 2} 0`,
    ];

    QUnit.test('rightAngle routing - source: top, target: top', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('top', 'top');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(topVerticalPathSegments);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topVerticalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topHorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topHorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const topRightS0PathSegmentsVertical = [
        `${width / 2} 0`,
        `${width / 2} -${margin}`,
        `${width + margin} -${margin}`,
        `${width + margin} ${position.y + (height / 2)}`,
        `${width} ${position.y + (height / 2)}`
    ];

    const topRightT0PathSegmentsVertical = [
        `${width / 2} ${position.y}`,
        `${width / 2} ${(height + position.y) / 2}`,
        `${width + margin} ${(height + position.y) / 2}`,
        `${width + margin} ${height / 2}`,
        `${width} ${height / 2}`
    ];

    const topRightS0PathSegmentsHorizontal = [
        `${width / 2} 0`,
        `${width / 2} -${margin}`,
        `${position.y + width + margin} -${margin}`,
        `${position.y + width + margin} ${height / 2}`,
        `${position.y + width} ${height / 2}`
    ];

    const topRightT0PathSegmentsHorizontal = [
        `${position.y + width / 2} 0`,
        `${position.y + width / 2} -${margin}`,
        `${(width + position.y) / 2} -${margin}`,
        `${(width + position.y) / 2} ${height / 2}`,
        `${width} ${height / 2}`
    ];

    QUnit.test('rightAngle routing - source: top, target: right', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('top', 'right');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(topRightS0PathSegmentsVertical);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topRightT0PathSegmentsVertical);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topRightS0PathSegmentsHorizontal);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topRightT0PathSegmentsHorizontal);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const topBottomS0PathSegmentsVertical = [
        `${width / 2} 0`,
        `${width / 2} -${margin}`,
        `${width + margin} -${margin}`,
        `${width + margin} ${position.y + height + margin}`,
        `${width / 2} ${position.y + height + margin}`,
        `${width / 2} ${position.y + height}`,
    ];

    const topBottomT0PathSegmentsVertical = [
        `${width / 2} ${position.y}`,
        `${width / 2} ${(height + position.y) / 2}`,
        `${width / 2} ${(height + position.y) / 2}`,
        `${width / 2} ${height}`,
    ];

    const topBottomS0PathSegmentsHorizontal = [
        `${width / 2} 0`,
        `${width / 2} -${margin}`,
        `${(width + position.y) / 2} -${margin}`,
        `${(width + position.y) / 2} ${height + margin}`,
        `${position.y + width / 2} ${height + margin}`,
        `${position.y + width / 2} ${height}`,
    ];

    const topBottomT0PathSegmentsHorizontal = [
        `${position.y + width / 2} 0`,
        `${position.y + width / 2} -${margin}`,
        `${(width + position.y) / 2} -${margin}`,
        `${(width + position.y) / 2} ${height + margin}`,
        `${width / 2} ${height + margin}`,
        `${width / 2} ${height}`
    ];

    QUnit.test('rightAngle routing - source: top, target: bottom', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('top', 'bottom');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(topBottomS0PathSegmentsVertical);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topBottomT0PathSegmentsVertical);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topBottomS0PathSegmentsHorizontal);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topBottomT0PathSegmentsHorizontal);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const topLeftS0PathSegmentsVertical = [
        `${width / 2} 0`,
        `${width / 2} -${margin}`,
        `-${margin} -${margin}`,
        `-${margin} ${position.y + height / 2}`,
        `0 ${position.y + height / 2}`
    ];

    const topLeftT0PathSegmentsVertical = [
        `${width / 2} ${position.y}`,
        `${width / 2} ${(height + position.y) / 2}`,
        `-${margin} ${(height + position.y) / 2}`,
        `-${margin} ${height / 2}`,
        `0 ${height / 2}`
    ];

    const topLeftS0PathSegmentsHorizontal = [
        `${width / 2} 0`,
        `${width / 2} -${margin}`,
        `${(width + position.y) / 2} -${margin}`,
        `${(width + position.y) / 2} ${height / 2}`,
        `${position.y} ${height / 2}`
    ];

    const topLeftT0PathSegmentsHorizontal = [
        `${position.y + width / 2} 0`,
        `${position.y + width / 2} -${margin}`,
        `-${margin} -${margin}`,
        `-${margin} ${height / 2}`,
        `0 ${height / 2}`
    ];

    QUnit.test('rightAngle routing - source: top, target: left', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('top', 'left');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(topLeftS0PathSegmentsVertical);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topLeftT0PathSegmentsVertical);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topLeftS0PathSegmentsHorizontal);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topLeftT0PathSegmentsHorizontal);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    QUnit.test('rightAngle routing - source: right, target: top', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('right', 'top');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(topRightT0PathSegmentsVertical).reverse();
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topRightS0PathSegmentsVertical).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topRightT0PathSegmentsHorizontal).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topRightS0PathSegmentsHorizontal).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const rightHorizontalPathSegments = [
        `${width} ${height / 2}`,
        `${(width + position.y) / 2} ${height / 2}`,
        `${(width + position.y) / 2} -${margin}`,
        `${position.y + width + margin} -${margin}`,
        `${position.y + width + margin} ${height / 2}`,
        `${position.y + width} ${height / 2}`
    ];

    const rightVerticalPathSegments = [
        `${width} ${height / 2}`,
        `${width + margin} ${height / 2}`,
        `${width + margin} ${height / 2 + position.y}`,
        `${width} ${height / 2 + position.y}`,
    ];

    QUnit.test('rightAngle routing - source: right, target: right', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('right', 'right');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(rightVerticalPathSegments);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightVerticalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightHorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightHorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const rightBottomS0VerticalPathSegments = [
        `${width} ${height / 2}`,
        `${width + margin} ${height / 2}`,
        `${width + margin} ${height + position.y + margin}`,
        `${width / 2} ${height + position.y + margin}`,
        `${width / 2} ${height + position.y}`
    ];

    const rightBottomT0VerticalPathSegments = [
        `${width} ${position.y + height / 2}`,
        `${width + margin} ${position.y + height / 2}`,
        `${width + margin} ${(height + position.y) / 2}`,
        `${width / 2} ${(height + position.y) / 2}`,
        `${width / 2} ${height}`
    ];

    const rightBottomS0HorizontalPathSegments = [
        `${width} ${height / 2}`,
        `${(width + position.y) / 2} ${height / 2}`,
        `${(width + position.y) / 2} ${height + margin}`,
        `${position.y + width / 2} ${height + margin}`,
        `${position.y + width / 2} ${height}`
    ];

    const rightBottomT0HorizontalPathSegments = [
        `${position.y + width} ${height / 2}`,
        `${position.y + width + margin} ${height / 2}`,
        `${position.y + width + margin} ${height + margin}`,
        `${width / 2} ${height + margin}`,
        `${width / 2} ${height}`
    ];

    QUnit.test('rightAngle routing - source: right, target: bottom', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('right', 'bottom');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(rightBottomS0VerticalPathSegments);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightBottomT0VerticalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightBottomS0HorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightBottomT0HorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const rightLeftS0VerticalPathSegments = [
        `${width} ${height / 2}`,
        `${width + margin} ${height / 2}`,
        `${width + margin} ${(height + position.y) / 2}`,
        `-${margin} ${(height + position.y) / 2}`,
        `-${margin} ${height / 2 + position.y}`,
        `0 ${height / 2 + position.y}`
    ];

    const rightLeftT0VerticalPathSegments = [
        `${width} ${position.y + height / 2}`,
        `${width + margin} ${position.y + height / 2}`,
        `${width + margin} ${(position.y + height) / 2}`,
        `-${margin} ${(position.y + height) / 2}`,
        `-${margin} ${height / 2}`,
        `0 ${height / 2}`
    ];

    const rightLeftS0HorizontalPathSegments = [
        `${width} ${height / 2}`,
        `${(width + position.y) / 2} ${height / 2}`,
        `${(width + position.y) / 2} ${height / 2}`,
        `${position.y} ${height / 2}`,
    ];

    const rightLeftT0HorizontalPathSegments = [
        `${position.y + width} ${height / 2}`,
        `${position.y + width + margin} ${height / 2}`,
        `${position.y + width + margin} ${height + margin}`,
        `-${margin} ${height + margin}`,
        `-${margin} ${height / 2}`,
        `0 ${height / 2}`
    ];

    QUnit.test('rightAngle routing - source: right, target: left', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('right', 'left');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(rightLeftS0VerticalPathSegments);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightLeftT0VerticalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightLeftS0HorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightLeftT0HorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    QUnit.test('rightAngle routing - source: bottom, target: top', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('bottom', 'top');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(topBottomT0PathSegmentsVertical).reverse();
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topBottomS0PathSegmentsVertical).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topBottomT0PathSegmentsHorizontal).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topBottomS0PathSegmentsHorizontal).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    QUnit.test('rightAngle routing - source: bottom, target: right', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('bottom', 'right');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(rightBottomT0VerticalPathSegments).reverse();
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightBottomS0VerticalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightBottomT0HorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightBottomS0HorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const bottomVerticalPathSegments = [
        `${width / 2} ${height}`,
        `${width / 2} ${(height + position.y) / 2}`,
        `${width + margin} ${(height + position.y) / 2}`,
        `${width + margin} ${position.y + height + margin}`,
        `${width / 2} ${position.y + height + margin}`,
        `${width / 2} ${position.y + height}`
    ];

    const bottomHorizontalPathSegments = [
        `${width / 2} ${height}`,
        `${width / 2} ${height + margin}`,
        `${position.y + width / 2} ${height + margin}`,
        `${position.y + width / 2} ${height}`
    ];

    QUnit.test('rightAngle routing - source: bottom, target: bottom', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('bottom', 'bottom');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(bottomVerticalPathSegments);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomVerticalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomHorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomHorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const bottomLeftS0VerticalPathSegments = [
        `${width / 2} ${height}`,
        `${width / 2} ${(height + position.y) / 2}`,
        `-${margin} ${(height + position.y) / 2}`,
        `-${margin} ${position.y + height / 2}`,
        `0 ${position.y + height / 2}`
    ];

    const bottomLeftT0VerticalPathSegments = [
        `${width / 2} ${position.y + height}`,
        `${width / 2} ${position.y + height + margin}`,
        `-${margin} ${position.y + height + margin}`,
        `-${margin} ${height / 2}`,
        `0 ${height / 2}`
    ];

    const bottomLeftS0HorizontalPathSegments = [
        `${width / 2} ${height}`,
        `${width / 2} ${height + margin}`,
        `${(position.y + width) / 2} ${height + margin}`,
        `${(position.y + width) / 2} ${height / 2}`,
        `${position.y} ${height / 2}`
    ];

    const bottomLeftT0HorizontalPathSegments = [
        `${position.y + width / 2} ${height}`,
        `${position.y + width / 2} ${height + margin}`,
        `-${margin} ${height + margin}`,
        `-${margin} ${height / 2}`,
        `0 ${height / 2}`
    ];

    QUnit.test('rightAngle routing - source: bottom, target: left', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('bottom', 'left');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(bottomLeftS0VerticalPathSegments);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomLeftT0VerticalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomLeftS0HorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomLeftT0HorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    QUnit.test('rightAngle routing - source: left, target: top', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('left', 'top');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(topLeftT0PathSegmentsVertical).reverse();
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topLeftS0PathSegmentsVertical).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topLeftT0PathSegmentsHorizontal).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(topLeftS0PathSegmentsHorizontal).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    QUnit.test('rightAngle routing - source: left, target: right', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('left', 'right');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(rightLeftT0VerticalPathSegments).reverse();
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightLeftS0VerticalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightLeftT0HorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(rightLeftS0HorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    QUnit.test('rightAngle routing - source: left, target: bottom', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('left', 'bottom');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(bottomLeftT0VerticalPathSegments).reverse();
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomLeftS0VerticalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomLeftT0HorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(bottomLeftS0HorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    const leftHorizontalPathSegments = [
        `0 ${height / 2}`,
        `-${margin} ${height / 2}`,
        `-${margin} -${margin}`,
        `${(width + position.y) / 2} -${margin}`,
        `${(width + position.y) / 2} ${height / 2}`,
        `${position.y} ${height / 2}`
    ];

    const leftVerticalPathSegments = [
        `0 ${height / 2}`,
        `-${margin} ${height / 2}`,
        `-${margin} ${height / 2 + position.y}`,
        `0 ${height / 2 + position.y}`
    ];

    QUnit.test('rightAngle routing - source: left, target: left', function(assert) {
        const [r1, r2, l] = this.addTestSubjects('left', 'left');

        let d = this.paper.findViewByModel(l).metrics.data;
        let segments = joint.util.cloneDeep(leftVerticalPathSegments);
        let moveSegment = segments.shift();
        let path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source above target');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(leftVerticalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target above source');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(leftHorizontalPathSegments);
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Source on the left of target');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;
        segments = joint.util.cloneDeep(leftHorizontalPathSegments).reverse();
        moveSegment = segments.shift();
        path = `M ${moveSegment} L ${segments.join(' L ')}`;

        assert.checkDataPath(d, path, 'Target on the left of source');
    });

    QUnit.test('rightAngle routing with vertex - source: top, target: top', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('top', 'top', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 111 L 25 111 L 25 150', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 150 L 25 100 L 100 100 L 100 -28 L 25 -28 L 25 0', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 100 L 125 100 L 125 -28 L 175 -28 L 175 0', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 175 0 L 175 -28 L 100 -28 L 100 100 L 75 100 L 75 -28 L 25 -28 L 25 0', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: top, target: right', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('top', 'right', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 175 L 50 175', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 150 L 25 100 L 100 100 L 100 25 L 78 25 L 50 25', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 100 L 228 100 L 228 25 L 200 25', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 175 0 L 175 -28 L 100 -28 L 100 100 L 75 100 L 75 25 L 50 25', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: top, target: bottom', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('top', 'bottom', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 228 L 25 228 L 25 200', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 150 L 25 100 L 128 100 L 128 128 L 25 128 L 25 50', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 100 L 175 100 L 175 50', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 175 0 L 175 -28 L 100 -28 L 100 100 L 25 100 L 25 50', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: top, target: left', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('top', 'left', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 228 L -28 228 L -28 175 L 0 175', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 150 L 25 100 L 100 100 L 100 75 L -28 75 L -28 25 L 0 25', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 100 L 125 100 L 125 25 L 150 25', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 175 0 L 175 -28 L 100 -28 L 100 100 L -28 100 L -28 25 L 0 25', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: right, target: top', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('right', 'top', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 100 25 L 100 111 L 25 111 L 25 150', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 175 L 100 175 L 100 -28 L 25 -28 L 25 0', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 100 25 L 100 100 L 125 100 L 125 -28 L 175 -28 L 175 0', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 200 25 L 228 25 L 228 100 L 75 100 L 75 -28 L 25 -28 L 25 0', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: right, target: right', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('right', 'right', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 100 25 L 100 175 L 50 175', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 175 L 100 175 L 100 25 L 50 25', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 100 25 L 100 100 L 228 100 L 228 25 L 200 25', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 200 25 L 228 25 L 228 100 L 89 100 L 89 25 L 50 25', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: right, target: bottom', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('right', 'bottom', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 100 25 L 100 228 L 25 228 L 25 200', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 175 L 100 175 L 100 89 L 25 89 L 25 50', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 100 25 L 100 100 L 175 100 L 175 50', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 200 25 L 228 25 L 228 100 L 25 100 L 25 50', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: right, target: left', function(assert) {
        const vertex = { x: 100, y: 100 };

        const [r1, r2, l] = this.addTestSubjectsWithVertices('right', 'left', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 100 25 L 100 228 L -28 228 L -28 175 L 0 175', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 175 L 100 175 L 100 -28 L -28 -28 L -28 25 L 0 25', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 100 25 L 100 100 L 125 100 L 125 25 L 150 25', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 200 25 L 228 25 L 228 100 L -28 100 L -28 25 L 0 25', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: bottom, target: top', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('bottom', 'top', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 100 L 100 100 L 100 125 L 25 125 L 25 150', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 200 L 25 228 L 100 228 L 100 -28 L 25 -28 L 25 0', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 100 L 125 100 L 125 -28 L 175 -28 L 175 0', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 175 50 L 175 100 L 75 100 L 75 -28 L 25 -28 L 25 0', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: bottom, target: right', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('bottom', 'right', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 100 L 100 100 L 100 175 L 78 175 L 50 175', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 200 L 25 228 L 100 228 L 100 25 L 50 25', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 100 L 228 100 L 228 25 L 200 25', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 175 50 L 175 100 L 89 100 L 89 25 L 50 25', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: bottom, target: bottom', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('bottom', 'bottom', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 100 L 100 100 L 100 228 L 25 228 L 25 200', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 200 L 25 228 L 100 228 L 100 89 L 25 89 L 25 50', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 100 L 175 100 L 175 50', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 175 50 L 175 100 L 25 100 L 25 50', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: bottom, target: left', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('bottom', 'left', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 100 L 100 100 L 100 125 L -28 125 L -28 175 L 0 175', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 200 L 25 228 L 100 228 L 100 -28 L -28 -28 L -28 25 L 0 25', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 100 L 111 100 L 111 25 L 150 25', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 175 50 L 175 100 L -28 100 L -28 25 L 0 25', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: left, target: top', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('left', 'top', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 100 L 100 100 L 100 125 L 25 125 L 25 150', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 175 L -28 175 L -28 100 L 100 100 L 100 -28 L 25 -28 L 25 0', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 100 L 125 100 L 125 -28 L 175 -28 L 175 0', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 150 25 L 100 25 L 100 100 L 75 100 L 75 -28 L 25 -28 L 25 0', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: left, target: right', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('left', 'right', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 100 L 100 100 L 100 175 L 78 175 L 50 175', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 175 L -28 175 L -28 100 L 100 100 L 100 25 L 78 25 L 50 25', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 100 L 228 100 L 228 25 L 200 25', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 150 25 L 100 25 L 100 100 L 75 100 L 75 25 L 50 25', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: left, target: bottom', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('left', 'bottom', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 100 L 100 100 L 100 228 L 25 228 L 25 200', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 175 L -28 175 L -28 100 L 128 100 L 128 128 L 25 128 L 25 50', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 100 L 175 100 L 175 50', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 150 25 L 100 25 L 100 100 L 25 100 L 25 50', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex - source: left, target: left', function(assert) {
        const vertex = { x: 100, y: 100 };
        const [r1, r2, l] = this.addTestSubjectsWithVertices('left', 'left', [vertex]);

        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 100 L 100 100 L 100 125 L -28 125 L -28 175 L 0 175', 'Source above target with vertex');

        let position1 = r1.position();
        let position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 175 L -28 175 L -28 100 L 100 100 L 100 75 L -28 75 L -28 25 L 0 25', 'Target above source with vertex');

        r1.position(0, 0);
        r2.position(position.y, position.x);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 100 L 111 100 L 111 25 L 150 25', 'Source on the left of target with vertex');

        position1 = r1.position();
        position2 = r2.position();

        r1.position(position2.x, position2.y);
        r2.position(position1.x, position1.y);

        d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 150 25 L 100 25 L 100 100 L -28 100 L -28 25 L 0 25', 'Target on the left of source with vertex');
    });

    QUnit.test('rightAngle routing with vertex inside the source element bbox - source: top', function(assert) {
        const vertices = [{ x: size.width * 0.75, y: size.height / 2 }, { x: 100, y: 100 }];
        const [, , l] = this.addTestSubjectsWithVertices('top', 'top', vertices);
        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 53 -28 L 53 12.5 L 37.5 12.5 L 37.5 100 L 100 100 L 100 125 L 25 125 L 25 150', 'Source above target with vertex inside the source element bbox');
    });

    QUnit.test('rightAngle routing with vertex inside the source element bbox - source: right', function(assert) {
        const vertices = [{ x: 0, y: size.y }, { x: 100, y: 100 }];
        const [, , l] = this.addTestSubjectsWithVertices('right', 'top', vertices);
        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 50 25 L 78 25 L 78 -3 L 25 -3 L 25 0 L 0 0 L 0 100 L 100 100 L 100 125 L 25 125 L 25 150', 'Source above target with vertex inside the source element bbox');
    });

    QUnit.test('rightAngle routing with vertex inside the source element bbox - source: bottom', function(assert) {
        const vertices = [{ x: size.width, y: size.y }, { x: 100, y: 100 }];
        const [, , l] = this.addTestSubjectsWithVertices('bottom', 'top', vertices);
        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 50 L 25 78 L 53 78 L 53 25 L 50 25 L 50 0 L 100 0 L 100 111 L 25 111 L 25 150', 'Source above target with vertex inside the source element bbox');
    });

    QUnit.test('rightAngle routing with vertex inside the source element bbox - source: left', function(assert) {
        const vertices = [{ x: size.width, y: size.y }, { x: 100, y: 100 }];
        const [, , l] = this.addTestSubjectsWithVertices('left', 'top', vertices);
        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 0 25 L -28 25 L -28 -3 L 25 -3 L 25 0 L 100 0 L 100 111 L 25 111 L 25 150', 'Source above target with vertex inside the source element bbox');
    });

    QUnit.test('rightAngle routing with vertex inside the target element bbox - target: top', function(assert) {
        const vertices = [{ x: 100, y: 100 }, { x: position.x + size.width * 0.75, y: position.y + size.height / 2 }];
        const [, , l] = this.addTestSubjectsWithVertices('top', 'top', vertices);
        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 175 L 31.25 175 L 31.25 122 L 25 122 L 25 150', 'Source above target with vertex inside the target element bbox');
    });

    QUnit.test('rightAngle routing with vertex inside the target element bbox - target: right', function(assert) {
        const vertices = [{ x: 100, y: 100 }, { x: position.x, y: position.y }];
        const [, , l] = this.addTestSubjectsWithVertices('top', 'right', vertices);
        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 150 L 0 150 L 0 203 L 78 203 L 78 175 L 50 175', 'Source above target with vertex inside the target element bbox');
    });

    QUnit.test('rightAngle routing with vertex inside the target element bbox - target: bottom', function(assert) {
        const vertices = [{ x: 100, y: 100 }, { x: position.x + size.width, y: position.y }];
        const [, , l] = this.addTestSubjectsWithVertices('top', 'bottom', vertices);
        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 150 L 37.5 150 L 37.5 228 L 25 228 L 25 200', 'Source above target with vertex inside the target element bbox');
    });

    QUnit.test('rightAngle routing with vertex inside the target element bbox - target: left', function(assert) {
        const vertices = [{ x: 100, y: 100 }, { x: position.x + size.width, y: position.y }];
        const [, , l] = this.addTestSubjectsWithVertices('top', 'left', vertices);
        let d = this.paper.findViewByModel(l).metrics.data;

        assert.checkDataPath(d, 'M 25 0 L 25 -28 L 100 -28 L 100 150 L 25 150 L 25 147 L -28 147 L -28 175 L 0 175', 'Source above target with vertex inside the target element bbox');
    });
});

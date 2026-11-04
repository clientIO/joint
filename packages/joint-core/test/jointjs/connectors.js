QUnit.module('connectors', function(hooks) {

    hooks.beforeEach(function() {

        const fixtureEl = fixtures.getElement();
        const paperEl = document.createElement('div');
        fixtureEl.appendChild(paperEl);

        this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        this.paper = new joint.dia.Paper({
            el: paperEl,
            gridSize: 10,
            model: this.graph,
            cellViewNamespace: joint.shapes,
            defaultConnectionPoint: { name: 'bbox' },
        });
    });

    hooks.afterEach(function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });

    QUnit.test('construction', function(assert) {

        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 }});
        var r2 = r1.clone().translate(300);

        this.graph.addCell([r1, r2]);

        var l0 = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            vertices: [{ x: 150, y: 200 }],
            connector: { name: 'non-existing' }
        });

        assert.throws(function() {
            this.graph.addCell(l0);
        }, /non-existing/, 'Recognize a non-existing connector.');

        l0.set('connector', { name: 'normal' });
        this.graph.addCell(l0);
        assert.equal(this.graph.getLinks().length, 1, 'A link with the normal connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l0).getConnection().round().serialize(), 'M 102 110 L 150 200 L 320 104', 'A link with the normal connector was correctly rendered');

        var l1 = l0.clone().set('connector', { name: 'rounded' });
        this.graph.addCell(l1);
        assert.equal(this.graph.getLinks().length, 2, 'A link with the rounded connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l1).getConnection().round().serialize(), 'M 102 110 L 145 191 C 148 197 153 198 159 195 L 320 104', 'A link with the rounded connector was correctly rendered');

        var l2 = l0.clone().set('connector', { name: 'smooth' });
        this.graph.addCell(l2);
        assert.equal(this.graph.getLinks().length, 3, 'A link with the smooth connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l2).getConnection().round().serialize(), 'M 102 110 C 108 156 114 201 150 200 C 186 199 253 151 320 104', 'A link with the smooth connector was correctly rendered');

        var l3 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'non-existing' }});
        assert.throws(function() {
            this.graph.addCell(l3);
        }, /Invalid `cornerType` provided to `straight` connector/, 'Recognize invalid corner type of straight connector.');

        l3.set('connector', { name: 'straight' });
        this.graph.addCell(l3);
        assert.equal(this.graph.getLinks().length, 4, 'A link with the (default) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l3).getConnection().round().serialize(), 'M 102 110 L 150 200 L 320 104', 'A link with the (default) straight connector was correctly rendered');
        assert.checkDataPath(this.paper.findViewByModel(l3).getConnection().round(2).serialize(), this.paper.findViewByModel(l0).getConnection().round(2).serialize(), 'A link with the (default) straight connector was rendered same as if it had the normal connector');

        var l4 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'point' }});
        this.graph.addCell(l4);
        assert.equal(this.graph.getLinks().length, 5, 'A link with the (point) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l4).getConnection().round().serialize(), 'M 102 110 L 150 200 L 320 104', 'A link with the (point) straight connector was correctly rendered');
        assert.checkDataPath(this.paper.findViewByModel(l4).getConnection().round(2).serialize(), this.paper.findViewByModel(l0).getConnection().round(2).serialize(), 'A link with the (point) straight connector was rendered same as if it had the normal connector');

        var l5 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'cubic', precision: 0 }});
        this.graph.addCell(l5);
        assert.equal(this.graph.getLinks().length, 6, 'A link with the (cubic) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l5).getConnection().round().serialize(), 'M 102 110 L 145 191 C 148 197 153 198 159 195 L 320 104', 'A link with the (cubic) straight connector was correctly rendered');
        assert.checkDataPath(this.paper.findViewByModel(l5).getConnection().round(2).serialize(), this.paper.findViewByModel(l1).getConnection().round(2).serialize(), 'A link with the (cubic) straight connector was rendered same as if it had the rounded connector');

        var l6 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'line' }});
        this.graph.addCell(l6);
        assert.equal(this.graph.getLinks().length, 7, 'A link with the (line) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l6).getConnection().round().serialize(), 'M 102 110 L 145 191 L 159 195 L 320 104', 'A link with the (line) straight connector was correctly rendered');

        var l7 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'gap' }});
        this.graph.addCell(l7);
        assert.equal(this.graph.getLinks().length, 8, 'A link with the (gap) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l7).getConnection().round().serialize(), 'M 102 110 L 145 191 M 159 195 L 320 104', 'A link with the (gap) straight connector was correctly rendered');

        var customCalled = 0;
        var l99 = l0.clone().set('connector', function() {
            customCalled += 1;
            return 'M 0 0';
        });
        this.graph.addCell(l99);
        assert.equal(customCalled, 1, 'A link with the custom connector was successfully added to the graph');
    });

    QUnit.test('curve connector direction auto', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: { name: 'curve' }
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 305 270 C 305 343.539 435 326.461 435 400', 'curve auto link was correctly rendered');
    });

    QUnit.test('curve connector direction auto with vertex', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: { name: 'curve' }
        });

        link.set('vertices', [{ x: 400, y: 200 }]);

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 340 216.15 C 364.854 216.15 375.389 196.529 400 200 C 482.655 211.657 459.57 316.527 459.57 400', 'curve auto with vertex was correctly rendered');
    });

    QUnit.test('curve connector direction auto no element', function(assert) {
        var link = new joint.shapes.standard.Link({
            source: { x: 200, y: 200 },
            target: { x: 100, y: 300 },
            connector: { name: 'curve' }
        });

        this.graph.addCells([link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 200 200 C 143.431 200 156.569 300 100 300', 'curve auto with no elements was correctly rendered');
    });

    QUnit.test('curve connector with custom directions', function(assert) {
        var link = new joint.shapes.standard.Link({
            source: { x: 200, y: 200 },
            target: { x: 400, y: 400 },
            connector: {
                name: 'curve',
                args: {
                    sourceDirection: { x: 0.5, y: -0.5 },
                    targetDirection: { x: -0.5, y: 0.5 }
                }
            }
        });

        this.graph.addCells([link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 200 200 C 309.619 90.381 290.381 509.619 400 400', 'curve auto with custom directions was correctly rendered');
    });

    QUnit.test('curve connector with custom tangents', function(assert) {
        var link = new joint.shapes.standard.Link({
            source: { x: 200, y: 200 },
            target: { x: 400, y: 400 },
            connector: {
                name: 'curve',
                args: {
                    sourceTangent: { x: 100, y: -50 },
                    targetTangent: { x: 100, y: 100 }
                }
            }
        });

        this.graph.addCells([link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 200 200 C 266.667 166.667 466.667 466.667 400 400', 'curve auto with custom tangents was correctly rendered');
    });

    QUnit.test('curve connector with enum directions (left/right)', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: {
                name: 'curve',
                args: {
                    sourceDirection: joint.connectors.curve.TangentDirections.RIGHT,
                    targetDirection: joint.connectors.curve.TangentDirections.LEFT
                }
            }
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 270 270 C 363.888 270 176.112 400 270 400');
    });

    QUnit.test('curve connector with horizontal direction', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: {
                name: 'curve',
                args: {
                    direction: joint.connectors.curve.Directions.HORIZONTAL,
                }
            }
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 270 270 C 363.888 270 363.888 400 270 400');
    });

    QUnit.test('curve connector with vertical direction', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: {
                name: 'curve',
                args: {
                    direction: joint.connectors.curve.Directions.VERTICAL,
                }
            }
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 305 270 C 305 343.539 435 326.461 435 400');
    });

    QUnit.test('curve connector with closest point direction', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: {
                name: 'curve',
                args: {
                    direction: joint.connectors.curve.Directions.CLOSEST_POINT,
                }
            }
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 305 270 C 357 322 383 348 435 400');
    });

    QUnit.test('curve connector with outwards direction', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: {
                name: 'curve',
                args: {
                    direction: joint.connectors.curve.Directions.CLOSEST_POINT,
                }
            }
        });

        link.set('vertices', [{ x: 400, y: 200 }]);

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 340 216.15 C 364 209.69 378.299 187.884 400 200 C 472.884 240.691 435.742 320 459.57 400');
    });

    QUnit.test('curve connector rotate', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }, angle: 30 });
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }, angle: 60 });

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: {
                name: 'curve',
                args: {
                    rotate: true
                }
            }
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 335.31 300.31 C 369.299 319.934 385.066 335.701 404.69 369.69', 'curve link with rotate was correctly rendered');
    });

    QUnit.test('curve connector rotate (target is nonrotated)', function(assert) {
        var r1 = new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }, angle: 30 });
        var r2 = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: {
                name: 'curve',
                args: {
                    rotate: true
                }
            }
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.metrics.data;

        assert.checkDataPath(pathData, 'M 335.31 300.31 C 384.148 328.507 435 343.607 435 400', 'curve link with rotate was correctly rendered');
    });

    QUnit.test('jumpover connector - stacked links do not cause jumps', function(assert) {
        const element1 = new joint.shapes.standard.Rectangle({
            position: { x: 50, y: 50 },
            size: { width: 50, height: 50 },
        });

        const element2 = element1.clone();
        element2.position(50, 150);

        const link1 = new joint.shapes.standard.Link({
            source: { x: 25, y: 300 },
            target: { id: element1.id },
            connector: { name: 'jumpover' },
            vertices: [
                { x: 25, y: 75 }
            ],
        });

        const link2 = new joint.shapes.standard.Link({
            source: { x: 25, y: 300 },
            target: { id: element2.id },
            connector: { name: 'jumpover' },
            vertices: [
                { x: 25, y: 175 }
            ]
        });

        this.graph.addCells([element1, element2, link2, link1]);

        const linkView = link1.findView(this.paper);
        const pathData = linkView.metrics.data;

        // The link consists of two straight lines - no jumps
        assert.checkDataPath(pathData, 'M 25 300 L 25 75 L 50 75');
    });

    QUnit.module('jumpover connector - merge and split points', function(hooks) {

        // Link A is a single vertical segment. Each test draws another link B
        // that shares a stretch with A and asserts the path of A.
        hooks.beforeEach(function() {
            this.renderStackedLinks = (vertices, source, target) => {
                const linkA = new joint.shapes.standard.Link({
                    source: { x: 25, y: 300 },
                    target: { x: 25, y: 75 },
                    connector: { name: 'jumpover' },
                    z: 2
                });
                const linkB = new joint.shapes.standard.Link({
                    source,
                    target,
                    vertices,
                    connector: { name: 'jumpover' },
                    z: 1
                });
                this.graph.addCells([linkB, linkA]);
                return linkA.findView(this.paper).metrics.data;
            };
        });

        QUnit.test('a link merging onto a stacked stretch does not cause a jump', function(assert) {
            // The same shape as "stacked links do not cause jumps", traversed the other way:
            // B arrives perpendicular at 25@175 and then runs along A.
            const pathData = this.renderStackedLinks([{ x: 25, y: 175 }], { x: 50, y: 175 }, { x: 25, y: 300 });
            assert.checkDataPath(pathData, 'M 25 300 L 25 75');
        });

        QUnit.test('a link that joins, runs along and leaves does not cause jumps', function(assert) {
            const pathData = this.renderStackedLinks(
                [{ x: 25, y: 250 }, { x: 25, y: 150 }],
                { x: 100, y: 250 },
                { x: 100, y: 150 }
            );
            assert.checkDataPath(pathData, 'M 25 300 L 25 75', 'joins at 25@250, leaves at 25@150');

            const reversedPathData = this.renderStackedLinks(
                [{ x: 25, y: 150 }, { x: 25, y: 250 }],
                { x: 100, y: 150 },
                { x: 100, y: 250 }
            );
            assert.checkDataPath(reversedPathData, 'M 25 300 L 25 75', 'joins at 25@150, leaves at 25@250');
        });

        QUnit.test('only a genuine crossing causes a jump when the link also runs along', function(assert) {
            // B crosses A at 25@275, then joins A at 25@250 and leaves it at 25@150.
            const pathData = this.renderStackedLinks(
                [{ x: 100, y: 275 }, { x: 100, y: 250 }, { x: 25, y: 250 }, { x: 25, y: 150 }],
                { x: 0, y: 275 },
                { x: 100, y: 150 }
            );
            const segments = pathData.split(/\s(?=[MLC])/);
            assert.equal(segments.filter((segment) => segment.startsWith('C')).length, 2, 'a single jump (two arcs)');
            assert.equal(segments[0], 'M 25 300');
            assert.equal(segments[1], 'L 25 280', 'the jump starts 5 units before the crossing');
            assert.equal(segments[segments.length - 1], 'L 25 75', 'no jump at the merge or split point');
        });
    });

    QUnit.module('jumpover connector', function(hooks) {

        const JUMP_SIZE = 5;

        hooks.beforeEach(function() {
            this.addLink = (source, target, connectorName = 'jumpover', args = {}) => {
                const link = new joint.shapes.standard.Link({
                    source,
                    target,
                    connector: { name: connectorName, args: { size: JUMP_SIZE, ...args }}
                });
                this.graph.addCell(link);
                return link;
            };
            this.refresh = () => {
                // jumpover links are refreshed when a batch ends
                this.graph.startBatch('test');
                this.graph.stopBatch('test');
            };
        });

        QUnit.test('a jump over a track of close parallel links is a single jump', function(assert) {
            const link = this.addLink({ x: 0, y: 100 }, { x: 300, y: 100 });
            [100, 107, 114, 121].forEach((x) => this.addLink({ x, y: 0 }, { x, y: 200 }, 'normal'));
            this.refresh();
            const path = link.findView(this.paper).getConnection();
            const jumpSegments = path.segments.filter((segment) => segment.type === 'C');
            assert.equal(jumpSegments.length, 2, 'one jump (two quarter circles)');
            const bbox = path.bbox();
            assert.equal(Math.round(bbox.y * 1000) / 1000, 100 - JUMP_SIZE, 'the jump bulges by the jump size');
            assert.equal(Math.round(path.start.x), 0);
            assert.equal(Math.round(path.end.x), 300);
        });

        QUnit.test('two close crossings get one jump', function(assert) {
            const link = this.addLink({ x: 0, y: 100 }, { x: 300, y: 100 });
            [100, 107].forEach((x) => this.addLink({ x, y: 0 }, { x, y: 200 }, 'normal'));
            this.refresh();
            const path = link.findView(this.paper).getConnection();
            assert.equal(path.segments.filter((segment) => segment.type === 'C').length, 2, 'one jump');
            assert.equal(Math.round(path.bbox().y * 1000) / 1000, 100 - JUMP_SIZE, 'the jump bulges by the jump size');
        });

        QUnit.test('a crossing too close to the end of the line does not cancel the jump over the others', function(assert) {
            // the last crossing is 4px before the end of the line
            const link = this.addLink({ x: 0, y: 100 }, { x: 100, y: 100 });
            [60, 67, 74, 81, 88, 96].forEach((x) => this.addLink({ x, y: 0 }, { x, y: 200 }, 'normal'));
            this.refresh();
            const path = link.findView(this.paper).getConnection();
            assert.equal(path.segments.filter((segment) => segment.type === 'C').length, 2, 'one jump');
            const bbox = path.bbox();
            assert.ok(bbox.y < 100, 'the jump is drawn');
            assert.equal(Math.round(path.end.x), 100);
        });

        QUnit.test('a crossing too close to the start of the line does not cancel the jump over the others', function(assert) {
            // the first crossing is 4px after the start of the line
            const link = this.addLink({ x: 0, y: 100 }, { x: 100, y: 100 });
            [4, 11, 18, 25, 32].forEach((x) => this.addLink({ x, y: 0 }, { x, y: 200 }, 'normal'));
            this.refresh();
            const path = link.findView(this.paper).getConnection();
            assert.equal(path.segments.filter((segment) => segment.type === 'C').length, 2, 'one jump');
            assert.equal(Math.round(path.start.x), 0);
        });

        QUnit.test('a gap over a track of close parallel links is a single gap', function(assert) {
            const link = this.addLink({ x: 0, y: 100 }, { x: 300, y: 100 }, 'jumpover', { jump: 'gap' });
            [100, 107, 114, 121].forEach((x) => this.addLink({ x, y: 0 }, { x, y: 200 }, 'normal'));
            this.refresh();
            const path = link.findView(this.paper).getConnection();
            const moves = path.segments.filter((segment) => segment.type === 'M');
            assert.equal(moves.length, 2, 'one gap');
            const gapStart = path.segments[path.segments.indexOf(moves[1]) - 1].end;
            assert.equal(Math.round(gapStart.x), 100 - JUMP_SIZE, 'the gap starts before the first link');
            assert.equal(Math.round(moves[1].end.x), 121 + JUMP_SIZE, 'the gap ends after the last link');
        });

        QUnit.test('a cubic jump over a track of close parallel links is a single curve', function(assert) {
            const link = this.addLink({ x: 0, y: 100 }, { x: 300, y: 100 }, 'jumpover', { jump: 'cubic' });
            [100, 107, 114, 121].forEach((x) => this.addLink({ x, y: 0 }, { x, y: 200 }, 'normal'));
            this.refresh();
            const path = link.findView(this.paper).getConnection();
            assert.equal(path.segments.filter((segment) => segment.type === 'C').length, 1, 'one curve');
            assert.ok(100 - path.bbox().y < JUMP_SIZE * 1.1, 'the curve is about as high as the jump size');
        });

        QUnit.test('a single jump is a semicircle of the jump size', function(assert) {
            const link = this.addLink({ x: 0, y: 100 }, { x: 300, y: 100 });
            this.addLink({ x: 150, y: 0 }, { x: 150, y: 200 }, 'normal');
            this.refresh();
            const path = link.findView(this.paper).getConnection();
            assert.equal(path.segments.filter((segment) => segment.type === 'C').length, 2);
            assert.equal(Math.round(path.bbox().y * 1000) / 1000, 100 - JUMP_SIZE);
        });

        QUnit.test('distant crossings get separate jumps', function(assert) {
            const link = this.addLink({ x: 0, y: 100 }, { x: 300, y: 100 });
            [100, 200].forEach((x) => this.addLink({ x, y: 0 }, { x, y: 200 }, 'normal'));
            this.refresh();
            const path = link.findView(this.paper).getConnection();
            assert.equal(path.segments.filter((segment) => segment.type === 'C').length, 4, 'two jumps');
        });

        QUnit.test('a vertical jump points the same way when the line is a tiny bit off', function(assert) {
            const exact = this.addLink({ x: 100, y: 200 }, { x: 100, y: 0 });
            const offRight = this.addLink({ x: 200, y: 200 }, { x: 200 + 1e-9, y: 0 });
            const exactDown = this.addLink({ x: 300, y: 0 }, { x: 300, y: 200 });
            const offLeftDown = this.addLink({ x: 400, y: 0 }, { x: 400 - 1e-9, y: 200 });
            this.addLink({ x: 0, y: 100 }, { x: 500, y: 100 }, 'normal');
            this.refresh();
            const side = (link, x) => Math.sign(Math.round(link.findView(this.paper).getConnection().bbox().center().x - x));
            assert.notEqual(side(exact, 100), 0, 'the jump is drawn');
            assert.equal(side(offRight, 200), side(exact, 100), 'up');
            assert.equal(side(offLeftDown, 400), side(exactDown, 300), 'down');
        });

        QUnit.test('links outside of the bounding box are not tested for crossings', function(assert) {
            const link = this.addLink({ x: 0, y: 100 }, { x: 300, y: 100 });
            this.addLink({ x: 150, y: 0 }, { x: 150, y: 200 }, 'normal');
            [400, 500, 600].forEach((x) => this.addLink({ x, y: 0 }, { x, y: 200 }, 'normal'));
            const intersectionSpy = sinon.spy(joint.g.Line.prototype, 'intersection');
            try {
                link.findView(this.paper).requestUpdate(link.findView(this.paper).getFlag('CONNECTOR'));
                // 1 own segment: tested against the crossing link only
                assert.equal(intersectionSpy.callCount, 1);
            } finally {
                intersectionSpy.restore();
            }
            assert.equal(link.findView(this.paper).getConnection().segments.filter((segment) => segment.type === 'C').length, 2, 'the crossing still gets a jump');
        });

        QUnit.test('a link touching the bounding box at its edge is tested', function(assert) {
            // the zero-height box of a horizontal link and a vertical link ending on it
            const link = this.addLink({ x: 0, y: 100 }, { x: 300, y: 100 });
            this.addLink({ x: 150, y: 0 }, { x: 150, y: 100 }, 'normal');
            const intersectionSpy = sinon.spy(joint.g.Line.prototype, 'intersection');
            try {
                link.findView(this.paper).requestUpdate(link.findView(this.paper).getFlag('CONNECTOR'));
                assert.equal(intersectionSpy.callCount, 1);
            } finally {
                intersectionSpy.restore();
            }
        });
    });

    QUnit.module('jumpover connector - jumpPriority and search', function(hooks) {

        hooks.beforeEach(function() {
            this.addLink = (source, target, args = {}, connectorName = 'jumpover') => {
                const link = new joint.shapes.standard.Link({
                    source,
                    target,
                    connector: { name: connectorName, args }
                });
                this.graph.addCell(link);
                return link;
            };
            this.countCurves = (link) => (link.findView(this.paper).metrics.data.match(/C/g) || []).length;
            this.refresh = () => {
                this.graph.startBatch('test');
                this.graph.stopBatch('test');
            };
        });

        QUnit.test('paint-order: the link painted on top draws the jump', function(assert) {
            [undefined, 'paint-order', 'invalid'].forEach((jumpPriority) => {
                this.graph.resetCells([]);
                const horizontal = this.addLink({ x: 0, y: 50 }, { x: 100, y: 50 }, { jumpPriority });
                const vertical = this.addLink({ x: 50, y: 0 }, { x: 50, y: 100 }, { jumpPriority });
                this.refresh();
                assert.equal(this.countCurves(vertical), 2, `${jumpPriority}: the top link jumps`);
                assert.equal(this.countCurves(horizontal), 0, `${jumpPriority}: the bottom link does not`);
            });
        });

        QUnit.test('vertical: the more vertical link draws the jump', function(assert) {
            const vertical = this.addLink({ x: 50, y: 0 }, { x: 50, y: 100 }, { jumpPriority: 'vertical' });
            const horizontal = this.addLink({ x: 0, y: 50 }, { x: 100, y: 50 }, { jumpPriority: 'vertical' });
            this.refresh();
            assert.equal(this.countCurves(vertical), 2);
            assert.equal(this.countCurves(horizontal), 0);
        });

        QUnit.test('horizontal: the more horizontal link draws the jump', function(assert) {
            const horizontal = this.addLink({ x: 0, y: 50 }, { x: 100, y: 50 }, { jumpPriority: 'horizontal' });
            const vertical = this.addLink({ x: 50, y: 0 }, { x: 50, y: 100 }, { jumpPriority: 'horizontal' });
            this.refresh();
            assert.equal(this.countCurves(horizontal), 2);
            assert.equal(this.countCurves(vertical), 0);
        });

        QUnit.test('equally steep links fall back to the paint order', function(assert) {
            const bottom = this.addLink({ x: 0, y: 0 }, { x: 100, y: 100 }, { jumpPriority: 'vertical' });
            const top = this.addLink({ x: 0, y: 100 }, { x: 100, y: 0 }, { jumpPriority: 'vertical' });
            this.refresh();
            assert.equal(this.countCurves(top), 2);
            assert.equal(this.countCurves(bottom), 0);
        });

        QUnit.test('the jumpPriority of the link painted on top applies', function(assert) {
            [
                ['vertical', 'paint-order', 'paint-order'],
                ['paint-order', 'vertical', 'vertical'],
                ['horizontal', 'vertical', 'vertical'],
                ['vertical', 'horizontal', 'horizontal']
            ].forEach(([bottomPriority, topPriority, jumping]) => {
                [['horizontal', 'vertical'], ['vertical', 'horizontal']].forEach(([bottomDirection, topDirection]) => {
                    this.graph.resetCells([]);
                    const ends = {
                        horizontal: [{ x: 0, y: 50 }, { x: 100, y: 50 }],
                        vertical: [{ x: 50, y: 0 }, { x: 50, y: 100 }]
                    };
                    const links = {};
                    links[bottomDirection] = this.addLink(...ends[bottomDirection], { jumpPriority: bottomPriority });
                    links[topDirection] = this.addLink(...ends[topDirection], { jumpPriority: topPriority });
                    this.refresh();
                    const expected = (jumping === 'paint-order') ? topDirection : jumping;
                    const message = `${bottomDirection} ${bottomPriority} below ${topDirection} ${topPriority}`;
                    assert.equal(this.countCurves(links[expected]), 2, `${message}: the ${expected} link jumps`);
                    assert.equal(this.countCurves(links[expected === 'vertical' ? 'horizontal' : 'vertical']), 0, `${message}: the other link does not`);
                });
            });
        });

        QUnit.test('a link with another connector does not take the jump', function(assert) {
            const horizontal = this.addLink({ x: 0, y: 50 }, { x: 100, y: 50 }, { jumpPriority: 'vertical' });
            this.addLink({ x: 50, y: 0 }, { x: 50, y: 100 }, {}, 'normal');
            this.refresh();
            assert.equal(this.countCurves(horizontal), 2);
        });

        QUnit.test('search: finds the links with findLinksInArea() and the default buffer', function(assert) {
            const horizontal = this.addLink({ x: 0, y: 50 }, { x: 100, y: 50 }, { search: true });
            this.addLink({ x: 50, y: 0 }, { x: 50, y: 100 }, {}, 'normal');
            const spy = sinon.spy(this.graph, 'findLinksInArea');
            try {
                this.refresh();
                assert.ok(spy.called);
                const area = new g.Rect(spy.firstCall.args[0]);
                assert.deepEqual(area.toJSON(), { x: -51, y: -1, width: 202, height: 102 }, 'the bounding box grown by 1 + 50');
            } finally {
                spy.restore();
            }
            assert.equal(this.countCurves(horizontal), 2);
        });

        QUnit.test('search: a link routed further than the buffer is not found', function(assert) {
            const horizontal = this.addLink({ x: 0, y: 50 }, { x: 300, y: 50 });
            // The model bounding box of this link is 50 above `horizontal`,
            // but the route goes down across it.
            const detour = this.addLink({ x: 150, y: 0 }, { x: 250, y: 0 }, {}, 'normal');
            detour.router(() => [{ x: 150, y: 100 }, { x: 250, y: 100 }]);
            [[false, 4], [true, 4], [{ buffer: 60 }, 4], [{ buffer: 40 }, 0]].forEach(([search, curves]) => {
                horizontal.connector('jumpover', { search });
                this.refresh();
                assert.equal(this.countCurves(horizontal), curves, `search: ${JSON.stringify(search)}`);
            });
        });

        QUnit.test('search: the paint order follows the reordering of links', function(assert) {
            const horizontal = this.addLink({ x: 0, y: 50 }, { x: 100, y: 50 }, { search: true });
            const vertical = this.addLink({ x: 50, y: 0 }, { x: 50, y: 100 }, { search: true });
            this.refresh();
            assert.equal(this.countCurves(vertical), 2);
            assert.equal(this.countCurves(horizontal), 0);
            horizontal.toFront();
            this.refresh();
            assert.equal(this.countCurves(horizontal), 2);
            assert.equal(this.countCurves(vertical), 0);
        });
    });
});

QUnit.module('connectors', function(hooks) {

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
            vertices: [{ x: 150, y: 200 }],
            connector: { name: 'non-existing' }
        });

        assert.throws(function() {
            this.graph.addCell(l0);
        }, /non-existing/, 'Recognize a non-existing connector.');

        l0.set('connector', { name: 'normal' });
        this.graph.addCell(l0);
        assert.equal(this.graph.getLinks().length, 1, 'A link with the normal connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l0).getConnection().round(2).serialize(), 'M 102 110 L 150 200 L 320 104', 'A link with the normal connector was correctly rendered');

        var l1 = l0.clone().set('connector', { name: 'rounded' });
        this.graph.addCell(l1);
        assert.equal(this.graph.getLinks().length, 2, 'A link with the rounded connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l1).getConnection().round(2).serialize(), 'M 102 110 L 145 191 C 148.33 197 153 198.33 159 195 L 320 104', 'A link with the rounded connector was correctly rendered');

        var l2 = l0.clone().set('connector', { name: 'smooth' });
        this.graph.addCell(l2);
        assert.equal(this.graph.getLinks().length, 3, 'A link with the smooth connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l2).getConnection().round(2).serialize(), 'M 102 110 C 107.83 155.5 113.67 201 150 200 C 186.33 199 253.17 151.5 320 104', 'A link with the smooth connector was correctly rendered');

        var l3 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'non-existing' }});
        assert.throws(function() {
            this.graph.addCell(l3);
        }, /Invalid `cornerType` provided to `straight` connector/, 'Recognize invalid corner type of straight connector.');

        l3.set('connector', { name: 'straight' });
        this.graph.addCell(l3);
        assert.equal(this.graph.getLinks().length, 4, 'A link with the (default) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l3).getConnection().round(2).serialize(), 'M 102 110 L 150 200 L 320 104', 'A link with the (default) straight connector was correctly rendered');
        assert.checkDataPath(this.paper.findViewByModel(l3).getConnection().round(2).serialize(), this.paper.findViewByModel(l0).getConnection().round(2).serialize(), 'A link with the (default) straight connector was rendered same as if it had the normal connector');

        var l4 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'point' }});
        this.graph.addCell(l4);
        assert.equal(this.graph.getLinks().length, 5, 'A link with the (point) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l4).getConnection().round(2).serialize(), 'M 102 110 L 150 200 L 320 104', 'A link with the (point) straight connector was correctly rendered');
        assert.checkDataPath(this.paper.findViewByModel(l4).getConnection().round(2).serialize(), this.paper.findViewByModel(l0).getConnection().round(2).serialize(), 'A link with the (point) straight connector was rendered same as if it had the normal connector');

        var l5 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'cubic', precision: 0 }});
        this.graph.addCell(l5);
        assert.equal(this.graph.getLinks().length, 6, 'A link with the (cubic) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l5).getConnection().round(2).serialize(), 'M 102 110 L 145 191 C 148.33 197 153 198.33 159 195 L 320 104', 'A link with the (cubic) straight connector was correctly rendered');
        assert.checkDataPath(this.paper.findViewByModel(l5).getConnection().round(2).serialize(), this.paper.findViewByModel(l1).getConnection().round(2).serialize(), 'A link with the (cubic) straight connector was rendered same as if it had the rounded connector');

        var l6 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'line' }});
        this.graph.addCell(l6);
        assert.equal(this.graph.getLinks().length, 7, 'A link with the (line) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l6).getConnection().round(2).serialize(), 'M 102 110 L 145.3 191.2 L 158.7 195.1 L 320 104', 'A link with the (line) straight connector was correctly rendered');

        var l7 = l0.clone().set('connector', { name: 'straight', args: { cornerType: 'gap' }});
        this.graph.addCell(l7);
        assert.equal(this.graph.getLinks().length, 8, 'A link with the (gap) straight connector was successfully added to the graph');
        assert.checkDataPath(this.paper.findViewByModel(l7).getConnection().round(2).serialize(), 'M 102 110 L 145.3 191.2 M 158.7 195.1 L 320 104', 'A link with the (gap) straight connector was correctly rendered');

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
});

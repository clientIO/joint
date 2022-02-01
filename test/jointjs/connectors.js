QUnit.module('connectors', function(hooks) {

    hooks.beforeEach(function() {

        var $fixture = $('<div>', { id: 'qunit-fixture' }).appendTo(document.body);
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
            vertices: [{ x: 150, y: 200 }],
            connector: { name: 'non-existing' }
        });

        assert.throws(function() {

            this.graph.addCell(l0);

        }, /non-existing/, 'Recognize an unexisting connector.');

        l0.set('connector', { name: 'normal' });

        this.graph.addCell(l0);

        assert.equal(this.graph.getLinks().length, 1,
            'A link with the normal connector was succesfully added to the graph');

        var l1 = l0.clone().set('connector', { name: 'rounded' });

        this.graph.addCell(l1);

        assert.equal(this.graph.getLinks().length, 2,
            'A link with the rounded connector was succesfully added to the graph');

        var l2 = l0.clone().set('connector', { name: 'smooth' });

        this.graph.addCell(l2);

        assert.equal(this.graph.getLinks().length, 3,
            'A link with the smooth connector was succesfully added to the graph');

        var customCalled = 0;
        var l3 = l0.clone().set('connector', function() {
            customCalled += 1;
            return 'M 0 0';
        });

        this.graph.addCell(l3);

        assert.equal(customCalled, 1,
            'A link with the custom connector was succesfully added to the graph');

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
});

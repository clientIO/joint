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
        var r1 = new joint.shapes.basic.Rect({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: { name: 'curve' }
        });

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.$('.connection').attr('d');

        assert.checkDataPath(pathData, 'M 305 270 C 305 343.53910524340097 435 326.46089475659903 435 400', 'curve auto link was correctly rendered'); 
    });

    QUnit.test('curve connector direction auto with vertex', function(assert) {
        var r1 = new joint.shapes.basic.Rect({ position: { x: 200, y: 200 }, size: { width: 140, height: 70 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 400, y: 400 }, size: { width: 140, height: 70 }});

        var link = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id },
            connector: { name: 'curve' }
        });

        link.set('vertices', [new g.Point(400,200)]);

        this.graph.addCells([r1, r2, link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.$('.connection').attr('d');

        assert.checkDataPath(pathData, 'M 340 216 C 364.83867951401606 216 375.40626108556097 196.52034395257132 400 200 C 482.69881571505465 211.70067858405756 460 316.4775479287156 460 400', 'curve auto with vertex was correctly rendered'); 
    });

    QUnit.test('curve connector direction auto no element', function(assert) {
        var link = new joint.dia.Link({
            source: new g.Point(200, 200),
            target: new g.Point(100, 300),
            connector: { name: 'curve' }
        });

        this.graph.addCells([link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.$('.connection').attr('d');

        assert.checkDataPath(pathData, 'M 200 200 C 143.4314575050762 200 156.5685424949238 300 100 300', 'curve auto with no elements was correctly rendered'); 
    });

    QUnit.test('curve connector with custom directions', function(assert) {
        var link = new joint.dia.Link({
            source: new g.Point(200, 200),
            target: new g.Point(400, 400),
            connector: { 
                name: 'curve',
                args: {
                    sourceDirection: new g.Point(0.5, -0.5),
                    targetDirection: new g.Point(-0.5, 0.5)
                }
            }
        });

        this.graph.addCells([link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.$('.connection').attr('d');

        assert.checkDataPath(pathData, 'M 200 200 C 309.61921958772245 90.38078041227755 290.38078041227755 509.61921958772245 400 400', 'curve auto with custom directions was correctly rendered'); 
    });

    QUnit.test('curve connector with custom tangents', function(assert) {
        var link = new joint.dia.Link({
            source: new g.Point(200, 200),
            target: new g.Point(400, 400),
            connector: { 
                name: 'curve',
                args: {
                    sourceTangent: new g.Point(100, -50),
                    targetTangent: new g.Point(100, 100)
                }
            }
        });

        this.graph.addCells([link]);

        var linkView = this.paper.findViewByModel(link);
        var pathData = linkView.$('.connection').attr('d');

        assert.checkDataPath(pathData, 'M 200 200 C 266.6666666666667 166.66666666666666 466.6666666666667 466.6666666666667 400 400', 'curve auto with custom tangents was correctly rendered'); 
    });
});

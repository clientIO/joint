QUnit.module('embedding', function(hooks) {
    hooks.beforeEach(function() {

        var $fixture = $('<div>', { id: 'qunit-fixture' }).appendTo(document.body);
        var $paper = $('<div/>');
        $fixture.append($paper);

        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({
            el: $paper,
            gridSize: 1,
            model: this.graph,
            embeddingMode: true
        });
    });

    hooks.afterEach(function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });


    QUnit.test('sanity', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 500, y: 500 }, size: { width: 100, height: 100 }});

        this.graph.addCells([r1, r2]);

        var v1 = r1.findView(this.paper);
        var v2 = r2.findView(this.paper);

        this.paper.options.embeddingMode = false;

        var evt = { target: v1.el };
        v2.pointerdown(evt, 500, 500);
        v2.pointermove(evt, 100, 100);
        v2.pointerup(evt, 100, 100);

        assert.notEqual(r2.get('parent'), r1.id, 'embeddingMode disabled: element not embedded');

        this.paper.options.embeddingMode = true;
        r2.set('position', { x: 500, y: 500 });

        evt = { target: v1.el };
        v2.pointerdown(evt, 500, 500);
        v2.pointermove(evt, 100, 100);
        v2.pointerup(evt, 100, 100);

        assert.equal(r2.get('parent'), r1.id, 'embeddingMode enabled: element embedded');

        this.paper.options.validateEmbedding = function() {
            return false;
        };

        r1.unembed(r2);
        r2.set('position', { x: 500, y: 500 });
        evt = { target: v1.el };
        v2.pointerdown(evt, 500, 500);
        v2.pointermove(evt, 100, 100);
        v2.pointerup(evt, 100, 100);

        assert.notEqual(r2.get('parent'), r1.id, 'validating function denying all element pairs provided: element not embedded.');
    });

    QUnit.test('validateUnembedding option', function(assert) {

        var evt;
        var paper = this.paper;
        var graph = this.graph;
        var unembeddingIsValid = true;
        var validateUnembeddingSpy = sinon.spy(function() {
            return unembeddingIsValid;
        });

        paper.options.validateUnembedding = validateUnembeddingSpy;

        var r1 = new joint.shapes.standard.Rectangle({
            position: { x: 100, y: 101 },
            size: { width: 100, height: 100 }
        });
        var r2 = new joint.shapes.standard.Rectangle({
            position: { x: 500, y: 501 },
            size: { width: 100, height: 100 }
        });

        var l = new joint.shapes.standard.Link({
            target: { id: r2.id },
            z: -1
        });

        graph.addCells([r1, r2, l]);

        var v1 = r1.findView(paper);
        var v2 = r2.findView(paper);

        // Make sure validateUnembedding() is not called when embedding
        var newPosition0 = { x: 100, y: 101 };

        evt = { target: v1.el };
        v2.pointerdown(evt, r2.attributes.position.x, r2.attributes.position.y);
        v2.pointermove(evt, newPosition0.x, newPosition0.y);
        v2.pointerup(evt, newPosition0.x, newPosition0.y);

        assert.equal(r2.parent(), r1.id);
        assert.ok(validateUnembeddingSpy.notCalled);

        // Try To Unembed (Valid)
        unembeddingIsValid = true;
        var newPosition1 = { x: 300, y: 301 };

        evt = { target: paper.el };
        v2.pointerdown(evt, newPosition0.x, newPosition0.y);
        v2.pointermove(evt, newPosition1.x, newPosition1.y);
        v2.pointerup(evt, newPosition1.x, newPosition1.y);

        assert.ok(validateUnembeddingSpy.calledOnce);
        assert.ok(validateUnembeddingSpy.calledOn(paper));
        assert.ok(validateUnembeddingSpy.calledWithExactly(v2));
        assert.notOk(r2.isEmbeddedIn(r1));
        assert.notEqual(r2.parent(), r1.id);
        assert.deepEqual(r2.position().toJSON(), newPosition1);

        // Try To Unembed (Invalid)
        unembeddingIsValid = false;
        r1.embed(r2);
        var newPosition2 = { x: 600, y: 601 };

        var prevGraphJSON = graph.toJSON();

        evt = { target: paper.el };
        v2.pointerdown(evt, newPosition1.x, newPosition1.y);
        v2.pointermove(evt, newPosition2.x, newPosition2.y);
        v2.pointerup(evt, newPosition2.x, newPosition2.y);

        assert.ok(validateUnembeddingSpy.calledTwice);
        assert.ok(validateUnembeddingSpy.calledOn(paper));
        assert.ok(validateUnembeddingSpy.calledWithExactly(v2));
        // make sure the position and the parent are reverted
        assert.ok(r2.isEmbeddedIn(r1));
        assert.equal(r2.parent(), r1.id);
        assert.deepEqual(r2.position().toJSON(), newPosition1); // not newPosition2

        assert.deepEqual(prevGraphJSON, graph.toJSON());

        // Try to Unembedded (And remove when invalid)
        assert.ok(graph.getCell(r2.id));
        evt = { target: paper.el };
        v2.eventData(evt, { whenNotAllowed: 'remove' });
        v2.pointerdown(evt, newPosition1.x, newPosition1.y);
        v2.pointermove(evt, newPosition2.x, newPosition2.y);
        v2.pointerup(evt, newPosition2.x, newPosition2.y);

        assert.ok(validateUnembeddingSpy.calledThrice);
        assert.notOk(graph.getCell(r2.id));
    });

    QUnit.test('passing UI flag', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 500, y: 500 }, size: { width: 100, height: 100 }});
        var r3 = new joint.shapes.basic.Rect({ position: { x: 600, y: 600 }, size: { width: 100, height: 100 }});
        var l23 = new joint.dia.Link({ source: { id: r2.id }, target: { id: r3.id }});
        var l22 = new joint.dia.Link({ source: { id: r2.id }, target: { id: r2.id }});
        this.graph.addCells([r1, r2, r3, l23, l22]);

        var v2 = r2.findView(this.paper);

        this.paper.options.embeddingMode = true;

        var embedsCounter = 0;
        var parentCounter = 0;
        var zCounter = 0;

        this.graph.on('change:embeds', function(cell, embed, opt) {
            opt.ui && embedsCounter++;
        });
        this.graph.on('change:parent', function(cell, parent, opt) {
            opt.ui && parentCounter++;
        });
        this.graph.on('change:z', function(cell, z, opt) {
            opt.ui && zCounter++;
        });

        var evt = { target: v2.el };
        v2.pointerdown(evt, 500, 500);
        v2.pointermove(evt, 100, 100);
        v2.pointerup(evt, 100, 100);

        assert.deepEqual([embedsCounter, parentCounter, zCounter], [2, 2, 3], 'UI flags present (2 embedded, 2 reparented, 3 changed z-indexes).');
    });

    QUnit.test('findParentBy option', function(assert) {

        var data;
        var r1 = new joint.shapes.basic.Rect({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 }});

        this.graph.addCells([r1, r2]);

        var v2 = r2.findView(this.paper);

        this.paper.options.findParentBy = 'bbox';

        data = {};
        v2.prepareEmbedding(data);
        v2.processEmbedding(data);
        v2.finalizeEmbedding(data);

        assert.equal(r2.get('parent'), r1.id, 'parent found by bbox');

        r1.unembed(r2);

        this.paper.options.findParentBy = 'corner';

        data = {};
        v2.prepareEmbedding(data);
        v2.processEmbedding(data);
        v2.finalizeEmbedding(data);

        assert.equal(r2.get('parent'), r1.id, 'parent found by corner');

        r1.unembed(r2);

        this.paper.options.findParentBy = 'origin';

        data = {};
        v2.prepareEmbedding(data);
        v2.processEmbedding(data);
        v2.finalizeEmbedding(data);

        assert.notEqual(r2.get('parent'), r1.id, 'parent not found by origin');
    });

    QUnit.test('highlighting & unhighlighting', function(assert) {

        assert.expect(4);

        var r1 = new joint.shapes.basic.Rect({ position: { x: 0, y: 0 }, size: { width: 1000, height: 1000 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 }});

        this.graph.addCells([r1, r2]);

        var v2 = r2.findView(this.paper);

        this.paper.on('cell:highlight', function(cellView, el, opt) {
            assert.equal(cellView.model.id, r1.id, 'Highlight event triggered for correct element.');
            assert.ok(opt.embedding, 'And embedding flag is present.');
        });

        this.paper.on('cell:unhighlight', function(cellView, el, opt) {
            assert.equal(cellView.model.id, r1.id, 'Unhighlight event triggered for correct element.');
            assert.ok(opt.embedding, 'And embedding flag is present.');
        });

        var data = {};
        v2.prepareEmbedding(data);
        v2.processEmbedding(data);
        v2.finalizeEmbedding(data);

    });

    QUnit.test('frontParentOnly option', function(assert) {

        var data;
        var r1 = new joint.shapes.basic.Rect({ position: { x: 0, y: 0 }, size: { width: 200, height: 200 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 }});
        var r3 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 }});

        this.graph.addCells([r1, r2, r3]);

        var v3 = r3.findView(this.paper);

        this.paper.options.validateEmbedding = function(childView, parentView) {
            return parentView.model.id != r2.id;
        };

        this.paper.options.frontParentOnly = true;

        data = {};
        v3.prepareEmbedding(data);
        v3.processEmbedding(data);
        v3.finalizeEmbedding(data);

        assert.ok(!r3.get('parent'), 'disabled: parent on the bottom not found');

        this.paper.options.frontParentOnly = false;

        data = {};
        v3.prepareEmbedding(data);
        v3.processEmbedding(data);
        v3.finalizeEmbedding(data);

        assert.equal(r3.get('parent'), r1.id, 'enabled: parent on the bottom found');
    });


    QUnit.test('z-indexes', function(assert) {

        var graph = this.graph;
        var paper = this.paper;

        paper.options.embeddingMode = true;

        var r1 = new joint.shapes.standard.Rectangle({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 },
            z: 2
        });
        var r2 = new joint.shapes.standard.Rectangle({
            position: { x: 500, y: 500 },
            size: { width: 100, height: 100 },
            z: 3,
        });
        var r3 = new joint.shapes.standard.Rectangle({
            position: { x: 600, y: 600 },
            size: { width: 100, height: 100 },
            z: 4
        });
        var l23 = new joint.shapes.standard.Link({
            source: { id: r2.id },
            target: { id: r3.id },
            z: 0
        });
        var l22 = new joint.shapes.standard.Link({
            source: { id: r2.id },
            target: { id: r2.id },
            z: 1
        });

        graph.addCells([r1, r2, r3, l23, l22]);

        r1.embed(r2);

        var v1 = r1.findView(paper);

        var evt = { target: v1.el };
        v1.pointerdown(evt, 500, 500);
        v1.pointermove(evt, 100, 100);
        v1.pointerup(evt, 100, 100);

        var linksZIndex =[l23, l22].map(function(l) { return l.get('z'); });
        var elementZIndex = [r1, r2, r3].map(function(e) { return e.get('z'); });

        assert.ok(linksZIndex.every(function(linkZIndex) {
            return elementZIndex.every(function(elementZIndex) {
                return linkZIndex > elementZIndex;
            });
        }), 'All links were brought to front.');
    });

});

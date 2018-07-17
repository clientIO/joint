QUnit.module('embedding', function(hooks) {
    hooks.beforeEach(function() {

        var $fixture = $('#qunit-fixture');
        var $paper = $('<div/>');
        $fixture.append($paper);

        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({
            el: $paper,
            gridSize: 10,
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
});

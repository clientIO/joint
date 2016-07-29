module('embedding', {

    setup: function() {

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
    },

    teardown: function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    }
});

test('sanity', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 500, y: 500 }, size: { width: 100, height: 100 } });

    this.graph.addCells([r1, r2]);

    var v1 = r1.findView(this.paper);
    var v2 = r2.findView(this.paper);

    this.paper.options.embeddingMode = false;
    v2.pointerdown({ target: v1.el }, 500, 500);
    v2.pointermove({ target: v1.el }, 100, 100);
    v2.pointerup({ target: v1.el }, 100, 100);

    notEqual(r2.get('parent'), r1.id, 'embeddingMode disabled: element not embedded');

    this.paper.options.embeddingMode = true;
    r2.set('position', { x: 500, y: 500 });
    v2.pointerdown({ target: v1.el }, 500, 500);
    v2.pointermove({ target: v1.el }, 100, 100);
    v2.pointerup({ target: v1.el }, 100, 100);

    equal(r2.get('parent'), r1.id, 'embeddingMode enabled: element embedded');

    this.paper.options.validateEmbedding = function() { return false; };

    r1.unembed(r2);
    r2.set('position', { x: 500, y: 500 });
    v2.pointerdown({ target: v2.el }, 500, 500);
    v2.pointermove({ target: v2.el }, 100, 100);
    v2.pointerup({ target: v2.el }, 100, 100);

    notEqual(r2.get('parent'), r1.id, 'validating function denying all element pairs provided: element not embedded.');
});

test('passing UI flag', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 500, y: 500 }, size: { width: 100, height: 100 } });
    var r3 = new joint.shapes.basic.Rect({ position: { x: 600, y: 600 }, size: { width: 100, height: 100 } });
    var l23 = new joint.dia.Link({ source: { id: r2.id }, target: { id: r3.id } });
    var l22 = new joint.dia.Link({ source: { id: r2.id }, target: { id: r2.id } });
    this.graph.addCells([r1, r2, r3, l23, l22]);

    var v2 = r2.findView(this.paper);

    this.paper.options.embeddingMode = true;

    var embedsCounter = 0;
    var parentCounter = 0;
    var zCounter = 0;

    this.graph.on('change:embeds', function(cell, embed, opt) { opt.ui && embedsCounter++; });
    this.graph.on('change:parent', function(cell, parent, opt) { opt.ui && parentCounter++; });
    this.graph.on('change:z', function(cell, z, opt) { opt.ui && zCounter++; });

    v2.pointerdown({ target: v2.el }, 500, 500);
    v2.pointermove({ target: v2.el }, 100, 100);
    v2.pointerup({ target: v2.el }, 100, 100);

    deepEqual([embedsCounter, parentCounter, zCounter], [2, 2, 3], 'UI flags present (2 embedded, 2 reparented, 3 changed z-indexes).');
});

test('findParentBy option', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 } });

    this.graph.addCells([r1, r2]);

    var v2 = r2.findView(this.paper);

    this.paper.options.findParentBy = 'bbox';

    v2.prepareEmbedding();
    v2.processEmbedding();
    v2.finalizeEmbedding();

    equal(r2.get('parent'), r1.id, 'parent found by bbox');

    r1.unembed(r2);

    this.paper.options.findParentBy = 'corner';

    v2.prepareEmbedding();
    v2.processEmbedding();
    v2.finalizeEmbedding();

    equal(r2.get('parent'), r1.id, 'parent found by corner');

    r1.unembed(r2);

    this.paper.options.findParentBy = 'origin';

    v2.prepareEmbedding();
    v2.processEmbedding();
    v2.finalizeEmbedding();

    notEqual(r2.get('parent'), r1.id, 'parent not found by origin');
});

test('highlighting & unhighlighting', function() {

    expect(4);

    var r1 = new joint.shapes.basic.Rect({ position: { x: 0, y: 0 }, size: { width: 1000, height: 1000 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 } });

    this.graph.addCells([r1, r2]);

    var v2 = r2.findView(this.paper);

    this.paper.on('cell:highlight', function(cellView, el, opt) {
        equal(cellView.model.id, r1.id, 'Highlight event triggered for correct element.');
        ok(opt.embedding, 'And embedding flag is present.');
    });

    this.paper.on('cell:unhighlight', function(cellView, el, opt) {
        equal(cellView.model.id, r1.id, 'Unhighlight event triggered for correct element.');
        ok(opt.embedding, 'And embedding flag is present.');
    });

    v2.prepareEmbedding();
    v2.processEmbedding();
    v2.finalizeEmbedding();

});

test('frontParentOnly option', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 0, y: 0 }, size: { width: 200, height: 200 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 } });
    var r3 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 } });

    this.graph.addCells([r1, r2, r3]);

    var v3 = r3.findView(this.paper);

    this.paper.options.validateEmbedding = function(childView, parentView) {
        return parentView.model.id != r2.id;
    };

    this.paper.options.frontParentOnly = true;

    v3.prepareEmbedding();
    v3.processEmbedding();
    v3.finalizeEmbedding();

    ok(!r3.get('parent'), 'disabled: parent on the bottom not found');

    this.paper.options.frontParentOnly = false;

    v3.prepareEmbedding();
    v3.processEmbedding();
    v3.finalizeEmbedding();

    equal(r3.get('parent'), r1.id, 'enabled: parent on the bottom found');
});

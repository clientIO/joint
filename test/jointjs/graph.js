QUnit.module('graph', function(hooks) {

    hooks.beforeEach(function() {

        this.graph = new joint.dia.Graph;
    });

    hooks.afterEach(function() {

        this.graph = null;
    });

    this.setupTestMixtureGraph = function(graph) {
        // An example graph with many sources, sinks, embedded elements and pinned links.
        var a = new joint.shapes.basic.Rect({ id: 'a' }).addTo(graph); // e -> a -> b, c, d; parent of aa(aaa)
        var b = new joint.shapes.basic.Rect({ id: 'b' }).addTo(graph); // e -> b
        var c = new joint.shapes.basic.Rect({ id: 'c' }).addTo(graph); // a -> c
        var d = new joint.shapes.basic.Rect({ id: 'd' }).addTo(graph); // d -> e
        var e = new joint.shapes.basic.Rect({ id: 'e' }).addTo(graph); // d -> e -> a, b
        var f = new joint.shapes.basic.Rect({ id: 'f' }).addTo(graph); // f ->
        var g = new joint.shapes.basic.Rect({ id: 'g' }).addTo(graph); // -> g
        new joint.shapes.basic.Rect({ id: 'h' }).addTo(graph);

        new joint.dia.Link({ id: 'l1', source: { id: a.id }, target: { id: b.id }}).addTo(graph); // a -> b
        new joint.dia.Link({ id: 'l2', source: { id: a.id }, target: { id: c.id }}).addTo(graph); // a -> c
        new joint.dia.Link({ id: 'l3', source: { id: a.id }, target: { id: d.id }}).addTo(graph); // a -> d
        new joint.dia.Link({ id: 'l4', source: { id: d.id }, target: { id: e.id }}).addTo(graph); // d -> e
        new joint.dia.Link({ id: 'l5', source: { id: e.id }, target: { id: b.id }}).addTo(graph); // e -> b
        new joint.dia.Link({ id: 'l6', source: { id: e.id }, target: { id: a.id }}).addTo(graph); // e -> a
        new joint.dia.Link({ id: 'l7', source: { id: f.id }, target: { x: 50, y: 50 }}).addTo(graph); // f ->
        new joint.dia.Link({ id: 'l8', source: { x: 100, y: 100 }, target: { id: g.id }}).addTo(graph); // -> g
        new joint.dia.Link({ id: 'l9', source: { x: 200, y: 200 }, target: { x: 300, y: 300 }}).addTo(graph); // ->

        // Add hierarchy.
        var aa = new joint.shapes.basic.Rect({ id: 'aa' }).addTo(graph); // top -> aa; child of a, parent of aaa
        a.embed(aa);
        var aaa = new joint.shapes.basic.Rect({ id: 'aaa' }).addTo(graph); // top, aa -> aaa -> top; aaa -> aaa (loop); child of a(aa)
        aa.embed(aaa);
        var top = new joint.shapes.basic.Rect({ id: 'top' }).addTo(graph); // aaa -> top -> aaa
        new joint.dia.Link({ id: 'l10', source: { id: top.id }, target: { id: aa.id }}).addTo(graph); // top -> aa
        new joint.dia.Link({ id: 'l11', source: { id: top.id }, target: { id: aaa.id }}).addTo(graph); // top -> aaa
        new joint.dia.Link({ id: 'l12', source: { id: aaa.id }, target: { id: top.id }}).addTo(graph); // aaa -> top
        new joint.dia.Link({ id: 'l13', source: { id: aaa.id }, target: { id: aaa.id }}).addTo(graph); // aaa -> aaa
        new joint.dia.Link({ id: 'l14', source: { id: aa.id }, target: { id: aaa.id }}).addTo(graph); // aa -> aaa
    };

    this.setupTestTreeGraph = function(graph) {

        // make element
        function me(id) {
            return new joint.shapes.basic.Circle({ id: id, name: id }).addTo(graph);
        }

        // make link
        function ml(id, a, b) {
            var source = a.x ? a : { id: a.id };
            var target = b.x ? b : { id: b.id };
            return new joint.dia.Link({ id: id, source: source, target: target, name: id }).addTo(graph);
        }

        var a = me('a'); var b = me('b'); var c = me('c'); var d = me('d');
        var e = me('e'); var f = me('f'); var g = me('g'); var h = me('h');
        var i = me('i'); var j = me('j'); var k = me('k'); var l = me('l');
        var m = me('m'); var n = me('n'); var o = me('o'); var p = me('p');

        ml('l1', a, b);
        ml('l2', a, c);
        ml('l3', a, d);

        ml('l4', b, e);
        ml('l5', b, f);
        ml('l6', b, g);

        ml('l7', c, h);
        ml('l8', c, i);
        ml('l9', c, j);

        ml('l10', d, k);
        ml('l11', d, l);
        ml('l12', d, m);

        ml('l13', e, n);
        ml('l14', f, o);
        ml('l15', g, p);

        ml('l16', h, b);
        ml('l17', b, c);
    };

    this.setupTestNestedGraph = function(graph) {

        // make element
        function me(id) {
            return new joint.shapes.basic.Circle({ id: id, name: id }).addTo(graph);
        }

        // make link
        function ml(id, a, b) {
            var source = a.x ? a : { id: a.id };
            var target = b.x ? b : { id: b.id };
            return new joint.dia.Link({ id: id, source: source, target: target, name: id }).addTo(graph);
        }

        var a = me('a');
        var aa = me('aa');
        a.embed(aa);
        var aaa = me('aaa');
        aa.embed(aaa);
        var c = me('c');
        a.embed(c);
        var d = me('d');

        ml('l1', aa, c);
        var l2 = ml('l2', aa, aaa);
        aa.embed(l2);
        ml('l3', c, d);
    };

    QUnit.module('resetCells()', function(hooks) {

        var cells;

        hooks.beforeEach(function() {

            this.graph = new joint.dia.Graph;

            cells = [
                new joint.shapes.basic.Rect,
                new joint.shapes.basic.Rect,
                new joint.shapes.basic.Rect
            ];
        });

        QUnit.test('should return graph', function(assert) {

            var returned = this.graph.resetCells(cells);

            assert.deepEqual(returned, this.graph);
        });

        QUnit.test('resetCells(cell, cell ..)', function(assert) {

            var args = [].concat(cells);

            this.graph.resetCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length);
        });

        QUnit.test('resetCells(cell, cell .., opt)', function(assert) {

            var opt = {
                some: 'option'
            };

            var args = [].concat(cells).concat(opt);

            this.graph.resetCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length);
        });

        QUnit.test('resetCells(cells)', function(assert) {

            var args = [cells];

            this.graph.resetCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length);
        });

        QUnit.test('resetCells(cells, opt)', function(assert) {

            var opt = {
                some: 'option'
            };

            var args = [cells, opt];

            this.graph.resetCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length);
        });

        QUnit.test('should replace all cells', function(assert) {

            this.graph.addCells(cells);

            var newCells = [
                new joint.shapes.basic.Rect,
                new joint.shapes.basic.Rect
            ];

            this.graph.resetCells(newCells);

            var cellsAfter = this.graph.getCells();

            var allNewCellsExist = _.every(newCells, function(cell) {
                return !!_.find(cellsAfter, { id: cell.id });
            });

            var noOldCellsExist = _.every(cells, function(cell) {
                return !_.find(cellsAfter, { id: cell.id });
            });

            assert.ok(allNewCellsExist && noOldCellsExist);
        });
    });

    QUnit.module('addCells()', function(hooks) {

        var cells;

        hooks.beforeEach(function() {

            this.graph.resetCells([]);

            cells = [
                new joint.shapes.basic.Rect,
                new joint.shapes.basic.Rect,
                new joint.shapes.basic.Rect
            ];
        });

        QUnit.test('should return graph', function(assert) {

            var returned = this.graph.addCells(cells);

            assert.deepEqual(returned, this.graph);
        });

        QUnit.test('addCells(cell, cell ..)', function(assert) {

            var args = [].concat(cells);

            this.graph.addCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length);
        });

        QUnit.test('addCells(cell, cell .., opt)', function(assert) {

            var opt = {
                some: 'option'
            };

            var args = [].concat(cells).concat(opt);

            this.graph.addCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length);
        });

        QUnit.test('addCells(cells)', function(assert) {

            var args = [cells];

            this.graph.addCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length);
        });

        QUnit.test('addCells(cells, opt)', function(assert) {

            var opt = {
                some: 'option'
            };

            var args = [cells, opt];

            this.graph.addCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length);
        });
    });

    QUnit.module('removeCells()', function(hooks) {

        var cells;

        hooks.beforeEach(function() {

            cells = [
                new joint.shapes.basic.Rect,
                new joint.shapes.basic.Rect,
                new joint.shapes.basic.Rect
            ];

            this.graph.resetCells(cells);
        });

        QUnit.test('should return graph', function(assert) {

            var returned = this.graph.removeCells(cells);

            assert.deepEqual(returned, this.graph);
        });

        QUnit.test('removeCells(cell, cell ..)', function(assert) {

            var cellsToRemove = cells.slice(0, cells.length - 1);
            var args = [].concat(cellsToRemove);

            this.graph.removeCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length - cellsToRemove.length);
        });

        QUnit.test('removeCells(cell, cell .., opt)', function(assert) {

            var cellsToRemove = cells.slice(0, cells.length);
            var opt = {
                some: 'option'
            };

            var args = [].concat(cellsToRemove).concat(opt);

            this.graph.removeCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length - cellsToRemove.length);
        });

        QUnit.test('removeCells(cells)', function(assert) {

            var cellsToRemove = cells.slice(0, cells.length - 1);
            var args = [cellsToRemove];

            this.graph.removeCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length - cellsToRemove.length);
        });

        QUnit.test('removeCells(cells, opt)', function(assert) {

            var cellsToRemove = cells.slice(0, cells.length - 1);
            var opt = {
                some: 'option'
            };

            var args = [cellsToRemove, opt];

            this.graph.removeCells.apply(this.graph, args);

            assert.equal(this.graph.getCells().length, cells.length - cellsToRemove.length);
        });
    });

    QUnit.test('storing reference on models', function(assert) {

        var fromInstance = new joint.shapes.basic.Rect({ id: 'a' });
        var fromPlainObject = { id: 'b', type: 'basic.Rect' };

        var graph1 = this.graph;
        var graph2 = new joint.dia.Graph;

        graph1.addCell(fromInstance);
        graph1.addCell(fromPlainObject);

        assert.equal(
            graph1.getCell('a').graph,
            graph1,
            'The graph reference was stored on the model when created from an instance.'
        );

        assert.equal(
            graph1.getCell('b').graph,
            graph1,
            'The graph reference was stored on the model when created from a plain JS object.'
        );

        var a = graph1.getCell('a');
        var b = graph1.getCell('b');

        a.remove();
        assert.ok(a.graph === null, 'The graph reference is nulled when the model is removed from the graph.');

        graph2.addCell(a);
        assert.equal(
            a.graph,
            graph2,
            'The graph reference was stored after the element was added to a graph.'
        );

        graph2.addCell(b);
        assert.equal(
            b.graph,
            graph1,
            'The graph reference was not stored after the model was added to a graph while it\'s still member of another graph.'
        );

        // Dry mode

        b.remove();
        graph1.addCell(b, { dry: true });
        assert.ok(b.graph === null, 'The graph reference is not stored after element added when the `dry` flag is passed.');

        graph1.resetCells([b], { dry: true });
        assert.ok(b.graph === null, 'The graph reference is not stored after graph reset when the `dry` flag is passed.');
    });

    QUnit.test('graph.clear()', function(assert) {

        var graph = this.graph;
        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;
        var r3 = new joint.shapes.basic.Rect;
        var r4 = new joint.shapes.basic.Rect;
        var l1 = new joint.shapes.basic.Rect({ source: { id: r1.id }, target: { id: r2.id }});
        var l2 = new joint.shapes.basic.Rect({ source: { id: r2.id }, target: { id: r3.id }});
        var l3 = new joint.shapes.basic.Rect({ source: { id: r2.id }, target: { id: r4.id }});

        graph.addCells([r1, r2, l1, r3, l2, r4]);
        r3.embed(r2);
        r3.embed(l3);

        graph.clear();

        assert.equal(graph.getCells().length, 0, 'all the links and elements (even embeddes) were removed.');
        assert.equal(graph.get('cells').length, 0, 'collection length is exactly 0 (Backbone v1.2.1 was showing negative values.)');
    });

    QUnit.test('graph.getCells(), graph.getLinks(), graph.getElements()', function(assert) {

        var graph = this.graph;
        var r1 = new joint.shapes.basic.Rect({ id: 'r1' });
        var r2 = new joint.shapes.basic.Rect({ id: 'r2' });
        var l1 = new joint.dia.Link({ id: 'l1' });

        graph.addCells([r1, r2, l1]);

        assert.deepEqual(_.map(graph.getCells(), 'id'), ['r1', 'r2', 'l1'],
            'getCells() returns all the cells in the graph.');
        assert.deepEqual(_.map(graph.getLinks(), 'id'), ['l1'],
            'getLinks() returns only the link in the graph.');
        assert.deepEqual(_.map(graph.getElements(), 'id'), ['r1', 'r2'],
            'getElements() returns only the elements in the graph');
    });

    QUnit.test('graph.getCommonAncestor()', function(assert) {

        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;
        var r3 = new joint.shapes.basic.Rect;
        var r4 = new joint.shapes.basic.Rect;
        var r5 = new joint.shapes.basic.Rect;
        var r6 = new joint.shapes.basic.Rect;
        var r7 = new joint.shapes.basic.Rect;

        this.graph.addCells([r1, r2, r3, r4, r5, r6, r7]);

        r1.embed(r2.embed(r4).embed(r5)).embed(r3.embed(r6));

        assert.ok(!this.graph.getCommonAncestor(), 'r1 embeds r2 and r3. r2 embeds r4 and r5. r3 embeds r6. r1 and r7 have no parents. Calling getCommonAncestor() returns no common ancestor.');
        assert.equal((this.graph.getCommonAncestor(r2) || {}).id, r1.id, 'Common ancestor for r2 is r1.');
        assert.equal((this.graph.getCommonAncestor(r2, r3) || {}).id, r1.id, 'Common ancestor for r2 and r3 is r1.');
        assert.equal((this.graph.getCommonAncestor(r2, r3, r4) || {}).id, r1.id, 'Common ancestor for r2, r3 and r4 is r1');
        assert.notOk(this.graph.getCommonAncestor(r2, r3, r7), 'There is no common ancestor for r2, r3 and r5');
        assert.notOk(this.graph.getCommonAncestor(r2, r3, r1), 'There is no common ancestor for r2, r3 and r1');
        assert.equal((this.graph.getCommonAncestor(r5, r4) || {}).id, r2.id, 'Common ancestor for r5 and r4 is r2');
        assert.equal((this.graph.getCommonAncestor(r5, r6) || {}).id, r1.id, 'Common ancestor for r5 and r6 is r1');
    });

    QUnit.test('graph.getConnectedLinks()', function(assert) {

        var graph = this.graph;
        this.setupTestMixtureGraph(graph);

        // SHALLOW LINKS:
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a')), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l6']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l6']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { outbound: true }), 'id')), _.sortBy(['l1', 'l2', 'l3']), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { inbound: true }), 'id')), _.sortBy(['l6']), 'getConnectedLinks() returns all the connected links to an element.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('b')), 'id')), _.sortBy(['l1', 'l5']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('b'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l1', 'l5']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('b'), { outbound: true }), 'id')), _.sortBy([]), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('b'), { inbound: true }), 'id')), _.sortBy(['l1', 'l5']), 'getConnectedLinks() returns all the connected links to an element.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('c')), 'id')), _.sortBy(['l2']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('c'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l2']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('c'), { outbound: true }), 'id')), _.sortBy([]), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('c'), { inbound: true }), 'id')), _.sortBy(['l2']), 'getConnectedLinks() returns all the connected links to an element.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('d')), 'id')), _.sortBy(['l3', 'l4']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('d'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l3', 'l4']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('d'), { outbound: true }), 'id')), _.sortBy(['l4']), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('d'), { inbound: true }), 'id')), _.sortBy(['l3']), 'getConnectedLinks() returns all the connected links to an element.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('e')), 'id')), _.sortBy(['l4', 'l5', 'l6']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('e'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l4', 'l5', 'l6']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('e'), { outbound: true }), 'id')), _.sortBy(['l5', 'l6']), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('e'), { inbound: true }), 'id')), _.sortBy(['l4']), 'getConnectedLinks() returns all the connected links to an element.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('f')), 'id')), _.sortBy(['l7']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('f'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l7']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('f'), { outbound: true }), 'id')), _.sortBy(['l7']), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('f'), { inbound: true }), 'id')), _.sortBy([]), 'getConnectedLinks() returns all the connected links to an element.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('g')), 'id')), _.sortBy(['l8']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('g'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l8']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('g'), { outbound: true }), 'id')), _.sortBy([]), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('g'), { inbound: true }), 'id')), _.sortBy(['l8']), 'getConnectedLinks() returns all the connected links to an element.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('h')), 'id')), _.sortBy([]), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('h'), { inbound: true, outbound: true }), 'id')), _.sortBy([]), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('h'), { outbound: true }), 'id')), _.sortBy([]), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('h'), { inbound: true }), 'id')), _.sortBy([]), 'getConnectedLinks() returns all the connected links to an element.');

        // (include connection to child)
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa')), 'id')), _.sortBy(['l10', 'l14']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l10', 'l14']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { outbound: true }), 'id')), _.sortBy(['l14']), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { inbound: true }), 'id')), _.sortBy(['l10']), 'getConnectedLinks() returns all the connected links to an element.');

        // (include shallow loop)
        // (include connection from parent)
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa')), 'id')), _.sortBy(['l11', 'l12', 'l13', 'l14']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l11', 'l12', 'l13', 'l14']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { outbound: true }), 'id')), _.sortBy(['l12', 'l13']), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { inbound: true }), 'id')), _.sortBy(['l11', 'l13', 'l14']), 'getConnectedLinks() returns all the connected links to an element.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('top')), 'id')), _.sortBy(['l10', 'l11', 'l12']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('top'), { inbound: true, outbound: true }), 'id')), _.sortBy(['l10', 'l11', 'l12']), 'getConnectedLinks() returns all the connected links to/from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('top'), { outbound: true }), 'id')), _.sortBy(['l10', 'l11']), 'getConnectedLinks() returns all the connected links from an element.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('top'), { inbound: true }), 'id')), _.sortBy(['l12']), 'getConnectedLinks() returns all the connected links to an element.');


        // DEEP LINKS, EXCEPT COMPLETELY ENCLOSED LINKS:
        // (do not include enclosed parent-child connection)
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l6', 'l10', 'l11', 'l12']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, inbound: true, outbound: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l6', 'l10', 'l11', 'l12']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, outbound: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l12']), 'deep getConnectedLinks() returns all the connected links from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, inbound: true }), 'id')), _.sortBy(['l6', 'l10', 'l11']), 'deep getConnectedLinks() returns all the connected links to an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, includeEnclosed: false }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l6', 'l10', 'l11', 'l12']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, includeEnclosed: false, inbound: true, outbound: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l6', 'l10', 'l11', 'l12']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, includeEnclosed: false, outbound: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l12']), 'deep getConnectedLinks() returns all the connected links from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, includeEnclosed: false, inbound: true }), 'id')), _.sortBy(['l6', 'l10', 'l11']), 'deep getConnectedLinks() returns all the connected links to an element, except enclosed links.');

        // (include connection to child)
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true }), 'id')), _.sortBy(['l10', 'l11', 'l12', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, inbound: true, outbound: true }), 'id')), _.sortBy(['l10', 'l11', 'l12', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, outbound: true }), 'id')), _.sortBy(['l12', 'l14']), 'deep getConnectedLinks() returns all the connected links from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, inbound: true }), 'id')), _.sortBy(['l10', 'l11', 'l14']), 'deep getConnectedLinks() returns all the connected links to an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, includeEnclosed: false }), 'id')), _.sortBy(['l10', 'l11', 'l12', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, includeEnclosed: false, inbound: true, outbound: true }), 'id')), _.sortBy(['l10', 'l11', 'l12', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, includeEnclosed: false, outbound: true }), 'id')), _.sortBy(['l12', 'l14']), 'deep getConnectedLinks() returns all the connected links from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, includeEnclosed: false, inbound: true }), 'id')), _.sortBy(['l10', 'l11', 'l14']), 'deep getConnectedLinks() returns all the connected links to an element, except enclosed links.');

        // (include shallow loop)
        // (include connection from parent)
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true }), 'id')), _.sortBy(['l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, inbound: true, outbound: true }), 'id')), _.sortBy(['l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, outbound: true }), 'id')), _.sortBy(['l12', 'l13']), 'deep getConnectedLinks() returns all the connected links from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, inbound: true }), 'id')), _.sortBy(['l11', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, includeEnclosed: false }), 'id')), _.sortBy(['l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, includeEnclosed: false, inbound: true, outbound: true }), 'id')), _.sortBy(['l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, includeEnclosed: false, outbound: true }), 'id')), _.sortBy(['l12', 'l13']), 'deep getConnectedLinks() returns all the connected links from an element, except enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, includeEnclosed: false, inbound: true }), 'id')), _.sortBy(['l11', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to an element, except enclosed links.');


        // DEEP LINKS, INCLUDING COMPLETELY ENCLOSED LINKS:
        // (include enclosed parent-child connection)
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, includeEnclosed: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l6', 'l10', 'l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, includeEnclosed: true, inbound: true, outbound: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l6', 'l10', 'l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, includeEnclosed: true, outbound: true }), 'id')), _.sortBy(['l1', 'l2', 'l3', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('a'), { deep: true, includeEnclosed: true, inbound: true }), 'id')), _.sortBy(['l6', 'l10', 'l11', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to an element, including enclosed links.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, includeEnclosed: true }), 'id')), _.sortBy(['l10', 'l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, includeEnclosed: true, inbound: true, outbound: true }), 'id')), _.sortBy(['l10', 'l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, includeEnclosed: true, outbound: true }), 'id')), _.sortBy(['l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aa'), { deep: true, includeEnclosed: true, inbound: true }), 'id')), _.sortBy(['l10', 'l11', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to an element, including enclosed links.');

        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, includeEnclosed: true }), 'id')), _.sortBy(['l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, includeEnclosed: true, inbound: true, outbound: true }), 'id')), _.sortBy(['l11', 'l12', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to/from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, includeEnclosed: true, outbound: true }), 'id')), _.sortBy(['l12', 'l13']), 'deep getConnectedLinks() returns all the connected links from an element, including enclosed links.');
        assert.deepEqual(_.sortBy(_.map(graph.getConnectedLinks(graph.getCell('aaa'), { deep: true, includeEnclosed: true, inbound: true }), 'id')), _.sortBy(['l11', 'l13', 'l14']), 'deep getConnectedLinks() returns all the connected links to an element, including enclosed links.');
    });

    QUnit.test('graph.getSources(), graph.getSinks(), isSource(), isSink()', function(assert) {

        var graph = this.graph;
        this.setupTestMixtureGraph(graph);

        assert.deepEqual(_.sortBy(_.map(graph.getSources(), 'id')), _.sortBy(['f', 'h']), 'getSources() returns all the root elements of the graph.');
        assert.deepEqual(_.sortBy(_.map(graph.getSinks(), 'id')), _.sortBy(['b', 'c', 'g', 'h']), 'getSinks() returns all the leaf elements of the graph.');
        assert.equal(graph.isSink(graph.getCell('c')), true, 'isSink() returns true for a root element.');
        assert.equal(graph.isSink(graph.getCell('a')), false, 'isSink() returns false for a non-root element.');
        assert.equal(graph.isSource(graph.getCell('f')), true, 'isSource() returns true for a leaf element.');
        assert.equal(graph.isSource(graph.getCell('a')), false, 'isSource() returns false for a non-leaf element.');

        // Test for remove - and if emptiness of the internal _in/_out is checked.
        graph.clear();

        new joint.shapes.basic.Rect({ id: 'el1' }).addTo(graph);
        new joint.shapes.basic.Rect({ id: 'el2' }).addTo(graph);
        var l1 = new joint.dia.Link({ id: 'l1', source: { id: 'el1' }, target: { id: 'el2' }}).addTo(graph);

        var sinks = graph.getSinks();
        assert.equal(sinks.length, 1, 'only one sink is in the graph');
        assert.equal(sinks[0].id, 'el2', 'that one sink is what we expect');

        var sources = graph.getSources();
        assert.equal(sources.length, 1, 'only one source is in the graph');
        assert.equal(sources[0].id, 'el1', 'that one source is what we expect');

        l1.remove();

        sinks = graph.getSinks();
        assert.equal(sinks.length, 2, 'now we have two sinks in the graph');
        assert.deepEqual(_.map(sinks, 'id').sort(), ['el1', 'el2'], 'both sinks are what we expect');

        sources = graph.getSources();
        assert.equal(sources.length, 2, 'now we have two sources in the graph');
        assert.deepEqual(_.map(sources, 'id').sort(), ['el1', 'el2'], 'both sources are what we expect');
    });

    QUnit.test('graph.getSuccessors(), graph.isSuccessor()', function(assert) {

        var graph = this.graph;

        this.setupTestTreeGraph(graph);

        assert.deepEqual(_.map(graph.getSuccessors(graph.getCell('b')), 'id'), ['e', 'n', 'f', 'o', 'g', 'p', 'c', 'h', 'i', 'j'], 'getSuccessors() returns successors of an element in DFS order by default');
        assert.deepEqual(_.map(graph.getSuccessors(graph.getCell('b'), { breadthFirst: true }), 'id'), ['e', 'f', 'g', 'c', 'n', 'o', 'p', 'h', 'i', 'j'], 'getSuccessors() returns successors of an element in BFS order if breadthFirst option is true');
        assert.deepEqual(_.map(graph.getSuccessors(graph.getCell('n')), 'id'), [], 'getSuccessors() returns an empty array for a leaf element');
        assert.equal(graph.isSuccessor(graph.getCell('b'), graph.getCell('o')), true, 'isSuccessor() returns true if the element in second argument is a successor of the element in the first argument');
        assert.equal(graph.isSuccessor(graph.getCell('b'), graph.getCell('a')), false, 'isSuccessor() returns false if the element in second argument is not a successor of the element in the first argument');
        assert.equal(graph.isSuccessor(graph.getCell('b'), graph.getCell('b')), false, 'isSuccessor() returns false if the element in second argument is the same as the element in the first argument');
    });

    QUnit.test('graph.getPredecessors(), graph.isPredecessor()', function(assert) {

        var graph = this.graph;

        this.setupTestTreeGraph(graph);

        assert.deepEqual(_.map(graph.getPredecessors(graph.getCell('g')), 'id'), ['b', 'a', 'h', 'c'], 'getPredecessors() returns predecessors of an element in DFS order by default');
        assert.deepEqual(_.map(graph.getPredecessors(graph.getCell('a')), 'id'), [], 'getPredecessors() returns an empty array for a root element');
        assert.equal(graph.isPredecessor(graph.getCell('g'), graph.getCell('c')), true, 'isPredecessor() returns true if the element in second argument is a successor of the element in the first argument');
        assert.equal(graph.isPredecessor(graph.getCell('g'), graph.getCell('e')), false, 'isPredecessor() returns false if the element in second argument is not a successor of the element in the first argument');
        assert.equal(graph.isPredecessor(graph.getCell('g'), graph.getCell('g')), false, 'isPredecessor() returns false if the element in second argument is the same as the element in the first argument');
    });

    QUnit.test('graph.bfs(), graph.dfs()', function(assert) {

        var graph = this.graph;
        var bfs, dfs;

        this.setupTestTreeGraph(graph);

        bfs = [];
        graph.bfs(graph.getCell('c'), function(element, distance) { bfs.push([element.id, distance]); }, { outbound: true });
        dfs = [];
        graph.dfs(graph.getCell('c'), function(element, distance) { dfs.push([element.id, distance]); }, { outbound: true });

        assert.deepEqual(bfs, [['c', 0], ['h', 1], ['i', 1], ['j', 1], ['b', 2], ['e', 3], ['f', 3], ['g', 3], ['n', 4], ['o', 4], ['p', 4]], 'bfs() returns elements in a correct order with correct distance');
        assert.deepEqual(dfs, [['c', 0], ['h', 1], ['b', 2], ['e', 3], ['n', 4], ['f', 3], ['o', 4], ['g', 3], ['p', 4], ['i', 1], ['j', 1]], 'dfs() returns elements in a correct order with correct distance');

        bfs = [];
        graph.bfs(graph.getCell('c'), function(element, distance) { if (distance > 1) return false; bfs.push([element.id, distance]); }, { outbound: true });
        dfs = [];
        graph.dfs(graph.getCell('c'), function(element, distance) { if (element.id === 'b') return false; dfs.push([element.id, distance]); }, { outbound: true });

        assert.deepEqual(bfs, [['c', 0], ['h', 1], ['i', 1], ['j', 1]], 'bfs() correctly stopped when iteratee returned false');
        assert.deepEqual(dfs, [['c', 0], ['h', 1], ['i', 1], ['j', 1]], 'dfs() correctly stopped when iteratee returned false');
    });

    QUnit.test('graph.cloneCells()', function(assert) {

        var graph = this.graph;
        this.setupTestTreeGraph(graph);

        var clones = graph.cloneCells([graph.getCell('d')].concat(graph.getSuccessors(graph.getCell('d'))));
        assert.deepEqual(_.map(clones, function(c) { return c.get('name'); }), ['d', 'k', 'l', 'm'], 'cloneCells() returns cloned elements without connected links');
        assert.ok(_.isObject(clones), 'returned clone map is an object');
        assert.equal(clones['d'].get('name'), 'd', 'returned clone map maps original ID to the clone');
        assert.notEqual(clones['d'].id, 'd', 'returned clone map maps original ID to the clone');
    });

    QUnit.test('graph.cloneSubgraph()', function(assert) {

        var graph = this.graph;
        this.setupTestTreeGraph(graph);

        var clones = graph.cloneSubgraph([graph.getCell('d')].concat(graph.getSuccessors(graph.getCell('d'))));
        assert.deepEqual(_.map(clones, function(c) {return c.get('name'); }), ['d', 'k', 'l', 'm', 'l10', 'l11', 'l12'], 'cloneSubgraph() returns cloned elements including connected links');
    });

    QUnit.test('graph.getSubgraph()', function(assert) {

        var graph = this.graph;
        this.setupTestTreeGraph(graph);

        var subgraph = graph.getSubgraph([graph.getCell('d')].concat(graph.getSuccessors(graph.getCell('d'))));
        assert.deepEqual(_.map(subgraph, 'id'), ['d', 'k', 'l', 'm', 'l10', 'l11', 'l12'], 'getSubgraph() returns elements including links that are connected to any element passed as argument');

        graph.clear();
        this.setupTestNestedGraph(graph);

        subgraph = graph.getSubgraph([graph.getCell('a')], { deep: false });
        assert.deepEqual(_.map(subgraph, 'id'), ['a'], 'getSubgraph() returns only the one element if deep is false');

        subgraph = graph.getSubgraph([graph.getCell('a')], { deep: true });
        assert.deepEqual(_.map(subgraph, 'id'), ['a', 'aa', 'c', 'l2', 'aaa', 'l1'], 'getSubgraph() returns all the embedded elements and all the links that connect these elements');
    });

    QUnit.test('graph.fetch()', function(assert) {

        var json = JSON.parse('{"cells":[{"type":"basic.Circle","size":{"width":100,"height":60},"position":{"x":110,"y":480},"id":"bbb9e641-9756-4f42-997a-f4818b89f374","embeds":"","z":0},{"type":"link","source":{"id":"bbb9e641-9756-4f42-997a-f4818b89f374"},"target":{"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6"},"id":"b4289c08-07ea-49d2-8dde-e67eb2f2a06a","z":1},{"type":"basic.Rect","position":{"x":420,"y":410},"size":{"width":100,"height":60},"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6","embeds":"","z":2}]}');

        var ajaxStub = sinon.stub($, 'ajax').yieldsTo('success', json);

        this.graph.url = 'test.url';
        this.graph.fetch();

        assert.equal(this.graph.getElements().length, 2, 'all the element were fetched.');
        assert.equal(this.graph.getLinks().length, 1, 'all the links were fetched.');

        ajaxStub.restore();
    });

    QUnit.test('graph.getCellsBBox()', function(assert) {

        var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 20, height: 20 }});
        var r2 = new joint.shapes.basic.Rect({ position: { x: 100, y: 200 }, size: { width: 20, height: 20 }});
        var r3 = new joint.shapes.basic.Rect({ position: { x: 20, y: 10 }, size: { width: 20, height: 20 }});

        this.graph.resetCells([r1, r2, r3]);

        var bbox = this.graph.getCellsBBox([r1, r2, r3]);
        assert.equal(bbox.x, 20, 'bbox.x correct');
        assert.equal(bbox.y, 10, 'bbox.y correct');
        assert.equal(bbox.width, 100, 'bbox.width correct');
        assert.equal(bbox.height, 210, 'bbox.height correct');

        assert.equal(this.graph.getCellsBBox([]), null, 'graph.getBBox([]) with empty array returns null');

        var l = new joint.dia.Link();
        this.graph.addCell(l);
        assert.equal(this.graph.getCellsBBox([l]), null, 'graph.getBBox() with links only returns null');
    });

    QUnit.test('graph.findModelsUnderElement()', function(assert) {

        var rect = new joint.shapes.basic.Rect({
            size: { width: 100, height: 100 },
            position: { x: 100, y: 100 }
        });

        var under = rect.clone();
        var away = rect.clone().translate(200, 200);

        this.graph.addCells([rect, under, away]);

        assert.deepEqual(this.graph.findModelsUnderElement(away), [], 'There are no models under the element.');
        assert.deepEqual(this.graph.findModelsUnderElement(rect), [under], 'There is a model under the element.');

        under.translate(50, 50);

        assert.deepEqual(this.graph.findModelsUnderElement(rect, { searchBy: 'origin' }), [], 'There is no model under the element if searchBy origin option used.');
        assert.deepEqual(this.graph.findModelsUnderElement(rect, { searchBy: 'corner' }), [under], 'There is a model under the element if searchBy corner options used.');

        var embedded = rect.clone().addTo(this.graph);
        rect.embed(embedded);

        assert.deepEqual(this.graph.findModelsUnderElement(rect), [under], 'There is 1 model under the element found and 1 embedded element is omitted.');
        assert.deepEqual(this.graph.findModelsUnderElement(under), [rect, embedded], 'There are 2 models under the element. Parent and its embed.');
        assert.deepEqual(this.graph.findModelsUnderElement(embedded), [rect, under], 'There are 2 models under the element. The element\'s parent and one other element.');
    });

    QUnit.test('graph.options: cellNamespace', function(assert) {

        var elementJSON = { id: 'a', type: 'elements.Element' };
        var linkJSON = { id: 'b', type: 'link' };
        var nonExistingJSON = { id: 'c', type: 'elements.NonExisting' };

        var graph = new joint.dia.Graph({}, {
            cellNamespace: {
                elements: { Element: joint.shapes.basic.Rect }
            }
        });

        graph.addCell(elementJSON);
        var element = graph.getCell('a');
        assert.equal(element.constructor, joint.shapes.basic.Rect,
            'The class was found in the custom namespace based on the type provided.');

        graph.addCell(linkJSON);
        var link = graph.getCell('b');
        assert.equal(link.constructor, joint.dia.Link,
            'The default link model is created when type equals "link".');

        graph.addCell(nonExistingJSON);
        var nonExisting = graph.getCell('c');
        assert.equal(nonExisting.constructor, joint.dia.Element,
            'If there is no class based on the type in the namespace, the default element model is used.');

    });

    QUnit.test('graph.getNeighbors(), graph.isNeighbor()', function(assert) {

        var graph = this.graph;
        var Element = joint.shapes.basic.Rect;
        var Link = joint.dia.Link;

        function neighbors(el, opt) { return _.chain(graph.getNeighbors(el, opt)).map('id').sortBy().value(); }

        var r1 = new Element({ id: 'R1' });
        var r2 = new Element({ id: 'R2' });
        var r3 = new Element({ id: 'R3' });
        var r4 = new Element({ id: 'R4' });
        var r5 = new Element({ id: 'R5' });
        var r6 = new Element({ id: 'R6' });
        var l1 = new Link({ id: 'L1' });
        var l2 = new Link({ id: 'L2' });
        var l3 = new Link({ id: 'L3' });
        var l4 = new Link({ id: 'L4' });

        graph.addCells([r1, r2, r3, r4, r5, r6, l1, l2]);
        l1.set('source', { id: 'R1' }).set('target', { id: 'R2' });
        l2.set('source', { id: 'R2' }).set('target', { id: 'R3' });

        //
        // [R1] --L1--> [R2] --L2--> [R3]
        //
        // [R4]
        //

        assert.deepEqual(neighbors(r4), [], 'Returns an empty array if the element has no neighbors.');
        assert.deepEqual(neighbors(r1), ['R2'], 'Element has only outbound link. The neighbor was found.');
        assert.deepEqual(neighbors(r3), ['R2'], 'Element has only inbound link. The neighbor was found.');
        assert.deepEqual(neighbors(r2), ['R1', 'R3'], 'Element has both outbound an inbound links. The neighbors were found.');
        assert.equal(graph.isNeighbor(r2, r3), true, 'isNeighbor() returns true if the element in the second argument is a neighbor of the element in the first argument');
        assert.equal(graph.isNeighbor(r3, r2), true, 'isNeighbor() returns true if the element in the second argument is a neighbor of the element in the first argument');
        assert.equal(graph.isNeighbor(r1, r3), false, 'isNeighbor() returns true if the element in the second argument is not a neighbor of the element in the first argument');
        assert.equal(graph.isNeighbor(r3, r1), false, 'isNeighbor() returns false if the element in the second argument is not a neighbor of the element in the first argument');
        assert.equal(graph.isNeighbor(r2, r3, { outbound: true }), true, 'isNeighbor() with outbound true');
        assert.equal(graph.isNeighbor(r3, r2, { outbound: true }), false, 'isNeighbor() with outbound true');
        assert.equal(graph.isNeighbor(r2, r3, { inbound: true }), false, 'isNeighbor() with inbound true');
        assert.equal(graph.isNeighbor(r3, r2, { inbound: true }), true, 'isNeighbor() with inbound true');

        graph.addCells([l3]);
        l3.set('source', { id: 'R2' }).set('target', { id: 'R4' });
        //
        //                     L2--> [R3]
        //                     |
        // [R1] --L1--> [R2] --|
        //                     |
        //                     L3--> [R4]
        //

        assert.deepEqual(neighbors(r2, { inbound: true }), ['R1'], 'The inbound links were found.');
        assert.deepEqual(neighbors(r2, { outbound: true }), ['R3', 'R4'], 'The outbound links were found.');

        graph.addCells([l4]);
        l1.set('source', { id: 'R1' }).set('target', { id: 'R2' });
        l2.set('source', { id: 'R2' }).set('target', { id: 'R3' });
        l3.set('source', { id: 'R2' }).set('target', { id: 'R3' });
        l4.set('source', { id: 'R1' }).set('target', { id: 'R2' });
        //
        // [R1] --L1, L4--> [R2] --L2, L3--> [R3]
        //

        assert.deepEqual(neighbors(r2), ['R1', 'R3'], 'There are no duplicates in the result.');

        l1.set('source', { id: 'R1' }).set('target', { id: 'R1' });
        l2.remove();
        l3.remove();
        l4.set('source', { id: 'R1' }).set('target', { id: 'R1' });
        //  [R1] <--L1, L4
        //    |       |
        //     -------

        assert.deepEqual(neighbors(r1), ['R1'], 'Being a self-neighbor is detected.');
        assert.equal(graph.isNeighbor(r1, r1), true, 'Being a self-neighbor is detected in isNeighbor().');

        graph.addCells([l2, l3]);
        r1.embed(r2);
        l1.set('source', { id: 'R1' }).set('target', { id: 'R3' });
        l2.set('source', { id: 'R5' }).set('target', { id: 'R1' });
        l3.set('source', { id: 'R2' }).set('target', { id: 'R4' });
        l4.set('source', { id: 'R6' }).set('target', { id: 'R2' });
        //
        // ░░░░░░░░░░░<-L2-- [R5]
        // ░R1░░░░░░░░--L1-> [R3]
        // ░░░░▓▓▓▓▓▓▓
        // ░░░░▓▓▓R2▓▓--L3-> [R4]
        // ░░░░▓▓▓▓▓▓▓<-L4-- [R6]

        assert.deepEqual(neighbors(r1), ['R3', 'R5'], 'Embedded elements are not taken into account by default.');
        assert.deepEqual(neighbors(r2), ['R4', 'R6'], 'Parent elements are not taken into account by default.');
        assert.deepEqual(neighbors(r1, { deep: true }), ['R3', 'R4', 'R5', 'R6'], 'The neighbours of the element and all its embdes were found in the deep mode. But not the embdes themselves.');
        assert.deepEqual(neighbors(r2, { deep: true }), ['R4', 'R6'], 'Parent elements are not taken into account in the deep mode.');
        assert.deepEqual(neighbors(r1, { deep: true, outbound: true }), ['R3', 'R4'], 'The outbound neighbours of the element and all its embdes were found in the deep mode.');
        assert.deepEqual(neighbors(r1, { deep: true, inbound: true }), ['R5', 'R6'], 'The inbound neighbours of the element and all its embdes were found in the deep mode.');
        assert.equal(graph.isNeighbor(r1, r4, { deep: true }), true, 'isNeighbor() with deep true takes into account embedded elements');
        assert.equal(graph.isNeighbor(r1, r4, { deep: true, inbound: true }), false, 'isNeighbor() with inbound true and deep true takes into account embedded elements');

        l1.set('source', { id: 'R1' }).set('target', { id: 'R2' });
        l2.remove();
        l3.remove();
        l4.remove();
        //
        // ░░░░░░░░░░░
        // ░R1░░░░░░░░------
        // ░░░░▓▓▓▓▓▓▓   L1|
        // ░░░░▓▓▓R2▓▓<-----
        // ░░░░▓▓▓▓▓▓▓
        assert.deepEqual(neighbors(r1), ['R2'], 'A connected embedded elements is found in the shallow mode.');
        assert.deepEqual(neighbors(r1, { deep: true }), ['R1', 'R2'], 'All the connected embedded elements are found in the deep mode.');
        assert.deepEqual(neighbors(r1, { deep: true, inbound: true }), ['R1'], 'All the inbound connected embedded elements are found in the deep mode.');
        assert.deepEqual(neighbors(r1, { deep: true, outbound: true }), ['R2'], 'All the outbound connected embedded elements are found in the deep mode.');

    });

    QUnit.module('findModelsInArea(rect[, opt])', function(hooks) {

        var cells;

        hooks.beforeEach(function() {

            cells = [
                new joint.shapes.basic.Rect({
                    position: { x: 20, y: 20 },
                    size: { width: 20, height: 20 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 80, y: 80 },
                    size: { width: 40, height: 60 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 120, y: 180 },
                    size: { width: 40, height: 40 }
                })
            ];

            this.graph.addCells(cells);
        });

        QUnit.test('rect is instance of g.rect', function(assert) {

            var modelsInArea;

            modelsInArea = this.graph.findModelsInArea(new g.rect(0, 0, 10, 10));

            assert.equal(modelsInArea.length, 0, 'area with no elements in it');

            modelsInArea = this.graph.findModelsInArea(new g.rect(0, 0, 25, 25));

            assert.equal(modelsInArea.length, 1, 'area with 1 element in it');

            modelsInArea = this.graph.findModelsInArea(new g.rect(0, 0, 300, 300));

            assert.equal(modelsInArea.length, 3, 'area with 3 elements in it');

            modelsInArea = this.graph.findModelsInArea(new g.rect(0, 0, 100, 100), { strict: true });

            assert.equal(modelsInArea.length, 1, '[opt.strict = TRUE] should require elements to be completely within rect');
        });

        QUnit.test('rect is object', function(assert) {

            var modelsInArea;

            modelsInArea = this.graph.findModelsInArea({
                x: 0,
                y: 0,
                width: 10,
                height: 10
            });

            assert.equal(modelsInArea.length, 0, 'area with no elements in it');
        });
    });

    QUnit.test('translate(dx, dy, opt)', function(assert) {

        var rect1 = new joint.shapes.basic.Rect({
            id: 'rect1',
            position: { x: 20, y: 20 },
            size: { width: 20, height: 20 }
        });

        var rect2 = new joint.shapes.basic.Rect({
            id: 'rect2',
            position: { x: 80, y: 80 },
            size: { width: 40, height: 60 }
        });

        var link1 = new joint.dia.Link({
            id: 'link1',
            source: { x: 200, y: 200 },
            target: { x: 300, y: 300 }
        });

        var link2 = new joint.dia.Link({
            id: 'link2',
            source: { id: 'rect1' },
            target: { id: 'rect2' },
            vertices: [
                { x: 60, y: 30 }
            ]
        });

        var embeddedElement1 = new joint.shapes.basic.Rect({
            id: 'embeddedElement1',
            position: { x: 15, y: 15 },
            size: { width: 20, height: 20 }
        });

        rect1.embed(embeddedElement1);

        var embeddedLink1 = new joint.dia.Link({
            id: 'embeddedLink1',
            source: { x: 20, y: 20 },
            target: { x: 30, y: 30 }
        });

        rect2.embed(embeddedLink1);

        this.graph.addCells([rect1, rect2, link1, link2, embeddedElement1, embeddedLink1]);

        var dx;
        var dy;
        var before;
        var after;

        dx = 10;
        dy = 20;

        before = {
            rect1: {
                bbox: rect1.getBBox()
            },
            link1: {
                source: link1.get('source'),
                target: link1.get('target')
            },
            link2: {
                vertices: link2.get('vertices')
            },
            embeddedElement1: {
                bbox: embeddedElement1.getBBox()
            },
            embeddedLink1: {
                source: embeddedLink1.get('source'),
                target: embeddedLink1.get('target')
            }
        };

        this.graph.translate(dx, dy);

        after = {
            rect1: {
                bbox: rect1.getBBox()
            },
            link1: {
                source: link1.get('source'),
                target: link1.get('target')
            },
            link2: {
                vertices: link2.get('vertices')
            },
            embeddedElement1: {
                bbox: embeddedElement1.getBBox()
            },
            embeddedLink1: {
                source: embeddedLink1.get('source'),
                target: embeddedLink1.get('target')
            }
        };

        assert.equal(after.rect1.bbox.x, before.rect1.bbox.x + dx, 'position/x of element');
        assert.equal(after.rect1.bbox.y, before.rect1.bbox.y + dy, 'position/y of element');
        assert.equal(after.link1.source.x, before.link1.source.x + dx, 'source/x of link');
        assert.equal(after.link1.source.y, before.link1.source.y + dy, 'source/y of link');
        assert.equal(after.link1.target.x, before.link1.target.x + dx, 'target/x of link');
        assert.equal(after.link1.target.y, before.link1.target.y + dy, 'target/y of link');

        _.each(before.link2.vertices, function(vertexBefore, index) {
            var vertexAfter = after.link2.vertices[index];
            assert.equal(vertexAfter.x, vertexBefore.x + dx, 'vertex/x of link');
            assert.equal(vertexAfter.y, vertexBefore.y + dy, 'vertex/y of link');
        });

        assert.equal(after.embeddedElement1.bbox.x, before.embeddedElement1.bbox.x + dx, 'position/x of embedded element');
        assert.equal(after.embeddedElement1.bbox.y, before.embeddedElement1.bbox.y + dy, 'position/y of embedded element');
        assert.equal(after.embeddedLink1.source.x, before.embeddedLink1.source.x + dx, 'source/x of embedded link');
        assert.equal(after.embeddedLink1.source.y, before.embeddedLink1.source.y + dy, 'source/y of embedded link');
        assert.equal(after.embeddedLink1.target.x, before.embeddedLink1.target.x + dx, 'target/x of embedded link');
        assert.equal(after.embeddedLink1.target.y, before.embeddedLink1.target.y + dy, 'target/y of embedded link');
    });

    QUnit.module('resize()', function(hooks) {

        hooks.beforeEach(function() {
            var graph = this.graph;

            var el = new joint.shapes.basic.Rect({ size: { width: 100, height: 50 }});
            var l = new joint.dia.Link();

            this.ea = el.clone().set('id', 'a').position(100, 100).addTo(graph);
            this.eb = el.clone().set('id', 'b').position(300, 100).addTo(graph);
            this.ec = el.clone().set('id', 'c').position(200, 300).addTo(graph);

            this.l1 = l.clone().set({
                source: { id: 'a' },
                target: { id: 'b' }
            }).addTo(graph);

            this.l2 = l.clone().set({
                source: { id: 'b' },
                target: { id: 'c' },
                vertices: [{ x: 300, y: 300 }]
            }).addTo(graph);
        });

        QUnit.test('increase size', function(assert) {
            var graph = this.graph;
            graph.resize(600, 500);
            assert.equal(graph.getBBox().toString(), g.rect(100, 100, 600, 500).toString());
            assert.equal(g.point(this.l2.get('vertices')[0]).toString(), g.point(500, 500).toString());
        });

        QUnit.test('decrease size', function(assert) {
            var graph = this.graph;
            graph.resize(60, 50);
            assert.equal(graph.getBBox().toString(), g.rect(100, 100, 60, 50).toString());
            assert.equal(g.point(this.l2.get('vertices')[0]).toString(), g.point(140, 140).toString());
        });
    });

    QUnit.module('resizeCells()', function(hooks) {

        hooks.beforeEach(function() {
            var graph = this.graph;

            var el = new joint.shapes.basic.Rect({ size: { width: 100, height: 50 }});
            var l = new joint.dia.Link();

            this.ea = el.clone().set('id', 'a').position(100, 100).addTo(graph);
            this.eb = el.clone().set('id', 'b').position(300, 100).addTo(graph);
            this.ec = el.clone().set('id', 'c').position(200, 300).addTo(graph);

            this.l1 = l.clone().set({
                source: { id: 'a' },
                target: { id: 'b' }
            }).addTo(graph);

            this.l2 = l.clone().set({
                source: { id: 'b' },
                target: { id: 'c' },
                vertices: [{ x: 300, y: 300 }]
            }).addTo(graph);
        });

        QUnit.test('no cells provided', function(assert) {
            var graph = this.graph;
            graph.resizeCells(300, 400, []);
            assert.equal(graph.getBBox().toString(), g.rect(100, 100, 300, 250).toString());
            assert.equal(g.point(this.l2.get('vertices')[0]).toString(), g.point(300, 300).toString());
        });

        QUnit.test('elements and links provided', function(assert) {
            var graph = this.graph;
            graph.resizeCells(100, 100, [this.ea, this.eb, this.ec, this.l1, this.l2]);
            assert.equal(graph.getBBox().toString(), g.rect(100, 100, 100, 100).toString());
            graph.resizeCells(300, 400, graph.getCells());
            assert.equal(graph.getBBox().toString(), g.rect(100, 100, 300, 400).toString());
            assert.equal(g.point(this.l2.get('vertices')[0]).toString(), g.point(300, 420).toString());
        });

        QUnit.test('only elements provided', function(assert) {
            var graph = this.graph;
            graph.resizeCells(100, 100, [this.ea, this.eb]);
            assert.equal(graph.getBBox().toString(), g.rect(100, 100, 200, 250).toString());
            assert.equal(graph.getCellsBBox([this.ea, this.eb]).toString(), g.rect(100, 100, 100, 100).toString());
        });

        QUnit.test('only links provided', function(assert) {
            var graph = this.graph;
            graph.resizeCells(100, 100, [this.l1, this.l2]);
            assert.equal(graph.getBBox().toString(), g.rect(100, 100, 300, 250).toString());
        });

        QUnit.test('event options', function(assert) {
            var graph = this.graph;
            graph.on('change', function(cell, opt) {
                assert.ok(opt.resizeOption);
            });
            graph.resize(100, 100, { resizeOption: true });
        });
    });

    QUnit.module('graph.fromJSON()', function() {

        var json = JSON.parse('{"cells":[{"type":"basic.Circle","size":{"width":100,"height":60},"position":{"x":110,"y":480},"id":"bbb9e641-9756-4f42-997a-f4818b89f374","embeds":"","z":0},{"type":"link","source":{"id":"bbb9e641-9756-4f42-997a-f4818b89f374"},"target":{"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6"},"id":"b4289c08-07ea-49d2-8dde-e67eb2f2a06a","z":1},{"type":"basic.Rect","position":{"x":420,"y":410},"size":{"width":100,"height":60},"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6","embeds":"","z":2}]}');

        QUnit.test('should reconstruct graph data from JSON object', function(assert) {

            this.graph.fromJSON(json);

            var cells = this.graph.get('cells').models;

            assert.ok(_.isArray(cells));
            assert.equal(cells.length, 3);

            _.each(cells, function(cell) {
                assert.ok(cell instanceof joint.dia.Cell);
            });
        });

        QUnit.test('z attribute should inherit correctly', function(assert) {

            joint.shapes.basic.Custom = joint.shapes.basic.Rect.extend({
                defaults: {
                    z: 47
                }
            });

            this.graph.fromJSON({
                cells: [
                    {
                        id: 'some-cell',
                        type: 'basic.Custom'
                    }
                ]
            });

            assert.equal(this.graph.getCell('some-cell').get('z'), joint.shapes.basic.Custom.prototype.defaults.z, '');

            // Clean-up.
            delete joint.shapes.basic.Custom;
        });
    });

    QUnit.module('graph.toJSON()', function(hooks) {

        var json = JSON.parse('{"cells":[{"type":"basic.Circle","size":{"width":100,"height":60},"position":{"x":110,"y":480},"id":"bbb9e641-9756-4f42-997a-f4818b89f374","embeds":"","z":0},{"type":"link","source":{"id":"bbb9e641-9756-4f42-997a-f4818b89f374"},"target":{"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6"},"id":"b4289c08-07ea-49d2-8dde-e67eb2f2a06a","z":1},{"type":"basic.Rect","position":{"x":420,"y":410},"size":{"width":100,"height":60},"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6","embeds":"","z":2}]}');

        hooks.beforeEach(function() {

            this.graph.fromJSON(json);
        });

        QUnit.test('should return graph data as JSON object', function(assert) {

            var json = this.graph.toJSON();

            assert.ok(_.isObject(json));
            assert.ok(_.isArray(json.cells));
            assert.equal(json.cells.length, 3);
        });
    });
});

module('paper', {

    setup: function() {

        var $fixture = $('#qunit-fixture');
        var $paper = $('<div/>');
        $fixture.append($paper);

        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({

            el: $paper,
            gridSize: 10,
            model: this.graph
        });
    },

    teardown: function() {

        delete this.graph;
        delete this.paper;
    }
});

test('graph.resetCells()', function() {

    var r1 = new joint.shapes.basic.Rect;
    var r2 = new joint.shapes.basic.Rect;
    var r3 = new joint.shapes.basic.Rect;

    this.graph.addCell(r1);
    this.graph.resetCells([r2, r3]);

    equal(this.graph.get('cells').length, 2, 'previous cells were removed from the graph after calling graph.resetCells()');
    equal(this.paper.$('.element').length, 2, 'previous cells were removed from the paper after calling graph.resetCells()');
});

test('graph.clear()', function(assert) {

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

test('graph.getCells(), graph.getLinks(), graph.getElements()', function(assert) {

    var graph = this.graph;
    var r1 = new joint.shapes.basic.Rect({ id: 'r1' });
    var r2 = new joint.shapes.basic.Rect({ id: 'r2' });
    var l1 = new joint.dia.Link({ id: 'l1' });

    graph.addCells([r1, r2, l1]);

    assert.deepEqual(_.pluck(graph.getCells(), 'id'), ['r1', 'r2', 'l1'],
                     'getCells() returns all the cells in the graph.');
    assert.deepEqual(_.pluck(graph.getLinks(), 'id'), ['l1'],
                     'getLinks() returns only the link in the graph.');
    assert.deepEqual(_.pluck(graph.getElements(), 'id'), ['r1', 'r2'],
                     'getElements() returns only the elements in the graph');
});

test('graph.fromJSON(), graph.toJSON()', function() {

    var json = {
        "cells":[
            {"type":"basic.Circle","size":{"width":100,"height":60},"position":{"x":110,"y":480},"id":"bbb9e641-9756-4f42-997a-f4818b89f374","embeds":"","z":0},
            {"type":"link","source":{"id":"bbb9e641-9756-4f42-997a-f4818b89f374"},"target":{"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6"},"id":"b4289c08-07ea-49d2-8dde-e67eb2f2a06a","z":1},
            {"type":"basic.Rect","position":{"x":420,"y":410},"size":{"width":100,"height":60},"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6","embeds":"","z":2}
        ]
    };

    this.graph.fromJSON(json);

    equal(this.graph.get('cells').length, 3, 'all the cells were reconstructed from JSON');

    // Check that the link is before the last cell in the DOM. This check is there because
    // paper might have resorted the cells so that links are always AFTER elements.
    var linkView = this.paper.findViewByModel('b4289c08-07ea-49d2-8dde-e67eb2f2a06a');
    var rectView = this.paper.findViewByModel('cbd1109e-4d34-4023-91b0-f31bce1318e6');
    var circleView = this.paper.findViewByModel('bbb9e641-9756-4f42-997a-f4818b89f374');

    ok(rectView.el.previousSibling === linkView.el, 'link view is before rect element in the DOM');
    ok(linkView.el.previousSibling === circleView.el, 'link view is after circle element in the DOM');

    this.graph.fromJSON(this.graph.toJSON());
    equal(this.graph.get('cells').length, 3, 'all the cells were reconstructed from JSON');
    
    // Check that the link is before the last cell in the DOM. This check is there because
    // paper might have resorted the cells so that links are always AFTER elements.
    linkView = this.paper.findViewByModel('b4289c08-07ea-49d2-8dde-e67eb2f2a06a');
    rectView = this.paper.findViewByModel('cbd1109e-4d34-4023-91b0-f31bce1318e6');
    circleView = this.paper.findViewByModel('bbb9e641-9756-4f42-997a-f4818b89f374');

    ok(rectView.el.previousSibling === linkView.el, 'link view is before rect element in the DOM');
    ok(linkView.el.previousSibling === circleView.el, 'link view is after circle element in the DOM');
});

test('graph.fetch()', function(assert) {

    var json = {
        "cells":[
            {"type":"basic.Circle","size":{"width":100,"height":60},"position":{"x":110,"y":480},"id":"bbb9e641-9756-4f42-997a-f4818b89f374","embeds":"","z":0},
            {"type":"link","source":{"id":"bbb9e641-9756-4f42-997a-f4818b89f374"},"target":{"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6"},"id":"b4289c08-07ea-49d2-8dde-e67eb2f2a06a","z":1},
            {"type":"basic.Rect","position":{"x":420,"y":410},"size":{"width":100,"height":60},"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6","embeds":"","z":2}
        ]
    };

    var ajaxStub = sinon.stub($, 'ajax').yieldsTo('success', json);

    this.graph.url = 'test.url';
    this.graph.fetch();

    assert.equal(this.graph.getElements().length, 2, 'all the element were fetched.');
    assert.equal(this.graph.getLinks().length, 1, 'all the links were fetched.');

    ajaxStub.restore();
});

test('graph.getBBox()', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 20, height: 20 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 100, y: 200 }, size: { width: 20, height: 20 } });
    var r3 = new joint.shapes.basic.Rect({ position: { x: 20, y: 10 }, size: { width: 20, height: 20 } });

    this.graph.resetCells([r1, r2, r3]);

    var bbox = this.graph.getBBox([r1, r2, r3]);
    equal(bbox.x, 20, 'bbox.x correct');
    equal(bbox.y, 10, 'bbox.y correct');
    equal(bbox.width, 100, 'bbox.width correct');
    equal(bbox.height, 210, 'bbox.height correct');
});

test('contextmenu', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 20, height: 20 } });
    this.graph.resetCells([r1]);

    var cellContextmenuCallback = sinon.spy();
    this.paper.on('cell:contextmenu', cellContextmenuCallback);
    var blankContextmenuCallback = sinon.spy();
    this.paper.on('blank:contextmenu', blankContextmenuCallback);

    var r1View = this.paper.findViewByModel(r1);
    r1View.$el.trigger('contextmenu');
    ok(cellContextmenuCallback.called, 'cell:contextmenu triggered');    

    this.paper.$el.trigger('contextmenu');
    ok(blankContextmenuCallback.called, 'blank:contextmenu triggered');    
});

test('paper.getArea()', function(assert) {

    this.paper.setOrigin(0,0);
    this.paper.setDimensions(1000, 800);

    assert.ok(this.paper.getArea() instanceof g.rect, 'Paper area is a geometry rectangle.');
    assert.deepEqual(
        _.pick(this.paper.getArea(), 'x', 'y', 'width', 'height'),
        { x: 0, y: 0, width: 1000, height: 800 },
        'Paper area returns correct results for unscaled, untranslated viewport.');

    this.paper.setOrigin(100,100);

    assert.deepEqual(
        _.pick(this.paper.getArea(), 'x', 'y', 'width', 'height'),
        { x: -100, y: -100, width: 1000, height: 800 },
        'Paper area returns correct results for unscaled, but translated viewport.');

    V(this.paper.viewport).scale(2,2);

    assert.deepEqual(
        _.pick(this.paper.getArea(), 'x', 'y', 'width', 'height'),
        { x: -50, y: -50, width: 500, height: 400 },
        'Paper area returns correct results for scaled and translated viewport.');
});

test('graph.findModelsUnderElement()', function(assert) {

    var rect = new joint.shapes.basic.Rect({
        size: { width: 100, height: 100 },
        position: { x: 100, y: 100 }
    });

    var under = rect.clone();
    var away = rect.clone().translate(200,200);

    this.graph.addCells([rect,under,away]);

    assert.deepEqual(this.graph.findModelsUnderElement(away), [], 'There are no models under the element.');
    assert.deepEqual(this.graph.findModelsUnderElement(rect), [under], 'There is a model under the element.');

    under.translate(50,50);

    assert.deepEqual(this.graph.findModelsUnderElement(rect, { searchBy: 'origin' }), [], 'There is no model under the element if searchBy origin option used.');
    assert.deepEqual(this.graph.findModelsUnderElement(rect, { searchBy: 'corner' }), [under], 'There is a model under the element if searchBy corner options used.');
    
    var embedded = rect.clone().addTo(this.graph);
    rect.embed(embedded);

    assert.deepEqual(this.graph.findModelsUnderElement(rect), [under], 'There is 1 model under the element found and 1 embedded element is omitted.');
    assert.deepEqual(this.graph.findModelsUnderElement(under), [rect, embedded], 'There are 2 models under the element. Parent and its embed.');
    assert.deepEqual(this.graph.findModelsUnderElement(embedded), [rect, under], 'There are 2 models under the element. The element\'s parent and one other element.');
});

test('paper.options: linkView & elementView', function(assert) {

    assert.expect(8);

    var customElementView = joint.dia.ElementView.extend({ custom: true });
    var customLinkView = joint.dia.LinkView.extend({ custom: true });
    var element = new joint.shapes.basic.Rect();
    var link = new joint.dia.Link();

    // Custom View via class

    this.paper.options.elementView = customElementView;
    this.paper.options.linkView = customLinkView;

    this.graph.addCell(element);
    assert.equal(element.findView(this.paper).constructor, customElementView,
                 'custom element view used when "elementView" option contains one.');

    this.graph.addCell(link);
    assert.equal(link.findView(this.paper).constructor, customLinkView,
                 'custom link view used when "linkView" option contains one.');

    // Custom View via function

    element.remove();
    link.remove();

    this.paper.options.elementView = function(el) {
        assert.ok(el === element,
                  '"elementView" option function executed with correct parameters.');
        return customElementView;
    };

    this.paper.options.linkView = function(l) {
        assert.ok(l === link,
                  '"linkView" option function executed with correct parameters.');
        return customLinkView;
    };

    this.graph.addCell(element);
    assert.equal(element.findView(this.paper).constructor, customElementView,
                 'the custom element view was used when "elementView" option function returns one.');

    this.graph.addCell(link);
    assert.equal(link.findView(this.paper).constructor, customLinkView,
                 'the custom link view was used when "linkView" option function returns one.');

    // Default View via function

    element.remove();
    link.remove();

    this.paper.options.elementView = function(el) {
        return null;
    };

    this.paper.options.linkView = function(l) {
        return null;
    };

    this.graph.addCell(element);
    assert.equal(element.findView(this.paper).constructor, joint.dia.ElementView,
                 'the default element view was used when "elementView" option function returns no view.');

    this.graph.addCell(link);
    assert.equal(link.findView(this.paper).constructor, joint.dia.LinkView,
                 'the default link view was used when "linkView" option function returns no view.');

});

test('paper.options: cellViewNamespace', function(assert) {

    var customElementView = joint.dia.ElementView.extend({ custom: true });
    var customLinkView = joint.dia.LinkView.extend({ custom: true });
    var element = new joint.shapes.basic.Rect({ type: 'elements.Element' });
    var link = new joint.dia.Link({ type: 'links.Link' });

    this.paper.options.cellViewNamespace = {
        elements: { ElementView: customElementView },
        links: { LinkView: customLinkView }
    };

    this.graph.addCells([element, link]);

    assert.equal(element.findView(this.paper).constructor, customElementView,
                 'the custom element view was found in the custom namespace.');

    assert.equal(link.findView(this.paper).constructor, customLinkView,
                 'the custom link view was found in the custom namespace.');

});

test('graph.options: cellNamespace', function(assert) {

    var elementJSON = { id: 'a', type: 'elements.Element' };
    var linkJSON = { id: 'b', type: 'link' };
    var nonExistingJSON = { id: 'c', type: 'elements.NonExisting' };

    var graph = new joint.dia.Graph({}, { cellNamespace: {
        elements: { Element: joint.shapes.basic.Rect }
    }});

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

test('paper.options: linkPinning', function(assert) {

    assert.expect(5);

    var source = new joint.shapes.basic.Rect({ id: 'source', position: { x: 100, y: 100 }, size: { width: 100, height: 100 }});
    var target = new joint.shapes.basic.Rect({ id: 'target', position: { x: 400, y: 100 }, size: { width: 100, height: 100 }});
    var link = new joint.dia.Link({ id: 'link', source: { id: source.id }, target: { id: target.id }});
    var newLink; // to be created.

    this.graph.addCells([source, target, link]);

    var linkView = link.findView(this.paper);
    var sourceView = source.findView(this.paper);
    var targetView = target.findView(this.paper);

    var arrowhead = linkView.el.querySelector('.marker-arrowhead[end=target]');

    this.paper.options.linkPinning = false;
    linkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
    linkView.pointermove({ target: this.paper.el, type: 'mousemove' }, 50 , 50);
    linkView.pointerup({ target: this.paper.el, type: 'mouseup' }, 50 , 50);

    assert.deepEqual(link.get('target'), { id: target.id }, 'pinning disabled: when the arrowhead is dragged&dropped to the blank paper area, the arrowhead is return to its original position.');

    this.paper.options.linkPinning = true;
    linkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
    linkView.pointermove({ target: this.paper.el, type: 'mousemove' }, 50 , 50);
    linkView.pointerup({ target: this.paper.el, type: 'mouseup' }, 50 , 50);

    assert.deepEqual(link.get('target'), { x: 50, y: 50 }, 'pinning enabled: when the arrowhead is dragged&dropped to the blank paper area, the arrowhead is set to a point.');

    this.paper.options.linkPinning = false;
    linkView.pointerdown({ target: arrowhead, type: 'mousedown' }, 0, 0);
    linkView.pointermove({ target: targetView.el, type: 'mousemove' }, 450 , 150);
    linkView.pointerup({ target: targetView.el, type: 'mouseup' }, 450 , 150);

    assert.deepEqual(link.get('target'), { id: 'target' }, 'pinning disabled: it\'s still possible to connect link to elements.');

    this.paper.options.linkPinning = true;
    source.attr('.', { magnet: true });
    sourceView.pointerdown({ target: sourceView.el, type: 'mousedown' }, 150, 150);
    sourceView.pointermove({ target: this.paper.el, type: 'mousemove' }, 150 , 400);
    sourceView.pointerup({ target: this.paper.el, type: 'mouseup' }, 150 , 400);

    newLink = _.reject(this.graph.getLinks(), { id: 'link' })[0];
    if (newLink) {
        assert.deepEqual(newLink.get('target'), { x: 150, y: 400 }, 'pinning enabled: when there was a link created from a magnet a dropped into the blank paper area, the link target is set to a point.');
        newLink.remove();
    }

    this.paper.options.linkPinning = false;
    sourceView.pointerdown({ target: sourceView.el, type: 'mousedown' }, 150, 150);
    sourceView.pointermove({ target: this.paper.el, type: 'mousemove' }, 150 , 400);
    sourceView.pointerup({ target: this.paper.el, type: 'mouseup' }, 150 , 400);

    newLink = _.reject(this.graph.getLinks(), { id: 'link' })[0];
    assert.notOk(newLink, 'pinning disabled: when there was a link created from a magnet a dropped into the blank paper area, the link was removed after the drop.');
});


test('graph.getNeighbors()', function(assert) {

    var graph = this.graph;
    var Element = joint.shapes.basic.Rect;
    var Link = joint.dia.Link;

    function neighbors(el, opt) { return _.chain(graph.getNeighbors(el, opt)).pluck('id').sort().value(); }

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
    assert.deepEqual(neighbors(r2), ['R1','R3'], 'Elment has both outbound an inbound links. The neighbors were found.');

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
    assert.deepEqual(neighbors(r2, { outbound: true }), ['R3','R4'], 'The outbound links were found.');

    graph.addCells([l4]);
    l1.set('source', { id: 'R1' }).set('target', { id: 'R2' });
    l2.set('source', { id: 'R2' }).set('target', { id: 'R3' });
    l3.set('source', { id: 'R2' }).set('target', { id: 'R3' });
    l4.set('source', { id: 'R1' }).set('target', { id: 'R2' });
    //
    // [R1] --L1,L4--> [R2] --L2,L3--> [R3]
    //

    assert.deepEqual(neighbors(r2), ['R1','R3'], 'There are no duplicates in the result.');

    l1.set('source', { id: 'R1' }).set('target', { id: 'R1' });
    l2.remove();
    l3.remove();
    l4.set('source', { id: 'R1' }).set('target', { id: 'R1' });
    //  [R1] <--L1,L4
    //    |       |
    //     -------

    assert.deepEqual(neighbors(r1), ['R1'], 'Being a self-neighbor is detected.');

    graph.addCells([l2,l3]);
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

    assert.deepEqual(neighbors(r1), ['R3','R5'], 'Embedded elements are not taken into account by default.');
    assert.deepEqual(neighbors(r2), ['R4','R6'], 'Parent elements are not taken into account by default.');
    assert.deepEqual(neighbors(r1, { deep: true }), ['R3','R4','R5','R6'], 'The neighbours of the element and all its embdes were found in the deep mode. But not the embdes themselves.');
    assert.deepEqual(neighbors(r2, { deep: true }), ['R4','R6'], 'Parent elements are not taken into account in the deep mode.');
    assert.deepEqual(neighbors(r1, { deep: true, outbound: true }), ['R3','R4'], 'The outbound neighbours of the element and all its embdes were found in the deep mode.');
    assert.deepEqual(neighbors(r1, { deep: true, inbound: true }), ['R5','R6'], 'The inbound neighbours of the element and all its embdes were found in the deep mode.');

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
    assert.deepEqual(neighbors(r1, { deep: true }), ['R1','R2'], 'All the connected embedded elements are found in the deep mode.');
    assert.deepEqual(neighbors(r1, { deep: true, inbound: true }), ['R1'], 'All the inbound connected embedded elements are found in the deep mode.');
    assert.deepEqual(neighbors(r1, { deep: true, outbound: true  }), ['R2'], 'All the outbound connected embedded elements are found in the deep mode.');

});

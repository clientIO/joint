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

module('paper', {

    beforeEach: function() {

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

    afterEach: function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    }
});

test('paper.resetViews()', function() {

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

test('paper.options: guard', function(assert) {

    var element = new joint.shapes.basic.Rect({
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 }
    });

    this.graph.addCell(element);

    var elementView = this.paper.findViewByModel(element);
    var paperOffsetX = this.paper.$el.offset().left;
    var paperOffsetY = this.paper.$el.offset().top;
    var bboxBefore = element.getBBox();
    var bboxAfter;
    var diffX;
    var diffY;

    simulate.mousedown({
        el: elementView.$el[0],
        clientX: paperOffsetX + bboxBefore.x + 10,
        clientY: paperOffsetY + bboxBefore.y + 10,
        button: 2
    });

    simulate.mousemove({
        el: elementView.$el[0],
        clientX: paperOffsetX + bboxBefore.x + 50,
        clientY: paperOffsetY + bboxBefore.y + 50,
        button: 2
    });

    bboxAfter = element.getBBox();
    diffX = Math.abs(bboxAfter.x - bboxBefore.x);
    diffY = Math.abs(bboxAfter.y - bboxBefore.y);

    assert.ok(diffX > 30 && diffY > 30, 'element should have been moved');

    // Use guard option to only allow mouse events for left mouse button.
    this.paper.options.guard = function(evt, view) {

        var isMouseEvent = evt.type.substr(0, 'mouse'.length) === 'mouse';

        if (isMouseEvent && evt.button !== 0) {

            return true;
        }

        return false;
    };

    simulate.mousedown({
        el: elementView.$el[0],
        clientX: paperOffsetX + bboxBefore.x + 10,
        clientY: paperOffsetY + bboxBefore.y + 10,
        button: 2
    });

    simulate.mousemove({
        el: elementView.$el[0],
        clientX: paperOffsetX + bboxBefore.x + 50,
        clientY: paperOffsetY + bboxBefore.y + 50,
        button: 2
    });

    bboxBefore = bboxAfter;
    bboxAfter = element.getBBox();
    diffX = Math.abs(bboxAfter.x - bboxBefore.x);
    diffY = Math.abs(bboxAfter.y - bboxBefore.y);

    assert.ok(diffX < 5 && diffY < 5, 'element should not have been moved');
});

test('getContentBBox()', function(assert) {

    var contentBBox;

    checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), { x: 0, y: 0, width: 0, height: 0 }, 'empty graph, content bbox should be correct');

    var rect1 = new joint.shapes.basic.Rect({
        position: {
            x: 20,
            y: 20
        },
        size: {
            width: 40,
            height: 40
        }
    });

    this.graph.addCell(rect1);

    checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), { x: 20, y: 20, width: 40, height: 40 }, 'one rectangle, content bbox should be correct');

    var rect2 = new joint.shapes.basic.Rect({
        position: {
            x: 5,
            y: 8
        },
        size: {
            width: 25,
            height: 25
        }
    });

    this.graph.addCell(rect2);

    checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), { x: 5, y: 8, width: 55, height: 52 }, 'two rectangles, content bbox should be correct');

    var circle1 = new joint.shapes.basic.Circle({
        position: {
            x: 75,
            y: 5
        },
        size: {
            width: 25,
            height: 25
        }
    });

    this.graph.addCell(circle1);

    checkBboxApproximately(2/* +- */, this.paper.getContentBBox(), { x: 5, y: 5, width: 95, height: 55 }, 'two rectangles + one circle, content bbox should be correct');

    V(this.paper.viewport).scale(2, 2);

    checkBboxApproximately(4/* +- */, this.paper.getContentBBox(), { x: 10, y: 10, width: 190, height: 110 }, 'two rectangles + one circle (scaled by factor of 2), content bbox should be correct');
});

test('findViewsInArea(rect[, opt])', function(assert) {

    var cells = [
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

    var viewsInArea;

    viewsInArea = this.paper.findViewsInArea(new g.rect(0, 0, 10, 10));

    assert.equal(viewsInArea.length, 0, 'area with no elements in it');

    viewsInArea = this.paper.findViewsInArea(new g.rect(0, 0, 25, 25));

    assert.equal(viewsInArea.length, 1, 'area with 1 element in it');

    viewsInArea = this.paper.findViewsInArea(new g.rect(0, 0, 300, 300));

    assert.equal(viewsInArea.length, 3, 'area with 3 elements in it');

    viewsInArea = this.paper.findViewsInArea(new g.rect(0, 0, 100, 100), { strict: true });

    assert.equal(viewsInArea.length, 1, '[opt.strict = TRUE] should require elements to be completely within rect');
});

test('linkAllowed(linkViewOrModel)', function(assert) {

    assert.equal(typeof this.paper.linkAllowed, 'function', 'should be a function');

    var paper = this.paper;

    assert.throws(function() {

        paper.linkAllowed();

    }, new Error('Must provide link model or view.'), 'should throw error when link model/view is missing');

    var rect1 = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 40, height: 40 }
    });

    var rect2 = new joint.shapes.basic.Rect({
        position: { x: 80, y: 30 },
        size: { width: 40, height: 40 }
    });

    this.graph.addCells([rect1, rect2]);

    // Defaults.
    this.paper.options.multiLinks = true;
    this.paper.options.linkPinning = true;

    var link = new joint.dia.Link({
        source: { x: 300, y: 300 },
        target: { x: 320, y: 320 }
    });

    this.graph.addCells([link]);

    var linkView = this.paper.findViewByModel(link);

    assert.ok(this.paper.linkAllowed(link), 'can use link model');
    assert.ok(this.paper.linkAllowed(linkView), 'can use link view');

    var pinnedLink = new joint.dia.Link({
        source: { id: rect1.id },
        target: { x: 200, y: 200 }
    });

    this.paper.options.linkPinning = false;
    assert.notOk(this.paper.linkAllowed(pinnedLink), 'pinned link not allowed when link pinning is disabled');

    this.paper.options.linkPinning = true;
    assert.ok(this.paper.linkAllowed(pinnedLink), 'pinned link allowed when link pinning is enabled');

    var multiLink1 = new joint.dia.Link({
        source: { id: rect1.id },
        target: { id: rect2.id }
    });

    var multiLink2 = new joint.dia.Link({
        source: { id: rect1.id },
        target: { id: rect2.id }
    });

    this.graph.addCells([multiLink1, multiLink2]);

    this.paper.options.multiLinks = false;
    assert.notOk(this.paper.linkAllowed(multiLink2), 'multi link not allowed when link multi-links is disabled');

    this.paper.options.multiLinks = true;
    assert.ok(this.paper.linkAllowed(multiLink2), 'multi link allowed when link multi-links is enabled');
});

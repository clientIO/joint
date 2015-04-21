module('basic', {

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

test('construction', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(myrect);

    strictEqual(myrect.constructor, joint.shapes.basic.Rect, 'myrect.constructor === joint.shapes.basic.Rect');

    var textEls = this.paper.svg.getElementsByTagName('text');
    var rectEls = this.paper.svg.getElementsByTagName('rect');

    equal(textEls.length, 1, 'there is exactly one <text> element in the paper');
    equal(rectEls.length, 1, 'there is exactly one <rect> element in the paper');

    equal(textEls[0].textContent, 'my rectangle', 'text element has a proper content');
    
});

asyncTest('async: resetCells', function() {

    var r1 = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });
    var r2 = r1.clone();
    var r3 = r1.clone();

    this.paper.options.async = { batchSize: 1 };
    this.paper.on('render:done', function() {
	
	var textEls = this.paper.svg.getElementsByTagName('text');
	var rectEls = this.paper.svg.getElementsByTagName('rect');

	equal(textEls.length, 3, 'there is exactly 3 <text> elements in the paper');
	equal(rectEls.length, 3, 'there is exactly 3 <rect> elements in the paper');

	equal(textEls[0].textContent, 'my rectangle', 'text element has a proper content');

	start();

    }, this);

    this.graph.resetCells([r1, r2, r3]);
});

asyncTest('async: addCells', function() {

    var r1 = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });
    var r2 = r1.clone();
    var r3 = r1.clone();
    var r4 = r1.clone();
    var r5 = r1.clone();

    this.graph.addCells([r1, r2]);

    this.paper.options.async = { batchSize: 1 };
    this.paper.on('render:done', function() {

	var textEls = this.paper.svg.getElementsByTagName('text');
	var rectEls = this.paper.svg.getElementsByTagName('rect');

	equal(textEls.length, 5, 'there is exactly 5 <text> elements in the paper');
	equal(rectEls.length, 5, 'there is exactly 5 <rect> elements in the paper');

	equal(textEls[0].textContent, 'my rectangle', 'text element has a proper content');

	start();

    }, this);

    this.graph.addCells([r3, r4, r5]);
});

test('getBBox()', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(myrect);

    var view = this.paper.findViewByModel(myrect);
    var bbox = view.getBBox();

    equal(bbox.x, 20, 'bbox.x is correct');
    equal(bbox.y, 30, 'bbox.y is correct');
    equal(bbox.width, 120, 'bbox.width is correct');
    equal(bbox.height, 80, 'bbox.height is correct');

    myrect.attr('text', { ref: 'rect', 'ref-y': 100 });

    bbox = view.getBBox({ useModelGeometry: false });

    ok(bbox.height > 80, 'Translating text outside the rect: bbox.width grew.');
    equal(bbox.x, 20, 'bbox.x is correct');
    equal(bbox.y, 30, 'bbox.y is correct');
    equal(bbox.width, 120, 'bbox.width is correct');

    bbox = view.getBBox({ useModelGeometry: true });

    equal(bbox.x, 20, 'Using model geometry: bbox.x is correct');
    equal(bbox.y, 30, 'bbox.y is correct');
    equal(bbox.width, 120, 'bbox.width is correct');
    equal(bbox.height, 80, 'bbox.height is correct');

});

test('z index', function() {

    var r1 = new joint.shapes.basic.Rect;
    var r2 = new joint.shapes.basic.Rect;
    var r3 = new joint.shapes.basic.Rect;

    this.graph.addCell(r1);
    this.graph.addCell(r2);
    this.graph.addCell(r3);

    ok(r1.get('z') < r2.get('z'), 'z index of the first added cell is lower than that of the second one');
    ok(r2.get('z') < r3.get('z'), 'z index of the second added cell is lower than that of the third one');

    // Test removing/adding new cells to cover https://github.com/clientIO/JointJS_plus/issues/21.
    r1.remove();
    var r4 = new joint.shapes.basic.Rect;
    this.graph.addCell(r4);
    ok(r2.get('z') < r3.get('z'), 'z index of the second added cell is lower than that of the third one');
    ok(r3.get('z') < r4.get('z'), 'z index of the third added cell is lower than that of the fourth, newly added, one');
});

test('position()', function() {

    var r1 = new joint.shapes.basic.Rect({
        position: { x: 100, y: 100 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' }}
    });

    this.graph.addCell(r1);

    var pos = r1.position();
    checkBbox(this.paper, r1, pos.x, pos.y, 120, 80, 'getter "position()" returns the elements position.');

    r1.position(200,200);
    checkBbox(this.paper, r1, 200, 200, 120, 80, 'setter "position(a,b)" should move element to the given position.');
     
    // parentRelative option

    var r2 = new joint.shapes.basic.Rect({
        position: { x: 10, y: 10 },
        size: { width: 30, height: 30 }
    });

    throws(function() {
        r2.position(100,100, { parentRelative: true });
    }, 'getter throws an error if "parentRelative" option passed and the element is not part of any collection.');

    throws(function() {
        r2.position({ parentRelative: true });
    }, 'getter throws an error if "parentRelative" option passed and the element is not part of any collection.');

    this.graph.addCell(r2);

    deepEqual(r2.position({ parentRelative: true }), r2.position(), 'getter with "parentRelative" option works in same way as getter without this option for an unembed element.');    

    r1.embed(r2);

    r2.position(10,10, { parentRelative: true });
    checkBbox(this.paper, r2, 210, 210, 30, 30, 'setter "position(a,b)" with "parentRelative" option should move element to the position relative to its parent.');

    pos = r2.position({ parentRelative: true });
    deepEqual(pos.toString(), "10@10", 'getter with "parentRelative" option returns position relative to the element parent.');
    
});

test('translate()', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(myrect);

    myrect.translate(50);
    checkBbox(this.paper, myrect, 70, 30, 120, 80, 'translate(50) should translate by 50px in x direction only');

    myrect.translate(0, 20);
    checkBbox(this.paper, myrect, 70, 50, 120, 80, 'translate(0, 20) should translate by 20px in y direction only');

    myrect.translate(10, 10);
    checkBbox(this.paper, myrect, 80, 60, 120, 80, 'translate(10, 10) should translate by 10px in both x and y directions');

    myrect.translate(-10, -10);
    checkBbox(this.paper, myrect, 70, 50, 120, 80, 'translate(-10, -10) should translate back by 10px in both x and y directions');
});

test('resize()', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(myrect);

    myrect.resize(120, 80);
    checkBbox(this.paper, myrect, 20, 30, 120, 80, 'resize([same width], [same height]) should not change bbox');

    myrect.resize(240, 160);
    checkBbox(this.paper, myrect, 20, 30, 240, 160, 'resize([2*width], [2*height]) should scale twice preserving top-left corner as it was');

    myrect.resize(120, 80);
    checkBbox(this.paper, myrect, 20, 30, 120, 80, 'resize([orig width], [orig height]) should scale back to the original size and position');
});

test('rotate()', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(myrect);

    myrect.rotate(90);
    checkBbox(this.paper, myrect, 40, 10, 80, 120, 'rotate(90) should rotate the object by 90 degrees around its center');

    myrect.rotate(-90);
    checkBbox(this.paper, myrect, 20, 30, 120, 80, 'rotate(-90) should rotate the object back to its original angle');

    // Rotation around an origin.
    myrect.rotate(180, false, { x: 140, y: 70 });
    checkBbox(this.paper, myrect, 140, 30, 120, 80, 'rotate(180, 140, 70) should rotate the object around the middle of its right edge');
    
    myrect.rotate(180, true, { x: 140, y: 70 });    
    checkBbox(this.paper, myrect, 140, 30, 120, 80, 'rotate(180, 140, 70) with absolute flag should not rotate the object as it is already rotated');
});


test('object reconstruction after several transformations', function() {

    var r1 = new joint.shapes.basic.Rect({
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });
    this.graph.addCell(r1);

    r1.resize(150, 60);
    r1.rotate(45);
    r1.translate(20, 30);
    r1.rotate(15);
    r1.resize(20, 30);
    r1.rotate(45, true);
    r1.rotate(-15);

    var r2 = r1.clone();
    this.graph.addCell(r2);

    var r1View = this.paper.findViewByModel(r1);
    var r2View = this.paper.findViewByModel(r2);

    var r1Bbox = g.rect(r1View.getBBox()).round();
    var r2Bbox = g.rect(r2View.getBBox()).round();
    
    deepEqual(
        { x: r1Bbox.x, y: r1Bbox.y, width: r1Bbox.width, height: r1Bbox.height },
        { x: r2Bbox.x, y: r2Bbox.y, width: r2Bbox.width, height: r2Bbox.height },
        'bounding box of the clone of an element that has been severely transformed is the same as of the original element'
    );
});

test('attr()', function() {

    var el = new joint.shapes.basic.Generic({
        position: { x: 20, y: 30 },
        markup: '<rect class="big"/><rect class="small"/>',
        attrs: {
            '.big': { width: 100, height: 50, fill: 'gray' },
            '.small': { width: 10, height: 10, fill: 'red' }
        }
    });

    this.graph.addCell(el);

    var elView = this.paper.findViewByModel(el);

    equal(elView.$('.big').attr('opacity'), undefined, 'No opacity is set on the element');

    el.attr({ '.big': { opacity: .5 } });
    
    equal(elView.$('.big').attr('opacity'), .5, '.5 opacity was correctly set by attr()');
    
});

test('removeAttr()', function() {

    var el = new joint.shapes.basic.Generic({
        position: { x: 20, y: 30 },
        markup: '<rect class="big"/><rect class="small"/>',
        attrs: {
            '.big': { width: 100, height: 50, fill: 'gray', stroke: 'pink' },
            '.small': { width: 10, height: 10, fill: 'red' }
        }
    });

    this.graph.addCell(el);

    var elView = this.paper.findViewByModel(el);

    equal(elView.$('.big').attr('stroke'), 'pink', 'A stroke is set on the element');

    el.removeAttr('.big/stroke');

    equal(elView.$('.big').attr('stroke'), undefined, 'The stroke was correctly unset from the element by removeAttr()');

    var link = new joint.dia.Link({
        source: { x: 100, y: 100 },
        target: { x: 200, y: 200 },
        attrs: {
            '.connection': { width: 100, height: 50, fill: 'gray', 'stroke-width': 2 }
        }
    });

    this.graph.addCell(link);

    var linkView = this.paper.findViewByModel(link);

    equal(linkView.$('.connection').attr('stroke-width'), '2', 'A stroke is set on the link');

    link.removeAttr('.connection/stroke-width');

    equal(linkView.$('.connection').attr('stroke-width'), undefined, 'The stroke was correctly unset from the link by removeAttr()');

});


test('prop()', function() {

    var el = new joint.shapes.basic.Rect({
	flat: 5,
	object: { nested: { value: 'foo' }, nested2: { value: 'bar' } },
	array: [[5], [{ value: ['bar'] }]],
        a: { b: { c: 1 }}
    });

    equal(el.prop('flat'), 5, 'flat value returned in getter');
    equal(el.prop('object/nested/value'), 'foo', 'nested object value returned in getter');
    deepEqual(el.prop('array/0'), [5], 'nested array returned in getter');
    equal(el.prop('array/0/0'), 5, 'value in nested array returned in getter');
    deepEqual(el.prop('array/1/0/value'), ['bar'], 'object in nested array returned in getter');
    equal(el.prop('array/1/0/value/0'), 'bar', 'value in nested object in nested array returned in getter');

    el.prop('array/1/0/value/0', 'baz');
    equal(el.prop('array/1/0/value/0'), 'baz', 'value in nested object in nested array set correctly');
    ok(_.isArray(el.prop('array/1/0/value')), 'type of the nested array was preserved');
    ok(_.isObject(el.prop('array/1/0')), 'type of the nested object was preserved');
    ok(_.isArray(el.prop('array/1')), 'type of the nested array was preserved');
    ok(_.isArray(el.prop('array')), 'type of the top level array was preserved');

    el.prop('array/1/0/value', { s: 'baz' });
    deepEqual(el.prop('array/1/0/value'), { s: 'baz' }, 'value in nested object in nested array set correctly');
    ok(_.isObject(el.prop('array/1/0/value')), 'type of the object was changed');

    el.prop('array/2', 10);
    ok(_.isArray(el.prop('array')), 'type of the top level array was preserved after adding new item');
    equal(el.prop('array/2'), '10', 'value of the newly added array item is correct');

    el.prop({ array: [['foo']] });
    ok(_.isArray(el.prop('array')), 'type of the top level array was preserved after changing an item');
    equal(el.prop('array/0/0'), 'foo', 'value of the newly added array item is correct');    
    ok(_.isArray(el.prop('array/0')), 'type of the nested array is correct');

    var called = false;
    el.once('change:array', function(cell, changed, opt) {
	ok(opt.flag, 'options object was correctly passed in path syntax of prop');
	called = true;
    });
    el.prop('array/0', 'something', { flag: true });
    ok(called, 'on change callback with options passed was called');

    called = false;
    el.once('change:array', function(cell, changed, opt) {
	ok(opt.flag, 'options object was correctly passed in object syntax of prop');
	called = true;
    });
    el.prop({ array: ['something else'] }, { flag: true });
    ok(called, 'on change callback with options passed was called');

    el.prop('object/nested', 'baz');
    deepEqual(el.prop('object/nested2'), { value: 'bar' }, 'value in untouched nested object was preserved');    
    equal(el.prop('object/nested'), 'baz', 'value in nested object was changed');

    el.prop('a/b', { d: 2 }, { rewrite: true });
    deepEqual(el.prop('a/b'), { d: 2 }, 'rewrite mode doesn\'t merge values');
});

test('removeProp()', function() {

    expect(4);

    var el = new joint.dia.Cell({
	flat: 6,
        nested: { a: 4, b: 5 }
    });

    el.removeProp('NonExisting');

    deepEqual(el.attributes, {
        id: el.id,
	flat: 6,
        nested: { a: 4, b: 5 }
    }, 'Removing a non-existing property won\'t affect the model\'s attributes.');

    el.removeProp('flat');

    ok(!el.has('flat'), 'A flat property was unset from the model.');

    el.removeProp('nested/a');

    deepEqual(el.get('nested'), { b: 5 }, 'A nested property was unset from the model.');

    el.on('change', function(cell, opt) {
        ok(opt.OPT_PRESENT, 'Options are propagated to the underlying model method.');
    });

    el.removeProp('nested/b', { OPT_PRESENT: true });
});

test('toBack(), toFront()', function() {

    var r1 = new joint.shapes.basic.Rect;
    var r2 = new joint.shapes.basic.Rect;

    this.graph.addCell(r1);
    this.graph.addCell(r2);

    var r1View = this.paper.findViewByModel(r1);
    var r2View = this.paper.findViewByModel(r2);
    
    notEqual(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element is before r2 element in the DOM');

    r1.toFront();

    equal(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element moved after r2 element in the DOM after toFront()');

    r1.toBack();

    notEqual(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element moved back before r2 element in the DOM after toBack()');
});

test('toBack(), toFront() with { deep: true } option', function() {

    var a1 = new joint.shapes.basic.Rect;
    var a2 = new joint.shapes.basic.Rect;
    var a3 = new joint.shapes.basic.Rect;
    var a4 = new joint.shapes.basic.Rect;

    a1.embed(a2).embed(a3.embed(a4));

    var b1 = new joint.shapes.basic.Rect;
    var b2 = new joint.shapes.basic.Rect;

    this.graph.addCells([b1, a1, a2, a3, a4, b2]);

    var a1View = this.paper.findViewByModel(a1);
    var a2View = this.paper.findViewByModel(a2);
    var a3View = this.paper.findViewByModel(a3);
    var a4View = this.paper.findViewByModel(a4);
    var b1View = this.paper.findViewByModel(b1);
    var b2View = this.paper.findViewByModel(b2);
    
    equal(b2View.$el.nextAll('.basic.Rect').length, 0, 'element b2 after a1 element in the DOM');
    equal(b1View.$el.prevAll('.basic.Rect').length, 0, 'element b1 before a1 element in the DOM');

    a1.toFront({ deep: true });

    equal(_.unique(a1View.$el.prevAll('.basic.Rect').toArray().concat([b1View.el, b2View.el])).length, 2, 'a1 element moved after b1,b2 element in the DOM after toFront()');
    ok(a4View.$el.prev('.basic.Rect')[0] == a3View.el || a4View.$el.prev('.basic.Rect')[0] == a2View.el, 'and a4 element moved after a3 or a2 element');
    ok(a2View.$el.prev('.basic.Rect')[0] == a1View.el || a3View.$el.prev('.basic.Rect')[0] == a1View.el, 'and a2 or a3 element moved just after a1 element');

    a1.toBack({ deep: true });

    equal(a1View.$el.prevAll('.basic.Rect').length, 0, 'a1 element moved back before a2,a3,a4,b1,b2 elements in the DOM after toBack()');
    ok(a4View.$el.prev('.basic.Rect')[0] == a3View.el || a4View.$el.prev('.basic.Rect')[0] == a2View.el, 'and a4 element moved after a3 or a2 element');
    ok(a2View.$el.prev('.basic.Rect')[0] == a1View.el || a3View.$el.prev('.basic.Rect')[0] == a1View.el, 'and a2 or a3 element moved just after a1 element');

});



test('clone()', function() {

    var r1 = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(r1);

    var r2 = r1.clone();
    this.graph.addCell(r2);

    var textEls = this.paper.svg.getElementsByTagName('text');
    var rectEls = this.paper.svg.getElementsByTagName('rect');

    equal(textEls.length, 2, 'there are exactly two <text> elements in the paper');
    equal(rectEls.length, 2, 'there are exactly two <rect> elements in the paper');

    equal(textEls[0].textContent, 'my rectangle', 'text element has a proper content');
    equal(textEls[1].textContent, 'my rectangle', 'text element of the cloned element has a proper content');

    checkBbox(this.paper, r2, 20, 30, 120, 80, 'cloned element is at the exact same position as the original element');

    // Check correct offset of the element when translate() is called before appending the element to the paper.
    // This is critical as in this situation, render() is called after translate() and should therefore
    // reset the transformation attribute of the element.
    var r3 = r1.clone();
    r3.translate(50);
    this.graph.addCell(r3);
    checkBbox(this.paper, r3, 70, 30, 120, 80, 'cloned element is offset by 50px to the right of the original element if translate() was called before appending it to the paper');

    // Deep clone.

    r1.embed(r2);
    var l = new joint.dia.Link({ source: { id: r1.id }, target: { id: r2.id } });
    this.graph.addCell(l);
    var clones = r1.clone({ deep: true });

    equal(clones.length, 3, 'deep clone returned three clones for a parent element with one child connected with a link');
    equal(clones[0].id, clones[1].get('parent'), 'clone of the embedded element gets a parent attribute set to the clone of the parent element');
});

test('embed(), unembed()', function() {

    var r1 = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(r1);

    var r2 = r1.clone();
    this.graph.addCell(r2);

    r1.embed(r2);

    r1.translate(50);
    
    checkBbox(this.paper, r1, 70, 30, 120, 80, 'translate(50) should translate the parent element by 50px');
    checkBbox(this.paper, r2, 70, 30, 120, 80, 'embedded element should translate the same as the parent element');
    equal(r2.get('parent'), r1.id, 'embedded element gains the parent attribute pointing to its parent cell');

    r1.unembed(r2);

    r1.translate(-50);
    checkBbox(this.paper, r1, 20, 30, 120, 80, 'translate(-50) should translate the parent element by -50px');
    checkBbox(this.paper, r2, 70, 30, 120, 80, 'unembedded element should stay at the same position when its old parent got translated');
    equal(r2.get('parent'), undefined, 'embedded element gets its parent attribute pointing to its parent cell removed');

    r1.embed(r2);
    r2.remove();
    deepEqual(r1.get('embeds'), [], 'embedded element got removed from the embeds array of its parent when the embedded element remove() was called.');
});

test('isEmbeddedIn()', function() {

    var r1 = new joint.shapes.basic.Rect;
    var r2 = r1.clone();
    var r3 = r1.clone();

    r1.embed(r2);
    r2.embed(r3);

    this.graph.addCells([r1,r2,r3]);

    ok(!r1.isEmbeddedIn(r1), 'We have 3 elements. r3 is embedded in r2, r2 is embedded in r1. | r1 is not child of r1. ');
    ok(r2.isEmbeddedIn(r1), 'r2 is descendent of r1');
    ok(r3.isEmbeddedIn(r1), 'r3 is descendent of r1');
    ok(r3.isEmbeddedIn(r1, { deep: false }), 'r3 is not direct child of r1 (option { deep: false })');
    ok(!r1.isEmbeddedIn(r3), 'r1 is not descendent of r3');
});

test('findMagnet()', function() {

    var r1 = new joint.shapes.basic.Rect({
        attrs: { text: { text: 'my\nrectangle' } }
    });

    this.graph.addCell(r1);

    var r1View = this.paper.findViewByModel(r1);

    var magnet = r1View.findMagnet('tspan');
    equal(magnet, r1View.el, 'should return the root element of the view if there is no subelement with magnet attribute set to true');

    r1.attr({ text: { magnet: true } });
    magnet = r1View.findMagnet('tspan');
    equal(magnet, r1View.$('text')[0], 'should return the text element that has the magnet attribute set to true even though we passed the child <tspan> in the selector');
});

test('getSelector()', function() {

    var r1 = new joint.shapes.basic.Rect;

    this.graph.addCell(r1);

    var r1View = this.paper.findViewByModel(r1);

    var selector = r1View.getSelector(r1View.$('text')[0]);
    equal(r1View.$(selector)[0], r1View.$('text')[0], 'applying the selector returned from getSelector() should point to the selected element');
});

test('ref-x, ref-y, ref', function() {

    var el = new joint.shapes.basic.Generic({
        markup: '<rect class="big"/><rect class="small"/><rect class="smaller"/>',
        attrs: {
            '.big': { width: 100, height: 50, fill: 'gray' },
            '.small': { width: 10, height: 10, 'ref-x': 20, 'ref-y': 10, fill: 'red' },
            '.smaller': { width: 5, height: 5, 'ref-x': 20, 'ref-y': 10, ref: '.small', fill: 'black' }
        }
    });

    this.graph.addCell(el);

    var elView = this.paper.findViewByModel(el);

    // Range [1, x]
    
    var smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);
    
    deepEqual(
        { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
        { x: 20, y: 10, width: 10, height: 10 },
        'ref-x: 20, ref-y: 10 attributes should offset the element by 20px in x axis and 10px in y axis'
    );

    // Range [0, 1]
    
    el.attr({ '.small': { 'ref-x': .5, 'ref-y': .5 } });
    
    smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);
    
    deepEqual(
        { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
        { x: 50, y: 25, width: 10, height: 10 },
        'ref-x: .5, ref-y: .5 attributes should position the element in the center, i.e. at [50, 25] coordinate'
    );

    // Range [-x, 0]

    el.attr({ '.small': { 'ref-x': -10, 'ref-y': -15 } });
    
    smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);
    
    deepEqual(
        { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
        { x: -10, y: -15, width: 10, height: 10 },
        'ref-x: -10, ref-y: -15 attributes should offset the element from the left by 10px and from the top  by 15px'
    );

    var smallerRectBbox = V(elView.$('.smaller')[0]).bbox(false, elView.el);

    deepEqual(
        { x: smallerRectBbox.x, y: smallerRectBbox.y, width: smallerRectBbox.width, height: smallerRectBbox.height },
        { x: smallRectBbox.x + 20, y: smallRectBbox.y + 10, width: 5, height: 5 },
        'ref-x: 20, ref-y: 10 and ref set to .small should offset the element by 20px in x axis and 10px in y axis with respect to the x-y coordinate of the .small element'
    );
});

test('ref-dx, ref-dy, ref', function() {

    var el = new joint.shapes.basic.Generic({
        markup: '<rect class="big"/><rect class="small"/><rect class="smaller"/>',
        attrs: {
            '.big': { width: 100, height: 50, fill: 'gray' },
            '.small': { width: 10, height: 10, 'ref-dx': 20, 'ref-dy': 10, fill: 'red' },
            '.smaller': { width: 5, height: 5, 'ref-dx': 10, 'ref-dy': 10, ref: '.small', fill: 'black' }
        }
    });

    this.graph.addCell(el);

    var elView = this.paper.findViewByModel(el);

    var smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);
    
    deepEqual(
        { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
        { x: 120, y: 60, width: 10, height: 10 },
        'ref-dx: 20, ref-dy: 10 attributes should offset the element by 20px in x axis and 10px in y axis with respect to the right-bottom coordinate of the ref element'
    );

    var smallerRectBbox = V(elView.$('.smaller')[0]).bbox(false, elView.el);

    deepEqual(
        { x: smallerRectBbox.x, y: smallerRectBbox.y, width: smallerRectBbox.width, height: smallerRectBbox.height },
        { x: smallRectBbox.x + smallRectBbox.width + 10, y: smallRectBbox.y + smallRectBbox.height + 10, width: 5, height: 5 },
        'ref-dx: 10, ref-dy: 10 with ref set to .small should offset the element by 10px in x axis and 10px in y axis with respect to the right-bottom coordinate of the .small element'
    );
});

 test('ref-width, ref-height', function() {

    var el = new joint.shapes.basic.Generic({
        markup: '<rect class="big"/><rect class="small"/><rect class="smaller"/>',
        attrs: {
            '.big': { width: 100, height: 50, fill: 'gray' },
            '.small': { 'ref-width': .5, 'ref-height': .4, ref: '.big', fill: 'red' },
            '.smaller': { 'ref-width': 10, 'ref-height': -10, ref: '.small', fill: 'black' }
        }
    });

    this.graph.addCell(el);

    var elView = this.paper.findViewByModel(el);

    var smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

    // Range [0, 1]

    deepEqual(
        { width: smallRectBbox.width, height: smallRectBbox.height },
        { width: 50, height: 20 },
        'ref-width: .5, ref-height: .4 attributes should set the element size to 50x20.'
    );

    var smallerRectBbox = V(elView.$('.smaller')[0]).bbox(false, elView.el);

    // Range [-x, 0] && [1, x]

    deepEqual(
        { width: smallerRectBbox.width, height: smallerRectBbox.height },
        { width: 60, height: 10 },
        'ref-width: 10, ref-height: -10 attributes referenced to the previous element should set the element size to 60x10.'
    );

    // Margin value 1

    el.attr({ '.small': { 'ref-width': 1, 'ref-height': 1 } });

    smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

    deepEqual(
        { width: smallRectBbox.width, height: smallRectBbox.height },
        { width: 100, height: 50 },
        'ref-width: 1, ref-height: 1 attributes element should set the exact referenced element size 100x50.'
    );

    el.attr({ '.small': { 'ref-width': 0 } });

    smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

     ok(smallRectBbox.width === 0, 'ref-width: 0 attribute element should set its width to 0.');

});

test('x-alignment, y-alignment', function() {

    var el = new joint.shapes.basic.Generic({
        markup: '<rect class="big"/><rect class="small"/>',
        attrs: {
            '.big': { width: 100, height: 50, fill: 'gray' },
            '.small': { width: 20, height: 20, 'ref-x': .5, 'ref-y': .5, 'y-alignment': 'middle', 'x-alignment': 'middle', fill: 'red' }
        }
    });

    this.graph.addCell(el);

    var elView = this.paper.findViewByModel(el);

    var smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);
    
    deepEqual(
        { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
        { x: 40, y: 15, width: 20, height: 20 },
        'ref-x: .5, ref-y: .5, x-alignment: middle, y-alignment: middle aligns the element center with the root center'
    );
});

test('gradient', function() {

    var el = new joint.shapes.basic.Rect;
    this.graph.addCell(el);

    var elView = this.paper.findViewByModel(el);

    var defs = this.paper.svg.querySelector('defs');
    var defsChildrenCount = $(defs).children().length;
    equal(defsChildrenCount, 0, 'there is no element in the <defs> by default.');
    
    el.attr('rect/fill', {
        type: 'linearGradient',
        stops: [
            { offset: '0%', color: 'red' },
            { offset: '20%', color: 'blue' }
        ]
    });

    // PhantomJS fails to lookup linearGradient with `querySelectorAll()` (also with jQuery).
    // Therefore, we use the following trick to check whether the element is in DOM.
    defsChildrenCount = $(defs).children().length;
    equal(defsChildrenCount, 1, 'one element got created in <defs>.');

    var linearGradient = $(defs).children()[0];
    
    equal(linearGradient.tagName.toLowerCase(), 'lineargradient', 'one <linearGradient> element got created in <defs>.');
    equal('url(#' + linearGradient.id + ')', elView.$('rect').attr('fill'), 'fill attribute pointing to the newly created gradient with url()');

    el.attr('rect/stroke', {
        type: 'linearGradient',
        stops: [
            { offset: '0%', color: 'red' },
            { offset: '20%', color: 'blue' }
        ]
    });

    defsChildrenCount = $(defs).children().length;

    equal(defsChildrenCount, 1, 'one element is in <defs>.');

    linearGradient = $(defs).children()[0];

    equal(linearGradient.tagName.toLowerCase(), 'lineargradient', 'still only one <linearGradient> element is in <defs>.');
    equal('url(#' + linearGradient.id + ')', elView.$('rect').attr('stroke'), 'stroke attribute pointing to the correct gradient with url()');
});

test('filter', function() {

    var el = new joint.shapes.basic.Rect;
    var el2 = new joint.shapes.basic.Rect;
    this.graph.addCells([el, el2]);

    var elView = this.paper.findViewByModel(el);
    var el2View = this.paper.findViewByModel(el2);

    var defs = this.paper.svg.querySelector('defs');
    
    var defsChildrenCount = $(defs).children().length;
    equal(defsChildrenCount, 0, 'there is no element in the <defs> by default.');

    el.attr('rect/filter', { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } });

    // PhantomJS fails to lookup linearGradient with `querySelectorAll()` (also with jQuery).
    // Therefore, we use the following trick to check whether the element is in DOM.

    defsChildrenCount = $(defs).children().length;
    equal(defsChildrenCount, 1, 'one element got created in <defs>.');

    var filter = $(defs).children()[0];
    
    equal(filter.tagName.toLowerCase(), 'filter', 'one <filter> element got created in <defs>.');
    equal('url(#' + filter.id + ')', elView.$('rect').attr('filter'), 'filter attribute pointing to the newly created filter with url()');

    el2.attr('rect/filter', { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } });

    defsChildrenCount = $(defs).children().length;
    equal(defsChildrenCount, 1, 'one element still in <defs>.');

    filter = $(defs).children()[0];

    equal(filter.tagName.toLowerCase(), 'filter', 'still only one <filter> element is in <defs>.');
    equal('url(#' + filter.id + ')', el2View.$('rect').attr('filter'), 'filter attribute pointing to the correct gradient with url()');

    el.attr('rect/filter', { name: 'blur', args: { x: 5 } });

    defsChildrenCount = $(defs).children().length;
    equal(defsChildrenCount, 2, 'now two elements are in <defs>.');
    var filter0 = $(defs).children()[0];
    var filter1 = $(defs).children()[1];
    deepEqual([filter0.tagName.toLowerCase(), filter1.tagName.toLowerCase()], ['filter', 'filter'], 'both elements in <defs> are <filter> elements.');
    notEqual(filter0.id, filter1.id, 'both <filter> elements have different IDs');

    equal('url(#' + filter0.id + ')', el2View.$('rect').attr('filter'), 'filter attribute pointing to the correct gradient with url()');
    equal('url(#' + filter1.id + ')', elView.$('rect').attr('filter'), 'filter attribute pointing to the correct gradient with url()');
});

asyncTest('transition: sanity', 5, function() {

    var p0 = true, p1 = true, p2 = true;

    var el = new joint.shapes.basic.Rect({
	property: 1
    });

    this.graph.addCell(el);

    el.transition('property', 3, {
	valueFunction: function(a, b) {

	    equal(a, 2, 'The method passes the current value to a valueFunction as start.');
	    equal(b, 3, 'The method passes the requested value to a valueFunction as end.');

	    return function(t) {

		if (t < .1 && p0) {
		    ok(true, 'Transition starts.');
		    p0 = false;
		};

		if (t > .1 && t < .9 && p1) {
		    ok(true, 'Transition runs.');
		    p1 = false;
		}

		if (t > .9 && p2) {
		    ok(true, 'Transition ends.');
		    p2 = false;
		    start();
		}

		return 0;
	    }
	}
    });

    el.set('property', 2);
});

asyncTest('transition: primitive value', function() {

    var el = new joint.shapes.basic.Rect({
	timer: -1
    });

    this.graph.addCell(el);

    var timerArray = [];

    el.transition('timer', 100, {
	delay: 100,
	duration: 100,
	valueFunction: function(a, b) { return function(t) { return t; }}
    });

    el.on('change:timer', function(cell, changed) { timerArray.push(changed); });

    setTimeout(function() {

	var timerMedian = timerArray[Math.floor(timerArray.length / 2)];

	equal(el.get('timer'), 1, 'The transition sets the primitive property.');

	deepEqual(timerArray.sort(), timerArray, 'The transition changes the primitive property gradually, ');

	ok(0 < timerMedian && timerMedian < 1, 'The transition median value is between min and max.');

	start();

    }, 300);

});

asyncTest('transition: nested value', function() {

    var el = new joint.shapes.basic.Rect({
	nested: {
	    timer: -1,
	    other: 'nochange'
	}
    });

    this.graph.addCell(el);

    var timerArray = [];

    el.transition('nested/timer', 100, {
	delay: 100,
	duration: 100,
	valueFunction: function(a, b) { return function(t) { return t; }}
    });

    el.on('change:nested', function(cell, changed) { timerArray.push(changed.timer); });

    setTimeout(function() {

	var timerMedian = timerArray[Math.floor(timerArray.length / 2)];

	equal(el.get('nested').timer, 1, 'The transition sets the nested property.');

	equal(el.get('nested').other, 'nochange', "The transition affects no other property.");

	deepEqual(timerArray.sort(), timerArray, 'The transition changes the nested property gradually, ');

	ok(0 < timerMedian && timerMedian < 1, 'The transition median value is between min and max.');

	start();

    }, 300);

});

test('graph.getCommonAncestor()', function() {

    var r1 = new joint.shapes.basic.Rect;
    var r2 = new joint.shapes.basic.Rect;
    var r3 = new joint.shapes.basic.Rect;
    var r4 = new joint.shapes.basic.Rect;
    var r5 = new joint.shapes.basic.Rect;
    var r6 = new joint.shapes.basic.Rect;
    var r7 = new joint.shapes.basic.Rect;

    r1.embed(r2.embed(r4).embed(r5)).embed(r3.embed(r6));

    this.graph.addCells([r1,r2,r3,r4,r5,r6,r7]);

    ok(!this.graph.getCommonAncestor(), 'r1 embeds r2 and r3. r2 embeds r4 and r5. r3 embeds r6. r1 and r7 have no parents. Calling getCommonAncestor() returns no common ancestor.');
    equal((this.graph.getCommonAncestor(r2) || {}).id, r2.id, 'Common ancestor for r2 is r2.');
    equal((this.graph.getCommonAncestor(r2,r3) || {}).id, r1.id, 'Common ancestor for r2 and r3 is r1.');
    equal((this.graph.getCommonAncestor(r2,r3,r4) || {}).id, r1.id, 'Common ancestor for r2,r3 and r4 is r1');
    ok(!this.graph.getCommonAncestor(r2,r3,r7), 'There is no common ancestor for r2,r3 and r5');
    equal((this.graph.getCommonAncestor(r2,r3,r1) || {}).id, r1.id, 'Common ancestor for r2,r3 and r1 is r1');
    equal((this.graph.getCommonAncestor(r5,r4) || {}).id, r2.id, 'Common ancestor for r5 and r4 is r2');
    equal((this.graph.getCommonAncestor(r5,r6) || {}).id, r1.id, 'Common ancestor for r5 and r6 is r1');
});

test('cell.getAncestors()', function() {

    var r0 = new joint.shapes.basic.Rect;
    var r1 = new joint.shapes.basic.Rect;
    var r2 = new joint.shapes.basic.Rect;
    var r3 = new joint.shapes.basic.Rect;
    var r4 = new joint.shapes.basic.Rect;
    var r5 = new joint.shapes.basic.Rect;

    r1.embed(r2.embed(r4).embed(r5));

    this.graph.addCells([r1,r2,r3,r4,r5]);

    deepEqual(r0.getAncestors(), [], 'A cell that is not part of a collection has no ancestors.');
    deepEqual(r1.getAncestors(), [], 'A cell with no parent has no ancestors.');
    deepEqual(_.pluck(r2.getAncestors(), 'id'), [r1.id], 'A cell embedded in a parent with no ancestor has exactly one ancestor.');
    deepEqual(_.pluck(r5.getAncestors(), 'id'), [r2.id, r1.id], 'If a cell has more than one ancestor, the ancesotrs are sorted from the parent to the most distant ancestor.');
});

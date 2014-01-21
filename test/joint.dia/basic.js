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

test('getBBox()', function() {

    var myrect = new joint.shapes.basic.Rect({
        position: { x: 20, y: 30 },
        size: { width: 120, height: 80 },
        attrs: { text: { text: 'my rectangle' } }
    });

    this.graph.addCell(myrect);

    var bbox = this.paper.findViewByModel(myrect).getBBox();
    equal(bbox.x, 20, 'bbox.x is correct');
    equal(bbox.y, 30, 'bbox.y is correct');
    equal(bbox.width, 120, 'bbox.width is correct');
    equal(bbox.height, 80, 'bbox.height is correct');
    
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

    /*
    // Rotation around a point is not supported yet.
    myrect.rotate(90, 0, 0);
    checkBbox(this.paper, myrect, -60, 30, 80, 120, 'rotate(90, 0, 0) should rotate the object around the viewport origin');
    */

    /*
    // This is exactly the same as a series of transforms: translate(centerX, centerY), rotate(deg), translate(-centerX, -centerY)
    myrect.rotate(90, 0, 0);
    var bbox = this.paper.findViewByModel(myrect).getBBox();
    myrect.rotate(-90, 0, 0);

    myrect.translate(-20, -30);
    myrect.rotate(90);
    myrect.translate(20, 30);

    checkBbox(this.paper, myrect, bbox.x, bbox.y, bbox.width, bbox.height, 'rotate(90, 0, 0)');
    */
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
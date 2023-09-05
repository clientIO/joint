QUnit.module('basic', function(hooks) {

    hooks.beforeEach(function() {

        const fixtureEl = fixtures.getElement();
        const paperEl = document.createElement('div');
        fixtureEl.appendChild(paperEl);
        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({
            el: paperEl,
            gridSize: 10,
            model: this.graph
        });
    });

    hooks.afterEach(function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });

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

    QUnit.test('construction', function(assert) {

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });

        this.graph.addCell(myrect);

        assert.strictEqual(myrect.constructor, joint.shapes.basic.Rect, 'myrect.constructor === joint.shapes.basic.Rect');

        var textEls = this.paper.svg.getElementsByTagName('text');
        var rectEls = this.paper.svg.getElementsByTagName('rect');

        assert.equal(textEls.length, 1, 'there is exactly one <text> element in the paper');
        assert.equal(rectEls.length, 1, 'there is exactly one <rect> element in the paper');

        assert.equal(textEls[0].textContent, V.sanitizeText('my rectangle'), 'text element has a proper content');
    });

    QUnit.test('async: resetCells', function(assert) {

        var done = assert.async();

        var r1 = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });
        var r2 = r1.clone();
        var r3 = r1.clone();

        this.paper.options.async = { batchSize: 1 };
        this.paper.on('render:done', function() {

            var textEls = this.paper.svg.getElementsByTagName('text');
            var rectEls = this.paper.svg.getElementsByTagName('rect');

            assert.equal(textEls.length, 3, 'there is exactly 3 <text> elements in the paper');
            assert.equal(rectEls.length, 3, 'there is exactly 3 <rect> elements in the paper');

            assert.equal(textEls[0].textContent, V.sanitizeText('my rectangle'), 'text element has a proper content');

            done();
        }, this);

        this.graph.resetCells([r1, r2, r3]);
    });

    QUnit.test('async: addCells', function(assert) {

        this.paper.options.async = true;
        this.paper.unfreeze();

        var done = assert.async();
        var r1 = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });
        var r2 = r1.clone();
        var r3 = r1.clone();
        var r4 = r1.clone();
        var r5 = r1.clone();

        this.graph.addCells([r1, r2]);

        this.paper.on('render:done', function() {

            var textEls = this.paper.svg.getElementsByTagName('text');
            var rectEls = this.paper.svg.getElementsByTagName('rect');

            assert.equal(textEls.length, 5, 'there is exactly 5 <text> elements in the paper');
            assert.equal(rectEls.length, 5, 'there is exactly 5 <rect> elements in the paper');

            assert.equal(textEls[0].textContent, V.sanitizeText('my rectangle'), 'text element has a proper content');

            done();

        }, this);

        this.graph.addCells([r3, r4, r5]);
    });

    QUnit.test('getBBox()', function(assert) {

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });

        this.graph.addCell(myrect);

        var view = this.paper.findViewByModel(myrect);
        var bbox = view.getBBox();

        assert.equal(bbox.x, 20, 'bbox.x is correct');
        assert.equal(bbox.y, 30, 'bbox.y is correct');
        assert.equal(bbox.width, 120, 'bbox.width is correct');
        assert.equal(bbox.height, 80, 'bbox.height is correct');

        myrect.attr('text', { ref: 'rect', 'ref-y': 100 });

        bbox = view.getBBox({ useModelGeometry: false });

        assert.ok(bbox.height > 80, 'Translating text outside the rect: bbox.width grew.');
        assert.equal(bbox.x, 20, 'bbox.x is correct');
        assert.equal(bbox.y, 30, 'bbox.y is correct');
        assert.equal(bbox.width, 120, 'bbox.width is correct');

        bbox = view.getBBox({ useModelGeometry: true });

        assert.equal(bbox.x, 20, 'Using model geometry: bbox.x is correct');
        assert.equal(bbox.y, 30, 'bbox.y is correct');
        assert.equal(bbox.width, 120, 'bbox.width is correct');
        assert.equal(bbox.height, 80, 'bbox.height is correct');

    });

    QUnit.test('z index', function(assert) {

        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;
        var r3 = new joint.shapes.basic.Rect;

        this.graph.addCell(r1);
        this.graph.addCell(r2);
        this.graph.addCell(r3);

        assert.ok(r1.get('z') < r2.get('z'), 'z index of the first added cell is lower than that of the second one');
        assert.ok(r2.get('z') < r3.get('z'), 'z index of the second added cell is lower than that of the third one');

        // Test removing/adding new cells to cover https://github.com/clientIO/JointJS_plus/issues/21.
        r1.remove();
        var r4 = new joint.shapes.basic.Rect;
        this.graph.addCell(r4);
        assert.ok(r2.get('z') < r3.get('z'), 'z index of the second added cell is lower than that of the third one');
        assert.ok(r3.get('z') < r4.get('z'), 'z index of the third added cell is lower than that of the fourth, newly added, one');
    });

    QUnit.test('position()', function(assert) {

        var r1 = new joint.shapes.basic.Rect({
            position: { x: 100, y: 100 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });
        var r2 = new joint.shapes.basic.Rect({
            position: { x: 10, y: 10 },
            size: { width: 30, height: 30 }
        });

        r1.addTo(this.graph);
        assert.checkBbox(
            this.paper,
            r1, 100, 100, 120, 80,
            'getter "position()" returns the elements position.'
        );

        r1.position(200, 200);
        assert.checkBbox(
            this.paper,
            r1,
            200, 200, 120, 80,
            'setter "position(a, b)" should move element to the given position.'
        );

        // parentRelative option

        assert.throws(function() {
            r2.position(100, 100, { parentRelative: true });
        }, 'getter throws an error if "parentRelative" option passed and the element is not part of any collection.');

        assert.throws(function() {
            r2.position({ parentRelative: true });
        }, 'getter throws an error if "parentRelative" option passed and the element is not part of any collection.');

        r2.addTo(this.graph);

        assert.deepEqual(
            r2.position({ parentRelative: true }),
            r2.position(),
            'getter with "parentRelative" option works in same way as getter without this option for an unembed element.'
        );

        r1.embed(r2);
        r2.position(10, 10, { parentRelative: true });
        assert.checkBbox(
            this.paper,
            r2,
            210, 210, 30, 30,
            'setter "position(a, b)" with "parentRelative" option should move element to the position relative to its parent.'
        );

        assert.equal(
            r2.position({ parentRelative: true }).toString(),
            '10@10',
            'getter with "parentRelative" option returns position relative to the element parent.'
        );

        // deep options

        r1.position(30, 30, { deep: true });
        assert.equal(
            r1.position().toString(),
            '30@30',
            'setter with deep option sets the correct position on the element'
        );
        assert.equal(
            r2.position().toString(),
            '40@40',
            'and moves the child to keep the original distance from the element origin'
        );

        var size = r1.size();
        r1.position(400, 400, {
            restrictedArea: { x: 0, y: 0, width: 80 + size.width, height: 220 + size.height }
        });
        assert.equal(
            r1.position().toString(),
            '80@220',
            'setter respects the restrictedArea option rect'
        );

        var raSpy = sinon.spy(function() { return { x: 11, y: 13 }; });
        var raOpt = { restrictedArea: raSpy };
        r1.position(17, 19, raOpt);
        assert.equal(
            r1.position().toString(),
            '11@13',
            'setter respects the restrictedArea option function'
        );
        assert.ok(raSpy.calledOnce);
        assert.ok(raSpy.calledOn(r1));
        assert.ok(raSpy.calledWithExactly(17, 19, raOpt));
    });

    QUnit.test('z()', function(assert) {
        const r1 = new joint.shapes.standard.Rectangle;

        assert.equal(r1.z(), 0);

        r1.set('z', 10);
        assert.equal(r1.z(), 10);

        r1.set('z', -10);
        assert.equal(r1.z(), -10);

        r1.set('z', undefined);
        assert.equal(r1.z(), 0);

        r1.set('z', null);
        assert.equal(r1.z(), 0);
    });

    QUnit.test('translate()', function(assert) {

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });

        this.graph.addCell(myrect);

        myrect.translate(50);
        assert.checkBbox(this.paper, myrect, 70, 30, 120, 80, 'translate(50) should translate by 50px in x direction only');

        myrect.translate(0, 20);
        assert.checkBbox(this.paper, myrect, 70, 50, 120, 80, 'translate(0, 20) should translate by 20px in y direction only');

        myrect.translate(10, 10);
        assert.checkBbox(this.paper, myrect, 80, 60, 120, 80, 'translate(10, 10) should translate by 10px in both x and y directions');

        myrect.translate(-10, -10);
        assert.checkBbox(this.paper, myrect, 70, 50, 120, 80, 'translate(-10, -10) should translate back by 10px in both x and y directions');
    });

    QUnit.test('translate() with restrictedArea option', function(assert) {

        var rect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 }
        });

        var embed = new joint.shapes.basic.Rect({
            position: { x: 100, y: 70 },
            size: { width: 120, height: 80 }
        });

        this.graph.addCell(rect);

        rect.translate(1000, 0, { restrictedArea: { x: 0, y: 0, height: 1000, width: 150 }});
        assert.equal(rect.prop('position/x'), 30, 'restrictedArea is respected when the element is translated to the left.');

        rect.translate(0, 1000, { restrictedArea: { x: 0, y: 0, height: 150, width: 1000 }});
        assert.equal(rect.prop('position/y'), 70, 'restrictedArea is respected when the element is translated to the bottom.');

        rect.translate(-1000, 0, { restrictedArea: { x: 10, y: 0, height: 1000, width: 1000 }});
        assert.equal(rect.prop('position/x'), 10, 'restrictedArea is respected when the element is translated to the right.');

        rect.translate(0, -1000, { restrictedArea: { x: 0, y: 10, height: 1000, width: 1000 }});
        assert.equal(rect.prop('position/y'), 10, 'restrictedArea is respected when the element is translated to the top.');

        rect.position(50, 50).embed(embed);
        this.graph.addCell(embed);

        rect.translate(1000, 0, { restrictedArea: { x: 0, y: 0, height: 1000, width: 500 }});
        assert.equal(rect.prop('position/x'), 330, 'restrictedArea is respected when the element and its embeds are translated to the left.');

        rect.translate(0, 1000, { restrictedArea: { x: 0, y: 0, height: 500, width: 1000 }});
        assert.equal(rect.prop('position/y'), 400, 'restrictedArea is respected when the element and its embeds are translated to the bottom.');

        rect.position(50, 50);
        embed.position(20, 20);

        rect.translate(-1000, 0, { restrictedArea: { x: 10, y: 0, height: 1000, width: 1000 }});
        assert.equal(rect.prop('position/x'), 40, 'restrictedArea is respected when the element and its embeds are translated to the right.');

        rect.translate(0, -1000, { restrictedArea: { x: 0, y: 10, height: 1000, width: 1000 }});
        assert.equal(rect.prop('position/y'), 40, 'restrictedArea is respected when the element and its embeds are translated to the top.');
    });

    QUnit.test('size()', function(assert) {

        assert.expect(9);

        var el = new joint.shapes.basic.Rect({
            size: { width: 1, height: 2 }
        });

        // Getter
        assert.deepEqual(el.size(), el.get('size'), 'work as getter');
        assert.notOk(el.size() === el.get('size'), 'getter clones size');

        // Setter
        assert.equal(el.size(1, 2), el, 'chaining enabled');
        assert.deepEqual(el.size(2, 3).size(), { width: 2, height: 3 }, 'set via width & height');
        assert.deepEqual(el.size({ width: 3, height: 4 }).size(), { width: 3, height: 4 }, 'set via object');
        assert.deepEqual(el.size({ width: 4 }).size(), { width: 4, height: 4 }, 'set via object with width only');
        assert.deepEqual(el.size({ height: 5 }).size(), { width: 4, height: 5 }, 'set via object with height only');

        // Setter with option
        el.on('change:size', function(model, size, opt) {
            assert.ok(opt.test);
        });

        el.size(10, 10, { test: true });
        el.size({ width: 20, height: 20 }, { test: true });
    });

    QUnit.test('resize()', function(assert) {

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: '' }}
        });

        this.graph.addCell(myrect);

        myrect.resize(120, 80);
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: 20,
            y: 30,
            width: 120,
            height: 80
        }, 'resize([same width], [same height]) should not change bbox');

        myrect.resize(240, 160);
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: 20,
            y: 30,
            width: 240,
            height: 160
        }, 'resize([2*width], [2*height]) should scale twice preserving origin as it was');

        myrect.resize(120, 80);
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: 20,
            y: 30,
            width: 120,
            height: 80
        }, 'resize([orig width], [orig height]): should scale back to the original size and origin');

        myrect.resize(200, 160, { direction: 'right' });
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: 20,
            y: 30,
            width: 200,
            height: 80
        }, 'resize([new width], [new height], { direction: "right" }) should scale only width, origin should be unchanged');

        myrect.resize(80, 240, { direction: 'bottom' });
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: 20,
            y: 30,
            width: 200,
            height: 240
        }, 'resize([new width], [new height], { direction: "bottom" }) should scale only height, origin should be unchanged');

        myrect.resize(50, 50, { direction: 'bottom-right' });
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: 20,
            y: 30,
            width: 50,
            height: 50
        }, 'resize([new width], [new height], { direction: "bottom-right" }) should scale both width and height, origin should be unchanged');

        myrect.resize(20, 20, { direction: 'top-left' });
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: 50,
            y: 60,
            width: 20,
            height: 20
        }, 'resize([new width], [new height], { direction: "top-left" }) should scale both width and height, should change position');

        myrect.resize(100, 100, { direction: 'left' });
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: -30,
            y: 60,
            width: 100,
            height: 20
        }, 'resize([new width], [new height], { direction: "left" }) should scale only width, should change position');

        myrect.resize(30, 30, { direction: 'top' });
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: -30,
            y: 50,
            width: 100,
            height: 30
        }, 'resize([new width], [new height], { direction: "top" }) should scale only height, should change position');

        myrect.resize(200, 200, { direction: 'top-right' });
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: -30,
            y: -120,
            width: 200,
            height: 200
        }, 'resize([new width], [new height], { direction: "top-right" }) should scale both width and height, should change position');

        myrect.resize(10, 10, { direction: 'bottom-left' });
        assert.checkBboxApproximately(1/* +- */, myrect.getBBox(), {
            x: 160,
            y: -120,
            width: 10,
            height: 10
        }, 'resize([new width], [new height], { direction: "bottom-left" }) should scale both width and height, should change position');
    });

    QUnit.test('rotate()', function(assert) {

        var myrect = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });

        this.graph.addCell(myrect);

        myrect.rotate(90);
        assert.checkBbox(this.paper, myrect, 40, 10, 80, 120, 'rotate(90) should rotate the object by 90 degrees around its center');

        myrect.rotate(-90);
        assert.checkBbox(this.paper, myrect, 20, 30, 120, 80, 'rotate(-90) should rotate the object back to its original angle');

        // Rotation around an origin.
        myrect.rotate(180, false, { x: 140, y: 70 });
        assert.checkBbox(this.paper, myrect, 140, 30, 120, 80, 'rotate(180, 140, 70) should rotate the object around the middle of its right edge');

        myrect.rotate(180, true, { x: 140, y: 70 });
        assert.checkBbox(this.paper, myrect, 140, 30, 120, 80, 'rotate(180, 140, 70) with absolute flag should not rotate the object as it is already rotated');
    });

    QUnit.test('object reconstruction after several transformations', function(assert) {

        var r1 = new joint.shapes.basic.Rect({
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
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

        assert.deepEqual(
            { x: r1Bbox.x, y: r1Bbox.y, width: r1Bbox.width, height: r1Bbox.height },
            { x: r2Bbox.x, y: r2Bbox.y, width: r2Bbox.width, height: r2Bbox.height },
            'bounding box of the clone of an element that has been severely transformed is the same as of the original element'
        );
    });

    QUnit.test('attr()', function(assert) {

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

        assert.equal(elView.$('.big').attr('opacity'), undefined, 'No opacity is set on the element');

        el.attr({ '.big': { opacity: .5 }});

        assert.equal(elView.$('.big').attr('opacity'), .5, '.5 opacity was correctly set by attr()');

        assert.equal(el.attr(), el.get('attrs'), 'called with no arguments returns all `attrs`');
    });

    QUnit.test('removeAttr()', function(assert) {

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

        assert.equal(elView.$('.big').attr('stroke'), 'pink', 'A stroke is set on the element');

        el.removeAttr('.big/stroke');

        assert.equal(elView.$('.big').attr('stroke'), undefined, 'The stroke was correctly unset from the element by removeAttr()');

        var link = new joint.dia.Link({
            source: { x: 100, y: 100 },
            target: { x: 200, y: 200 },
            attrs: {
                '.connection': { width: 100, height: 50, fill: 'gray', 'stroke-width': 2 }
            }
        });

        this.graph.addCell(link);

        var linkView = this.paper.findViewByModel(link);

        assert.equal(linkView.$('.connection').attr('stroke-width'), '2', 'A stroke is set on the link');

        link.removeAttr('.connection/stroke-width');

        assert.equal(linkView.$('.connection').attr('stroke-width'), undefined, 'The stroke was correctly unset from the link by removeAttr()');

    });

    QUnit.test('prop()', function(assert) {

        var el = new joint.shapes.basic.Rect({
            flat: 5,
            object: { nested: { value: 'foo' }, nested2: { value: 'bar' }},
            array: [[5], [{ value: ['bar'] }]],
            a: { b: { c: 1 }}
        });

        assert.equal(el.prop('flat'), 5, 'flat value returned in getter');
        assert.equal(el.prop('object/nested/value'), 'foo', 'nested object value returned in getter');
        assert.deepEqual(el.prop('array/0'), [5], 'nested array returned in getter');
        assert.equal(el.prop('array/0/0'), 5, 'value in nested array returned in getter');
        assert.deepEqual(el.prop('array/1/0/value'), ['bar'], 'object in nested array returned in getter');
        assert.equal(el.prop('array/1/0/value/0'), 'bar', 'value in nested object in nested array returned in getter');

        el.prop('array/1/0/value/0', 'baz');
        assert.equal(el.prop('array/1/0/value/0'), 'baz', 'value in nested object in nested array set correctly');
        assert.ok(_.isArray(el.prop('array/1/0/value')), 'type of the nested array was preserved');
        assert.ok(_.isObject(el.prop('array/1/0')), 'type of the nested object was preserved');
        assert.ok(_.isArray(el.prop('array/1')), 'type of the nested array was preserved');
        assert.ok(_.isArray(el.prop('array')), 'type of the top level array was preserved');

        el.prop('array/1/0/value', { s: 'baz' });
        assert.deepEqual(el.prop('array/1/0/value'), { s: 'baz' }, 'value in nested object in nested array set correctly');
        assert.ok(_.isObject(el.prop('array/1/0/value')), 'type of the object was changed');

        el.prop('array/2', 10);
        assert.ok(_.isArray(el.prop('array')), 'type of the top level array was preserved after adding new item');
        assert.equal(el.prop('array/2'), '10', 'value of the newly added array item is correct');

        el.prop({ array: [['foo']] });
        assert.ok(_.isArray(el.prop('array')), 'type of the top level array was preserved after changing an item');
        assert.equal(el.prop('array/0/0'), 'foo', 'value of the newly added array item is correct');
        assert.ok(_.isArray(el.prop('array/0')), 'type of the nested array is correct');

        var called = false;
        el.once('change:array', function(cell, changed, opt) {
            assert.ok(opt.flag, 'options object was correctly passed in path syntax of prop');
            called = true;
        });
        el.prop('array/0', 'something', { flag: true });
        assert.ok(called, 'on change callback with options passed was called');

        called = false;
        el.once('change:array', function(cell, changed, opt) {
            assert.ok(opt.flag, 'options object was correctly passed in object syntax of prop');
            called = true;
        });
        el.prop({ array: ['something else'] }, { flag: true });
        assert.ok(called, 'on change callback with options passed was called');

        el.prop('object/nested', 'baz');
        assert.deepEqual(el.prop('object/nested2'), { value: 'bar' }, 'value in untouched nested object was preserved');
        assert.equal(el.prop('object/nested'), 'baz', 'value in nested object was changed');

        el.prop('a/b', { d: 2 }, { rewrite: true });
        assert.deepEqual(el.prop('a/b'), { d: 2 }, 'rewrite mode doesn\'t merge values');
    });

    QUnit.test('removeProp()', function(assert) {

        assert.expect(4);

        var el = new joint.dia.Cell({
            flat: 6,
            nested: { a: 4, b: 5 }
        });

        el.removeProp('NonExisting');

        assert.deepEqual(el.attributes, {
            id: el.id,
            flat: 6,
            nested: { a: 4, b: 5 }
        }, 'Removing a non-existing property won\'t affect the model\'s attributes.');

        el.removeProp('flat');

        assert.ok(!el.has('flat'), 'A flat property was unset from the model.');

        el.removeProp('nested/a');

        assert.deepEqual(el.get('nested'), { b: 5 }, 'A nested property was unset from the model.');

        el.on('change', function(cell, opt) {
            assert.ok(opt.OPT_PRESENT, 'Options are propagated to the underlying model method.');
        });

        el.removeProp('nested/b', { OPT_PRESENT: true });
    });

    QUnit.test('removeProp()', function(assert) {

        var el = new joint.dia.Cell({
            flat: [1, 2, 3],
            nested: { a: [1, 2, 3] }
        });

        el.removeProp('flat/2');
        assert.deepEqual(el.get('flat'), [1, 2, undefined]);

        el.removeProp('nested/a/2');
        assert.deepEqual(el.get('nested'), { a: [1, 2, undefined] });
    });

    QUnit.test('toBack(), toFront()', function(assert) {

        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;

        this.graph.addCell(r1);
        this.graph.addCell(r2);

        var r1View = this.paper.findViewByModel(r1);
        var r2View = this.paper.findViewByModel(r2);

        assert.notEqual(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element is before r2 element in the DOM');

        r1.toFront();

        assert.equal(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element moved after r2 element in the DOM after toFront()');

        r1.toBack();

        assert.notEqual(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element moved back before r2 element in the DOM after toBack()');

        r1.set('z', 10);
        r2.set('z', 10);
        r1.toFront();
        assert.equal(r1View.$el.index(), 1, 'r1 - front');

        r1.set('z', 10);
        r2.set('z', 10);
        r1.toBack();
        assert.equal(r1View.$el.index(), 0, 'r1 - back');

        r1.set('z', 10);
        r2.set('z', 10);
        r2.toFront();
        assert.equal(r2View.$el.index(), 1, 'r2 - front');

        r1.set('z', 10);
        r2.set('z', 10);
        r2.toBack();
        assert.equal(r2View.$el.index(), 0, 'r2 -    back');
    });

    QUnit.test('toBack(), toFront() ignorable', function(assert) {

        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;

        this.graph.addCell(r1);
        this.graph.addCell(r2);

        var r1Z = r1.get('z');
        var r2Z = r2.get('z');

        assert.ok(r1Z < r2Z, 'r1 z is lower than r2 z');

        r2.toFront();

        assert.equal(r2.get('z'), r2Z, 'r2 doesn\'t change z during a toFront() if it is already in place');

        r1.toBack();

        assert.equal(r1.get('z'), r1Z, 'r1 doesn\'t change z during a toBack() if it is already in place');
    });

    QUnit.test('toBack(), toFront() with active batch', function(assert) {

        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;

        this.graph.addCell(r1);
        this.graph.addCell(r2);

        var spy = sinon.spy(this.paper, 'sortViews');

        var r1View = this.paper.findViewByModel(r1);
        var r2View = this.paper.findViewByModel(r2);

        assert.notEqual(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element is before r2 element in the DOM');

        r1.startBatch('to-front');
        r1.toFront();

        assert.equal(spy.callCount, 0, 'paper not sorted');
        assert.notEqual(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element not moved after r2 element in the DOM after toFront() bacause a batch is running');

        r1.stopBatch('to-front');

        assert.equal(spy.callCount, 1, 'paper sorted exactly once');
        assert.equal(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element moved after r2 element in the DOM after stopBatch()');

        r1.startBatch('to-back');
        r1.toBack();

        assert.equal(spy.callCount, 1, 'paper not sorted');
        assert.equal(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element not moved back before r2 element in the DOM after toBack() because a batch is running');

        r1.stopBatch('to-back');

        assert.equal(spy.callCount, 2, 'paper sorted exactly once');
        assert.notEqual(r2View.$el.prevAll(r1View.$el).length, 0, 'r1 element moved back before r2 element in the DOM after stopBatch()');

    });

    QUnit.test('toBack(), toFront() with { deep: true } option', function(assert) {

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

        assert.equal(b2View.$el.nextAll('[data-type="basic.Rect"]').length, 0, 'element b2 after a1 element in the DOM');
        assert.equal(b1View.$el.prevAll('[data-type="basic.Rect"]').length, 0, 'element b1 before a1 element in the DOM');

        a1.toFront({ deep: true });

        assert.equal(_.uniq(a1View.$el.prevAll('[data-type="basic.Rect"]').toArray().concat([b1View.el, b2View.el])).length, 2, 'a1 element moved after b1, b2 element in the DOM after toFront()');
        assert.ok(a4View.$el.prev('[data-type="basic.Rect"]')[0] == a3View.el || a4View.$el.prev('[data-type="basic.Rect"]')[0] == a2View.el, 'and a4 element moved after a3 or a2 element');
        assert.ok(a2View.$el.prev('[data-type="basic.Rect"]')[0] == a1View.el || a3View.$el.prev('[data-type="basic.Rect"]')[0] == a1View.el, 'and a2 or a3 element moved just after a1 element');

        a1.toBack({ deep: true });

        assert.equal(a1View.$el.prevAll('[data-type="basic.Rect"]').length, 0, 'a1 element moved back before a2, a3, a4, b1, b2 elements in the DOM after toBack()');
        assert.ok(a4View.$el.prev('[data-type="basic.Rect"]')[0] == a3View.el || a4View.$el.prev('[data-type="basic.Rect"]')[0] == a2View.el, 'and a4 element moved after a3 or a2 element');
        assert.ok(a2View.$el.prev('[data-type="basic.Rect"]')[0] == a1View.el || a3View.$el.prev('[data-type="basic.Rect"]')[0] == a1View.el, 'and a2 or a3 element moved just after a1 element');

    });

    QUnit.test('toBack(), toFront() ignore with { deep: true } option', function(assert) {

        var a1 = new joint.shapes.basic.Rect;
        var a2 = new joint.shapes.basic.Rect;
        var a3 = new joint.shapes.basic.Rect;
        var a4 = new joint.shapes.basic.Rect;

        a1.embed(a2).embed(a3.embed(a4));

        var b1 = new joint.shapes.basic.Rect;
        var b2 = new joint.shapes.basic.Rect;

        this.graph.addCells([b1, b2, a1, a2, a3, a4]);

        var a1Z = a1.get('z');
        var b1Z = b1.get('z');

        assert.ok(b1Z < a1Z, 'b root z is lower than a root z');

        a1.toFront({ deep: true });

        assert.equal(a1.get('z'), a1Z, 'a1 doesn\'t change z during a toFront() if it is already in place');

        b1.toBack({ deep: true });

        assert.equal(b1.get('z'), b1Z, 'b1 doesn\'t change z during a toFront() if it is already in place');

    });

    QUnit.module('toBack(), toFront()', function(hooks) {

        var cells, el;
        var Rect = joint.shapes.standard.Rectangle;

        hooks.beforeEach(function() {

            var a1 = new Rect({ id: 'a1' });
            var a11 = new Rect({ id: 'a11' });
            var a111 = new Rect({ id: 'a111' });
            var a112 = new Rect({ id: 'a112' });
            var a12 = new Rect({ id: 'a12' });
            var a121 = new Rect({ id: 'a121' });
            var a122 = new Rect({ id: 'a122' });
            var b1 = new Rect({ id: 'b1' });
            var c1 = new Rect({ id: 'c1' });

            cells = [b1, c1, a1, a11, a111, a112, a12, a121, a122];
            cells.forEach(function(cell) { return cell.set('z', 0); });

            a1.embed(a11.embed(a111.embed(a112)));
            a1.embed(a12.embed(a121.embed(a122)));
            this.graph.addCells(cells);
            el = a1;
        });

        [{
            // Test Case { deep: true, breadthFirst: false }
            breadthFirst: false,
            toFront: [0,0,1,2,3,4,5,6,7],
            toBack: [0,0,-7,-6,-5,-4,-3,-2,-1]

        }, {
            // Test Case { deep: true, breadthFirst: true }
            breadthFirst: true,
            toFront: [0,0,1,2,4,6,3,5,7],
            toBack: [0,0,-7,-6,-4,-2,-5,-3,-1]

        }].forEach(function(testCase) {

            QUnit.test('toBack(), toFront() > breadthFirst = ' + testCase.breadthFirst, function(assert) {

                Array.from({ length: 2 }).forEach(function() {
                    el.toFront({ deep: true, breadthFirst: testCase.breadthFirst });
                    assert.deepEqual(
                        cells.map(function(cell) { return cell.get('z'); }),
                        testCase.toFront,
                        'toFront order'
                    );
                });

                Array.from({ length: 2 }).forEach(function() {
                    el.toBack({ deep: true, breadthFirst: testCase.breadthFirst });
                    assert.deepEqual(
                        cells.map(function(cell) { return cell.get('z'); }),
                        testCase.toBack,
                        'toBack order'
                    );
                });
            });
        });
    });

    QUnit.test('toFront() preserve stacking of nested elements (z-indexes)', function(assert) {
        const Rect = joint.shapes.standard.Rectangle;

        const r1 = new Rect({ z: 1 });
        const r2 = new Rect({ z: 6 });
        const r3 = new Rect({ z: 4 });
        const r4 = new Rect({ z: 2 });

        const r5 = new Rect({ z: 3 }); // this rectangle forces r1 to go front

        r1.embed(r2);
        r1.embed(r3);
        r1.embed(r4);

        this.graph.addCells([r1, r2, r3, r4, r5]);

        r1.toFront({ deep: true });

        assert.equal(r1.get('z'), 7);
        assert.equal(r2.get('z'), 10);
        assert.equal(r3.get('z'), 9);
        assert.equal(r4.get('z'), 8);

        r1.toFront({ deep: true });
        r1.toFront({ deep: true }); // calling toFront again doesn't change anything

        assert.equal(r1.get('z'), 7);
        assert.equal(r2.get('z'), 10);
        assert.equal(r3.get('z'), 9);
        assert.equal(r4.get('z'), 8);
    });

    QUnit.test('toBack() preserve stacking of nested elements (z-indexes)', function(assert) {
        const Rect = joint.shapes.standard.Rectangle;

        const r1 = new Rect({ z: 2 });
        const r2 = new Rect({ z: 7 });
        const r3 = new Rect({ z: 5 });
        const r4 = new Rect({ z: 3 });

        const r5 = new Rect({ z: 1 }); // this rectangle forces r1 to go back

        r1.embed(r2);
        r1.embed(r3);
        r1.embed(r4);

        this.graph.addCells([r1, r2, r3, r4, r5]);

        r1.toBack({ deep: true });

        assert.equal(r1.get('z'), -3);
        assert.equal(r2.get('z'), 0);
        assert.equal(r3.get('z'), -1);
        assert.equal(r4.get('z'), -2);

        r1.toBack({ deep: true });
        r1.toBack({ deep: true }); // calling toBack again doesn't change anything

        assert.equal(r1.get('z'), -3);
        assert.equal(r2.get('z'), 0);
        assert.equal(r3.get('z'), -1);
        assert.equal(r4.get('z'), -2);
    });

    QUnit.test('toFront() with foregroundEmbeds: false', function(assert) {
        const Rect = joint.shapes.standard.Rectangle;

        const r1 = new Rect({ z: 2 });
        const r2 = new Rect({ z: 6 });
        const r3 = new Rect({ z: 4 });
        const r4 = new Rect({ z: 1 });

        const r5 = new Rect({ z: 3 }); // this rectangle forces r1 to go front

        r1.embed(r2);
        r1.embed(r3);
        r1.embed(r4);

        this.graph.addCells([r1, r2, r3, r4, r5]);

        r1.toFront({ deep: true, foregroundEmbeds: false });

        assert.equal(r1.get('z'), 8);
        assert.equal(r2.get('z'), 10);
        assert.equal(r3.get('z'), 9);
        assert.equal(r4.get('z'), 7);

        r1.toFront({ deep: true, foregroundEmbeds: false });
        r1.toFront({ deep: true, foregroundEmbeds: false }); // calling toFront again doesn't change anything

        assert.equal(r1.get('z'), 8);
        assert.equal(r2.get('z'), 10);
        assert.equal(r3.get('z'), 9);
        assert.equal(r4.get('z'), 7);
    });

    QUnit.test('toBack() with foregroundEmbeds: false', function(assert) {
        const Rect = joint.shapes.standard.Rectangle;

        const r1 = new Rect({ z: 3 });
        const r2 = new Rect({ z: 7 });
        const r3 = new Rect({ z: 5 });
        const r4 = new Rect({ z: 2 });

        const r5 = new Rect({ z: 1 }); // this rectangle forces r1 to go back

        r1.embed(r2);
        r1.embed(r3);
        r1.embed(r4);

        this.graph.addCells([r1, r2, r3, r4, r5]);

        r1.toBack({ deep: true, foregroundEmbeds: false });

        assert.equal(r1.get('z'), -2);
        assert.equal(r2.get('z'), 0);
        assert.equal(r3.get('z'), -1);
        assert.equal(r4.get('z'), -3);

        r1.toBack({ deep: true, foregroundEmbeds: false });
        r1.toBack({ deep: true, foregroundEmbeds: false }); // calling toBack again doesn't change anything

        assert.equal(r1.get('z'), -2);
        assert.equal(r2.get('z'), 0);
        assert.equal(r3.get('z'), -1);
        assert.equal(r4.get('z'), -3);
    });

    // tests for `dia.Element.fitToChildren()` can be found in `/test/jointjs/elements.js`
    QUnit.test('fitEmbeds()', function(assert) {
        // structure of objects:
        // `mainGroup` has the following children:
        // - `group1` has the following children:
        //   - `a`
        //   - `b`
        // - `group2` has the following children:
        //   - `c`

        var mainGroup = new joint.shapes.basic.Rect;
        var group1 = new joint.shapes.basic.Rect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 }});
        var group2 = new joint.shapes.basic.Rect({ position: { x: 1000, y: 1000 }, size: { width: 10, height: 10 }});
        var a = new joint.shapes.basic.Rect({ position: { x: 100, y: 100 }, size: { width: 20, height: 20 }});
        var b = new joint.shapes.basic.Rect({ position: { x: 200, y: 100 }, size: { width: 20, height: 20 }});
        var c = new joint.shapes.basic.Rect({ position: { x: 150, y: 200 }, size: { width: 20, height: 20 }});

        // embed
        mainGroup.embed(group2.embed(c)).embed(group1.embed(a).embed(b));

        // - missing graph:
        assert.throws(function() {
            a.fitEmbeds();
        }, /graph/, 'Shallow: Calling method on element that is not part of a graph throws an error.');

        assert.throws(function() {
            a.fitEmbeds({ deep: true });
        }, /graph/, 'Deep: Calling method on element that is not part of a graph throws an error.');

        // add to graph
        this.graph.addCells([mainGroup, group1, group2, a, b, c]);

        // - shallow:
        // -- no embedded children:
        a.fitEmbeds();
        assert.deepEqual(a.getBBox(), g.rect(100, 100, 20, 20), 'Shallow: Calling method on element that has no embeds has no effect.');

        mainGroup.fitEmbeds();
        assert.deepEqual(mainGroup.getBBox(), g.rect(0, 0, 1010, 1010), 'Shallow: Call takes embeds only one level deep into account.');

        mainGroup.fitEmbeds({ deep: false });
        assert.deepEqual(mainGroup.getBBox(), g.rect(0, 0, 1010, 1010), 'Shallow: Call takes embeds only one level deep into account.');

        // -- padding:
        mainGroup.fitEmbeds({ padding: 10 });
        assert.deepEqual(mainGroup.getBBox(), g.rect(-10, -10, 1030, 1030), 'Shallow: Using padding options is expanding the groups.');

        // - deep:
        // -- no embedded children:
        a.fitEmbeds({ deep: true });
        assert.deepEqual(a.getBBox(), g.rect(100, 100, 20, 20), 'Deep: Calling method on element that has no embeds has no effect.');

        mainGroup.fitEmbeds({ deep: true });
        assert.deepEqual(mainGroup.getBBox(), g.rect(100, 100, 120, 120), 'Deep: Call takes all descendant embeds into account.');
        assert.deepEqual(group1.getBBox(), g.rect(100, 100, 120, 20), 'Deep: After the call the first group fits its embeds.');
        assert.deepEqual(group2.getBBox(), g.rect(150, 200, 20, 20), 'Deep: After the call the second group fits its embeds.');

        // -- padding:
        mainGroup.fitEmbeds({ deep: true, padding: 10 });
        assert.deepEqual(mainGroup.getBBox(), g.rect(80, 80, 160, 160), 'Deep: Using padding options is expanding the groups.');
        assert.deepEqual(group1.getBBox(), g.rect(90, 90, 140, 40), 'Deep: Using padding is expanding first group.');
        assert.deepEqual(group2.getBBox(), g.rect(140, 190, 40, 40), 'Deep: Using padding is expanding second group.');

    });

    QUnit.test('clone()', function(assert) {

        var r1 = new joint.shapes.basic.Rect({
            position: { x: 20, y: 30 },
            size: { width: 120, height: 80 },
            attrs: { text: { text: 'my rectangle' }}
        });

        this.graph.addCell(r1);

        var r2 = r1.clone();
        this.graph.addCell(r2);

        var textEls = this.paper.svg.getElementsByTagName('text');
        var rectEls = this.paper.svg.getElementsByTagName('rect');

        assert.equal(textEls.length, 2, 'there are exactly two <text> elements in the paper');
        assert.equal(rectEls.length, 2, 'there are exactly two <rect> elements in the paper');

        assert.equal(textEls[0].textContent, V.sanitizeText('my rectangle'), 'text element has a proper content');
        assert.equal(textEls[1].textContent, V.sanitizeText('my rectangle'), 'text element of the cloned element has a proper content');

        assert.checkBbox(this.paper, r2, 20, 30, 120, 80, 'cloned element is at the exact same position as the original element');

        // Check correct offset of the element when translate() is called before appending the element to the paper.
        // This is critical as in this situation, render() is called after translate() and should therefore
        // reset the transformation attribute of the element.
        var r3 = r1.clone();
        r3.translate(50);
        this.graph.addCell(r3);
        assert.checkBbox(this.paper, r3, 70, 30, 120, 80, 'cloned element is offset by 50px to the right of the original element if translate() was called before appending it to the paper');

        // Shallow clone of embedded elements
        r1.embed(r2);
        r2.embed(r3);

        var clone = r2.clone();
        assert.notOk(
            clone.get('parent'),
            'Shallow clone of embedded element has no parent.'
        );

        assert.ok(
            _.isEmpty(clone.get('embeds')),
            'Shallow clone of embedded element that is also a parent has no embeds.'
        );

        // Deep clone.

        var l = new joint.dia.Link({ source: { id: r1.id }, target: { id: r2.id }});
        this.graph.addCell(l);
        var clones = r1.clone({ deep: true });

        assert.equal(clones.length, 3, 'deep clone returned two clones for a parent element with one child not including the link (use graph.cloneSubgraph() if this is desired)');
        assert.ok((clones[0].id === clones[1].get('parent') || (clones[1].id === clones[0].get('parent'))), 'clone of the embedded element gets a parent attribute set to the clone of the parent element');

        this.graph.clear();
        this.setupTestNestedGraph(this.graph);

        clones = this.graph.getCell('a').clone({ deep: true });
        assert.deepEqual(_.map(clones, function(c) {
            return c.get('name');
        }), ['a', 'aa', 'l2', 'aaa', 'c'], 'clone({ deep: true }) returns clones including all embedded cells');
    });

    QUnit.module('embed(), unembed()', function() {

        QUnit.test('single cell', function(assert) {

            var r1 = new joint.shapes.basic.Rect({
                position: { x: 20, y: 30 },
                size: { width: 120, height: 80 },
                attrs: { text: { text: 'my rectangle' }}
            });

            this.graph.addCell(r1);

            var r2 = r1.clone();
            this.graph.addCell(r2);

            r1.embed(r2);

            r1.translate(50);

            assert.checkBbox(this.paper, r1, 70, 30, 120, 80, 'translate(50) should translate the parent element by 50px');
            assert.checkBbox(this.paper, r2, 70, 30, 120, 80, 'embedded element should translate the same as the parent element');
            assert.equal(r2.get('parent'), r1.id, 'embedded element gains the parent attribute pointing to its parent cell');

            r1.unembed(r2);

            r1.translate(-50);
            assert.checkBbox(this.paper, r1, 20, 30, 120, 80, 'translate(-50) should translate the parent element by -50px');
            assert.checkBbox(this.paper, r2, 70, 30, 120, 80, 'unembedded element should stay at the same position when its old parent got translated');
            assert.equal(r2.get('parent'), undefined, 'embedded element gets its parent attribute pointing to its parent cell removed');

            r1.embed(r2);
            r2.remove();
            assert.deepEqual(r1.get('embeds'), [], 'embedded element got removed from the embeds array of its parent when the embedded element remove() was called.');
        });


        QUnit.test('multiple cells', function(assert) {

            var p1 = new joint.shapes.standard.Rectangle();
            var c1 = p1.clone();
            var c2 = p1.clone();

            this.graph.addCells([p1, c1, c2]);

            var events;
            var options;
            this.graph.on('all', function() {
                var args = Array.from(arguments);
                var eventName = args[0];
                var opt = args[args.length - 1];
                if (eventName === 'change') return;
                events.push(eventName);
                options.push(opt);
            });

            events = [];
            options = [];
            p1.embed([c1, c2], { testOption: true });

            assert.ok(c1.isEmbeddedIn(p1));
            assert.ok(c2.isEmbeddedIn(p1));
            assert.deepEqual(events, [
                'batch:start',
                'change:parent',
                'change:parent',
                'change:embeds',
                'batch:stop'
            ]);
            assert.deepEqual(p1.get('embeds'), [c1.id, c2.id]);
            assert.equal(options[0].batchName, 'embed');
            assert.equal(options[1].testOption, true);
            assert.equal(options[2].testOption, true);
            assert.equal(options[3].testOption, true);
            assert.equal(options[4].batchName, 'embed');

            assert.throws(function() {
                c1.embed([p1, c2]);
            }, /Recursive embedding not allowed/);

            events = [];
            options = [];
            p1.unembed([c1, c2], { testOption: true });

            assert.notOk(c1.isEmbeddedIn(p1));
            assert.notOk(c2.isEmbeddedIn(p1));
            assert.deepEqual(events, [
                'batch:start',
                'change:parent',
                'change:parent',
                'change:embeds',
                'batch:stop'
            ]);
            assert.deepEqual(p1.get('embeds'), []);
            assert.equal(options[0].batchName, 'unembed');
            assert.equal(options[1].testOption, true);
            assert.equal(options[2].testOption, true);
            assert.equal(options[3].testOption, true);
            assert.equal(options[4].batchName, 'unembed');
        });

        QUnit.test('isEmbeddedIn()', function(assert) {

            var r1 = new joint.shapes.basic.Rect;
            var r2 = r1.clone();
            var r3 = r1.clone();

            r1.embed(r2);
            r2.embed(r3);

            this.graph.addCells([r1, r2, r3]);

            assert.ok(!r1.isEmbeddedIn(r1), 'We have 3 elements. r3 is embedded in r2, r2 is embedded in r1. | r1 is not child of r1. ');
            assert.ok(r2.isEmbeddedIn(r1), 'r2 is descendent of r1');
            assert.ok(r3.isEmbeddedIn(r1), 'r3 is descendent of r1');
            assert.notOk(r3.isEmbeddedIn(r1, { deep: false }), 'r3 is not direct child of r1 (option { deep: false })');
            assert.ok(!r1.isEmbeddedIn(r3), 'r1 is not descendent of r3');
        });

    });

    QUnit.test('findMagnet()', function(assert) {

        var r1 = new joint.shapes.basic.Rect({
            attrs: { text: { text: 'my\nrectangle' }}
        });

        this.graph.addCell(r1);

        var r1View = this.paper.findViewByModel(r1);

        var magnet = r1View.findMagnet('tspan');
        assert.equal(magnet, r1View.el, 'should return the root element of the view if there is no subelement with magnet attribute set to true');

        r1.attr({ text: { magnet: true }});
        magnet = r1View.findMagnet('tspan');
        assert.equal(magnet, r1View.$('text')[0], 'should return the text element that has the magnet attribute set to true even though we passed the child <tspan> in the selector');


        r1.attr({
            text: { magnet: false },
            '.': { magnet: false }
        });

        magnet = r1View.findMagnet('tspan');
        assert.equal(magnet, undefined, 'should return `undefined` when magnet set to false on both the text and the root element');

    });

    QUnit.test('getSelector()', function(assert) {

        var model = new joint.shapes.devs.Model({ inPorts: ['1', '2'], outPorts: ['3', '4'] });

        // See issue #130 (https://github.com/DavidDurman/joint/issues/130)
        this.graph.addCell([model.clone(), model.clone(), model.clone(), model]);

        var view = model.findView(this.paper);
        var svgText = view.el.querySelector('.label');
        var svgPort1 = view.el.querySelector('[port="1"]');
        var svgPort2 = view.el.querySelector('[port="2"]');
        var svgPort3 = view.el.querySelector('[port="3"]');
        var svgPort4 = view.el.querySelector('[port="4"]');
        var selector;

        selector = view.getSelector(svgText);
        assert.equal(view.$el.find(selector)[0], svgText, 'Applying the selector returned from getSelector() should point to the selected element. It finds the exact same text node.');

        selector = view.getSelector(svgPort1);
        assert.equal(view.$el.find(selector)[0], svgPort1, 'It finds the exact same port no. 1.');

        selector = view.getSelector(svgPort2);
        assert.equal(view.$el.find(selector)[0], svgPort2, 'It finds the exact same port no. 2.');

        selector = view.getSelector(svgPort3);
        assert.equal(view.$el.find(selector)[0], svgPort3, 'It finds the exact same port no. 3.');

        selector = view.getSelector(svgPort4);
        assert.equal(view.$el.find(selector)[0], svgPort4, 'It finds the exact same port no. 4.');
    });

    QUnit.test('ports', function(assert) {

        var model = new joint.shapes.devs.Model({
            position: {
                x: 40,
                y: 40
            },
            size: {
                width: 80,
                height: 60
            },
            inPorts: ['1', '2'],
            outPorts: ['3', '4']
        });

        this.graph.addCell(model);

        var view = this.paper.findViewByModel(model);
        var allPorts = model.get('inPorts').concat(model.get('outPorts'));

        _.each(allPorts, function(port) {
            var $portEl = view.$el.find('[port="' + port + '"]');
            var foundEl = $portEl.length > 0;
            assert.equal(foundEl, true, 'port DOM element should exist ("' + port + '")');
        });

        model.set('inPorts', ['1']);
        model.set('outPorts', ['4']);

        var removedPorts = ['2', '3'];

        _.each(allPorts, function(port) {
            var $portEl = view.$el.find('[port="' + port + '"]');
            var foundEl = $portEl.length > 0;
            var wasRemoved = _.indexOf(removedPorts, port) !== -1;
            if (wasRemoved) {
                assert.equal(foundEl, false, 'port DOM element should not exist ("' + port + '")');
            } else {
                assert.equal(foundEl, true, 'port DOM element should exist ("' + port + '")');
            }
        });
    });

    QUnit.test('ref-x, ref-y, ref', function(assert) {

        var el = new joint.shapes.basic.Generic({
            markup: '<rect class="big"/><rect class="small"/><rect class="smaller"/>',
            size: { width: 100, height: 50 },
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

        assert.deepEqual(
            { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
            { x: 20, y: 10, width: 10, height: 10 },
            'ref-x: 20, ref-y: 10 attributes should offset the element by 20px in x axis and 10px in y axis'
        );

        // Range [0, 1]

        el.attr({ '.small': { 'ref-x': .5, 'ref-y': .5 }});

        smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

        assert.deepEqual(
            { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
            { x: 50, y: 25, width: 10, height: 10 },
            'ref-x: .5, ref-y: .5 attributes should position the element in the center, i.e. at [50, 25] coordinate'
        );

        // Percentage

        el.attr({ '.small': { 'ref-x': '50%', 'ref-y': '50%' }});

        smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

        assert.deepEqual(
            { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
            { x: 50, y: 25, width: 10, height: 10 },
            'ref-x: "50%", ref-y: "50%" attributes should position the element in the center, i.e. at [50, 25] coordinate'
        );

        // Range [-x, 0]

        el.attr({ '.small': { 'ref-x': -10, 'ref-y': -15 }});

        smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

        assert.deepEqual(
            { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
            { x: -10, y: -15, width: 10, height: 10 },
            'ref-x: -10, ref-y: -15 attributes should offset the element from the left by 10px and from the top  by 15px'
        );

        var smallerRectBbox = V(elView.$('.smaller')[0]).bbox(false, elView.el);

        assert.deepEqual(
            {
                x: smallerRectBbox.x,
                y: smallerRectBbox.y,
                width: smallerRectBbox.width,
                height: smallerRectBbox.height
            },
            { x: smallRectBbox.x + 20, y: smallRectBbox.y + 10, width: 5, height: 5 },
            'ref-x: 20, ref-y: 10 and ref set to .small should offset the element by 20px in x axis and 10px in y axis with respect to the x-y coordinate of the .small element'
        );

        assert.throws(function() {
            el.attr({ '.small': { 'ref': '.not-existing-reference' }});
        }, /dia.CellView/, 'Use of an invalid reference throws an error.');
    });

    QUnit.test('ref-dx, ref-dy, ref', function(assert) {

        var el = new joint.shapes.basic.Generic({
            markup: '<rect class="big"/><rect class="small"/><rect class="smaller"/>',
            size: { width: 100, height: 50 },
            attrs: {
                '.big': { width: 100, height: 50, fill: 'gray' },
                '.small': { width: 10, height: 10, 'ref-dx': 20, 'ref-dy': 10, fill: 'red' },
                '.smaller': { width: 5, height: 5, 'ref-dx': 10, 'ref-dy': 10, ref: '.small', fill: 'black' }
            }
        });

        this.graph.addCell(el);

        var elView = this.paper.findViewByModel(el);

        var smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

        assert.deepEqual(
            { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
            { x: 120, y: 60, width: 10, height: 10 },
            'ref-dx: 20, ref-dy: 10 attributes should offset the element by 20px in x axis and 10px in y axis with respect to the right-bottom coordinate of the ref element'
        );

        var smallerRectBbox = V(elView.$('.smaller')[0]).bbox(false, elView.el);

        assert.deepEqual(
            {
                x: smallerRectBbox.x,
                y: smallerRectBbox.y,
                width: smallerRectBbox.width,
                height: smallerRectBbox.height
            },
            {
                x: smallRectBbox.x + smallRectBbox.width + 10,
                y: smallRectBbox.y + smallRectBbox.height + 10,
                width: 5,
                height: 5
            },
            'ref-dx: 10, ref-dy: 10 with ref set to .small should offset the element by 10px in x axis and 10px in y axis with respect to the right-bottom coordinate of the .small element'
        );
    });

    QUnit.test('ref-width, ref-height', function(assert) {

        var el = new joint.shapes.basic.Generic({
            markup: '<rect class="big"/><rect class="small"/><rect class="smaller"/>',
            size: { width: 100, height: 50 },
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

        assert.deepEqual(
            { width: smallRectBbox.width, height: smallRectBbox.height },
            { width: 50, height: 20 },
            'ref-width: .5, ref-height: .4 attributes should set the element size to 50x20.'
        );

        var smallerRectBbox = V(elView.$('.smaller')[0]).bbox(false, elView.el);

        // Percentage

        el.attr({ '.small': { 'ref-width': '50%', 'ref-height': '40%' }});

        assert.deepEqual(
            { width: smallRectBbox.width, height: smallRectBbox.height },
            { width: 50, height: 20 },
            'ref-width: "50%", ref-height: "40%" attributes should set the element size to 50x20.'
        );

        smallerRectBbox = V(elView.$('.smaller')[0]).bbox(false, elView.el);

        // Range [-x, 0] && [1, x]

        assert.deepEqual(
            { width: smallerRectBbox.width, height: smallerRectBbox.height },
            { width: 60, height: 10 },
            'ref-width: 10, ref-height: -10 attributes referenced to the previous element should set the element size to 60x10.'
        );

        // Margin value 1

        el.attr({ '.small': { 'ref-width': 1, 'ref-height': 1 }});

        smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

        assert.deepEqual(
            { width: smallRectBbox.width, height: smallRectBbox.height },
            { width: 100, height: 50 },
            'ref-width: 1, ref-height: 1 attributes element should set the exact referenced element size 100x50.'
        );

        el.attr({ '.small': { 'ref-width': 0 }});

        smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

        assert.ok(smallRectBbox.width === 0, 'ref-width: 0 attribute element should set its width to 0.');

    });

    QUnit.test('x-alignment, y-alignment', function(assert) {

        var el = new joint.shapes.basic.Generic({
            markup: '<rect class="big"/><rect class="small"/>',
            size: { width: 100, height: 50 },
            attrs: {
                '.big': { width: 100, height: 50, fill: 'gray' },
                '.small': {
                    width: 20,
                    height: 20,
                    'ref-x': .5,
                    'ref-y': .5,
                    'y-alignment': 'middle',
                    'x-alignment': 'middle',
                    fill: 'red'
                }
            }
        });

        this.graph.addCell(el);

        var elView = this.paper.findViewByModel(el);

        var smallRectBbox = V(elView.$('.small')[0]).bbox(false, elView.el);

        assert.deepEqual(
            { x: smallRectBbox.x, y: smallRectBbox.y, width: smallRectBbox.width, height: smallRectBbox.height },
            { x: 40, y: 15, width: 20, height: 20 },
            'ref-x: .5, ref-y: .5, x-alignment: middle, y-alignment: middle aligns the element center with the root center'
        );
    });

    QUnit.test('gradient', function(assert) {

        var el = new joint.shapes.basic.Rect;
        this.graph.addCell(el);

        var elView = this.paper.findViewByModel(el);

        var defs = this.paper.svg.querySelector('defs');
        var defsChildrenCount = $(defs).children().length;
        assert.equal(defsChildrenCount, 0, 'there is no element in the <defs> by default.');

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
        assert.equal(defsChildrenCount, 1, 'one element got created in <defs>.');

        var linearGradient = $(defs).children()[0];

        assert.equal(linearGradient.tagName.toLowerCase(), 'lineargradient', 'one <linearGradient> element got created in <defs>.');
        assert.equal('url(#' + linearGradient.id + ')', elView.$('rect').attr('fill'), 'fill attribute pointing to the newly created gradient with url()');

        el.attr('rect/stroke', {
            type: 'linearGradient',
            stops: [
                { offset: '0%', color: 'red' },
                { offset: '20%', color: 'blue' }
            ]
        });

        defsChildrenCount = $(defs).children().length;

        assert.equal(defsChildrenCount, 1, 'one element is in <defs>.');

        linearGradient = $(defs).children()[0];

        assert.equal(linearGradient.tagName.toLowerCase(), 'lineargradient', 'still only one <linearGradient> element is in <defs>.');
        assert.equal('url(#' + linearGradient.id + ')', elView.$('rect').attr('stroke'), 'stroke attribute pointing to the correct gradient with url()');
    });

    QUnit.test('filter', function(assert) {

        var el = new joint.shapes.basic.Rect;
        var el2 = new joint.shapes.basic.Rect;

        this.graph.addCells([el, el2]);

        var elView = this.paper.findViewByModel(el);
        var el2View = this.paper.findViewByModel(el2);

        var defs = this.paper.svg.querySelector('defs');

        var defsChildrenCount = $(defs).children().length;
        assert.equal(defsChildrenCount, 0, 'there is no element in the <defs> by default.');

        el.attr('rect/filter', { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 }});

        // PhantomJS fails to lookup linearGradient with `querySelectorAll()` (also with jQuery).
        // Therefore, we use the following trick to check whether the element is in DOM.

        defsChildrenCount = $(defs).children().length;
        assert.equal(defsChildrenCount, 1, 'one element got created in <defs>.');

        var filter = $(defs).children()[0];

        assert.equal(filter.tagName.toLowerCase(), 'filter', 'one <filter> element got created in <defs>.');
        assert.checkSvgAttr('filter', elView.$('rect'), 'url(#' + filter.id + ')', 'filter attribute pointing to the newly created filter with url()');

        el2.attr('rect/filter', { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 }});

        defsChildrenCount = $(defs).children().length;
        assert.equal(defsChildrenCount, 1, 'one element still in <defs>.');

        filter = $(defs).children()[0];

        assert.equal(filter.tagName.toLowerCase(), 'filter', 'still only one <filter> element is in <defs>.');
        assert.checkSvgAttr('filter', el2View.$('rect'), 'url(#' + filter.id + ')', 'filter attribute pointing to the correct gradient with url()');

        el.attr('rect/filter', { name: 'blur', args: { x: 5 }});

        defsChildrenCount = $(defs).children().length;
        assert.equal(defsChildrenCount, 2, 'now two elements are in <defs>.');
        var filter0 = $(defs).children()[0];
        var filter1 = $(defs).children()[1];
        assert.deepEqual([filter0.tagName.toLowerCase(), filter1.tagName.toLowerCase()], ['filter', 'filter'], 'both elements in <defs> are <filter> elements.');
        assert.notEqual(filter0.id, filter1.id, 'both <filter> elements have different IDs');

        assert.checkSvgAttr('filter', el2View.$('rect'), 'url(#' + filter0.id + ')', 'filter attribute pointing to the correct gradient with url()');
        assert.checkSvgAttr('filter', elView.$('rect'), 'url(#' + filter1.id + ')', 'filter attribute pointing to the correct gradient with url()');
    });

    QUnit.test('transition: sanity', function(assert) {

        var done = assert.async();

        var p0 = true;
        var p1 = true;
        var p2 = true;

        var el = new joint.shapes.basic.Rect({
            property: 1
        });

        this.graph.addCell(el);

        el.transition('property', 3, {
            valueFunction: function(a, b) {

                assert.equal(a, 2, 'The method passes the current value to a valueFunction as start.');
                assert.equal(b, 3, 'The method passes the requested value to a valueFunction as end.');

                return function(t) {

                    if (t < .1 && p0) {
                        assert.ok(true, 'Transition starts.');
                        p0 = false;
                    }

                    if (t > .1 && t < .9 && p1) {
                        assert.ok(true, 'Transition runs.');
                        p1 = false;
                    }

                    if (t > .9 && p2) {
                        assert.ok(true, 'Transition ends.');
                        p2 = false;
                        done();
                    }

                    return 0;
                };
            }
        });

        el.set('property', 2);
    });

    QUnit.test('transition: events', function(assert) {

        var done = assert.async();

        assert.expect(6);

        var el = new joint.shapes.standard.Rectangle({
            timer: -1
        });

        el.transition('timer', 100, {
            delay: 100,
            duration: 100
        });

        el.on('transition:start', function(cell, path) {
            assert.equal(cell, el);
            assert.equal(path, 'timer');
            assert.equal(el.get('timer'), -1);
        });

        el.on('transition:end', function(cell, path) {
            assert.equal(cell, el);
            assert.equal(path, 'timer');
            assert.equal(el.get('timer'), 100);
            done();
        });
    });

    QUnit.test('transition: discrete events', function(assert) {

        var done = assert.async();

        assert.expect(18);

        var el = new joint.shapes.standard.Rectangle({
            timer: -1
        });

        el.transition('timer', 100, {
            delay: 0,
            duration: 100
        });

        el.transition('timer', 200, {
            delay: 200,
            duration: 100
        });

        el.transition('timer', 300, {
            delay: 400,
            duration: 100
        });

        var startValues = [200, 100, -1];
        var endValues = [300, 200, 100];

        el.on('transition:start', function(cell, path) {
            var start = startValues.pop();
            assert.ok(el.get('timer') <= start);
            assert.ok(el.get('timer') > start - 100);
            assert.deepEqual(cell.getTransitions(), ['timer']);
        });

        el.on('transition:end', function(cell, path) {
            var end = endValues.pop();
            assert.ok(el.get('timer') <= end);
            assert.ok(el.get('timer') > end - 100);
            var last = endValues.length === 0;
            assert.deepEqual(cell.getTransitions(), last ? [] : ['timer']);
            if (last) done();
        });
    });

    QUnit.test('transition: overlapping events', function(assert) {

        var done = assert.async();

        assert.expect(18);

        var el = new joint.shapes.standard.Rectangle({
            timer: -1
        });

        el.transition('timer', 100, {
            delay: 0,
            duration: 100
        });

        el.transition('timer', 200, {
            delay: 50,
            duration: 100
        });

        el.transition('timer', 300, {
            delay: 125,
            duration: 100
        });

        var startValues = [200, 100, -1];
        var endValues = [300, 200, 100];

        el.on('transition:start', function(cell, path) {
            var start = startValues.pop();
            assert.ok(el.get('timer') <= start);
            assert.ok(el.get('timer') > start - 100);
            assert.deepEqual(cell.getTransitions(), ['timer']);
        });

        el.on('transition:end', function(cell, path) {
            var end = endValues.pop();
            assert.ok(el.get('timer') <= end);
            assert.ok(el.get('timer') > end - 100);
            var last = endValues.length === 0;
            var oneBeforeLast = endValues.length === 1;
            assert.deepEqual(cell.getTransitions(), (last || oneBeforeLast) ? [] : ['timer']);
            if (last) done();
        });
    });

    QUnit.test('transition: primitive value', function(assert) {

        var done = assert.async();

        var el = new joint.shapes.basic.Rect({
            timer: -1
        });

        this.graph.addCell(el);

        var timerArray = [];

        el.transition('timer', 100, {
            delay: 100,
            duration: 100,
            valueFunction: function(a, b) {
                return function(t) {
                    return t;
                };
            }
        });

        el.on('change:timer', function(cell, changed) {
            timerArray.push(changed);
        });

        setTimeout(function() {

            var timerMedian = timerArray[Math.floor(timerArray.length / 2)];

            assert.equal(el.get('timer'), 1, 'The transition sets the primitive property.');

            assert.deepEqual(timerArray.sort(), timerArray, 'The transition changes the primitive property gradually, ');

            assert.ok(0 < timerMedian && timerMedian < 1, 'The transition median value is between min and max.');

            done();

        }, 300);
    });

    QUnit.test('transition: nested value', function(assert) {

        var done = assert.async();
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
            valueFunction: function(a, b) {
                return function(t) {
                    return t;
                };
            }
        });

        el.on('change:nested', function(cell, changed) {
            timerArray.push(changed.timer);
        });

        setTimeout(function() {

            var timerMedian = timerArray[Math.floor(timerArray.length / 2)];

            assert.equal(el.get('nested').timer, 1, 'The transition sets the nested property.');

            assert.equal(el.get('nested').other, 'nochange', 'The transition affects no other property.');

            assert.deepEqual(timerArray.sort(), timerArray, 'The transition changes the nested property gradually, ');

            assert.ok(0 < timerMedian && timerMedian < 1, 'The transition median value is between min and max.');

            done();

        }, 300);
    });

    QUnit.test('transition: stopTransitions()', function(assert) {
        assert.expect(6);
        var done = assert.async();
        var el = new joint.shapes.standard.Rectangle({ test1: 0, test2: 0, test3: 0 });
        this.graph.addCell(el);
        el.transition('test1', 100);
        el.transition('test2', 100);
        el.transition('test3', 100);
        assert.equal(el.getTransitions().length, 3);
        el.stopTransitions('test2');
        assert.equal(el.getTransitions().length, 2);
        el.stopTransitions();
        assert.equal(el.getTransitions().length, 0);
        setTimeout(function() {
            assert.equal(el.attributes.test1, 0);
            assert.equal(el.attributes.test2, 0);
            assert.equal(el.attributes.test3, 0);
            done();
        }, 200);
    });

    QUnit.test('cell.getAncestors()', function(assert) {

        var r0 = new joint.shapes.basic.Rect;
        var r1 = new joint.shapes.basic.Rect;
        var r2 = new joint.shapes.basic.Rect;
        var r3 = new joint.shapes.basic.Rect;
        var r4 = new joint.shapes.basic.Rect;
        var r5 = new joint.shapes.basic.Rect;

        r1.embed(r2.embed(r4).embed(r5));

        this.graph.addCells([r1, r2, r3, r4, r5]);

        assert.deepEqual(r0.getAncestors(), [], 'A cell that is not part of a collection has no ancestors.');
        assert.deepEqual(r1.getAncestors(), [], 'A cell with no parent has no ancestors.');
        assert.deepEqual(_.map(r2.getAncestors(), 'id'), [r1.id], 'A cell embedded in a parent with no ancestor has exactly one ancestor.');
        assert.deepEqual(_.map(r5.getAncestors(), 'id'), [r2.id, r1.id], 'If a cell has more than one ancestor, the ancesotrs are sorted from the parent to the most distant ancestor.');
    });

    QUnit.test('cellView: element reference wrapped in Vectorizer', function(assert) {

        var element = new joint.shapes.basic.Rect;
        var view = element.addTo(this.graph).findView(this.paper);

        assert.ok(V.isVElement(view.vel), 'A cellView has attribute "vel" and its value is wrapped in Vectorizer.');
        assert.equal(view.vel.node, view.el, 'Value of attribtue "vel" references to the view group element (view.el).');

    });

    QUnit.test('cell.isEmbedded()', function(assert) {

        var rect = new joint.shapes.basic.Rect;
        var link = new joint.dia.Link;
        var embeddedRect = new joint.shapes.basic.Rect;
        var embeddedLink = new joint.dia.Link;

        rect.embed(embeddedRect);
        rect.embed(embeddedLink);

        this.graph.addCells([rect, link, embeddedRect, embeddedLink]);

        assert.ok(embeddedRect.isEmbedded(), 'should return TRUE for an embedded element');
        assert.ok(embeddedLink.isEmbedded(), 'should return TRUE for an embedded link');
        assert.notOk(rect.isEmbedded(), 'should return FALSE for an element that is NOT embedded');
        assert.notOk(link.isEmbedded(), 'should return FALSE for a link that is NOT embedded');
    });

    QUnit.module('Link.applyToPoints()', function(hooks) {

        var fn = function(p) {
            return g.point(p).difference({ x: 10, y: 10 }).toJSON();
        };

        hooks.beforeEach(function() {
            this.link = new joint.dia.Link({
                source: { x: 100, y: 100 },
                target: { x: 200, y: 200 },
                vertices: []
            });
        });

        QUnit.test('parameters', function(assert) {
            var l = this.link;
            assert.throws(function() {
                l.applyToPoints(null);
            });
        });

        QUnit.test('point-point + no vertices', function(assert) {
            var l = this.link.applyToPoints(fn);
            assert.deepEqual(l.get('source'), { x: 90, y: 90 });
            assert.deepEqual(l.get('target'), { x: 190, y: 190 });
            assert.deepEqual(l.get('vertices'), []);
        });

        QUnit.test('point-point + vertices', function(assert) {
            var l = this.link
                .set('vertices', [{ x: 10, y: 10 }])
                .applyToPoints(fn);
            assert.deepEqual(l.get('source'), { x: 90, y: 90 });
            assert.deepEqual(l.get('target'), { x: 190, y: 190 });
            assert.deepEqual(l.get('vertices'), [{ x: 0, y: 0 }]);
        });

        QUnit.test('element-element + no vertices', function(assert) {
            var l = this.link
                .set('source', { id: 'a' })
                .set('target', { id: 'b' })
                .applyToPoints(fn);
            assert.deepEqual(l.get('source'), { id: 'a' });
            assert.deepEqual(l.get('target'), { id: 'b' });
            assert.deepEqual(l.get('vertices'), []);
        });

        QUnit.test('element-element + vertices', function(assert) {
            var l = this.link
                .set('source', { id: 'a' })
                .set('target', { id: 'b' })
                .set('vertices', [{ x: 10, y: 10 }])
                .applyToPoints(fn);
            assert.deepEqual(l.get('source'), { id: 'a' });
            assert.deepEqual(l.get('target'), { id: 'b' });
            assert.deepEqual(l.get('vertices'), [{ x: 0, y: 0 }]);
        });

        QUnit.test('event option', function(assert) {
            var l = this.link;
            l.on('change', function(link, opt) {
                assert.ok(opt.linkOption);
            });
            l.applyToPoints(fn, { linkOption: true });
        });
    });

    QUnit.module('Link.scale()', function(hooks) {

        hooks.beforeEach(function() {
            this.link = new joint.dia.Link({
                source: { x: 100, y: 100 },
                target: { x: 200, y: 200 },
                vertices: [{ x: 100, y: 200 }]
            });
        });

        QUnit.test('no origin', function(assert) {
            var l = this.link.scale(2, 3);

            assert.equal(l.get('vertices').length, 1);
            assert.equal(g.point(l.get('vertices')[0]).toString(), g.point(200, 600).toString());
            assert.equal(g.point(l.get('source')).toString(), g.point(200, 300).toString());
            assert.equal(g.point(l.get('target')).toString(), g.point(400, 600).toString());
        });

        QUnit.test('with custom origin', function(assert) {
            var l = this.link.scale(2, 3, g.point(100, 100));

            assert.equal(l.get('vertices').length, 1);
            assert.equal(g.point(l.get('vertices')[0]).toString(), g.point(100, 400).toString());
            assert.equal(g.point(l.get('source')).toString(), g.point(100, 100).toString());
            assert.equal(g.point(l.get('target')).toString(), g.point(300, 400).toString());
        });

        QUnit.test('when connected to elements', function(assert) {
            var l = this.link
                .set('source', { id: 'a' })
                .set('target', { id: 'b' })
                .scale(2, 3);

            assert.equal(l.get('vertices').length, 1);
            assert.equal(g.point(l.get('vertices')[0]).toString(), g.point(200, 600).toString());
            assert.deepEqual(l.get('source'), { id: 'a' });
            assert.deepEqual(l.get('target'), { id: 'b' });
        });

        QUnit.test('event option', function(assert) {
            var l = this.link;
            l.on('change', function(link, opt) {
                assert.ok(opt.linkOption);
            });
            l.scale(2, 2, null, { linkOption: true });
        });
    });

    QUnit.module('Element.scale()', function(hooks) {

        hooks.beforeEach(function() {
            this.element = new joint.dia.Element({
                size: { width: 100, height: 100 },
                position: { x: 100, y: 100 }
            });
        });

        QUnit.test('no origin', function(assert) {
            var el = this.element.scale(2, 3);
            assert.equal(el.getBBox().toString(), g.rect(200, 300, 200, 300).toString());
        });

        QUnit.test('with custom origin', function(assert) {
            var el = this.element.scale(2, 3, g.point(100, 100));
            assert.equal(el.getBBox().toString(), g.rect(100, 100, 200, 300).toString());
        });

        QUnit.test('event option', function(assert) {
            var el = this.element;
            el.on('change', function(link, opt) {
                assert.ok(opt.elementOption);
            });
            el.scale(2, 2, null, { elementOption: true });
        });
    });
});

QUnit.module('elements', function(hooks) {

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

    QUnit.module('isElement()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Element.prototype.isElement, 'function');
        });

        QUnit.test('should return TRUE', function(assert) {

            var element = new joint.dia.Element;

            assert.ok(element.isElement());
        });
    });

    QUnit.module('isLink()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Element.prototype.isLink, 'function');
        });

        QUnit.test('should return FALSE', function(assert) {

            var element = new joint.dia.Element;

            assert.notOk(element.isLink());
        });
    });

    QUnit.module('angle()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Element.prototype.angle, 'function');
        });

        QUnit.test('should be 0 by default', function(assert) {

            var element = new joint.dia.Element;

            assert.equal(element.angle(), 0);
        });

        QUnit.test('should return normalized "angle" attribute', function(assert) {

            var ANGLE = 45;
            var element = new joint.dia.Element;

            element.set('angle', ANGLE);
            assert.equal(element.angle(), ANGLE);

            element.set('angle', ANGLE + 360);
            assert.equal(element.angle(), ANGLE);
        });
    });

    QUnit.module('fitParent()', function(hooks) {

        hooks.beforeEach(function() {
            // structure of objects:
            // `mainGroup` has the following children:
            // - `group1` has the following children:
            //   - `a`
            //   - `b`
            // - `group2` has the following children:
            //   - `c`

            this.mainGroup = new joint.shapes.standard.Rectangle({ position: { x: 50, y: 150 }, size: { width: 500, height: 400 }}); // (x: 50-550, y: 150-550)
            this.group1 = new joint.shapes.standard.Rectangle({ position: { x: 101, y: 101 }, size: { width: 100, height: 100 }}); // (x: 101-201, y: 101-201) = reaches over `mainGroup` at top
            this.group2 = new joint.shapes.standard.Rectangle({ position: { x: 502, y: 202 }, size: { width: 100, height: 100 }}); // (x: 502-602, y: 202-302) = reaches over `mainGroup` at right
            this.a = new joint.shapes.standard.Rectangle({ position: { x: 153, y: 153 }, size: { width: 100, height: 100 }}); // (x: 153-253, y: 153-253) = within `mainGroup`, reaches over `group1` at bottom and right
            this.b = new joint.shapes.standard.Rectangle({ position: { x: 154, y: 604 }, size: { width: 100, height: 100 }}); // (x: 154-254, y: 604-704) = outside `mainGroup`, outside `group1`
            this.c = new joint.shapes.standard.Rectangle({ position: { x: 505, y: 355 }, size: { width: 100, height: 100 }}); // (x: 505-605, y: 355-455) = within `mainGroup`, outside `group2`

            this.mainGroup.embed(this.group2.embed(this.c)).embed(this.group1.embed(this.a).embed(this.b));

            this.graph.addCells([this.mainGroup, this.group1, this.group2, this.a, this.b, this.c]);
        });

        QUnit.test('sanity', function(assert) {

            const r = new joint.shapes.basic.Rect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 }});
            // not added to graph

            assert.throws(function() {
                r.fitParent();
            }, /graph/, 'Shallow: Calling method on element that is not part of a graph throws an error.');

            assert.throws(function() {
                r.fitParent({ deep: true });
            }, /graph/, 'Deep: Calling method on element that is not part of a graph throws an error.');
        });

        QUnit.test('expandOnly + shrinkOnly', function(assert) {

            this.a.fitParent({ expandOnly: true, shrinkOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Using shrinkOnly and expandOnly together does nothing.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Using shrinkOnly and expandOnly together does nothing.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Using shrinkOnly and expandOnly together does nothing.');
        });

        QUnit.test('shallow', function(assert) {

            // element with no embedding parent:
            this.mainGroup.fitParent();
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Shallow: Calling method on element that has no embedding parent has no effect.');

            this.a.fitParent();
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Shallow: Call takes ancestors only one level above into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Shallow: Call takes ancestors only one level above into account.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: Call takes ancestors only one level above into account.');

            this.a.fitParent({ deep: false });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Shallow: Call takes ancestors only one level above into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Shallow: Call takes ancestors only one level above into account.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: Call takes ancestors only one level above into account.');

            // padding:
            this.a.fitParent({ padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Shallow: Using padding options is expanding the ancestors only one level above.');
            assert.deepEqual(this.group1.getBBox(), g.rect(143, 143, 121, 571), 'Shallow: Using padding options is expanding the ancestors only one level above.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: Using padding options is expanding the ancestors only one level above.');
        });

        QUnit.test('shallow + expandOnly', function(assert) {

            this.a.fitParent({ expandOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Shallow: ExpandOnly call takes ancestors only one level above into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 153, 603), 'Shallow: ExpandOnly call takes ancestors only one level above into account.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: ExpandOnly call takes ancestors only one level above into account.');
        });

        QUnit.test('shallow + expandOnly + padding', function(assert) {

            this.a.fitParent({ expandOnly: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Shallow: ExpandOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 163, 613), 'Shallow: ExpandOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: ExpandOnly using padding options expands at child edges only.');
        });

        QUnit.test('shallow + shrinkOnly', function(assert) {

            this.a.fitParent({ shrinkOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Shallow: ShrinkOnly call takes ancestors only one level above into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 48, 48), 'Shallow: ShrinkOnly call takes ancestors only one level above into account.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: ShrinkOnly call takes ancestors only one level above into account.');
        });

        QUnit.test('shallow + shrinkOnly + padding', function(assert) {

            this.a.fitParent({ shrinkOnly: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Shallow: ShrinkOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group1.getBBox(), g.rect(143, 143, 58, 58), 'Shallow: ShrinkOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: ShrinkOnly using padding options expands at child edges only.');
        });

        QUnit.test('deep', function(assert) {

            // element with no embedding parent:
            this.mainGroup.fitParent({ deep: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Deep: Calling method on element that has no embedding parent has no effect.');

            this.a.fitParent({ deep: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Call takes all embedding ancestors into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: After the call the first group fits its embeds.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: After the call the second group is unchanged.');

            // padding:
            this.a.fitParent({ deep: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(133, 133, 479, 591), 'Deep: Using padding options is expanding the groups.');
            assert.deepEqual(this.group1.getBBox(), g.rect(143, 143, 121, 571), 'Deep: Using padding is expanding first group.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Using padding does not expand second group.');
        });

        QUnit.test('deep + terminator', function(assert) {

            // - terminator element is the same as this element
            this.a.fitParent({ deep: true, terminator: this.a });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Deep: Terminator (ref) same as this element does nothing.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Deep: Terminator (ref) same as this element does nothing.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (ref) same as this element does nothing.');

            this.a.fitParent({ deep: true, terminator: this.a.id });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Deep: Terminator (id) same as this element does nothing.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Deep: Terminator (id) same as this element does nothing.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (id) same as this element does nothing.');

            // - terminator element is this element's embedding parent
            this.a.fitParent({ deep: true, terminator: this.group1 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Deep: Terminator (ref) being embedding parent has same result as shallow.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (ref) being embedding parent has same result as shallow.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (ref) being embedding parent has same result as shallow.');

            this.a.fitParent({ deep: true, terminator: this.group1.id });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Deep: Terminator (id) being embedding parent has same result as shallow.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (id) being embedding parent has same result as shallow.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (id) being embedding parent has same result as shallow.');

            // - terminator element is this element's topmost embedding ancestor
            this.a.fitParent({ deep: true, terminator: this.mainGroup });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Terminator (ref) being topmost embedding ancestor has same result as not providing terminator.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (ref) being topmost embedding ancestor has same result as not providing terminator.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (ref) being topmost embedding ancestor has same result as not providing terminator.');

            this.a.fitParent({ deep: true, terminator: this.mainGroup.id });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Terminator (id) being topmost embedding ancestor has same result as not providing terminator.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (id) being topmost embedding ancestor has same result as not providing terminator.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (id) being topmost embedding ancestor has same result as not providing terminator.');

            // - terminator element is not an ancestor of this element
            this.a.fitParent({ deep: true, terminator: this.c });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Terminator (ref) not being ancestor of this element has same result as not providing terminator.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (ref) not being ancestor of this element has same result as not providing terminator.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (ref) not being ancestor of this element has same result as not providing terminator.');

            this.a.fitParent({ deep: true, terminator: this.c.id });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Terminator (id) not being ancestor of this element has same result as not providing terminator.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (id) not being ancestor of this element has same result as not providing terminator.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (id) not being ancestor of this element has same result as not providing terminator.');

            // - terminator is not an Element
            const l = new joint.shapes.standard.Link();
            l.source(this.a);
            l.target(this.b);
            this.graph.addCells([l]);

            this.a.fitParent({ deep: true, terminator: l });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Terminator (ref) not of type Element has same result as not providing terminator.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (ref) not of type Element has same result as not providing terminator.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (ref) not of type Element has same result as not providing terminator.');

            this.a.fitParent({ deep: true, terminator: l.id });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Terminator (id) not of type Element has same result as not providing terminator.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (id) not of type Element has same result as not providing terminator.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (id) not of type Element has same result as not providing terminator.');

            // - terminator element is not in a graph
            const r = new joint.shapes.basic.Rect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 }});
            // not added to graph

            this.a.fitParent({ deep: true, terminator: r });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Terminator (ref) not in a graph has same result as not providing terminator.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (ref) not in a graph has same result as not providing terminator.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (ref) not in a graph has same result as not providing terminator.');

            this.a.fitParent({ deep: true, terminator: r.id });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 449, 551), 'Deep: Terminator (id) not in a graph has same result as not providing terminator.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: Terminator (id) not in a graph has same result as not providing terminator.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: Terminator (id) not in a graph has same result as not providing terminator.');
        });

        QUnit.test('deep + expandOnly', function(assert) {

            this.a.fitParent({ deep: true, expandOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 101, 552, 603), 'Deep: ExpandOnly call takes all embedding ancestors into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 153, 603), 'Deep: After expandOnly call the first group fits its embeds and keeps extra from original.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: After expandOnly call the second group is unchanged.');
        });

        QUnit.test('deep + expandOnly + padding', function(assert) {

            this.a.fitParent({ deep: true, expandOnly: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 91, 562, 633), 'Deep: ExpandOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 163, 613), 'Deep: ExpandOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: ExpandOnly using padding options does not expand second group.');
        });

        QUnit.test('deep + shrinkOnly', function(assert) {

            this.a.fitParent({ deep: true, shrinkOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 397, 149), 'Deep: ShrinkOnly call takes all embedding ancestors into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 48, 48), 'Deep: After shrinkOnly call the first group shrinks to only contain originally overlapped part of embeds.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: After shrinkOnly call the second group is unchanged.');
        });

        QUnit.test('deep + shrinkOnly + padding', function(assert) {

            this.mainGroup.fitToChildren({ deep: true, shrinkOnly: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(133, 150, 417, 162), 'Deep: ShrinkOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group1.getBBox(), g.rect(143, 143, 58, 58), 'Deep: ShrinkOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: ShrinkOnly using padding options does not expand second group.');
        });
    });

    // older tests for `dia.Element.fitEmbeds()` using `joint.shapes.basic.Rect` can be found in `/test/jointjs/basic.js`
    QUnit.module('fitToChildren()', function(hooks) {

        hooks.beforeEach(function() {
            // structure of objects:
            // `mainGroup` has the following children:
            // - `group1` has the following children:
            //   - `a`
            //   - `b`
            // - `group2` has the following children:
            //   - `c`

            this.mainGroup = new joint.shapes.standard.Rectangle({ position: { x: 50, y: 150 }, size: { width: 500, height: 400 }}); // (x: 50-550, y: 150-550)
            this.group1 = new joint.shapes.standard.Rectangle({ position: { x: 101, y: 101 }, size: { width: 100, height: 100 }}); // (x: 101-201, y: 101-201) = reaches over `mainGroup` at top
            this.group2 = new joint.shapes.standard.Rectangle({ position: { x: 502, y: 202 }, size: { width: 100, height: 100 }}); // (x: 502-602, y: 202-302) = reaches over `mainGroup` at right
            this.a = new joint.shapes.standard.Rectangle({ position: { x: 153, y: 153 }, size: { width: 100, height: 100 }}); // (x: 153-253, y: 153-253) = within `mainGroup`, reaches over `group1` at bottom and right
            this.b = new joint.shapes.standard.Rectangle({ position: { x: 154, y: 604 }, size: { width: 100, height: 100 }}); // (x: 154-254, y: 604-704) = outside `mainGroup`, outside `group1`
            this.c = new joint.shapes.standard.Rectangle({ position: { x: 505, y: 355 }, size: { width: 100, height: 100 }}); // (x: 505-605, y: 355-455) = within `mainGroup`, outside `group2`

            this.mainGroup.embed(this.group2.embed(this.c)).embed(this.group1.embed(this.a).embed(this.b));

            this.graph.addCells([this.mainGroup, this.group1, this.group2, this.a, this.b, this.c]);
        });

        QUnit.test('sanity', function(assert) {

            const r = new joint.shapes.basic.Rect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 }});
            // not added to graph

            assert.throws(function() {
                r.fitToChildren();
            }, /graph/, 'Shallow: Calling method on element that is not part of a graph throws an error.');

            assert.throws(function() {
                r.fitToChildren({ deep: true });
            }, /graph/, 'Deep: Calling method on element that is not part of a graph throws an error.');
        });

        QUnit.test('expandOnly + shrinkOnly', function(assert) {

            this.mainGroup.fitToChildren({ expandOnly: true, shrinkOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 150, 500, 400), 'Using shrinkOnly and expandOnly together does nothing.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Using shrinkOnly and expandOnly together does nothing.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Using shrinkOnly and expandOnly together does nothing.');
        });

        QUnit.test('shallow', function(assert) {

            // element with no embedded children:
            this.a.fitToChildren();
            assert.deepEqual(this.a.getBBox(), g.rect(153, 153, 100, 100), 'Shallow: Calling method on element that has no embeds has no effect.');

            this.mainGroup.fitToChildren();
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(101, 101, 501, 201), 'Shallow: Call takes embeds only one level deep into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Shallow: Call takes embeds only one level deep into account.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: Call takes embeds only one level deep into account.');

            this.mainGroup.fitToChildren({ deep: false });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(101, 101, 501, 201), 'Shallow: Call takes embeds only one level deep into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Shallow: Call takes embeds only one level deep into account.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: Call takes embeds only one level deep into account.');

            // padding:
            this.mainGroup.fitToChildren({ padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(91, 91, 521, 221), 'Shallow: Using padding options is expanding the groups only one level deep.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Shallow: Using padding options is expanding the groups only one level deep.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: Using padding options is expanding the groups only one level deep.');
        });

        QUnit.test('shallow + expandOnly', function(assert) {

            this.mainGroup.fitToChildren({ expandOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 101, 552, 449), 'Shallow: ExpandOnly call takes embeds only one level deep into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Shallow: ExpandOnly call takes embeds only one level deep into account.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: ExpandOnly call takes embeds only one level deep into account.');
        });

        QUnit.test('shallow + expandOnly + padding', function(assert) {

            this.mainGroup.fitToChildren({ expandOnly: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 91, 562, 459), 'Shallow: ExpandOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Shallow: ExpandOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: ExpandOnly using padding options expands at child edges only.');
        });

        QUnit.test('shallow + shrinkOnly', function(assert) {

            this.mainGroup.fitToChildren({ shrinkOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(101, 150, 449, 152), 'Shallow: ShrinkOnly call takes embeds only one level deep into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Shallow: ShrinkOnly call takes embeds only one level deep into account.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: ShrinkOnly call takes embeds only one level deep into account.');
        });

        QUnit.test('shallow + shrinkOnly + padding', function(assert) {

            this.mainGroup.fitToChildren({ shrinkOnly: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(91, 150, 459, 162), 'Shallow: ShrinkOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 100, 100), 'Shallow: ShrinkOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Shallow: ShrinkOnly using padding options expands at child edges only.');
        });

        QUnit.test('deep', function(assert) {

            // element with no embedded children:
            this.a.fitToChildren({ deep: true });
            assert.deepEqual(this.a.getBBox(), g.rect(153, 153, 100, 100), 'Deep: Calling method on element that has no embeds has no effect.');

            this.mainGroup.fitToChildren({ deep: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 452, 551), 'Deep: Call takes all descendant embeds into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 101, 551), 'Deep: After the call the first group fits its embeds.');
            assert.deepEqual(this.group2.getBBox(), g.rect(505, 355, 100, 100), 'Deep: After the call the second group fits its embeds.');

            // padding:
            this.mainGroup.fitToChildren({ deep: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(133, 133, 492, 591), 'Deep: Using padding options is expanding the groups.');
            assert.deepEqual(this.group1.getBBox(), g.rect(143, 143, 121, 571), 'Deep: Using padding is expanding first group.');
            assert.deepEqual(this.group2.getBBox(), g.rect(495, 345, 120, 120), 'Deep: Using padding is expanding second group.');
        });

        QUnit.test('deep + expandOnly', function(assert) {

            this.mainGroup.fitToChildren({ deep: true, expandOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 101, 555, 603), 'Deep: ExpandOnly call takes all descendant embeds into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 153, 603), 'Deep: After expandOnly call the first group fits its embeds and keeps extra from original.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 103, 253), 'Deep: After expandOnly call the second group fits its embeds and keeps extra from original.');
        });

        QUnit.test('deep + expandOnly + padding', function(assert) {

            this.mainGroup.fitToChildren({ deep: true, expandOnly: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(50, 91, 575, 633), 'Deep: ExpandOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group1.getBBox(), g.rect(101, 101, 163, 613), 'Deep: ExpandOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group2.getBBox(), g.rect(495, 202, 120, 263), 'Deep: ExpandOnly using padding options expands at child edges only.');
        });

        QUnit.test('deep + shrinkOnly', function(assert) {

            this.mainGroup.fitToChildren({ deep: true, shrinkOnly: true });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(153, 153, 397, 149), 'Deep: ShrinkOnly call takes all descendant embeds into account.');
            assert.deepEqual(this.group1.getBBox(), g.rect(153, 153, 48, 48), 'Deep: After shrinkOnly call the first group shrinks to only contain originally overlapped part of embeds.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: After shrinkOnly call the second group does not shrink because no overlap.');
        });

        QUnit.test('deep + shrinkOnly + padding', function(assert) {

            this.mainGroup.fitToChildren({ deep: true, shrinkOnly: true, padding: 10 });
            assert.deepEqual(this.mainGroup.getBBox(), g.rect(133, 150, 417, 162), 'Deep: ShrinkOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group1.getBBox(), g.rect(143, 143, 58, 58), 'Deep: ShrinkOnly using padding options expands at child edges only.');
            assert.deepEqual(this.group2.getBBox(), g.rect(502, 202, 100, 100), 'Deep: ShrinkOnly using padding options does not expand anywhere because no overlap.');
        });
    });
});

'use strict';

QUnit.module('cellView', function(hooks) {

    var paper;
    var cellView;

    hooks.beforeEach(function() {

        // !! TODO !!
        // Should be able to create a CellView instance without the graph or paper.
        const fixtureEl = fixtures.getElement();
        paper = new joint.dia.Paper;
        fixtureEl.appendChild(paper.render().el);

        var cell = new joint.dia.Element({
            type: 'element',
            markup: '<rect/>'
        });

        paper.model.addCell(cell);
        cellView = paper.findViewByModel(cell);
    });

    hooks.afterEach(function() {

        paper.remove();
        paper = null;
        cellView = null;
    });

    QUnit.module('can(feature)', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.CellView.prototype.can, 'function');
        });

        QUnit.test('options.interactive = false', function(assert) {

            cellView.options.interactive = false;

            assert.notOk(cellView.can('someFeature'));
        });

        QUnit.test('options.interactive = true', function(assert) {

            cellView.options.interactive = true;

            assert.ok(cellView.can('someFeature'));
        });

        QUnit.test('options.interactive = { someFeature: false }', function(assert) {

            cellView.options.interactive = { someFeature: false };

            assert.notOk(cellView.can('someFeature'));
        });

        QUnit.test('options.interactive = { someFeature: true }', function(assert) {

            cellView.options.interactive = { someFeature: true };

            assert.ok(cellView.can('someFeature'));
        });

        QUnit.test('options.interactive = function(cellView) { }', function(assert) {

            var called = false;

            cellView.options.interactive = function(cellView) {

                called = true;
                return false;
            };

            assert.notOk(cellView.can('someFeature'));
            assert.ok(called);
        });
    });

    QUnit.module('highlighting', function() {

        QUnit.test('default highlighter', function(assert) {

            paper.options.highlighting['default'] = { name: 'addClass' };
            cellView.highlight();
            assert.ok(cellView.$el.hasClass(joint.highlighters.addClass.className));
        });

        QUnit.test('highlighter specified by name only', function(assert) {

            cellView.highlight(null, { highlighter: 'addClass' });
            assert.ok(cellView.$el.hasClass(joint.highlighters.addClass.className));
        });

        QUnit.module('addClass', function() {

            QUnit.test('default class name', function(assert) {

                cellView.highlight(null, { highlighter: { name: 'addClass' }});
                assert.ok(cellView.$el.hasClass(joint.highlighters.addClass.className));

                cellView.unhighlight(null, { highlighter: { name: 'addClass' }});
                assert.notOk(cellView.$el.hasClass(joint.highlighters.addClass.className));
            });

            QUnit.test('with defined class name', function(assert) {

                cellView.highlight(null, { highlighter: { name: 'addClass', options: { className: 'xx' }}});
                assert.ok(cellView.$el.hasClass('xx'));

                cellView.unhighlight(null, { highlighter: { name: 'addClass', options: { className: 'xx' }}});
                assert.notOk(cellView.$el.hasClass('xx'));
            });
        });
    });

    QUnit.module('Attributes', function(hooks) {

        var cell;

        hooks.beforeEach(function() {
            cell = cellView.model;
            cell.resize(100,100).position(0, 0);
        });

        QUnit.module('ref', function(hooks) {
            QUnit.test('should use the ref node ancestor transformation only if it is not a common ancestor', function(assert) {
                const ax = 1;
                const ay = 2;
                const aw = 3;
                const ah = 4;
                const gx = 11;
                const gy = 13;
                [{
                    attrs: {
                        a: { ref: 'b', x: 'calc(x)', y: 'calc(y)', width: 'calc(w)', height: 'calc(h)' },
                    },
                    markup: joint.util.svg`
                        <g transform="translate(${gx},${gy})">
                            <rect @selector="b" x="${ax}" y="${ay}" width="${aw}" height="${ah}"/>
                        </g>
                        <rect @selector="a"/>
                    `
                }, {
                    attrs: {
                        a: { ref: 'b', x: 'calc(x)', y: 'calc(y)', width: 'calc(w)', height: 'calc(h)' },
                    },
                    markup: joint.util.svg`
                        <g transform="translate(${gx},${gy})">
                            <rect @selector="b" x="${ax}" y="${ay}" width="${aw}" height="${ah}"/>
                            <rect @selector="a"/>
                        </g>
                    `
                }].forEach(attributes => {
                    cell.set(attributes);
                    const [a] = cellView.findBySelector('a');
                    const bbox = V(a).getBBox({ target: cellView.el });
                    assert.equal(bbox.x, ax + gx);
                    assert.equal(bbox.y, ay + gy);
                    assert.equal(bbox.width, aw);
                    assert.equal(bbox.height, ah);
                });
            });
        });

        QUnit.module('Merging', function(hooks) {

            hooks.beforeEach(function() {
                cell.set('markup', [{
                    tagName: 'rect',
                    selector: 'selector1',
                    groupSelector: ['groupSelector', 'groupSelector1']
                }, {
                    tagName: 'rect',
                    selector: 'selector2',
                    groupSelector: ['groupSelector', 'groupSelector2']
                }]);
            });

            hooks.afterEach(function(assert) {
                assert.equal(cellView.el.querySelector('[joint-selector="selector1"]').getAttribute('test'), 'selector');
            });

            QUnit.test('selector, groupSelector(n > 1)', function() {
                cell.attr({
                    selector1: { test: 'selector' },
                    groupSelector: { test: 'groupSelector' }
                });
            });

            QUnit.test('groupSelector(n > 1), selector', function() {
                cell.attr({
                    groupSelector: { test: 'groupSelector' },
                    selector1: { test: 'selector' }
                });
            });

            QUnit.test('selector, groupSelector(n === 1)', function() {
                cell.attr({
                    selector1: { test: 'selector' },
                    groupSelector1: { test: 'groupSelector' }
                });
            });

            QUnit.test('groupSelector(n === 1), selector', function() {
                cell.attr({
                    groupSelector1: { test: 'groupSelector' },
                    selector1: { test: 'selector' }
                });
            });
        });

        QUnit.module('Type: Set', function(hooks) {

            var rectA, rectB;

            hooks.beforeEach(function() {
                cell.set('markup', '<rect class="a"/><rect class="b"/>');
                rectA = cellView.vel.findOne('.a');
                rectB = cellView.vel.findOne('.b');
            });

            QUnit.test('Sanity', function(assert) {

                var spy = sinon.spy();
                cell.constructor.attributes || (cell.constructor.attributes = {});
                cell.constructor.attributes.setTestAttribute = { set: spy };
                cell.attr('.a/setTestAttribute', 'value');

                assert.ok(spy.calledOnce);
                assert.ok(spy.calledOn(cellView));
                assert.ok(spy.calledWith(
                    'value',
                    sinon.match.instanceOf(g.Rect),
                    rectA.node,
                    cell.attr('.a')
                ));

                delete cell.constructor.attributes.setTestAttribute;
            });

            QUnit.test('Basics', function(assert) {

                cell.attr({
                    '.b': {
                        fill: {
                            type: 'radialGradient',
                            stops: [
                                { offset: '95%', color: '#3498DB' },
                                { offset: '98%', color: '#9B59B6' }
                            ]
                        }
                    }
                });

                assert.notEqual(rectB.attr('fill'), null);
            });
        });

        QUnit.module('Type: Position', function(hooks) {

            var rectA, rectB;

            hooks.beforeEach(function() {
                cell.set('markup', '<rect class="a"/><rect class="b"/>');
                rectA = cellView.vel.findOne('.a');
                rectB = cellView.vel.findOne('.b');
            });

            QUnit.test('Sanity', function(assert) {

                var spy = sinon.spy();
                cell.constructor.attributes || (cell.constructor.attributes = {});
                cell.constructor.attributes.positionTestAttribute = { position: spy };
                cell.attr('.a/positionTestAttribute', 'value');


                assert.ok(spy.calledOnce);
                assert.ok(spy.calledOn(cellView));
                assert.ok(spy.calledWith(
                    'value',
                    sinon.match.instanceOf(g.Rect),
                    rectA.node,
                    cell.attr('.a')
                ));

                delete cell.constructor.attributes.positionTestAttribute;
            }),

            QUnit.test('Basics', function(assert) {

                cell.attr({
                    '.a': {
                        refWidth: '100%',
                        refHeight: '100%',
                        refX: 0,
                        refY: 10
                    },
                    '.b': {
                        refWidth: '50%',
                        refHeight: '50%',
                        refX: '50%',
                        refY: '50%'
                    }
                });

                assert.deepEqual(rectA.bbox().toString(), '0@10 100@110');
                assert.deepEqual(rectB.bbox().toString(), '50@50 100@100');
                // Attributes are not actually set on the DOM Element
                assert.equal(rectA.attr('refWidth'), null);
                assert.equal(rectA.attr('refHeight'), null);
                assert.equal(rectB.attr('refX'), null);
                assert.equal(rectB.attr('refY'), null);
            });

            QUnit.test('With Ref', function(assert) {

                cell.attr({
                    '.a': {
                        refWidth: '100%',
                        refHeight: '100%',
                        refX: 10,
                        refY: 10
                    },
                    '.b': {
                        ref: '.a',
                        refWidth: '50%',
                        refHeight: '50%',
                        refX: '50%',
                        refY: '50%'
                    }
                });

                assert.deepEqual(rectA.bbox().toString(), '10@10 110@110');
                assert.deepEqual(rectB.bbox().toString(), '60@60 110@110');
            });

            QUnit.test('With Ref and Rotatable Group', function(assert) {
                var REF_DY = 10;
                var RECT_WIDTH = 50;
                cell.set('markup', [{
                    tagName: 'g',
                    selector: 'rotatable',
                    children: [{
                        tagName: 'rect',
                        selector: '.a',
                        className: 'a'
                    }]
                }, {
                    tagName: 'rect',
                    selector: '.b',
                    className: 'b'
                }, {
                    tagName: 'rect',
                    selector: '.c',
                    className: 'c'
                }]);
                cell.attr({
                    '.a': {
                        width: 100,
                        height: 100,
                        x: 0,
                        y: 0
                    },
                    '.b': {
                        width: RECT_WIDTH,
                        height: 50,
                        ref: '.a',
                        refDy: REF_DY,
                        refX: 0.5
                    },
                    '.c': {
                        width: RECT_WIDTH,
                        height: 50,
                        ref: '.b',
                        refDy: REF_DY,
                        refX: 0.5
                    }
                });
                cell.set('angle', 45);

                rectA = cellView.vel.findOne('.a');
                rectB = cellView.vel.findOne('.b');
                var rectC = cellView.vel.findOne('.c');
                var bboxA = rectA.getBBox({ target: paper.svg });
                var bboxB = rectB.getBBox({ target: paper.svg });
                var bboxC = rectC.getBBox({ target: paper.svg });

                assert.equal(Math.round(bboxB.y - bboxA.y - bboxA.height), REF_DY);
                assert.equal(Math.round(bboxC.y - bboxB.y - bboxB.height), REF_DY);
                assert.equal(Math.round(bboxC.x - bboxB.x), RECT_WIDTH / 2);
            });

            QUnit.test('Position stacking', function(assert) {
                // Position does not override the previous position.
                // The results are added up.
                cell.attr({
                    '.b': {
                        refWidth: '50%',
                        refHeight: '50%',
                        refX: '50%',
                        refX2: 20,
                        refY: '50%',
                        refY2: 20
                    }
                });
                assert.deepEqual(rectB.bbox().toString(), '70@70 120@120');
            });

            QUnit.test('Position && Transform', function(assert) {

                cell.attr({
                    '.b': {
                        refWidth: '50%',
                        refHeight: '50%',
                        refX: '50%',
                        refY: '50%',
                        transform: 'translate(10,10)'
                    }
                });
                assert.deepEqual(rectB.bbox().toString(), '60@60 110@110');

                cell.attr({
                    '.b': {
                        transform: 'scale(2,2)'
                    }
                });
                assert.deepEqual(rectB.bbox().toString(), '50@50 150@150');

                cell.attr({
                    '.b': {
                        transform: 'translate(10,10) scale(2,2)'
                    }
                });
                assert.deepEqual(rectB.bbox().toString(), '60@60 160@160');

            });
        });

        QUnit.module('Type: Offset', function(hooks) {

            var rectA, rectB;

            hooks.beforeEach(function() {
                cell.set('markup', '<rect class="a"/><rect class="b"/>');
                rectA = cellView.vel.findOne('.a');
                rectB = cellView.vel.findOne('.b');
            });

            QUnit.test('Sanity', function(assert) {

                var spy = sinon.spy();
                cell.constructor.attributes || (cell.constructor.attributes = {});
                cell.constructor.attributes.offsetTestAttribute = { offset: spy };
                cell.attr('.a/offsetTestAttribute', 'value');

                // Rect has no dimension yet
                assert.notOk(spy.called);

                cell.attr({
                    '.a': {
                        height: 100,
                        width: 100
                    }
                });

                assert.ok(spy.calledOnce);
                assert.ok(spy.calledOn(cellView));
                assert.ok(spy.calledWith(
                    'value',
                    sinon.match.instanceOf(g.Rect),
                    rectA.node,
                    cell.attr('.a')
                ));

                delete cell.constructor.attributes.offsetTestAttribute;
            }),

            QUnit.test('Basics', function(assert) {

                cell.attr({
                    '.b': {
                        refWidth: '50%',
                        refHeight: '50%',
                        refX: '50%',
                        refY: '50%',
                        xAlignment: 'middle',
                        yAlignment: 'middle'
                    }
                });

                assert.deepEqual(rectB.bbox().toString(), '25@25 75@75');
                // Attributes are not actually set on the DOM Element
                assert.equal(rectB.attr('xAlignment'), null);
                assert.equal(rectB.attr('yAlignment'), null);
            });

            QUnit.test('With Ref', function(assert) {

                cell.attr({
                    '.a': {
                        refWidth: '100%',
                        refHeight: '100%',
                        refX: 10,
                        refY: 10
                    },
                    '.b': {
                        ref: '.a',
                        refWidth: '50%',
                        refHeight: '50%',
                        refX: '50%',
                        refY: '50%',
                        xAlignment: 'middle',
                        yAlignment: 'middle'
                    }
                });
                assert.deepEqual(rectA.bbox().toString(), '10@10 110@110');
                assert.deepEqual(rectB.bbox().toString(), '35@35 85@85');

                cell.attr({
                    '.a': {
                        transform: 'scale(2,2)'
                    }
                });
                assert.deepEqual(rectA.bbox().toString(), '10@10 210@210');
                assert.deepEqual(rectB.bbox().toString(), '60@60 160@160');

            });

            QUnit.test('Offset && Transform', function(assert) {

                cell.attr({
                    '.b': {
                        transform: 'translate(10,10)',
                        refWidth: '50%',
                        refHeight: '50%',
                        refX: '50%',
                        refY: '50%',
                        xAlignment: 'middle',
                        yAlignment: 'middle'
                    }
                });
                assert.deepEqual(rectB.bbox().toString(), '35@35 85@85');

                cell.attr({
                    '.b': {
                        transform: 'scale(3,3)'
                    }
                });
                assert.deepEqual(rectB.bbox().toString(), '-25@-25 125@125');

                cell.attr({
                    '.b': {
                        transform: 'translate(10,10) scale(3,3)'
                    }
                });
                assert.deepEqual(rectB.bbox().toString(), '-15@-15 135@135');
            });
        });

        QUnit.module('Backwards compatibility', function() {

            QUnit.test('inline transform attribute', function(assert) {
                cell.set('markup', '<rect class="a" transform="translate(10,10)"/>');
                var rect = cellView.vel.findOne('.a');

                cell.attr('rect/style', { fill: 'red' }); // set attribute
                assert.equal(rect.attr('transform'), 'translate(10,10)', 'inline attribute stays untouched');

                cell.attr('rect/refX', 20); // position attribute
                assert.equal(rect.attr('transform'), 'matrix(1,0,0,1,20,0)', 'inline attribute is disregarder');
            });
        });

        QUnit.module('Text', function(hooks) {

            hooks.beforeEach(function() {
                cell.set('markup', '<rect/><text/>');
            });

            QUnit.test('attribute "x"', function(assert) {

                var X = 23;

                function testTextOffset(offset) {
                    var text = cellView.vel.findOne('text');
                    var tspans = text.find('tspan');
                    tspans.forEach(function(tspan) {
                        assert.equal(tspan.bbox(false, cellView.el).x, offset, 'Offset of "' + tspan.node.textContent + '""');
                    });
                }

                assert.expect(6);

                cell.attr({ text: { refX: null, x: X, text: 'single line - no refX and with x' }}, { dirty: true });
                testTextOffset(X);

                cell.attr({ text: { refX: X, x: X, text: 'single line - with refX and x' }}, { dirty: true });
                testTextOffset(X + X);

                cell.attr({ text: { refX: null, x: X, text: '1. line - no refX and with x\n2. line - no refX and with x' }}, { dirty: true });
                testTextOffset(X);

                cell.attr({ text: { refX: X, x: X, text: '1. line - with refX and x\n2. line - with refX and x' }}, { dirty: true });
                testTextOffset(X + X);
            });
        });

        QUnit.module('Event', function(hooks) {

            hooks.beforeEach(function() {
                cell.set('markup', '<g class="ab"><rect class="a"/><rect class="b"/></g><rect class="c"/>');
            });

            QUnit.test('sanity', function(assert) {
                var paperSpy = sinon.spy();
                var cellViewSpy = sinon.spy();
                cell.attr('.ab/event', 'test-event');
                paper.on('test-event', paperSpy);
                cellView.on('test-event', cellViewSpy);
                // Event should be triggered
                simulate.mousedown({ el: cellView.el.querySelector('.ab') });
                simulate.mouseup({ el: cellView.el.querySelector('.ab') });
                simulate.mousedown({ el: cellView.el.querySelector('.a') });
                simulate.mouseup({ el: cellView.el.querySelector('.a') });
                simulate.mousedown({ el: cellView.el.querySelector('.b') });
                simulate.mouseup({ el: cellView.el.querySelector('.b') });
                assert.equal(paperSpy.callCount, 3);
                assert.equal(cellViewSpy.callCount, 3);
                assert.ok(paperSpy.alwaysCalledWith(
                    cellView,
                    sinon.match.instanceOf($.Event),
                    sinon.match.number,
                    sinon.match.number
                ));
                assert.ok(cellViewSpy.alwaysCalledWith(
                    sinon.match.instanceOf($.Event),
                    sinon.match.number,
                    sinon.match.number
                ));
                // Event should not be triggered
                paperSpy.resetHistory();
                cellViewSpy.resetHistory();
                simulate.mousedown({ el: cellView.el.querySelector('.c') });
                assert.notOk(paperSpy.called);
                assert.notOk(cellViewSpy.called);
            });
        });

        QUnit.module('resetOffset', function(hooks) {

            hooks.beforeEach(function() {
                cell.set('markup', 'path');
            });

            QUnit.test('sanity', function(assert) {
                cell.attr('path/d', 'M 10 10 20 20');
                assert.equal(cellView.getBBox().toString(), '10@10 20@20');
                cell.attr('path/resetOffset', true);
                assert.equal(cellView.getBBox().toString(), '0@0 10@10');
                cell.attr('path/resetOffset', false);
                assert.equal(cellView.getBBox().toString(), '10@10 20@20');
            });
        });

    });
});

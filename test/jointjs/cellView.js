'use strict';

QUnit.module('cellView', function(hooks) {

    var paper;
    var cellView;

    hooks.beforeEach(function() {

        // !! TODO !!
        // Should be able to create a CellView instance without the graph or paper.

        paper = new joint.dia.Paper;
        paper.render().$el.appendTo('#qunit-fixture');

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

            QUnit.test('Position stacking', function(assert) {
                // Positin does not override the previous position.
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
    });
});

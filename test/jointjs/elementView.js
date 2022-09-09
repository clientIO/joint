'use strict';

QUnit.module('elementView', function(hooks) {

    var paper;
    var elementView;

    hooks.beforeEach(function() {

        paper = new joint.dia.Paper({
            el: $('<div/>').appendTo('#qunit-fixture'),
            model: new joint.dia.Graph,
            width: 300,
            height: 300
        });

        var element = new joint.shapes.basic.Generic({
            markup: '<toBeOverriden/>'
        });

        element.addTo(paper.model);
        elementView = element.findView(paper);
    });

    hooks.afterEach(function() {

        paper.remove();
        paper = null;
    });

    QUnit.module('ports', function() {

        QUnit.test('no label markup', function(assert) {
            var el1 = new joint.shapes.standard.Rectangle({
                portMarkup: [{ tagName: 'polygon' }],
                portLabelMarkup: [],
                ports: {
                    items: [{
                        id: 1
                    }, {
                        id: 2
                    }]
                }
            });
            var el2 = new joint.shapes.standard.Rectangle({
                portMarkup: [{ tagName: 'polygon' }],
                ports: {
                    items: [{
                        id: 1,
                        label: { markup: [] }
                    }, {
                        id: 2
                    }]
                }
            });
            paper.model.addCells([el1, el2]);
            var el1view = el1.findView(paper);
            var el2view = el2.findView(paper);
            assert.equal(el1view.findPortNode(1, 'root').childNodes.length, 1);
            assert.equal(el1view.findPortNode(2, 'root').childNodes.length, 1);
            assert.equal(el1view.findPortNode(2, 'root').firstChild.tagName.toUpperCase(), 'POLYGON');
            assert.equal(el2view.findPortNode(1, 'root').childNodes.length, 1);
            assert.equal(el2view.findPortNode(2, 'root').childNodes.length, 2);
            assert.equal(el2view.findPortNode(2, 'root').firstChild.tagName.toUpperCase(), 'POLYGON');
            assert.equal(el2view.findPortNode(2, 'root').lastChild.tagName.toUpperCase(), 'TEXT');
        });

        QUnit.test('implicit selectors', function(assert) {
            var el1 = new joint.shapes.standard.Rectangle({
                portMarkup: [{ tagName: 'polygon' }],
                portLabelMarkup: [{ tagName: 'circle', selector: 'cs' }],
                ports: {
                    items: [{
                        id: 1
                    }]
                }
            });
            var el2 = new joint.shapes.standard.Rectangle({
                portMarkup: [{ tagName: 'polygon' }, { tagName: 'polyline' }],
                portLabelMarkup: [{ tagName: 'circle' }, { tagName: 'ellipse', selector: 'es' }],
                ports: {
                    items: [{
                        id: 1
                    }]
                }
            });
            paper.model.addCells([el1, el2]);

            var el1view = el1.findView(paper);
            assert.equal(el1view.findPortNode(1), el1view.findPortNode(1, 'portRoot'));
            assert.equal(el1view.findPortNode(1, 'root').childNodes.length, 2);
            assert.equal(el1view.findPortNode(1, 'root').parentNode, el1view.el);
            assert.equal(el1view.findPortNode(1, 'root').firstChild.tagName.toUpperCase(), 'POLYGON');
            assert.equal(el1view.findPortNode(1, 'root').lastChild.tagName.toUpperCase(), 'CIRCLE');
            assert.equal(el1view.findPortNode(1, 'portRoot').tagName.toUpperCase(), 'POLYGON');
            assert.equal(el1view.findPortNode(1, 'labelRoot').tagName.toUpperCase(), 'CIRCLE');
            assert.equal(el1view.findPortNode(1, 'portRoot').parentNode, el1view.findPortNode(1, 'root'));
            assert.equal(el1view.findPortNode(1, 'labelRoot').parentNode, el1view.findPortNode(1, 'root'));
            assert.equal(el1view.findPortNode(1, 'cs').tagName.toUpperCase(), 'CIRCLE');
            assert.equal(el1view.findPortNode(1, 'es'), null);

            var el2view = el2.findView(paper);
            assert.equal(el2view.findPortNode(1), el2view.findPortNode(1, 'portRoot'));
            assert.equal(el2view.findPortNode(1, 'root').childNodes.length, 2);
            assert.equal(el2view.findPortNode(1, 'root').parentNode, el2view.el);
            assert.equal(el2view.findPortNode(1, 'portRoot').tagName.toUpperCase(), 'G');
            assert.equal(el2view.findPortNode(1, 'portRoot').firstChild.tagName.toUpperCase(), 'POLYGON');
            assert.equal(el2view.findPortNode(1, 'portRoot').lastChild.tagName.toUpperCase(), 'POLYLINE');
            assert.equal(el2view.findPortNode(1, 'labelRoot').tagName.toUpperCase(), 'G');
            assert.equal(el2view.findPortNode(1, 'labelRoot').firstChild.tagName.toUpperCase(), 'CIRCLE');
            assert.equal(el2view.findPortNode(1, 'labelRoot').lastChild.tagName.toUpperCase(), 'ELLIPSE');
            assert.equal(el2view.findPortNode(1, 'portRoot').parentNode, el2view.findPortNode(1, 'root'));
            assert.equal(el2view.findPortNode(1, 'labelRoot').parentNode, el2view.findPortNode(1, 'root'));
            assert.equal(el2view.findPortNode(1, 'es').tagName.toUpperCase(), 'ELLIPSE');
            assert.equal(el2view.findPortNode(1, 'cs'), null);
        });
    });

    QUnit.module('custom view ', function() {

        QUnit.test('getBBox should not fail for custom view', function(assert) {

            var element = new joint.shapes.basic.Generic({ markup: '<toBeOverriden/>' });
            var CustomView = joint.dia.ElementView.extend({
                initialize: function() {
                    // noop
                },
                update: function() {
                    // noop
                }
            });

            paper = new joint.dia.Paper({
                el: $('<div/>').appendTo('#qunit-fixture'),
                model: new joint.dia.Graph,
                elementView: CustomView,
                width: 300,
                height: 300
            });

            element.addTo(paper.model);

            var elementView = element.findView(paper);

            var bbx = elementView.getBBox();

            assert.ok(bbx instanceof g.Rect);
            assert.ok(elementView.metrics === null, 'cache should not be used for this view');
        });
    });

    QUnit.module('rotatable group and no scalable group', function(hooks) {

        hooks.beforeEach(function() {

            elementView.model.set({
                markup: '<g class="rotatable"><rect class="body"/><text class="label"/></g>'
            }).attr({
                '.body': {
                    'ref-width': 1,
                    'ref-height': 1
                }
            });
        });

        QUnit.test('un-rotated elementView should update the size when model is resized', function(assert) {

            elementView.model.rotate(0).resize(100, 200).translate(100, 100);

            assert.checkBboxApproximately(1, elementView.getBBox(), {
                x: 100,
                y: 100,
                width: 100,
                height: 200
            });
        });

        QUnit.test('rotated elementView should update the size when model is resized', function(assert) {

            elementView.model.rotate(90).resize(100, 200).translate(100, 100);

            assert.checkBboxApproximately(1, elementView.getBBox(), {
                x: 50,
                y: 150,
                width: 200,
                height: 100
            });
        });

        QUnit.test('resizing a rotated element with options passed will trigger all subsequent events with this option.', function(assert) {

            assert.expect(6);

            elementView.model.set({
                markup: '<g class="rotatable"><g class="scalable"><rect class="body"/><text class="label"/></g></g>'
            });

            elementView.model.resize(100, 100).translate(100, 100).rotate(45);

            paper.model.on('all', function(eventName) {
                var options = _.last(arguments);
                assert.ok(options.passed, eventName);
            });

            elementView.model.resize(200, 300, { passed: true });
        });

        QUnit.test('getNodeBBox(), getNodeMatrix()', function(assert) {

            elementView.model.set({
                markup: [
                    {
                        tagName: 'g',
                        selector: 'rotatable',
                        children: [
                            {
                                tagName: 'rect',
                                selector: 'rectInside',
                            },
                            {
                                tagName: 'circle',
                                selector: 'circle',
                                attributes: {
                                    transform: 'translate(11,13)',
                                    r: 5
                                }
                            }
                        ],
                    }, {
                        tagName: 'rect',
                        selector: 'rectOutside',
                    },
                ],
                attrs: {
                    rectInside: {
                        x: 21,
                        y: 13,
                        width: 20,
                        height: 10
                    },
                    rectOutside: {
                        x: 21,
                        y: 13,
                        width: 20,
                        height: 10
                    }
                }
            });

            elementView.model.resize(100, 100).translate(100, 100).rotate(90);

            var rectInside = elementView.findBySelector('rectInside')[0];
            assert.checkBboxApproximately(1, elementView.getNodeBBox(rectInside), {
                x: 177,
                y: 121,
                width: 10,
                height: 20
            });

            assert.equal(V.matrixToTransformString(elementView.getNodeMatrix(rectInside)), 'matrix(1,0,0,1,0,0)');

            var rectOutside = elementView.findBySelector('rectOutside')[0];
            assert.checkBboxApproximately(1, elementView.getNodeBBox(rectOutside), {
                x: 121,
                y: 113,
                width: 20,
                height: 10
            });

            assert.equal(V.matrixToTransformString(elementView.getNodeMatrix(rectOutside)), 'matrix(1,0,0,1,0,0)');

            var circle = elementView.findBySelector('circle')[0];
            assert.checkBboxApproximately(1, elementView.getNodeBBox(circle), {
                x: 182,
                y: 106,
                width: 10,
                height: 10
            });

            assert.equal(V.matrixToTransformString(elementView.getNodeMatrix(circle)), 'matrix(1,0,0,1,11,13)');
        });
    });

    QUnit.module('no rotatable group and no scalable group', function(hooks) {

        hooks.beforeEach(function() {

            elementView.model.set({
                markup: '<rect class="body"/><text class="label"/>'
            }).attr({
                '.body': {
                    'ref-width': 1,
                    'ref-height': 1
                }
            });
        });

        QUnit.test('un-rotated elementView should update the size when model is resized', function(assert) {

            elementView.model.rotate(0).resize(100, 200).translate(100, 100);

            assert.checkBboxApproximately(1, elementView.getBBox(), {
                x: 100,
                y: 100,
                width: 100,
                height: 200
            });
        });

        QUnit.test('rotated elementView should update the size when model is resized', function(assert) {

            elementView.model.rotate(90).resize(100, 200).translate(100, 100);

            assert.checkBboxApproximately(1, elementView.getBBox(), {
                x: 50,
                y: 150,
                width: 200,
                height: 100
            });
        });
    });

    QUnit.module('getDelegatedView()', function() {

        QUnit.test('Interactivity "stopDelegation"', function(assert) {

            var element2 = new joint.shapes.standard.Rectangle();
            var element3 = new joint.shapes.standard.Rectangle();

            paper.model.addCells([element2, element3]);

            var elementView2 = element2.findView(paper);
            var elementView3 = element3.findView(paper);

            element3.embed(element2);
            element2.embed(elementView.model);

            elementView.setInteractivity({ stopDelegation: true });
            assert.equal(elementView.getDelegatedView(), elementView);
            elementView.setInteractivity({ stopDelegation: false });
            assert.equal(elementView.getDelegatedView(), elementView2);
            elementView2.setInteractivity({ stopDelegation: false });
            assert.equal(elementView.getDelegatedView(), elementView3);
            elementView3.setInteractivity({ stopDelegation: false });
            assert.equal(elementView.getDelegatedView(), elementView3);

            var link = new joint.shapes.standard.Link();
            link.addTo(paper.model);

            link.embed(element3);
            assert.equal(elementView.getDelegatedView(), null);
            link.unembed(element3);

            // view does not exists
            paper.removeView(element2);
            assert.equal(elementView.getDelegatedView(), null);
        });

    });
});

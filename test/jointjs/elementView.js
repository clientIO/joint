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

            assert.expect(5);

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
});

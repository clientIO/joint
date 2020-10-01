'use strict';

QUnit.module('linkView', function(hooks) {

    var paper;
    var link;
    var linkView;
    var link2;
    var linkView2;

    hooks.beforeEach(function() {

        paper = new joint.dia.Paper({
            el: $('<div/>').appendTo('#qunit-fixture'),
            model: new joint.dia.Graph,
            width: 300,
            height: 300
        });

        link = new joint.dia.Link({
            source: { x: 100, y: 100 },
            target: { x: 200, y: 100 }
        });
        link.addTo(paper.model);
        linkView = link.findView(paper);

        link2 = new joint.dia.Link({
            source: { x: 100, y: 100 },
            target: { x: 100, y: 100 }
        });
        link2.addTo(paper.model);
        linkView2 = link2.findView(paper);
    });

    hooks.afterEach(function() {

        paper.remove();
        paper = null;
    });

    QUnit.module('labels', function() {

        QUnit.test('SVGGroup container', function(assert) {
            link.labels([{}]);
            assert.ok(linkView.el.querySelector('.labels'));
            link.labels([]);
            assert.notOk(linkView.el.querySelector('.labels'));
        });

        QUnit.test('Selectors', function(assert) {
            link.labels([{
                markup: [{
                    tagName: 'circle',
                    selector: 'c',
                    groupSelector: 'cr'
                }, {
                    tagName: 'rect',
                    selector: 'r',
                    groupSelector: 'cr'
                }],
                attrs: {
                    root: { rootTest: true },
                    c: { circleTest: true },
                    r: { rectTest: true },
                    cr: { groupTest: true }
                }
            }]);
            var rootNode = linkView.el.querySelector('[root-test]');
            var circleNode = linkView.el.querySelector('[circle-test]');
            var rectNode = linkView.el.querySelector('[rect-test]');
            var group = linkView.el.querySelectorAll('[group-test]');
            assert.ok(rootNode instanceof SVGGElement);
            assert.ok(circleNode instanceof SVGCircleElement);
            assert.ok(rectNode instanceof SVGRectElement);
            assert.equal(group.length, 2);
            assert.equal(group[0], circleNode);
            assert.equal(group[1], rectNode);
        });
    });

    QUnit.module('addLabel', function(hooks) {

        QUnit.test('default args', function(assert) {

            linkView.addLabel(100, 100);
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0, offset: 0 }});
            link.removeLabel(0);

            linkView.addLabel(150, 100);
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0.5, offset: 0 }});
            link.removeLabel(0);

            linkView.addLabel(200, 100);
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: 0 }});
            link.removeLabel(0);

            linkView.addLabel(175, 50);
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0.75, offset: -50 }});
            link.removeLabel(0);

            linkView.addLabel(250, 100);
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: 0 }});
            link.removeLabel(0);

            linkView2.addLabel(100, 100);
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 0, offset: { x: 0, y: 0 }}});
            link2.removeLabel(0);

            linkView2.addLabel(150, 50);
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 0, offset: { x: 50, y: -50 }}});
            link2.removeLabel(0);
        });

        QUnit.test('absolute distance', function(assert) {

            linkView.addLabel(100, 100, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0, offset: 0, args: { absoluteDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(150, 100, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 50, offset: 0, args: { absoluteDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(200, 100, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 100, offset: 0, args: { absoluteDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(175, 50, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 75, offset: -50, args: { absoluteDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(250, 100, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 100, offset: 0, args: { absoluteDistance: true }}});
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { absoluteDistance: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 0, offset: { x: 0, y: 0 }, args: { absoluteDistance: true }}});
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { absoluteDistance: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 0, offset: { x: 50, y: -50 }, args: { absoluteDistance: true }}});
            link2.removeLabel(0);
        });

        QUnit.test('reverse distance', function(assert) {

            linkView.addLabel(100, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: -100, offset: 0, args: { absoluteDistance: true, reverseDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(150, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: -50, offset: 0, args: { absoluteDistance: true, reverseDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(200, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: 0, args: { absoluteDistance: true, reverseDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(175, 50, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: -25, offset: -50, args: { absoluteDistance: true, reverseDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(250, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: 0, args: { absoluteDistance: true, reverseDistance: true }}});
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true }}});
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 1, offset: { x: 50, y: -50 }, args: { absoluteDistance: true, reverseDistance: true }}});
            link2.removeLabel(0);
        });

        QUnit.test('reverse distance without absolute distance (no effect)', function(assert) {

            linkView.addLabel(100, 100, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0, offset: 0, args: { reverseDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(150, 100, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0.5, offset: 0, args: { reverseDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(200, 100, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: 0, args: { reverseDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(175, 50, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0.75, offset: -50, args: { reverseDistance: true }}});
            link.removeLabel(0);

            linkView.addLabel(250, 100, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: 0, args: { reverseDistance: true }}});
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { reverseDistance: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 0, offset: { x: 0, y: 0 }, args: { reverseDistance: true }}});
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { reverseDistance: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 0, offset: { x: 50, y: -50 }, args: { reverseDistance: true }}});
            link2.removeLabel(0);
        });

        QUnit.test('absolute offset', function(assert) {

            linkView.addLabel(100, 100, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0, offset: { x: 0, y: 0 }, args: { absoluteOffset: true }}});
            link.removeLabel(0);

            linkView.addLabel(150, 100, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0.5, offset: { x: 0, y: 0 }, args: { absoluteOffset: true }}});
            link.removeLabel(0);

            linkView.addLabel(200, 100, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: { x: 0, y: 0 }, args: { absoluteOffset: true }}});
            link.removeLabel(0);

            linkView.addLabel(175, 50, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 0.75, offset: { x: 0, y: -50 }, args: { absoluteOffset: true }}});
            link.removeLabel(0);

            linkView.addLabel(250, 100, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: { x: 50, y: 0 }, args: { absoluteOffset: true }}});
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { absoluteOffset: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 0, offset: { x: 0, y: 0 }, args: { absoluteOffset: true }}});
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { absoluteOffset: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 0, offset: { x: 50, y: -50 }, args: { absoluteOffset: true }}});
            link2.removeLabel(0);
        });

        QUnit.test('all args', function(assert) {

            linkView.addLabel(100, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: -100, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }}});
            link.removeLabel(0);

            linkView.addLabel(150, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: -50, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }}});
            link.removeLabel(0);

            linkView.addLabel(200, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }}});
            link.removeLabel(0);

            linkView.addLabel(175, 50, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: -25, offset: { x: 0, y: -50 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }}});
            link.removeLabel(0);

            linkView.addLabel(250, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { angle: 0, distance: 1, offset: { x: 50, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }}});
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }}});
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link2.label(0), { position: { angle: 0, distance: 1, offset: { x: 50, y: -50 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }}});
            link2.removeLabel(0);
        });
    });

    QUnit.module('addVertex', function(hooks) {

        QUnit.test('add vertex', function(assert) {

            assert.deepEqual(link.vertices(), []);

            linkView.addVertex(150, 100);
            assert.deepEqual(link.vertices(), [{ x: 150, y: 100 }]);

            linkView.addVertex(175, 50);
            assert.deepEqual(link.vertices(), [{ x: 150, y: 100 }, { x: 175, y: 50 }]);

            linkView.addVertex(250, 100);
            assert.deepEqual(link.vertices(), [{ x: 150, y: 100 }, { x: 175, y: 50 }, { x: 250, y: 100 }]);

            linkView.addVertex(150, 50);
            assert.deepEqual(link.vertices(), [{ x: 150, y: 100 }, { x: 150, y: 50 }, { x: 175, y: 50 }, { x: 250, y: 100 }]);
        });
    });

    QUnit.module('findLabelNode', function(hooks) {

        QUnit.test('root', function(assert) {
            link.labels([{ }, { }]);
            assert.equal(linkView.findLabelNode(0).getAttribute('label-idx'), '0');
            assert.equal(linkView.findLabelNode(1).getAttribute('label-idx'), '1');
            assert.equal(linkView.findLabelNode(2), null);
        });

        QUnit.test('by selector', function(assert) {
            link.labels([{ }, { }]);
            var rect0 = linkView.findLabelNode(0, 'rect');
            assert.ok(rect0 instanceof SVGRectElement);
            assert.equal(rect0.parentNode.getAttribute('label-idx'), '0');
            var text1 = linkView.findLabelNode(1, 'text');
            assert.ok(text1 instanceof SVGTextElement);
            assert.equal(text1.parentNode.getAttribute('label-idx'), '1');
            // Edge Cases
            assert.equal(linkView.findLabelNode(1, 'invalid-selector'), null);
            assert.equal(linkView.findLabelNode(2, 'rect'), null);
        });
    });

    QUnit.module('getLabelPosition', function(hooks) {

        QUnit.test('default args', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100);
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: 0 });

            labelPosition = linkView.getLabelPosition(150, 100);
            assert.deepEqual(labelPosition, { angle: 0, distance: 0.5, offset: 0 });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100);
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: 0 });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50);
            assert.deepEqual(labelPosition, { angle: 0, distance: 0.75, offset: -50 });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100);
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: 0 });
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100);
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 0, y: 0 }});
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50);
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 50, y: -50 }});
            link2.removeLabel(0);
        });

        QUnit.test('absolute distance', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: 0, args: { absoluteDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 50, offset: 0, args: { absoluteDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 100, offset: 0, args: { absoluteDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 75, offset: -50, args: { absoluteDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 100, offset: 0, args: { absoluteDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 0, y: 0 }, args: { absoluteDistance: true }});
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 50, y: -50 }, args: { absoluteDistance: true }});
            link2.removeLabel(0);
        });

        QUnit.test('reverse distance', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: -100, offset: 0, args: { absoluteDistance: true, reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: -50, offset: 0, args: { absoluteDistance: true, reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: 0, args: { absoluteDistance: true, reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: -25, offset: -50, args: { absoluteDistance: true, reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: 0, args: { absoluteDistance: true, reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true }});
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: { x: 50, y: -50 }, args: { absoluteDistance: true, reverseDistance: true }});
            link2.removeLabel(0);
        });

        QUnit.test('reverse distance without absolute distance (no effect)', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: 0, args: { reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0.5, offset: 0, args: { reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: 0, args: { reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0.75, offset: -50, args: { reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: 0, args: { reverseDistance: true }});
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 0, y: 0 }, args: { reverseDistance: true }});
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { reverseDistance: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 50, y: -50 }, args: { reverseDistance: true }});
            link2.removeLabel(0);
        });

        QUnit.test('absolute offset', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 0, y: 0 }, args: { absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0.5, offset: { x: 0, y: 0 }, args: { absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: { x: 0, y: 0 }, args: { absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0.75, offset: { x: 0, y: -50 }, args: { absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: { x: 50, y: 0 }, args: { absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 0, y: 0 }, args: { absoluteOffset: true }});
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 0, offset: { x: 50, y: -50 }, args: { absoluteOffset: true }});
            link2.removeLabel(0);
        });

        QUnit.test('all args', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: -100, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: -50, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: -25, offset: { x: 0, y: -50 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: { x: 50, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }});
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }});
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { angle: 0, distance: 1, offset: { x: 50, y: -50 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true }});
            link2.removeLabel(0);
        });
    });

    QUnit.module('getLabelCoordinates', function(hooks) {

        QUnit.test('default', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0, offset: 0 });
            assert.equal(labelCoordinates.toString(), '100@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0.5, offset: 0 });
            assert.equal(labelCoordinates.toString(), '150@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.equal(labelCoordinates.toString(), '200@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0.75, offset: -50 });
            assert.equal(labelCoordinates.toString(), '175@50');

            // unreachable region
            /*labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.equal(labelCoordinates.toString(), '250@100');*/

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: 0 });
            assert.equal(labelCoordinates.toString(), '100@100');

            // offset coerced to absolute
            /*labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 50, y: -50 } });
            assert.equal(labelCoordinates.toString(), '150@50');*/
        });

        QUnit.test('absolute', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0, offset: 0 });
            assert.equal(labelCoordinates.toString(), '100@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 50, offset: 0 });
            assert.equal(labelCoordinates.toString(), '150@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 100, offset: 0 });
            assert.equal(labelCoordinates.toString(), '200@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 75, offset: -50 });
            assert.equal(labelCoordinates.toString(), '175@50');

            // unreachable region
            /*labelCoordinates = linkView.getLabelCoordinates({ distance: 100, offset: 0 });
            assert.equal(labelCoordinates.toString(), '250@100');*/

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: 0 });
            assert.equal(labelCoordinates.toString(), '100@100');

            // offset coerced to absolute
            /*labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 50, y: -50 } });
            assert.equal(labelCoordinates.toString(), '150@50');*/
        });

        QUnit.test('reverse absolute', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: -100, offset: 0 });
            assert.equal(labelCoordinates.toString(), '100@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: -50, offset: 0 });
            assert.equal(labelCoordinates.toString(), '150@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.equal(labelCoordinates.toString(), '200@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: -25, offset: -50 });
            assert.equal(labelCoordinates.toString(), '175@50');

            // unreachable region
            /*labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.equal(labelCoordinates.toString(), '250@100');*/

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.equal(labelCoordinates.toString(), '100@100');

            // offset coerced to absolute
            /*labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 50, y: -50 } });
            assert.equal(labelCoordinates.toString(), '150@50');*/
        });

        QUnit.test('absolute offset', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0, offset: { x: 0, y: 0 }});
            assert.equal(labelCoordinates.toString(), '100@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0.5, offset: { x: 0, y: 0 }});
            assert.equal(labelCoordinates.toString(), '150@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: { x: 0, y: 0 }});
            assert.equal(labelCoordinates.toString(), '200@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0.75, offset: { x: 0, y: -50 }});
            assert.equal(labelCoordinates.toString(), '175@50');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: { x: 50, y: 0 }});
            assert.equal(labelCoordinates.toString(), '250@100');

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 0, y: 0 }});
            assert.equal(labelCoordinates.toString(), '100@100');

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 50, y: -50 }});
            assert.equal(labelCoordinates.toString(), '150@50');
        });

        QUnit.test('all', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: -100, offset: { x: 0, y: 0 }});
            assert.equal(labelCoordinates.toString(), '100@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: -50, offset: { x: 0, y: 0 }});
            assert.equal(labelCoordinates.toString(), '150@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: { x: 0, y: 0 }});
            assert.equal(labelCoordinates.toString(), '200@100');

            labelCoordinates = linkView.getLabelCoordinates({ distance: -25, offset: { x: 0, y: -50 }});
            assert.equal(labelCoordinates.toString(), '175@50');

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: { x: 50, y: 0 }});
            assert.equal(labelCoordinates.toString(), '250@100');

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 1, offset: { x: 0, y: 0 }});
            assert.equal(labelCoordinates.toString(), '100@100');

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 1, offset: { x: 50, y: -50 }});
            assert.equal(labelCoordinates.toString(), '150@50');
        });
    });

    QUnit.module('getVertexIndex', function(hooks) {

        QUnit.test('get vertex index', function(assert) {

            var vertexIndex;

            vertexIndex = linkView.getVertexIndex(150, 100);
            assert.equal(vertexIndex, 0);
            linkView.addVertex(150, 100);

            vertexIndex = linkView.getVertexIndex(175, 50);
            assert.equal(vertexIndex, 1);
            linkView.addVertex(175, 50);

            vertexIndex = linkView.getVertexIndex(250, 100);
            assert.equal(vertexIndex, 2);
            linkView.addVertex(250, 100);

            vertexIndex = linkView.getVertexIndex(150, 50);
            assert.equal(vertexIndex, 1);
            linkView.addVertex(150, 50);
        });
    });

    QUnit.module('linkAnchors', function() {

        QUnit.test('sanity', function(assert) {
            // Source Anchor
            var sourceAnchor = new g.Point(1, -1);
            var sourceAnchorSpy = joint.linkAnchors.test1 = sinon.spy(function() {
                return sourceAnchor;
            });
            linkView.model.source(link2, {
                anchor: {
                    name: 'test1',
                    args: {
                        testArg1: true
                    }
                }
            });
            assert.ok(sourceAnchorSpy.calledOnce);
            assert.ok(sourceAnchorSpy.calledWithExactly(
                linkView2,
                linkView2.el,
                sinon.match.instanceOf(g.Point),
                sinon.match({ testArg1: true }),
                'source',
                linkView
            ));
            assert.ok(sourceAnchorSpy.calledOn(linkView));
            assert.deepEqual(linkView.sourceBBox.toJSON(), (new g.Rect(sourceAnchor)).toJSON());


            // // Target Anchor
            var targetAnchor = new g.Point(-1, 1);
            var targetAnchorSpy = joint.linkAnchors.test2 = sinon.spy(function() {
                return targetAnchor;
            });
            linkView.model.target(link2, {
                anchor: {
                    name: 'test2',
                    args: {
                        testArg2: true
                    }
                }
            });
            assert.ok(targetAnchorSpy.calledOnce);
            assert.ok(targetAnchorSpy.calledWithExactly(
                linkView2,
                linkView2.el,
                sinon.match.instanceOf(g.Point),
                sinon.match({ testArg2: true }),
                'target',
                linkView
            ));
            assert.ok(targetAnchorSpy.calledOn(linkView));
            assert.deepEqual(linkView.targetBBox.toJSON(), (new g.Rect(targetAnchor)).toJSON());

            // // Changing target updates both anchors
            assert.ok(sourceAnchorSpy.calledTwice);

            // // Source Magnet
            sourceAnchorSpy.resetHistory();
            var sourceMagnetAnchorSpy = joint.anchors.test1 = sinon.spy(function() {
                return sourceAnchor;
            });
            linkView.model.prop('source/magnet', '.connection');
            assert.ok(sourceAnchorSpy.notCalled);
            assert.ok(sourceMagnetAnchorSpy.calledWithExactly(
                linkView2,
                // eslint-disable-next-line no-undef
                linkView2.el.querySelector('.connection'),
                sinon.match(function(value) {
                    return value instanceof SVGElement;
                }), // requires resolving
                sinon.match({ testArg1: true }),
                'source',
                linkView
            ));
            assert.ok(sourceMagnetAnchorSpy.calledOnce);

            // // Target Magnet
            targetAnchorSpy.resetHistory();
            var targetMagnetAnchorSpy = joint.anchors.test2 = sinon.spy(function() {
                return targetAnchor;
            });
            linkView.model.prop('target/magnet', '.connection');
            assert.ok(targetAnchorSpy.notCalled);

            assert.ok(targetMagnetAnchorSpy.calledWithExactly(
                linkView2,
                linkView2.el.querySelector('.connection'),
                sinon.match.instanceOf(g.Point),
                sinon.match({ testArg2: true }),
                'target',
                linkView
            ));
            assert.ok(targetMagnetAnchorSpy.calledOnce);

            assert.ok(sourceAnchor.equals(linkView.sourceAnchor));
            assert.ok(targetAnchor.equals(linkView.targetAnchor));

            // // Link connected by source to a point does not use anchors
            sourceAnchorSpy.resetHistory();
            sourceMagnetAnchorSpy.resetHistory();
            linkView.model.removeProp('source/id');
            assert.ok(sourceAnchorSpy.notCalled);
            assert.ok(sourceMagnetAnchorSpy.notCalled);

            // Link connected by target to a point does not use anchors
            targetAnchorSpy.resetHistory();
            targetMagnetAnchorSpy.resetHistory();
            linkView.model.removeProp('target/id');
            assert.ok(targetAnchorSpy.notCalled);
            assert.ok(targetMagnetAnchorSpy.notCalled);
        });

        QUnit.test('joint.linkAnchors - source', function(assert) {

            link2.source({ x: 100, y: 100 });
            link2.target({ x: 200, y: 100 });
            link.source({ x: 160, y: 200 });
            // RATIO
            link.target(link2, { anchor: { name: 'connectionRatio', args: { ratio: 0.2 }}});
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 120, y: 100 });
            //L ENGTH
            link.target(link2, { anchor: { name: 'connectionLength', args: { length: 40 }}});
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 140, y: 100 });
            // CLOSEST
            link.target(link2, { anchor: { name: 'connectionClosest' }});
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 160, y: 100 });
            // PERPENDICULAR
            link.target(link2, { anchor: { name: 'connectionPerpendicular', args: { fallbackAt: '30%' }}});
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 160, y: 100 });
            link.source({ x: 0, y: 200 });
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 130, y: 100 });
            link.target(link2, { anchor: { name: 'connectionPerpendicular', args: { fallbackAt: 40 }}});
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 140, y: 100 });
            link.removeProp('target/anchor/args');
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 100, y: 100 });
            link2.target({ x: 100, y: 300 });
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 100, y: 200 });
            link.prop('target/anchor/args', { fixedAt: '40%' });
            link.source(link2, { anchor: { name: 'connectionRatio', args: { ratio: 0.9 }}});
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 100, y: 280 });
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 100, y: 280 }); // perpendicular
            link.prop('target/priority', true);
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 100, y: 280 });
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 100, y: 180 }); // fixedAt
            // Multiple intersections
            link2.target({ x: 200, y: 100 });
            link2.vertices([{ x: 100, y: 300 }, { x: 200, y: 300 }]);
            link.source(link2, { anchor: { name: 'connectionPerpendicular' }});
            link.target({ x: 0, y: 150 });
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 100, y: 150 });
        });

        QUnit.test('joint.linkAchors - target', function(assert) {

            link2.source({ x: 100, y: 100 });
            link2.target({ x: 200, y: 100 });
            link.target({ x: 160, y: 200 });
            // RATIO
            link.source(link2, { anchor: { name: 'connectionRatio', args: { ratio: 0.2 }}});
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 120, y: 100 });
            // LENGTH
            link.source(link2, { anchor: { name: 'connectionLength', args: { length: 40 }}});
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 140, y: 100 });
            // CLOSEST
            link.source(link2, { anchor: { name: 'connectionClosest' }});
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 160, y: 100 });
            // PERPENDICULAR
            link.source(link2, { anchor: { name: 'connectionPerpendicular', args: { fallbackAt: '30%' }}});
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 160, y: 100 });
            link.target({ x: 0, y: 200 });
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 130, y: 100 });
            link.source(link2, { anchor: { name: 'connectionPerpendicular', args: { fallbackAt: 40 }}});
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 140, y: 100 });
            link.removeProp('source/anchor/args');
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 100, y: 100 });
            link2.target({ x: 100, y: 300 });
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 100, y: 200 });
            link.prop('source/anchor/args', { fixedAt: '40%' });
            link.target(link2, { anchor: { name: 'connectionRatio', args: { ratio: 0.9 }}});
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 100, y: 180 }); // fixedAt
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 100, y: 280 });
            link.prop('target/priority', true);
            assert.deepEqual(linkView.sourceAnchor.toJSON(), { x: 100, y: 280 }); // perpendicular
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 100, y: 280 });
            // Multiple intersections
            link2.target({ x: 200, y: 100 });
            link2.vertices([{ x: 100, y: 300 }, { x: 200, y: 300 }]);
            link.target(link2, { anchor: { name: 'connectionPerpendicular' }});
            link.source({ x: 0, y: 150 });
            assert.deepEqual(linkView.targetAnchor.toJSON(), { x: 100, y: 150 });
        });

    });

    QUnit.module('anchors', function(hooks) {

        var r1, r2, rv1, rv2;

        hooks.beforeEach(function() {
            r1 = new joint.shapes.standard.Rectangle();
            r2 = new joint.shapes.standard.Rectangle();
            r1.addTo(paper.model);
            r2.addTo(paper.model);
            rv1 = r1.findView(paper);
            rv2 = r2.findView(paper);
        });

        QUnit.test('sanity', function(assert) {
            // Source Anchor
            var sourceAnchor = new g.Point(1, -1);
            var sourceAnchorSpy = joint.anchors.test1 = sinon.spy(function() {
                return sourceAnchor;
            });
            linkView.model.source(r1, {
                anchor: {
                    name: 'test1',
                    args: {
                        testArg1: true
                    }
                }
            });
            assert.ok(sourceAnchorSpy.calledOnce);
            assert.ok(sourceAnchorSpy.calledWithExactly(
                rv1,
                rv1.el,
                sinon.match.instanceOf(g.Point),
                sinon.match({ testArg1: true }),
                'source',
                linkView
            ));
            assert.ok(sourceAnchorSpy.calledOn(linkView));

            // Target Anchor
            var targetAnchor = new g.Point(-1, 1);
            var targetAnchorSpy = joint.anchors.test2 = sinon.spy(function() {
                return targetAnchor;
            });
            linkView.model.target({
                id: r2.id,
                anchor: { name: 'test2', args: { testArg2: true }}
            });
            assert.ok(targetAnchorSpy.calledOnce);
            assert.ok(targetAnchorSpy.calledWithExactly(
                rv2,
                rv2.el,
                sinon.match.instanceOf(g.Point),
                sinon.match({ testArg2: true }),
                'target',
                linkView
            ));
            assert.ok(targetAnchorSpy.calledOn(linkView));

            // Changing target updates both anchors
            assert.ok(sourceAnchorSpy.calledTwice);

            // Source Magnet
            sourceAnchorSpy.resetHistory();
            linkView.model.prop('source/magnet', 'body');
            assert.ok(sourceAnchorSpy.calledWithExactly(
                rv1,
                rv1.el.querySelector('rect'),
                sinon.match(function(value) {
                    return value instanceof SVGElement;
                }), // requires resolving
                sinon.match({ testArg1: true }),
                'source',
                linkView
            ));

            // Target Magnet
            targetAnchorSpy.resetHistory();
            linkView.model.prop('target/magnet', 'body');
            assert.ok(targetAnchorSpy.calledWithExactly(
                rv2,
                rv2.el.querySelector('rect'),
                sinon.match.instanceOf(g.Point),
                sinon.match({ testArg2: true }),
                'target',
                linkView
            ));

            assert.ok(sourceAnchor.equals(linkView.sourceAnchor));
            assert.ok(targetAnchor.equals(linkView.targetAnchor));

            // Link connected by source to a point does not use anchors
            sourceAnchorSpy.resetHistory();
            linkView.model.removeProp('source/id');
            assert.ok(sourceAnchorSpy.notCalled);

            // Link connected by target to a point does not use anchors
            targetAnchorSpy.resetHistory();
            linkView.model.removeProp('target/id');
            assert.ok(targetAnchorSpy.notCalled);
        });
    });

    QUnit.module('connectionPoints', function() {

        var r1, r2, rv1, rv2;

        hooks.beforeEach(function() {
            r1 = new joint.shapes.standard.Rectangle();
            r2 = new joint.shapes.standard.Rectangle();
            r1.addTo(paper.model);
            r2.addTo(paper.model);
            rv1 = r1.findView(paper);
            rv2 = r2.findView(paper);
        });

        QUnit.test('sanity', function(assert) {
            // Sourcer connectionPoint
            var sourcePoint = new g.Point(1, -1);
            var sourceConnectionPointSpy = joint.connectionPoints.test1 = sinon.spy(function() {
                return sourcePoint;
            });
            linkView.model.source(r1, {
                connectionPoint: {
                    name: 'test1',
                    args: {
                        testArg1: true
                    }
                }
            });
            assert.ok(sourceConnectionPointSpy.calledOnce);
            assert.ok(sourceConnectionPointSpy.calledWithExactly(
                sinon.match.instanceOf(g.Line),
                rv1,
                rv1.el,
                sinon.match({ testArg1: true }),
                'source',
                linkView
            ));
            assert.ok(sourceConnectionPointSpy.calledOn(linkView));
            // Target connectionPoint
            var targetPoint = new g.Point(-1, 1);
            var targetConnectionPointSpy = joint.connectionPoints.test2 = sinon.spy(function() {
                return targetPoint;
            });
            linkView.model.target({
                id: r2.id,
                connectionPoint: { name: 'test2', args: { testArg2: true }}
            });
            assert.ok(targetConnectionPointSpy.calledOnce);
            assert.ok(targetConnectionPointSpy.calledWithExactly(
                sinon.match.instanceOf(g.Line),
                rv2,
                rv2.el,
                sinon.match({ testArg2: true }),
                'target',
                linkView
            ));
            assert.ok(targetConnectionPointSpy.calledOn(linkView));

            // Changing target updates both connectionPoints
            assert.ok(sourceConnectionPointSpy.calledTwice);

            // Source Magnet
            sourceConnectionPointSpy.resetHistory();
            linkView.model.prop('source/magnet', 'body');
            assert.ok(sourceConnectionPointSpy.calledWithExactly(
                sinon.match.instanceOf(g.Line),
                rv1,
                rv1.el.querySelector('rect'),
                sinon.match({ testArg1: true }),
                'source',
                linkView
            ));

            // Target Magnet
            targetConnectionPointSpy.resetHistory();
            linkView.model.prop('target/magnet', 'body');
            assert.ok(targetConnectionPointSpy.calledWithExactly(
                sinon.match.instanceOf(g.Line),
                rv2,
                rv2.el.querySelector('rect'),
                sinon.match({ testArg2: true }),
                'target',
                linkView
            ));

            assert.ok(sourcePoint.equals(linkView.sourcePoint));
            assert.ok(targetPoint.equals(linkView.targetPoint));

            // Link connected by source to a point does not use connectionPoints
            sourceConnectionPointSpy.resetHistory();
            linkView.model.removeProp('source/id');
            assert.ok(sourceConnectionPointSpy.notCalled);

            // Link connected by target to a point does not use connectionPoints
            targetConnectionPointSpy.resetHistory();
            linkView.model.removeProp('target/id');
            assert.ok(targetConnectionPointSpy.notCalled);
        });
    });

    QUnit.module('connectionStrategy', function(hooks) {

        var r1, rv1;

        hooks.beforeEach(function() {
            r1 = new joint.shapes.standard.Rectangle();
            r1.addTo(paper.model);
            rv1 = r1.findView(paper);
        });

        QUnit.test('sanity', function(assert) {

            var data;
            var strategySpy = paper.options.connectionStrategy = sinon.spy(function(end) {
                end.test = true;
            });

            // Source
            data = {};
            linkView.pointerdown({
                target: linkView.el.querySelector('.marker-arrowhead[end=source]'),
                type: 'mousedown',
                data: data
            }, 0, 0);
            linkView.pointermove({
                target: rv1.el,
                type: 'mousemove',
                data: data
            }, 50, 50);
            linkView.pointerup({
                target: rv1.el,
                type: 'mouseup',
                data: data
            }, 50, 50);

            assert.ok(strategySpy.calledOnce);
            assert.ok(strategySpy.calledWithExactly(
                sinon.match({ id: r1.id }),
                rv1,
                rv1.el,
                sinon.match(function(coords) { return coords.equals(new g.Point(50, 50)); }),
                linkView.model,
                'source',
                paper
            ));
            assert.ok(strategySpy.calledOn(paper));
            assert.equal(linkView.model.attributes.source.test, true);

            // Target
            data = {};
            linkView.pointerdown({
                target: linkView.el.querySelector('.marker-arrowhead[end=target]'),
                type: 'mousedown',
                data: data
            }, 0, 0);
            linkView.pointermove({
                target: rv1.el,
                type: 'mousemove',
                data: data
            }, 40, 40);
            linkView.pointerup({
                target: rv1.el,
                type: 'mouseup',
                data: data
            }, 40, 40);

            assert.ok(strategySpy.calledTwice);
            assert.ok(strategySpy.calledWithExactly(
                sinon.match({ id: r1.id }),
                rv1,
                rv1.el,
                sinon.match(function(coords) { return coords.equals(new g.Point(40, 40)); }),
                linkView.model,
                'target',
                paper
            ));
            assert.ok(strategySpy.alwaysCalledOn(paper));
            assert.equal(linkView.model.attributes.target.test, true);
        });
    });

    QUnit.module('linkTools', function(hooks) {

        QUnit.module('joint.dia.ToolView', function() {

            QUnit.test('sanity', function(assert) {
                assert.ok(joint.dia.ToolView);
            });

            QUnit.test('visibility', function(assert) {
                var toolView = new joint.dia.ToolView();
                toolView.hide();
                assert.notOk(toolView.isVisible());
                toolView.show();
                assert.ok(toolView.isVisible());
            });
        });

        QUnit.module('joint.dia.ToolsView', function() {

            QUnit.test('sanity', function(assert) {
                assert.ok(joint.dia.ToolsView);
            });

            QUnit.test('name', function(assert) {

                var toolView = new joint.dia.ToolView();
                var toolsView = new joint.dia.ToolsView({
                    name: 'testName',
                    tools: [toolView]
                });

                assert.equal(toolsView.getName(), 'testName');
            });

            QUnit.test('focus(), blur()', function(assert) {

                var toolView1 = new joint.dia.ToolView();
                var toolView2 = new joint.dia.ToolView();
                var toolsView = new joint.dia.ToolsView({
                    tools: [toolView1, toolView2]
                });

                linkView.addTools(toolsView);

                assert.ok(toolView1.isVisible());
                assert.ok(toolView2.isVisible());
                toolsView.focusTool(toolView1);
                assert.ok(toolView1.isVisible());
                assert.notOk(toolView2.isVisible());
                toolsView.blurTool(toolView1);
                assert.ok(toolView1.isVisible());
                assert.ok(toolView2.isVisible());
            });
        });

        QUnit.test('addTools(), removeTools()', function(assert) {

            assert.ok(paper.tools instanceof SVGElement);
            assert.ok(V(paper.svg).contains(paper.tools));

            var toolView = new joint.dia.ToolView();
            var toolsView = new joint.dia.ToolsView({
                tools: [toolView]
            });

            linkView.addTools(toolsView);
            assert.ok(V(paper.tools).contains(toolsView.el));
            assert.ok(toolsView.vel.contains(toolView.el));
            assert.equal(paper.findView(toolView.el), linkView);

            linkView.removeTools();
            assert.notOk(V(paper.svg).contains(toolsView.el));
        });

        QUnit.test('hasTools()', function(assert) {

            var toolView = new joint.dia.ToolView();
            var toolsView = new joint.dia.ToolsView({
                name: 'testName',
                tools: [toolView]
            });

            assert.notOk(linkView.hasTools());
            linkView.addTools(toolsView);
            assert.ok(linkView.hasTools());
            assert.ok(linkView.hasTools('testName'));
            assert.notOk(linkView.hasTools('badName'));
        });

        QUnit.module('events', function(hooks) {

            var toolView1, toolsView1, toolView2, toolsView2;

            hooks.beforeEach(function() {

                toolView1 = new joint.dia.ToolView();
                toolsView1 = new joint.dia.ToolsView({
                    tools: [toolView1]
                });

                toolView2 = new joint.dia.ToolView();
                toolsView2 = new joint.dia.ToolsView({
                    tools: [toolView2]
                });

                linkView.addTools(toolsView1);
                linkView2.addTools(toolsView2);
            });

            QUnit.test('tools:event -> remove', function(assert) {
                paper.trigger('tools:event', 'remove');
                assert.notOk(linkView.hasTools());
                assert.notOk(linkView2.hasTools());
            });

            QUnit.test('tools:event -> show', function(assert) {
                paper.trigger('tools:event', 'hide');
                assert.notOk(toolView1.isVisible());
                assert.notOk(toolView2.isVisible());
            });

            QUnit.test('tools:event -> hide', function(assert) {
                toolsView1.hide();
                toolsView2.hide();
                paper.trigger('tools:event', 'show');
                assert.ok(toolView1.isVisible());
                assert.ok(toolView2.isVisible());
            });
        });
    });
});

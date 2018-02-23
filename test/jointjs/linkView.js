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

    QUnit.module('addLabel', function(hooks) {

        QUnit.test('default args', function(assert) {

            linkView.addLabel(100, 100);
            assert.deepEqual(link.label(0), { position: { distance: 0, offset: 0, args: {} } });
            link.removeLabel(0);

            linkView.addLabel(150, 100);
            assert.deepEqual(link.label(0), { position: { distance: 0.5, offset: 0, args: {} } });
            link.removeLabel(0);

            linkView.addLabel(200, 100);
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: 0, args: {} } });
            link.removeLabel(0);

            linkView.addLabel(175, 50);
            assert.deepEqual(link.label(0), { position: { distance: 0.75, offset: -50, args: {} } });
            link.removeLabel(0);

            linkView.addLabel(250, 100);
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: 0, args: {} } });
            link.removeLabel(0);

            linkView2.addLabel(100, 100);
            assert.deepEqual(link2.label(0), { position: { distance: 0, offset: { x: 0, y: 0 }, args: {} } });
            link2.removeLabel(0);

            linkView2.addLabel(150, 50);
            assert.deepEqual(link2.label(0), { position: { distance: 0, offset: { x: 50, y: -50 }, args: {} } });
            link2.removeLabel(0);
        });

        QUnit.test('absolute distance', function(assert) {

            linkView.addLabel(100, 100, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 0, offset: 0, args: { absoluteDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(150, 100, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 50, offset: 0, args: { absoluteDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(200, 100, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 100, offset: 0, args: { absoluteDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(175, 50, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 75, offset: -50, args: { absoluteDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(250, 100, { absoluteDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 100, offset: 0, args: { absoluteDistance: true } } });
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { absoluteDistance: true });
            assert.deepEqual(link2.label(0), { position: { distance: 0, offset: { x: 0, y: 0 }, args: { absoluteDistance: true } } });
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { absoluteDistance: true });
            assert.deepEqual(link2.label(0), { position: { distance: 0, offset: { x: 50, y: -50 }, args: { absoluteDistance: true } } });
            link2.removeLabel(0);
        });

        QUnit.test('reverse distance', function(assert) {

            linkView.addLabel(100, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: -100, offset: 0, args: { absoluteDistance: true, reverseDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(150, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: -50, offset: 0, args: { absoluteDistance: true, reverseDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(200, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: 0, args: { absoluteDistance: true, reverseDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(175, 50, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: -25, offset: -50, args: { absoluteDistance: true, reverseDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(250, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: 0, args: { absoluteDistance: true, reverseDistance: true } } });
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link2.label(0), { position: { distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true } } });
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(link2.label(0), { position: { distance: 1, offset: { x: 50, y: -50 }, args: { absoluteDistance: true, reverseDistance: true } } });
            link2.removeLabel(0);
        });

        QUnit.test('reverse distance without absolute distance (no effect)', function(assert) {

            linkView.addLabel(100, 100, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 0, offset: 0, args: { reverseDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(150, 100, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 0.5, offset: 0, args: { reverseDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(200, 100, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: 0, args: { reverseDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(175, 50, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 0.75, offset: -50, args: { reverseDistance: true } } });
            link.removeLabel(0);

            linkView.addLabel(250, 100, { reverseDistance: true });
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: 0, args: { reverseDistance: true } } });
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { reverseDistance: true });
            assert.deepEqual(link2.label(0), { position: { distance: 0, offset: { x: 0, y: 0 }, args: { reverseDistance: true } } });
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { reverseDistance: true });
            assert.deepEqual(link2.label(0), { position: { distance: 0, offset: { x: 50, y: -50 }, args: { reverseDistance: true } } });
            link2.removeLabel(0);
        });

        QUnit.test('absolute offset', function(assert) {

            linkView.addLabel(100, 100, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: 0, offset: { x: 0, y: 0 }, args: { absoluteOffset: true } } });
            link.removeLabel(0);

            linkView.addLabel(150, 100, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: 0.5, offset: { x: 0, y: 0 }, args: { absoluteOffset: true } } });
            link.removeLabel(0);

            linkView.addLabel(200, 100, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: { x: 0, y: 0 }, args: { absoluteOffset: true } } });
            link.removeLabel(0);

            linkView.addLabel(175, 50, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: 0.75, offset: { x: 0, y: -50 }, args: { absoluteOffset: true } } });
            link.removeLabel(0);

            linkView.addLabel(250, 100, { absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: { x: 50, y: 0 }, args: { absoluteOffset: true } } });
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { absoluteOffset: true });
            assert.deepEqual(link2.label(0), { position: { distance: 0, offset: { x: 0, y: 0 }, args: { absoluteOffset: true } } });
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { absoluteOffset: true });
            assert.deepEqual(link2.label(0), { position: { distance: 0, offset: { x: 50, y: -50 }, args: { absoluteOffset: true } } });
            link2.removeLabel(0);
        });

        QUnit.test('all args', function(assert) {

            linkView.addLabel(100, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: -100, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } } });
            link.removeLabel(0);

            linkView.addLabel(150, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: -50, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } } });
            link.removeLabel(0);

            linkView.addLabel(200, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } } });
            link.removeLabel(0);

            linkView.addLabel(175, 50, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: -25, offset: { x: 0, y: -50 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } } });
            link.removeLabel(0);

            linkView.addLabel(250, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link.label(0), { position: { distance: 1, offset: { x: 50, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } } });
            link.removeLabel(0);

            linkView2.addLabel(100, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link2.label(0), { position: { distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } } });
            link2.removeLabel(0);

            linkView2.addLabel(150, 50, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(link2.label(0), { position: { distance: 1, offset: { x: 50, y: -50 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } } });
            link2.removeLabel(0);
        });
    });

    QUnit.module('addVertex', function(hooks) {

        QUnit.test('add vertex', function(assert) {

            assert.deepEqual(link.vertices(), [])

            linkView.addVertex(150, 100);
            assert.deepEqual(link.vertices(), [{ x: 150, y: 100 }]);

            linkView.addVertex(175, 50);
            assert.deepEqual(link.vertices(), [{ x: 150, y: 100 }, { x: 175, y: 50 }]);

            linkView.addVertex(250, 100);
            assert.deepEqual(link.vertices(), [{ x: 150, y: 100 }, { x: 175, y: 50 }, { x: 250, y: 100}]);

            linkView.addVertex(150, 50);
            assert.deepEqual(link.vertices(), [{ x: 150, y: 100 }, { x: 150, y: 50 }, { x: 175, y: 50 }, { x: 250, y: 100}]);
        });
    });

    QUnit.module('getLabelPosition', function(hooks) {

        QUnit.test('default args', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100);
            assert.deepEqual(labelPosition, { distance: 0, offset: 0, args: {} });

            labelPosition = linkView.getLabelPosition(150, 100);
            assert.deepEqual(labelPosition, { distance: 0.5, offset: 0, args: {} });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100);
            assert.deepEqual(labelPosition, { distance: 1, offset: 0, args: {} });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50);
            assert.deepEqual(labelPosition, { distance: 0.75, offset: -50, args: {} });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100);
            assert.deepEqual(labelPosition, { distance: 1, offset: 0, args: {} });
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100);
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 0, y: 0 }, args: {} });
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50);
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 50, y: -50 }, args: {} });
            link2.removeLabel(0);
        });

        QUnit.test('absolute distance', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: 0, args: { absoluteDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { distance: 50, offset: 0, args: { absoluteDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { distance: 100, offset: 0, args: { absoluteDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { distance: 75, offset: -50, args: { absoluteDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { distance: 100, offset: 0, args: { absoluteDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 0, y: 0 }, args: { absoluteDistance: true } });
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { absoluteDistance: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 50, y: -50 }, args: { absoluteDistance: true } });
            link2.removeLabel(0);
        });

        QUnit.test('reverse distance', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: -100, offset: 0, args: { absoluteDistance: true, reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: -50, offset: 0, args: { absoluteDistance: true, reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: 0, args: { absoluteDistance: true, reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: -25, offset: -50, args: { absoluteDistance: true, reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: 0, args: { absoluteDistance: true, reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true } });
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { absoluteDistance: true, reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: { x: 50, y: -50 }, args: { absoluteDistance: true, reverseDistance: true } });
            link2.removeLabel(0);
        });

        QUnit.test('reverse distance without absolute distance (no effect)', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: 0, args: { reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 0.5, offset: 0, args: { reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: 0, args: { reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 0.75, offset: -50, args: { reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: 0, args: { reverseDistance: true } });
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 0, y: 0 }, args: { reverseDistance: true } });
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { reverseDistance: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 50, y: -50 }, args: { reverseDistance: true } });
            link2.removeLabel(0);
        });

        QUnit.test('absolute offset', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 0, y: 0 }, args: { absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 0.5, offset: { x: 0, y: 0 }, args: { absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: { x: 0, y: 0 }, args: { absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 0.75, offset: { x: 0, y: -50 }, args: { absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: { x: 50, y: 0 }, args: { absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 0, y: 0 }, args: { absoluteOffset: true } });
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 0, offset: { x: 50, y: -50 }, args: { absoluteOffset: true } });
            link2.removeLabel(0);
        });

        QUnit.test('all args', function(assert) {

            var labelPosition;

            labelPosition = linkView.getLabelPosition(100, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: -100, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(150, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: -50, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(200, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(175, 50, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: -25, offset: { x: 0, y: -50 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView.getLabelPosition(250, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: { x: 50, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } });
            link.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(100, 100, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: { x: 0, y: 0 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } });
            link2.removeLabel(0);

            labelPosition = linkView2.getLabelPosition(150, 50, { absoluteDistance: true, reverseDistance: true, absoluteOffset: true });
            assert.deepEqual(labelPosition, { distance: 1, offset: { x: 50, y: -50 }, args: { absoluteDistance: true, reverseDistance: true, absoluteOffset: true } });
            link2.removeLabel(0);
        });
    });

    QUnit.module('getLabelCoordinates', function(hooks) {

        QUnit.test('default', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0.5, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 150, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 200, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0.75, offset: -50 });
            assert.deepEqual(labelCoordinates, { x: 175, y: 50 });

            // unreachable region
            /*labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 250, y: 100 });*/

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            // offset coerced to absolute
            /*labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 50, y: -50 } });
            assert.deepEqual(labelCoordinates, { x: 150, y: 50 });*/
        });

        QUnit.test('absolute', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 50, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 150, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 100, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 200, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 75, offset: -50 });
            assert.deepEqual(labelCoordinates, { x: 175, y: 50 });

            // unreachable region
            /*labelCoordinates = linkView.getLabelCoordinates({ distance: 100, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 250, y: 100 });*/

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            // offset coerced to absolute
            /*labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 50, y: -50 } });
            assert.deepEqual(labelCoordinates, { x: 150, y: 50 });*/
        });

        QUnit.test('reverse absolute', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: -100, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: -50, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 150, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 200, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: -25, offset: -50 });
            assert.deepEqual(labelCoordinates, { x: 175, y: 50 });

            // unreachable region
            /*labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 250, y: 100 });*/

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 1, offset: 0 });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            // offset coerced to absolute
            /*labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 50, y: -50 } });
            assert.deepEqual(labelCoordinates, { x: 150, y: 50 });*/
        });

        QUnit.test('absolute offset', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0, offset: { x: 0, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0.5, offset: { x: 0, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 150, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: { x: 0, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 200, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 0.75, offset: { x: 0, y: -50 } });
            assert.deepEqual(labelCoordinates, { x: 175, y: 50 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: { x: 50, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 250, y: 100 });

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 0, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 0, offset: { x: 50, y: -50 } });
            assert.deepEqual(labelCoordinates, { x: 150, y: 50 });
        });

        QUnit.test('all', function(assert) {

            var labelCoordinates;

            labelCoordinates = linkView.getLabelCoordinates({ distance: -100, offset: { x: 0, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: -50, offset: { x: 0, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 150, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: { x: 0, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 200, y: 100 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: -25, offset: { x: 0, y: -50 } });
            assert.deepEqual(labelCoordinates, { x: 175, y: 50 });

            labelCoordinates = linkView.getLabelCoordinates({ distance: 1, offset: { x: 50, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 250, y: 100 });

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 1, offset: { x: 0, y: 0 } });
            assert.deepEqual(labelCoordinates, { x: 100, y: 100 });

            labelCoordinates = linkView2.getLabelCoordinates({ distance: 1, offset: { x: 50, y: -50 } });
            assert.deepEqual(labelCoordinates, { x: 150, y: 50 });
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
});

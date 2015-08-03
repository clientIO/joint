module('paper', {

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

test('graph.resetCells()', function() {

    var r1 = new joint.shapes.basic.Rect;
    var r2 = new joint.shapes.basic.Rect;
    var r3 = new joint.shapes.basic.Rect;

    this.graph.addCell(r1);
    this.graph.resetCells([r2, r3]);

    equal(this.graph.get('cells').length, 2, 'previous cells were removed from the graph after calling graph.resetCells()');
    equal(this.paper.$('.element').length, 2, 'previous cells were removed from the paper after calling graph.resetCells()');
});

test('graph.fromJSON(), graph.toJSON()', function() {

    var json = {
        "cells":[
            {"type":"basic.Circle","size":{"width":100,"height":60},"position":{"x":110,"y":480},"id":"bbb9e641-9756-4f42-997a-f4818b89f374","embeds":"","z":0},
            {"type":"link","source":{"id":"bbb9e641-9756-4f42-997a-f4818b89f374"},"target":{"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6"},"id":"b4289c08-07ea-49d2-8dde-e67eb2f2a06a","z":1},
            {"type":"basic.Rect","position":{"x":420,"y":410},"size":{"width":100,"height":60},"id":"cbd1109e-4d34-4023-91b0-f31bce1318e6","embeds":"","z":2}
        ]
    };

    this.graph.fromJSON(json);

    equal(this.graph.get('cells').length, 3, 'all the cells were reconstructed from JSON');

    // Check that the link is before the last cell in the DOM. This check is there because
    // paper might have resorted the cells so that links are always AFTER elements.
    var linkView = this.paper.findViewByModel('b4289c08-07ea-49d2-8dde-e67eb2f2a06a');
    var rectView = this.paper.findViewByModel('cbd1109e-4d34-4023-91b0-f31bce1318e6');
    var circleView = this.paper.findViewByModel('bbb9e641-9756-4f42-997a-f4818b89f374');

    ok(rectView.el.previousSibling === linkView.el, 'link view is before rect element in the DOM');
    ok(linkView.el.previousSibling === circleView.el, 'link view is after circle element in the DOM');

    this.graph.fromJSON(this.graph.toJSON());
    equal(this.graph.get('cells').length, 3, 'all the cells were reconstructed from JSON');
    
    // Check that the link is before the last cell in the DOM. This check is there because
    // paper might have resorted the cells so that links are always AFTER elements.
    linkView = this.paper.findViewByModel('b4289c08-07ea-49d2-8dde-e67eb2f2a06a');
    rectView = this.paper.findViewByModel('cbd1109e-4d34-4023-91b0-f31bce1318e6');
    circleView = this.paper.findViewByModel('bbb9e641-9756-4f42-997a-f4818b89f374');

    ok(rectView.el.previousSibling === linkView.el, 'link view is before rect element in the DOM');
    ok(linkView.el.previousSibling === circleView.el, 'link view is after circle element in the DOM');
});

test('graph.getBBox()', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 20, height: 20 } });
    var r2 = new joint.shapes.basic.Rect({ position: { x: 100, y: 200 }, size: { width: 20, height: 20 } });
    var r3 = new joint.shapes.basic.Rect({ position: { x: 20, y: 10 }, size: { width: 20, height: 20 } });

    this.graph.resetCells([r1, r2, r3]);

    var bbox = this.graph.getBBox([r1, r2, r3]);
    equal(bbox.x, 20, 'bbox.x correct');
    equal(bbox.y, 10, 'bbox.y correct');
    equal(bbox.width, 100, 'bbox.width correct');
    equal(bbox.height, 210, 'bbox.height correct');
});

test('contextmenu', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 50, y: 50 }, size: { width: 20, height: 20 } });
    this.graph.resetCells([r1]);

    var cellContextmenuCallback = sinon.spy();
    this.paper.on('cell:contextmenu', cellContextmenuCallback);
    var blankContextmenuCallback = sinon.spy();
    this.paper.on('blank:contextmenu', blankContextmenuCallback);

    var r1View = this.paper.findViewByModel(r1);
    r1View.$el.trigger('contextmenu');
    ok(cellContextmenuCallback.called, 'cell:contextmenu triggered');    

    this.paper.$el.trigger('contextmenu');
    ok(blankContextmenuCallback.called, 'blank:contextmenu triggered');    
});

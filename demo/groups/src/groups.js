var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 695,
    height: 600,
    gridSize: 1,
    model: graph,
    linkPinning: false,
    linkConnectionPoint: joint.util.shapePerimeterConnectionPoint,
    clickThreshold: 5,
    restrictTranslate: function(cellView) {

        var model = cellView.model;

        if (model.get('type') === 'groups.Port' && model.get('group')) {
            return _.first(model.get('group').getCells()).getBBox().moveAndExpand({
                x: -10,
                y: -10,
                width: 20,
                height: 20
            });
        }

        return null;
    }
});

joint.shapes.groups = {};

joint.shapes.groups.Container = joint.shapes.basic.Generic.extend({
    markup: '<g class="rotatable"><rect/></g>',
    defaults: _.defaultsDeep({
        type: 'groups.Container',
        size: {
            width: 100,
            height: 100
        },
        attrs: {
            '.': {
                'magnet': false
            },
            'rect': {
                'ref-width': '100%',
                'ref-height': '100%',
                'rx': 5,
                'ry': 5,
                'fill': 'white',
                'stroke': 'gray',
                'stroke-width': '2',
                'cursor': 'move'
            }
        }
    }, joint.shapes.basic.Generic.prototype.defaults),

    toggle: function() {
        return this.attr('rect/cursor', this.isEdited() ? 'move' : 'cell');
    },

    isEdited: function() {
        return this.attr('rect/cursor') !== 'move';
    }

}, {

    createAt: function(x, y) {
        return (new this).position(x, y);
    }
});

joint.shapes.groups.Port = joint.shapes.basic.Generic.extend({
    markup: '<g class="rotatable"><rect/></g>',
    defaults: _.defaultsDeep({
        type: 'groups.Port',
        size: {
            width: 20,
            height: 20
        },
        attrs: {
            '.': {
                'magnet': false
            },
            rect: {
                'ref-width': '100%',
                'ref-height': '100%',
                'rx': '10%',
                'ry': '10%',
                'fill': 'lightgray',
                'stroke': 'gray',
                'stroke-width': '2',
                'magnet': true,
                'cursor': '-webkit-grab'
            }
        }
    }, joint.shapes.basic.Generic.prototype.defaults),

    toggle: function() {
        return this.attr({
            rect: (this.isEdited())
                ? { magnet: true, fill: 'lightgray' }
                : { magnet: null, fill: '#FF4136' }
        });
    },

    isEdited: function() {
        return !this.attr('rect/magnet');
    }

}, {

    createAt: function(x, y) {
        var defaultSize = this.prototype.defaults.size;
        return (new this).position(
            x - defaultSize.width / 2,
            y - defaultSize.height / 2
        );
    }
});

var g1 = new joint.dia.Group({
    cells: [
        joint.shapes.groups.Container.createAt(0,0),
        joint.shapes.groups.Port.createAt(0, 50),
        joint.shapes.groups.Port.createAt(100, 50),
        joint.shapes.groups.Port.createAt(50, 0)
    ]
});

g1.translate(100,100).addTo(graph);
var g2 = g1.clone().translate(200,200).addTo(graph);

var editHighlighter = {
    name: 'stroke',
    options: {
        padding: 24,
        rx: 5,
        ry: 5,
        attrs: {
            'stroke-width': 2,
            'stroke-dasharray': '5,1',
            'stroke': '#FF4136'
        }
    }
};

var clickTimerId;
var clickViewCid;

paper.on('cell:pointerclick', function(view, evt, x, y) {

    if (clickTimerId && clickViewCid === view.cid) {
        // double click
        window.clearTimeout(clickTimerId);
        clickTimerId = null;
        clickViewCid = null;
        dblClick(view, evt, x, y);

    } else {
        // single click
        clickViewCid = view.cid;
        clickTimerId = window.setTimeout(function() {
            clickTimerId = null;
            clickViewCid = null;
            click(view, evt, x, y);
        }, 300);
    }
});

function click(cellView, evt, x, y) {

    var model = cellView.model;
    var group = graph.getCellGroup(model);

    switch (model.get('type')) {
        case 'groups.Container':
            if (!group) {
                group = model.get('group');
                group.addCell(
                    joint.shapes.groups.Port.createAt(x, y)
                        .toggle()
                        .set('group', group)
                        .addTo(graph)
                );
            }
            break;
    }
}

function dblClick(cellView) {

    var model = cellView.model;
    var group = graph.getCellGroup(model);

    switch (model.get('type')) {
        case 'groups.Container':

            if (group) {

                cellView
                    .setInteractivity(false)
                    .highlight(null, { highlighter: editHighlighter });

                graph.removeGroup(group);

                _.invoke(group.getCells(), 'toggle');
                _.invoke(group.getCells(), 'set', 'group', group);

            } else {

                group = model.get('group');

                cellView
                    .setInteractivity(true)
                    .unhighlight(null, { highlighter: editHighlighter });

                graph.addGroup(group);

                _.invoke(group.getCells(), 'toggle');
                _.invoke(group.getCells(), 'unset', 'group');

            }
            break;

        case 'groups.Port':

            if (!group) {
                model.remove();
            }
            break;
    }
}
